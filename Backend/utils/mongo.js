import { MongoClient, ServerApiVersion } from 'mongodb';

let mongoClient = null;
let mongoDb = null;
let isConnected = false;

export async function initMongo() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>') || uri.includes('your_mongodb')) {
    if (process.env.NODE_ENV !== 'test') {
      console.log('ℹ️ MongoDB URI not configured; running primary relational database engine.');
    }
    return null;
  }

  try {
    mongoClient = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
    });

    await mongoClient.connect();
    // Test ping
    await mongoClient.db('admin').command({ ping: 1 });
    mongoDb = mongoClient.db('tooltrunk');
    isConnected = true;
    console.log('✅ Connected to MongoDB successfully!');
    return mongoDb;
  } catch (err) {
    isConnected = false;
    console.warn('⚠️ MongoDB connection could not be established (relational DB remains active):', err.message);
    return null;
  }
}

export function getMongoDb() {
  return mongoDb;
}

export function isMongoConnected() {
  return isConnected;
}
