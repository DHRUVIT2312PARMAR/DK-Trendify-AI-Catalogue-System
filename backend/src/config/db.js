const mongoose = require('mongoose');

let connected = false;

async function connectDatabase() {
  const host = process.env.MONGODB_HOST || '127.0.0.1';
  const port = process.env.MONGODB_PORT || '27017';
  const dbName = process.env.DB_NAME || 'DK';
  const uri = process.env.MONGODB_URI || `mongodb://${host}:${port}/${dbName}`;

  if (connected) {
    return true;
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    autoIndex: true,
  });

  connected = true;
  console.log(`MongoDB connected: ${dbName}`);
  return true;
}

function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

module.exports = {
  connectDatabase,
  isDatabaseReady,
};
