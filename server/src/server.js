require('dotenv').config();

const app = require('./app');
const env = require('./config/env');

app.listen(env.PORT, env.HOST, () => {
  console.log(`Server ${env.HOST}:${env.PORT} üzerinde çalışıyor (${env.NODE_ENV})`);
});
