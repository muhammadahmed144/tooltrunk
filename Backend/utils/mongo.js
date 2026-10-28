import { MongoClient, ServerApiVersion } from 'mongodb';
import crypto from 'crypto';

let client = null;
let mongoDb = null;
let clientPromise = null;

export async function initMongo() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>') || uri.includes('your_mongodb')) {
    throw new Error('❌ MONGODB_URI is not configured properly in Vercel Environment Variables!');
  }

  if (mongoDb) {
    return mongoDb;
  }

  if (!clientPromise) {
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });
    clientPromise = client.connect();
  }

  try {
    await clientPromise;
    mongoDb = client.db('tooltrunk');
    console.log('✅ Connected to MongoDB successfully!');
    return mongoDb;
  } catch (err) {
    clientPromise = null;
    console.error('⚠️ MongoDB connection failed:', err.message);
    throw err;
  }
}

// 🟢 Auto-initialize helper to prevent null collection errors
export async function getMongoDb() {
  if (!mongoDb) {
    return await initMongo();
  }
  return mongoDb;
}

export function isMongoConnected() {
  return !!mongoDb;
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