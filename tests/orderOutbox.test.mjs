import test from 'node:test';
import assert from 'node:assert/strict';
import { enqueueOrder, restoreOutbox } from '../src/lib/orderOutbox.ts';

const order = { id: 'ORD-stable-id', timestamp: 123, items: [{ cocktailId: 'pisco', quantity: 2 }], totalAmount: 64 };
test('retry keeps the same order identity and never queues it twice', () => {
  const queue = enqueueOrder({}, order, 'jornada-1');
  assert.equal(enqueueOrder(queue, { ...order }, 'jornada-1'), queue);
  assert.equal(Object.keys(queue).length, 1);
  assert.deepEqual(queue[order.id].order, order);
});
test('reload recovers failed and interrupted sends, retaining the event and payload', () => {
  for (const state of ['error', 'sending']) {
    const restored = restoreOutbox(JSON.stringify({ [order.id]: { order, eventId: 'jornada-1', state } }));
    assert.equal(restored[order.id].state, 'pending');
    assert.deepEqual(restored[order.id].order, order);
    assert.equal(restored[order.id].eventId, 'jornada-1');
  }
});
test('invalid saved data does not prevent opening the application', () => {
  for (const raw of [null, '{broken', 'null', '[]', '{"wrong":{"order":{"id":"different"},"eventId":"jornada-1"}}']) {
    assert.deepEqual(restoreOutbox(raw), {});
  }
});
test('orders from different jornadas remain isolated in the outbox', () => {
  const queue = enqueueOrder(enqueueOrder({}, order, 'jornada-1'), { ...order, id: 'ORD-other' }, 'jornada-2');
  assert.equal(queue[order.id].eventId, 'jornada-1');
  assert.equal(queue['ORD-other'].eventId, 'jornada-2');
});
