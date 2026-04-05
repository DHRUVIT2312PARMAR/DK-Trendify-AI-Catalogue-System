const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const http = require('http');
const app = require('./src/app');
const { connectDatabase } = require('./src/config/db');

const PORT = process.env.PORT || 5000;
const SERVER_NAME = process.env.SERVER_NAME || 'DK';

async function startServer() {
  await connectDatabase();

  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`${SERVER_NAME} API running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
