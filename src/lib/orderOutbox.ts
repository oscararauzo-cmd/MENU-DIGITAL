import type { Order, BarEvent } from '../types/bar';

export interface OutboxEntry {
  order: Order;
  eventContext?: BarEvent;
  eventId: string;
  state: 'pending' | 'sending' | 'error';
  error?: string;
}
export type OrderOutbox = Record<string, OutboxEntry>;

// Never change the order ID on retry: remote upserts use this as their identity.
export function enqueueOrder(queue: OrderOutbox, order: Order, eventId: string, eventContext?: BarEvent): OrderOutbox {
  if (queue[order.id]) return queue;
  return { ...queue, [order.id]: { order, eventId, eventContext, state: 'pending' } };
}
export function restoreOutbox(raw: string | null): OrderOutbox {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return Object.fromEntries(Object.entries(parsed).filter(([id, value]: [string, any]) => value?.order?.id === id && typeof value.eventId === 'string' && Array.isArray(value.order.items)).map(([id, value]: [string, any]) => [id, { ...value, state: 'pending' }]));
  } catch { return {}; }
}
