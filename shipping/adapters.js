// shipping/adapters.js
import { ColissimoApi, DhlClient } from '../../tp4/carrierApis.js';

export class ColissimoAdapter {
  constructor(api = new ColissimoApi()) {
    this.api = api;
  }

  async getQuote({ weightKg, zip }) {
    // Convertir les kilos en grammes
    const result = this.api.tarif({ poidsGrammes: weightKg * 1000, codePostal: zip });
    return {
      carrier: 'Colissimo',
      price: result.prixCentimes / 100, // centimes vers euros
      days: result.delaiJours
    };
  }
}

export class DhlAdapter {
  constructor(client = new DhlClient()) {
    this.client = client;
  }

  async getQuote({ weightKg, zip }) {
    // API asynchrone qui prend directement des kilos
    const result = await this.client.getRate(weightKg, zip);
    return {
      carrier: 'DHL',
      price: parseFloat(result.amount), // texte vers nombre décimal
      days: result.transitDays
    };
  }
}