import { MongoClient, ServerApiVersion } from 'mongodb';
import crypto from 'crypto';

let mongoClient = null;
let mongoDb = null;
let isConnected = false;

export async function initMongo() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>') || uri.includes('your_mongodb')) {
    console.error('❌ MONGODB_URI is not configured properly in Vercel Environment Variables!');
    return null;
  }

  if (isConnected && mongoDb) {
    return mongoDb;
  }

  try {
    mongoClient = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });

    await mongoClient.connect();
    await mongoClient.db('admin').command({ ping: 1 });
    mongoDb = mongoClient.db('tooltrunk');
    isConnected = true;
    console.log('✅ Connected to MongoDB successfully!');
    return mongoDb;
  } catch (err) {
    isConnected = false;
    console.error('⚠️ MongoDB connection failed:', err.message);
    throw err;
  }
}

export function getMongoDb() {
  if (!mongoDb) {
    throw new Error('Database not initialized. Call initMongo() first.');
  }
  return mongoDb;
}

export function isMongoConnected() {
  return isConnected;
}

/**
 * Helper to calculate password crypt hash using scrypt
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Helper to verify password
 */
export function verifyPassword(password, storedHash) {
  try {
    const [salt, originalHash] = storedHash.split(':');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return hash === originalHash;
  } catch {
    return false;
  }
}