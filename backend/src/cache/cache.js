let cacheStore = new Map();
const useRedis = !!process.env.REDIS_URL;
let redisClient = null;

if (useRedis) {
  try {
    const Redis = require('ioredis');
    redisClient = new Redis(process.env.REDIS_URL);
  } catch (e) {
    console.warn('Redis requested but ioredis not installed or failed to connect:', e.message);
  }
}

async function get(key) {
  if (redisClient) {
    const v = await redisClient.get(key);
    return v ? JSON.parse(v) : null;
  }
  return cacheStore.has(key) ? cacheStore.get(key) : null;
}

async function set(key, value, ttlSec) {
  if (redisClient) {
    await redisClient.set(key, JSON.stringify(value), 'EX', ttlSec || 60);
    return;
  }
  cacheStore.set(key, value);
  if (ttlSec) {
    setTimeout(() => cacheStore.delete(key), ttlSec * 1000);
  }
}

module.exports = { get, set };
