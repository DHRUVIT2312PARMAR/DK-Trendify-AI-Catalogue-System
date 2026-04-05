require('dotenv').config();

const bcrypt = require('bcryptjs');
const { connectDatabase, isDatabaseReady } = require('../src/config/db');
const User = require('../src/models/User');

const DEFAULT_USERS = [
  {
    name: 'DK Admin',
    email: 'admin@dk.local',
    password: 'DK@Admin123',
    role: 'Admin',
  },
  {
    name: 'DK Seller',
    email: 'seller@dk.local',
    password: 'DK@Seller123',
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
}

createDefaultUsers().catch((error) => {
  console.error('User bootstrap failed:', error);
  process.exit(1);
});
