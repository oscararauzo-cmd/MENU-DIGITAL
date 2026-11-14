import { useCallback, useEffect, useRef, useState } from 'react';
import type { Order, BarEvent } from '../types/bar';
import { enqueueOrder, restoreOutbox, type OrderOutbox } from '../lib/orderOutbox';
import { isSupabaseConfigured, pushOrderToSupabase } from '../lib/supabase';

const key = 'altura_order_outbox_v1';
export function useOrderOutbox(pending: React.RefObject<Set<string>>) {
  const [queue, setQueue] = useState<OrderOutbox>(() => {
    try { return restoreOutbox(localStorage.getItem(key)); } catch { return {}; }
  });
  const current = useRef(queue);
  const busy = useRef(new Set<string>());
  const save = useCallback((next: OrderOutbox) => {
    // Persist before reporting a successful local save or attempting the network.
    localStorage.setItem(key, JSON.stringify(next));
    current.current = next;
    setQueue(next);
  }, []);
  const retry = useCallback(async () => {
    if (!isSupabaseConfigured() || !navigator.onLine) return;
    for (const entry of Object.values(current.current)) {
      const id = entry.order.id;
      if (busy.current.has(id)) continue;
      busy.current.add(id);
      pending.current.add(id);
      try {
        save({ ...current.current, [id]: { ...entry, state: 'sending' } });
        const result = await pushOrderToSupabase(entry.order, entry.eventId, entry.eventContext);
        if (!result.success) throw new Error(result.error || 'No se pudo enviar');
        const next = { ...current.current };
        delete next[id];
        save(next);
      } catch {
        const failed: OrderOutbox = { ...current.current, [id]: { ...entry, state: 'error', error: 'No se pudo enviar. Se reintentará al recuperar la conexión.' } };
        try { save(failed); } catch { current.current = failed; setQueue(failed); }
      } finally {
        busy.current.delete(id);
        pending.current.delete(id);
      }
    }
  }, [pending, save]);
  const enqueue = useCallback((order: Order, eventId: string, eventContext?: BarEvent) => {
    save(enqueueOrder(current.current, order, eventId, eventContext));
    void retry();
  }, [retry, save]);
  useEffect(() => {
    void retry();
    const timer = window.setInterval(() => void retry(), 10000);
    window.addEventListener('online', retry);
    return () => { clearInterval(timer); window.removeEventListener('online', retry); };
  }, [retry]);
  return { queue, queueRef: current, enqueue, retry };
}
