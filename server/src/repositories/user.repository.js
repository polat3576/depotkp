const { query, withTransaction } = require('../database/connection');

// Sadece veritabanı erişimi burada olur, iş kuralı içermez.

// Restoranı (tenant) e-posta ile bul. Login'in ilk adımı.
async function findBusinessByEmail(email) {
  const sql = `
    SELECT id, name, email, is_active
    FROM businesses
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1
  `;
  const result = await query(sql, [email]);
  return result.rows[0] || null;
}

// Restoran içinde kullanıcıyı userCode ile bul (login için password_hash de döner).
async function findByBusinessAndCode(businessId, userCode) {
  const sql = `
    SELECT id, business_id, full_name, email, user_code, password_hash, role,
           is_active, created_at, updated_at
    FROM users
    WHERE business_id = $1 AND LOWER(user_code) = LOWER($2)
    LIMIT 1
  `;
  const result = await query(sql, [businessId, userCode]);
  return result.rows[0] || null;
}

// E-posta ile kullanıcı bul (eski kullanım / çakışma kontrolü için)
async function findByEmail(email) {
  const sql = `
    SELECT id, business_id, full_name, email, user_code, password_hash, role,
           is_active, created_at, updated_at
    FROM users
    WHERE email = $1
    LIMIT 1
  `;
  const result = await query(sql, [email]);
  return result.rows[0] || null;
}

// ID ile kullanıcı bul (token doğrulama sonrası kullanıcıyı çekmek için)
async function findById(id) {
  const sql = `
    SELECT id, business_id, full_name, email, user_code, role, is_active,
           created_at, updated_at
    FROM users
    WHERE id = $1
    LIMIT 1
  `;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
}

// E-posta zaten kullanılıyor mu? (global unique - kullanıcı oluştururken)
async function existsByEmail(email) {
  const result = await query('SELECT 1 FROM users WHERE email = $1 LIMIT 1', [email]);
  return result.rowCount > 0;
}

// userCode bu restoranda kullanılıyor mu? (business içi unique kontrolü)
async function existsByCodeInBusiness(businessId, userCode) {
  const result = await query(
    'SELECT 1 FROM users WHERE business_id = $1 AND LOWER(user_code) = LOWER($2) LIMIT 1',
    [businessId, userCode]
  );
  return result.rowCount > 0;
}

// Yeni kullanıcı oluştur. password_hash zaten hash'lenmiş gelmeli.
// password_hash dışarı DÖNMEZ (güvenlik).
async function create({ business_id, full_name, email, user_code, password_hash, role }) {
  const sql = `
    INSERT INTO users (business_id, full_name, email, user_code, password_hash, role)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, business_id, full_name, email, user_code, role, is_active,
              created_at, updated_at
  `;
  const result = await query(sql, [business_id, full_name, email, user_code, password_hash, role]);
  return result.rows[0];
}

// Public kayıt: yeni bir restoran (email ile) VE ilk admin kullanıcısını
// (user_code ile) atomik oluşturur. İlk kullanıcı her zaman ADMIN'dir.
async function createBusinessWithAdmin({
  businessName,
  businessEmail,
  fullName,
  email,
  userCode,
  passwordHash,
}) {
  return withTransaction(async (client) => {
    const bizRes = await client.query(
      `INSERT INTO businesses (name, email) VALUES ($1, $2) RETURNING id`,
      [businessName, businessEmail]
    );
    const businessId = bizRes.rows[0].id;

    const userRes = await client.query(
      `INSERT INTO users (business_id, full_name, email, user_code, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, 'admin')
       RETURNING id, business_id, full_name, email, user_code, role, is_active,
                 created_at, updated_at`,
      [businessId, fullName, email, userCode, passwordHash]
    );
    return userRes.rows[0];
  });
}

// İşletmenin tüm kullanıcıları (password_hash HARİÇ). Multi-tenant filtreli.
async function findAllForBusiness(businessId) {
  const sql = `
    SELECT id, business_id, full_name, email, user_code, role, is_active,
           created_at, updated_at
    FROM users
    WHERE business_id = $1
    ORDER BY is_active DESC, full_name ASC
  `;
  const result = await query(sql, [businessId]);
  return result.rows;
}

// Kullanıcıyı pasifleştir (soft delete). Yalnızca aynı işletmedeki kullanıcı.
async function deactivate(id, businessId) {
  const sql = `
    UPDATE users
    SET is_active = false, updated_at = now()
    WHERE id = $1 AND business_id = $2
    RETURNING id, business_id, full_name, email, user_code, role, is_active,
              created_at, updated_at
  `;
  const result = await query(sql, [id, businessId]);
  return result.rows[0] || null;
}

// Kullanıcıyı yeniden aktif eder.
async function activate(id, businessId) {
  const sql = `
    UPDATE users
    SET is_active = true, updated_at = now()
    WHERE id = $1 AND business_id = $2
    RETURNING id, business_id, full_name, email, user_code, role, is_active,
              created_at, updated_at
  `;
  const result = await query(sql, [id, businessId]);
  return result.rows[0] || null;
}

// Kullanıcıyı kalıcı olarak siler. Kullanıcının stok hareketi / sayım
// geçmişi varsa (ON DELETE RESTRICT) veritabanı hata fırlatır; service
// katmanı bunu yakalayıp kullanıcı dostu bir mesaja çevirir.
async function hardDelete(id, businessId) {
  const sql = `DELETE FROM users WHERE id = $1 AND business_id = $2 RETURNING id`;
  const result = await query(sql, [id, businessId]);
  return result.rowCount > 0;
}

module.exports = {
  findBusinessByEmail,
  findByBusinessAndCode,
  findByEmail,
  findById,
  existsByEmail,
  existsByCodeInBusiness,
  create,
  createBusinessWithAdmin,
  findAllForBusiness,
  deactivate,
  activate,
  hardDelete,
};
