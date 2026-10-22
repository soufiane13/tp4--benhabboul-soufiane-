// tp4.test.js
import { MessageBuilder } from './notifications/MessageBuilder.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ColissimoAdapter, DhlAdapter } from './shipping/adapters.js';
import { RetryQuote, CachedQuote } from './shipping/decorators.js';
import { ColissimoApi, DhlClient } from './carrierApis.js';

import { createChannel, registerChannel, Channel } from './notifications/channels.js';

test('Factory: un canal par type, erreur si inconnu', () => {
  const email = createChannel('email');
  assert.equal(email.send({ to: 'alice', body: 'hello' }), '[EMAIL alice] hello');

  const sms = createChannel('sms');
  assert.equal(sms.send({ to: '0600000000', body: 'A'.repeat(200) }), `[SMS 0600000000] ${'A'.repeat(157)}...`);

  assert.throws(() => createChannel('pigeon'), /Canal inconnu: pigeon/);
  
  class BadChannel {}
  assert.throws(() => registerChannel('bad', BadChannel), /doit hériter de Channel/);
});

test('Factory (OCP): Slack ajouté sans modifier channels.js', async () => {
  assert.throws(() => createChannel('slack'), /Canal inconnu: slack/);
  
  // Importer dynamiquement le fichier enregistre le canal
  await import('./notifications/slack.js');
  
  const slack = createChannel('slack');
  assert.equal(slack.send({ to: 'logistique', body: 'hello' }), '[SLACK #logistique] hello');
});

test('Builder: interface fluide, validation dans build(), objet immuable', () => {
    // 1. Vérification du succès
    const message = new MessageBuilder()
      .to('alice@exemple.fr')
      .template('Bonjour {{nom}}, votre colis part avec {{transporteur}}.')
      .with('nom', 'Alice')
      .with('transporteur', 'Colissimo')
      .priority('haute')
      .build();
  
    assert.deepEqual(message, {
      to: 'alice@exemple.fr',
      body: 'Bonjour Alice, votre colis part avec Colissimo.',
      priority: 'haute'
    });
  
    // 2. Vérification des erreurs
    assert.throws(() => new MessageBuilder().build(), /Destinataire obligatoire/);
    assert.throws(() => new MessageBuilder().to('alice').build(), /Gabarit obligatoire/);
    assert.throws(() => new MessageBuilder().to('a').template('t').priority('urgente').build(), /Priorité invalide: urgente/);
    assert.throws(() => new MessageBuilder().to('a').template('{{nom}}').build(), /Variable manquante: nom/);
  
    // 3. Vérification de l'immuabilité
    assert.throws(() => { message.body = 'hack'; }, TypeError);
  });

  test('Adapter: Colissimo et DHL respectent le contrat', async () => {
    const colissimo = new ColissimoAdapter(new ColissimoApi());
    const dhl = new DhlAdapter(new DhlClient());
    const parcel = { weightKg: 2, zip: '75011' };
  
    assert.deepEqual(await colissimo.getQuote(parcel), { carrier: 'Colissimo', price: 9.95, days: 2 });
    assert.deepEqual(await dhl.getQuote(parcel), { carrier: 'DHL', price: 11, days: 1 });
  });
  
  test('Decorator Retry: absorbe les pannes et abandonne après la limite', async () => {
    // Client DHL qui échoue 2 fois
    const dhlClient = new DhlClient({ failFirst: 2 });
    const retryDhl = new RetryQuote(new DhlAdapter(dhlClient), { attempts: 3 });
    
    const quote = await retryDhl.getQuote({ weightKg: 2, zip: '75011' });
    assert.equal(quote.price, 11);
    assert.equal(dhlClient.calls, 3); // 2 échecs + 1 succès
  
    // Client DHL qui échoue 3 fois (atteint la limite)
    const dhlClientFail = new DhlClient({ failFirst: 3 });
    const retryFail = new RetryQuote(new DhlAdapter(dhlClientFail), { attempts: 3 });
    await assert.rejects(retryFail.getQuote({ weightKg: 2, zip: '75011' }), /503/);
  });
  
  test('Decorator Cache: mémorise, expire et se compose', async () => {
    let time = 1000;
    const dhlClient = new DhlClient({ failFirst: 1 });
    
    // Composition : Cache -> Retry -> Adapter DHL
    const composed = new CachedQuote(
      new RetryQuote(new DhlAdapter(dhlClient), { attempts: 3 }),
      { ttlMs: 60000, now: () => time }
    );
  
    await composed.getQuote({ weightKg: 2, zip: '75011' }); // Appel réel (appel = 2 à cause du retry)
    assert.equal(dhlClient.calls, 2);
  
    await composed.getQuote({ weightKg: 2, zip: '75011' }); // Hit cache (temps inchangé)
    assert.equal(dhlClient.calls, 2); // Toujours 2 appels !
  
    time += 60001; // On dépasse le TTL
    await composed.getQuote({ weightKg: 2, zip: '75011' }); // Expiré -> Appel réel
    assert.equal(dhlClient.calls, 3);
  });