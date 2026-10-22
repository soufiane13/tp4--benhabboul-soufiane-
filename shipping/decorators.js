// shipping/decorators.js
export class RetryQuote {
    constructor(inner, { attempts = 3 } = {}) {
      this.inner = inner;
      this.attempts = attempts;
    }
  
    async getQuote(parcel) {
      let lastError;
      for (let i = 0; i < this.attempts; i++) {
        try {
          return await this.inner.getQuote(parcel);
        } catch (err) {
          lastError = err;
        }
      }
      throw lastError; // Si toutes les tentatives échouent, on lève la dernière erreur
    }
  }
  
  export class CachedQuote {
    constructor(inner, { ttlMs = 60000, now = Date.now } = {}) {
      this.inner = inner;
      this.ttlMs = ttlMs;
      this.now = now;
      this.cache = new Map();
    }
  
    async getQuote(parcel) {
      const key = `${parcel.weightKg}-${parcel.zip}`;
      const cached = this.cache.get(key);
      const currentTime = this.now();
  
      // Renvoi du cache si valide
      if (cached && (currentTime - cached.timestamp < this.ttlMs)) {
        return cached.value;
      }
  
      // Appel réel sinon, puis mise en cache
      const value = await this.inner.getQuote(parcel);
      this.cache.set(key, { value, timestamp: currentTime });
      return value;
    }
  }