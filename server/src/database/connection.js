const { Pool } = require('pg');
const env = require('../config/env');

// Neon PostgreSQL bağlantısı SSL gerektirir
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Bağlantının gerçekten çalışıp çalışmadığını kontrol eder (health check için kullanılır)
async function testDatabaseConnection() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('[DB] Bağlantı testi başarısız:', error.message);
    return false;
  }
}

// Tüm sorgular bu fonksiyon üzerinden çalıştırılır (tek noktadan yönetim için)
function query(text, params) {
  return pool.query(text, params);
}

// Birden fazla sorgunun tek bir işlem (transaction) içinde atomik çalışması için.
// callback'e verilen client üzerinden sorgular çalıştırılır; hata olursa geri
// alınır (ROLLBACK), başarılıysa kalıcı olur (COMMIT). Örn: stok hareketi eklerken
// hem stock_movements insert'i hem products.current_stock update'i birlikte olmalı.
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query,
  withTransaction,
  testDatabaseConnection,
};
