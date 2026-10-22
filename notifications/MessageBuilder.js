export class MessageBuilder {
    #to;
    #template;
    #variables = {};
    #priority = 'normale'; // Priorité par défaut
  
    to(recipient) {
      this.#to = recipient;
      return this;
    }
  
    template(text) {
      this.#template = text;
      return this;
    }
  
    with(key, value) {
      this.#variables[key] = value;
      return this;
    }
  
    priority(level) {
      this.#priority = level;
      return this;
    }
  
    build() {
      // 1. Validations de présence
      if (!this.#to) throw new Error('Destinataire obligatoire');
      if (!this.#template) throw new Error('Gabarit obligatoire');
  
      // 2. Validation de la priorité
      if (!['basse', 'normale', 'haute'].includes(this.#priority)) {
        throw new Error(`Priorité invalide: ${this.#priority}`);
      }
  
      // 3. Remplacement des variables et validation
      let body = this.#template;
      const regex = /\{\{([^}]+)\}\}/g; // Cherche les mots entre {{ et }}
      let match;
      
      while ((match = regex.exec(this.#template)) !== null) {
        const variableName = match[1];
        if (!(variableName in this.#variables)) {
          throw new Error(`Variable manquante: ${variableName}`);
        }
        body = body.replace(match[0], this.#variables[variableName]);
      }
  
      // 4. Objet immuable (Object.freeze)
      return Object.freeze({
        to: this.#to,
        body: body,
        priority: this.#priority
      });
    }
  }