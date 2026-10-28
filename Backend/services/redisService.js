import Redis from 'ioredis';

let redisClient = null;
let isConnected = false;

function initRedis() {
  try {
    // TLS hata diya hai kyunki yeh port non-SSL (plain TCP) connection use kar raha hai
    redisClient = new Redis({
      host: 'hydrangea-plants-toes-52523.db.redis.io',
      port: 16980,
      username: 'default',
      password: 'K3gV0iVvZSmolc3wkW1Ftsu2gdtVP2kK',
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) {
          return null; // Stop retrying after 3 attempts
        }
        return Math.min(times * 100, 1000);
      },
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redisClient.on('connect', () => {
      isConnected = true;
      console.log('✅ Connected to Redis successfully');
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      if (process.env.NODE_ENV !== 'test') {
        console.warn('⚠️ Redis not available, running with in-memory fallback:', err.message);
      }
    });

    redisClient.on('close', () => {
      isConnected = false;
    });

    // Try connecting
    redisClient.connect().catch((err) => {
      isConnected = false;
      if (process.env.NODE_ENV !== 'test') {
        console.warn('⚠️ Initial Redis connection failed. Operating gracefully without cache:', err.message);
      }
    });
  } catch (err) {
    isConnected = false;
    console.warn('⚠️ Failed to initialize Redis client:', err.message);
  }
}

initRedis();

export const redisService = {
  isAvailable() {
    return isConnected && redisClient && redisClient.status === 'ready';
  },

  getClient() {
    return redisClient;
  },

  async get(key) {
    if (!this.isAvailable()) return null;
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.warn(`Redis GET failed for ${key}:`, err.message);
      return null;
    }
  },

  async set(key, value, ttlSeconds = 300) {
    if (!this.isAvailable()) return false;
    try {
      const payload = JSON.stringify(value);
      if (ttlSeconds) {
        await redisClient.set(key, payload, 'EX', ttlSeconds);
      } else {
        await redisClient.set(key, payload);
      }
      return true;
    } catch (err) {
      console.warn(`Redis SET failed for ${key}:`, err.message);
      return false;
    }
  },

  async del(key) {
    if (!this.isAvailable()) return false;
    try {
      await redisClient.del(key);
      return true;
    } catch (err) {
      console.warn(`Redis DEL failed for ${key}:`, err.message);
      return false;
    }
  },

  async delPattern(pattern) {
    if (!this.isAvailable()) return false;
    try {
      const keys = await redisClient.keys(pattern);
      if (keys && keys.length > 0) {
        await redisClient.del(...keys);
      }
      return true;
    } catch (err) {
      console.warn(`Redis DELPATTERN failed for ${pattern}:`, err.message);
      return false;
    }
  },

  async invalidateToolCache(toolId = null) {
    if (!this.isAvailable()) return;
    try {
      await this.delPattern('tools:public:*');
      if (toolId) {
        await this.del(`tool:detail:${toolId}`);
      }
    } catch (err) {
      console.warn('Tool cache invalidation error:', err.message);
    }
  },
};