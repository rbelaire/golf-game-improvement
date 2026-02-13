function createRateLimiter(maxRequests = 10, windowMs = 60000) {
  const hits = new Map();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of hits) {
      const valid = timestamps.filter((t) => now - t < windowMs);
      if (valid.length === 0) {
        hits.delete(key);
      } else {
        hits.set(key, valid);
      }
    }
  }, 60000);

  if (cleanup.unref) cleanup.unref();

  return {
    check(key) {
      const now = Date.now();
      const timestamps = (hits.get(key) || []).filter((t) => now - t < windowMs);
      if (timestamps.length >= maxRequests) {
        const oldest = timestamps[0];
        const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
        return { allowed: false, retryAfter };
      }
      timestamps.push(now);
      hits.set(key, timestamps);
      return { allowed: true, retryAfter: 0 };
    }
  };
}

module.exports = { createRateLimiter };
