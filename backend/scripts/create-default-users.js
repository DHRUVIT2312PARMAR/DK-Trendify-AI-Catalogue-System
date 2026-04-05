require('dotenv').config();

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { connectDatabase, isDatabaseReady } = require('../src/config/db');
const User = require('../src/models/User');

function getPasswordFromEnv(key) {
  const value = process.env[key];
  if (value && value.trim()) return value.trim();
  return crypto.randomBytes(10).toString('base64url');
}

const DEFAULT_USERS = [
  {
    name: process.env.DEFAULT_ADMIN_NAME || 'DK Admin',
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@dk.local',
    password: getPasswordFromEnv('DEFAULT_ADMIN_PASSWORD'),
    role: 'Admin',
  },
  {
    name: process.env.DEFAULT_SELLER_NAME || 'DK Seller',
    email: process.env.DEFAULT_SELLER_EMAIL || 'seller@dk.local',
    password: getPasswordFromEnv('DEFAULT_SELLER_PASSWORD'),
    role: 'Seller',
  },
];

async function upsertUser(entry) {
  const passwordHash = await bcrypt.hash(entry.password, 12);

  const user = await User.findOneAndUpdate(
    { email: entry.email },
    {
      $set: {
        name: entry.name,
        role: entry.role,
        passwordHash,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  return user;
}

async function createDefaultUsers() {
  await connectDatabase();

  if (!isDatabaseReady()) {
    console.log('MongoDB is not configured. User creation skipped.');
    return;
  }

  const users = [];
  for (const entry of DEFAULT_USERS) {
    const user = await upsertUser(entry);
    users.push({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      password: entry.password,
    });
  }

  console.log('Default users are ready:');
  users.forEach((user) => {
    console.log(`${user.role}: ${user.email} | ${user.password} | id=${user.id}`);
  });

  if (!process.env.DEFAULT_ADMIN_PASSWORD || !process.env.DEFAULT_SELLER_PASSWORD) {
    console.log('Password note: random passwords were generated for any missing DEFAULT_*_PASSWORD values.');
  }
}

createDefaultUsers().catch((error) => {
  console.error('User bootstrap failed:', error);
  process.exit(1);
});
