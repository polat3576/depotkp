// Ortam değişkenlerini tek noktadan yönetmek için merkezi config dosyası

const env = {
  PORT: process.env.PORT || 3001,
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  // Güvenli varsayılan: yalnızca tam olarak "true" ise public kayıt açılır.
  ALLOW_PUBLIC_REGISTRATION: process.env.ALLOW_PUBLIC_REGISTRATION === 'true',
};

// Uygulamanın çalışması için kritik olan değişken eksikse geliştiriciyi uyar
if (!env.DATABASE_URL) {
  console.warn('[UYARI] DATABASE_URL tanımlı değil. .env dosyanızı kontrol edin.');
}

if (!env.JWT_SECRET) {
  console.warn('[UYARI] JWT_SECRET tanımlı değil. .env dosyanızı kontrol edin.');
}

module.exports = env;
