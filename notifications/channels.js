// notifications/channels.js
export class Channel {
    send(message) {
      throw new Error('méthode abstraite');
    }
  }
  
  export class EmailChannel extends Channel {
    send({ to, body }) {
      return `[EMAIL ${to}] ${body}`;
    }
  }
  
  export class SmsChannel extends Channel {
    send({ to, body }) {
      const truncatedBody = body.length > 160 ? body.substring(0, 157) + '...' : body;
      return `[SMS ${to}] ${truncatedBody}`;
    }
  }
  
  export class PushChannel extends Channel {
    send({ to, body }) {
      return `[PUSH ${to}] ${body}`;
    }
  }
  
  // Le Registre
  const registry = new Map();
  
  export function registerChannel(type, Classe) {
    // On vérifie que la classe hérite bien de Channel (soit via prototype, soit en testant une instance)
    if (!(Classe.prototype instanceof Channel) && Classe !== Channel) {
        throw new Error('La classe doit hériter de Channel');
    }
    registry.set(type, Classe);
  }
  
  export function createChannel(type) {
    const Classe = registry.get(type);
    if (!Classe) {
      throw new Error(`Canal inconnu: ${type}`);
    }
    return new Classe();
  }
  
  // Enregistrement par défaut
  registerChannel('email', EmailChannel);
  registerChannel('sms', SmsChannel);
  registerChannel('push', PushChannel);