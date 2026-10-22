// tp4.test.js
import { MessageBuilder } from './notifications/MessageBuilder.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';

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