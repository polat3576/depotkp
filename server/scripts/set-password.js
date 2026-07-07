/**
 * Bir kullanıcının şifresini bcrypt ile hash'leyip veritabanında günceller.
 *
 * Kullanım:
 *   node scripts/set-password.js <email> <yeni-sifre>
 *
 * Örnek (seed'deki demo admin için):
 *   node scripts/set-password.js admin@demorestoran.com Admin123!
 *
 * Auth modülünü test edebilmek için seed'deki sahte password_hash'i
 * gerçek bir hash ile değiştirmek amacıyla kullanılır.
 */
require('dotenv').config();

const bcrypt = require('bcryptjs');
const { query, pool } = require('../src/database/connection');

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Kullanım: node scripts/set-password.js <email> <yeni-sifre>');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await query(
    `UPDATE users
     SET password_hash = $1, updated_at = now()
     WHERE email = $2
     RETURNING id, email, role`,
    [passwordHash, email]
  );

  if (result.rowCount === 0) {
    console.error(`Kullanıcı bulunamadı: ${email}`);
    process.exit(1);
  }

  console.log('Şifre güncellendi:', result.rows[0]);
}

main()
  .catch((err) => {
    console.error('Hata:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
