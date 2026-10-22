// main.js
import { createChannel } from './notifications/channels.js';
import './notifications/slack.js'; // OCP: on ajoute Slack dynamiquement
import { MessageBuilder } from './notifications/MessageBuilder.js';
import { ColissimoApi, DhlClient } from './carrierApis.js';
import { ColissimoAdapter, DhlAdapter } from './shipping/adapters.js';
import { RetryQuote, CachedQuote } from './shipping/decorators.js';
import { ShippingService } from './shipping/ShippingService.js';

async function main() {
  // 1. Initialiser les transporteurs avec les Décorateurs et Adaptateurs
  const colissimo = new ColissimoAdapter(new ColissimoApi());
  
  // Cache enveloppe Retry qui enveloppe l'Adaptateur DHL
  const dhl = new CachedQuote(
    new RetryQuote(new DhlAdapter(new DhlClient({ failFirst: 1 })), { attempts: 3 })
  );

  // 2. Initialiser la Facade
  const shipping = new ShippingService([colissimo, dhl]);

  // 3. Initialiser les canaux (Factory)
  const email = createChannel('email');
  const slack = createChannel('slack');

  // --- DEMONSTRATION ---
  
  // Colis 2 kg -> Colissimo
  const quote2kg = await shipping.bestQuote({ weightKg: 2, zip: '75011' });
  const msg2kg = new MessageBuilder()
    .to('alice@exemple.fr')
    .template('Bonjour {{nom}}, votre colis de 2 kg part avec {{transporteur}} ({{prix}} €).')
    .with('nom', 'Alice')
    .with('transporteur', quote2kg.carrier)
    .with('prix', quote2kg.price.toFixed(2))
    .build();
  console.log(email.send(msg2kg));

  // Colis 10 kg -> DHL
  const quote10kg = await shipping.bestQuote({ weightKg: 10, zip: '75011' });
  const msg10kg = new MessageBuilder()
    .to('alice@exemple.fr')
    .template('Bonjour {{nom}}, votre colis de 10 kg part avec {{transporteur}} ({{prix}} €).')
    .with('nom', 'Alice')
    .with('transporteur', quote10kg.carrier)
    .with('prix', quote10kg.price.toFixed(2))
    .build();
  console.log(email.send(msg10kg));

  // Notification Slack
  const msgSlack = new MessageBuilder()
    .to('logistique')
    .template('Tarifs mis à jour')
    .build();
  console.log(slack.send(msgSlack));
}

main().catch(console.error);