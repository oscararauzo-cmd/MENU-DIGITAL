import React, { useEffect, useRef, useState } from 'react';
import { BarEvent, OrderPreparationStatus } from '../types/bar';
import { isSupabaseConfigured } from '../lib/supabase';

interface KdsScreenProps {
  activeEvent: BarEvent;
  onUpdateOrderStatus?: (orderId: string, status: OrderPreparationStatus) => void;
  onGoToBarra?: () => void;
}

export const KdsScreen: React.FC<KdsScreenProps> = ({ activeEvent, onUpdateOrderStatus, onGoToBarra }) => {
  const [filter, setFilter] = useState<OrderPreparationStatus>('preparing');
  const [notice, setNotice] = useState('');
  const [permission, setPermission] = useState(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
  const seen = useRef(new Set(activeEvent.orders.map(o => o.id)));
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => tick(n => n + 1), 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const incoming = activeEvent.orders.filter(o => !seen.current.has(o.id) && (!o.status || o.status === 'preparing'));
    seen.current = new Set(activeEvent.orders.map(o => o.id));
    if (!incoming.length) return;
    const message = `${incoming.length} pedido(s) nuevo(s) en preparación`;
    setNotice(message);
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Nuevo pedido', { body: incoming.map(o => o.items.map(i => `${i.quantity} × ${i.cocktailName}`).join(', ')).join('\n') });
    }
  }, [activeEvent.orders]);
  const labels = { preparing: 'En preparación', ready: 'Listos', delivered: 'Entregados' };
  const orders = activeEvent.orders.filter(o => (o.status || 'preparing') === filter).sort((a, b) => a.timestamp - b.timestamp);
  return <div className="flex-1 min-h-0 flex flex-col bg-stone-50 text-stone-900 overflow-hidden">
    <header className="p-4 bg-white border-b border-stone-200 space-y-3">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div><h2 className="text-xl font-bold">Preparación</h2><p className="text-xs text-stone-500">Preparar → Pedido listo → Pedido entregado</p></div>
        <div className="flex gap-2">
          {permission === 'default' && <button className="p-3 rounded-xl border text-sm" onClick={async () => {
            try { setPermission(await Notification.requestPermission()); } catch { setPermission('unsupported'); }
          }}>Activar avisos</button>}
          {onGoToBarra && <button className="p-3 rounded-xl border text-sm" onClick={onGoToBarra}>Crear pedido</button>}
        </div>
      </div>
      <p className="text-xs text-stone-500">{isSupabaseConfigured() ? 'Actualización automática cada 5 segundos. Mantén esta pantalla abierta en el celular.' : 'Modo local: los pedidos solo están disponibles en este dispositivo. Configura la conexión para usar tablet y celular.'}</p>
      {permission === 'denied' && <p className="text-xs text-stone-500">Avisos del navegador bloqueados. Los nuevos pedidos se muestran aquí.</p>}
      {notice && <div role="status" className="flex justify-between items-center gap-2 p-3 rounded-xl bg-orange-100 text-orange-900"><span>{notice}</span><button className="p-2 font-bold" onClick={() => { setFilter('preparing'); setNotice(''); }}>Ver pedidos</button></div>}
      <div className="flex gap-2 overflow-x-auto">{(Object.keys(labels) as OrderPreparationStatus[]).map(status => <button key={status} onClick={() => setFilter(status)} className={`shrink-0 min-h-12 px-4 rounded-xl text-sm font-bold ${filter === status ? 'bg-orange-600 text-white' : 'bg-stone-100'}`}>
        {labels[status]} ({activeEvent.orders.filter(o => (o.status || 'preparing') === status).length})
      </button>)}</div>
    </header>
    <div className="overflow-y-auto flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
      {!orders.length && <p className="col-span-full p-10 text-center text-stone-500">No hay pedidos {labels[filter].toLowerCase()}.</p>}
      {orders.map(order => <article key={order.id} className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
        <div className="p-4 border-b flex justify-between gap-2"><strong>Pedido {order.id.replace('ORD-', '').slice(-8).toUpperCase()}</strong><span className="text-sm text-stone-500">{Math.max(0, Math.floor((Date.now() - order.timestamp) / 60000))} min</span></div>
        <ul className="p-4 space-y-3">{order.items.map((item, i) => <li key={i} className="flex gap-3"><strong className="text-orange-700">{item.quantity}×</strong><span className="font-semibold">{item.cocktailName}</span></li>)}</ul>
        {order.notes && <p className="mx-4 mb-4 p-3 rounded-xl bg-amber-50 text-sm">{order.notes}</p>}
        <div className="p-4 border-t">{filter === 'delivered' ? <p className="text-center text-emerald-700 font-bold">Pedido entregado</p> : <button disabled={!onUpdateOrderStatus} onClick={() => onUpdateOrderStatus?.(order.id, filter === 'preparing' ? 'ready' : 'delivered')} className="w-full min-h-12 p-3 rounded-xl bg-emerald-600 text-white font-bold">{filter === 'preparing' ? 'Pedido listo' : 'Pedido entregado'}</button>}</div>
      </article>)}
    </div>
  </div>;
};
