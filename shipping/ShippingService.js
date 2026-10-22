// shipping/ShippingService.js
export class ShippingService {
    constructor(carriers) {
      this.carriers = carriers;
    }
  
    async bestQuote(parcel) {
      if (!this.carriers || this.carriers.length === 0) {
        throw new Error('Aucun transporteur disponible');
      }
  
      // Lance tous les appels en parallèle
      const results = await Promise.allSettled(
        this.carriers.map(c => c.getQuote(parcel))
      );
  
      // On ne garde que ceux qui ont réussi (status === 'fulfilled')
      const successfulQuotes = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);
  
      if (successfulQuotes.length === 0) {
        throw new Error('Aucun transporteur disponible');
      }
  
      // Trie par prix, et en cas d'égalité, par délai (le plus rapide d'abord)
      successfulQuotes.sort((a, b) => {
        if (a.price !== b.price) return a.price - b.price;
        return a.days - b.days;
      });
  
      return successfulQuotes[0];
    }
  }