// tp4.test.js
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