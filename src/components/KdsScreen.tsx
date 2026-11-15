import React, { useEffect, useRef, useState } from 'react';
import { BarEvent, OrderPreparationStatus } from '../types/bar';
import { ChefHat, ShoppingBag, Bell, Clock, Check, CheckCircle2, Trash2, Receipt, Volume2, VolumeX } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface KdsScreenProps {
  activeEvent: BarEvent;
  onUpdateOrderStatus?: (orderId: string, status: OrderPreparationStatus) => void | Promise<void>;
  onDeleteOrder?: (orderId: string) => Promise<void>;
  onGoToBarra?: () => void;
}

export const KdsScreen: React.FC<KdsScreenProps> = ({ activeEvent, onUpdateOrderStatus, onDeleteOrder, onGoToBarra }) => {
  const audio = useRef<AudioContext | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundError, setSoundError] = useState('');
  const playSound = () => {
    const context = audio.current;
    if (!context || context.state !== 'running') return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.frequency.setValueAtTime(740, context.currentTime);
    oscillator.frequency.setValueAtTime(990, context.currentTime + 0.16);
    gain.gain.setValueAtTime(0.12, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.45);
    oscillator.start(); oscillator.stop(context.currentTime + 0.46);
  };
  useEffect(() => () => { void audio.current?.close(); }, []);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [updating,setUpdating]=useState<string|null>(null);
  const [statusError,setStatusError]=useState('');
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
    if (soundEnabled) playSound();
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try { new Notification('Nuevo pedido', { body: incoming.map(o => o.items.map(i => `${i.quantity} × ${i.cocktailName}`).join(', ')).join('\n') }); } catch { /* Some mobile browsers require push notifications. Keep the in-app notice. */ }
    }
  }, [activeEvent.orders]);
  const labels = { preparing: 'En preparación', ready: 'Listos', delivered: 'Entregados' };
  const orders = activeEvent.orders.filter(o => (o.status || 'preparing') === filter).sort((a, b) => a.timestamp - b.timestamp);
  return <div className="flex-1 min-h-0 flex flex-col bg-[#faf8f5] text-stone-900 overflow-hidden font-sans">
    <header className="px-4 sm:px-6 py-4 bg-white border-b border-stone-200 space-y-3 shadow-2xs shrink-0">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center"><ChefHat className="w-6 h-6" /></div><div><h2 className="text-lg font-extrabold tracking-tight">Estación de preparación</h2><p className="text-xs text-stone-500">Cada pedido, del primer trago a la entrega.</p></div></div>
        <div className="flex flex-wrap gap-2">
          <button aria-pressed={soundEnabled} className={`min-h-12 px-3 rounded-2xl border text-xs font-bold flex items-center gap-2 transition active:scale-95 ${soundEnabled ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-stone-50 border-stone-200 text-stone-600'}`} onClick={async () => {
            if (soundEnabled) { setSoundEnabled(false); return; }
            try {
              audio.current ||= new AudioContext();
              await audio.current.resume();
              if (audio.current.state !== 'running') throw new Error();
              setSoundEnabled(true); setSoundError(''); playSound();
            } catch { setSoundError('No se pudo activar el sonido. Revisa el volumen y los permisos del celular.'); }
          }}>{soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}{soundEnabled ? 'Sonido activo' : 'Activar sonido'}</button>
          {permission === 'default' && <button className="min-h-12 px-3 rounded-2xl border border-stone-200 bg-stone-50 text-xs font-bold flex items-center gap-2 transition active:scale-95" onClick={async () => {
            try { setPermission(await Notification.requestPermission()); } catch { setPermission('unsupported'); }
          }}><Bell className="w-4 h-4 text-orange-600" />Activar avisos</button>}
          {onGoToBarra && <button className="min-h-12 px-4 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold shadow-sm shadow-orange-500/20 flex items-center gap-2 transition active:scale-95" onClick={onGoToBarra}><ShoppingBag className="w-4 h-4" />Crear pedido</button>}
        </div>
      </div>
      <p className="text-xs text-stone-500">{isSupabaseConfigured() ? 'Actualización automática cada 5 segundos. Mantén esta pantalla abierta en el celular.' : 'Modo local: los pedidos solo están disponibles en este dispositivo. Configura la conexión para usar tablet y celular.'}</p>
      {soundError && <p role="status" className="text-xs text-amber-800">{soundError}</p>}
      {permission === 'denied' && <p className="text-xs text-stone-500">Avisos del navegador bloqueados. Los nuevos pedidos se muestran aquí.</p>}
      {statusError&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs text-rose-800">{statusError}</p>}
      {notice && <div role="status" className="flex justify-between items-center gap-2 p-3 rounded-xl bg-orange-100 text-orange-900"><span>{notice}</span><button className="p-2 font-bold" onClick={() => { setFilter('preparing'); setNotice(''); }}>Ver pedidos</button></div>}
      <div className="grid grid-cols-3 sm:flex gap-2 pb-1">{(Object.keys(labels) as OrderPreparationStatus[]).map(status => <button key={status} onClick={() => setFilter(status)} className={`min-w-0 min-h-12 px-2 sm:px-4 rounded-2xl text-[11px] sm:text-sm font-extrabold ${filter === status ? 'bg-orange-600 text-white shadow-sm shadow-orange-500/20' : 'bg-stone-100 text-stone-600 border border-stone-200'}`}>
        {labels[status]} ({activeEvent.orders.filter(o => (o.status || 'preparing') === status).length})
      </button>)}</div>
    </header>
    <div className="overflow-y-auto flex-1 min-h-0 p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 auto-rows-max">
      {!orders.length && <p className="col-span-full rounded-3xl border border-stone-200 bg-white shadow-2xs p-12 text-center text-stone-500"><ChefHat className="w-12 h-12 text-orange-300 mx-auto mb-3" /><strong className="block text-stone-800 mb-1">Todo al día</strong>No hay pedidos {labels[filter].toLowerCase()}.</p>}
      {orders.map(order => <article key={order.id} className={`min-w-0 rounded-3xl border-2 bg-white overflow-hidden shadow-2xs ${filter === 'preparing' ? 'border-orange-200 shadow-orange-100/50' : 'border-emerald-200'}`}>
        <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-2 ${filter === 'preparing' ? 'bg-orange-50/70 border-orange-100' : 'bg-emerald-50/70 border-emerald-100'}`}><strong className="font-mono text-sm tracking-tight">Pedido {order.id.replace('ORD-', '').slice(-8).toUpperCase()}</strong><span className="text-xs font-mono font-bold text-stone-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{Math.max(0, Math.floor((Date.now() - order.timestamp) / 60000))} min</span></div>
        <ul className="p-4 space-y-3">{order.items.map((item, i) => <li key={i} className="flex items-center gap-3 rounded-xl bg-stone-50 border border-stone-200/80 p-3"><strong className="w-8 h-8 rounded-xl bg-orange-600 text-white font-mono flex items-center justify-center shrink-0">{item.quantity}×</strong><span className="font-extrabold text-sm break-words min-w-0">{item.cocktailName}</span></li>)}</ul>
        {order.notes && <p className="mx-4 mb-4 p-3 rounded-xl bg-amber-50 text-sm">{order.notes}</p>}
        <div className="p-3 bg-stone-50 border-t border-stone-200 space-y-2">{filter === 'delivered' ? <p className="text-center text-emerald-700 font-bold">Pedido entregado</p> : <button disabled={!onUpdateOrderStatus||updating!==null||activeEvent.status!=='active'} onClick={async()=>{setUpdating(order.id);setStatusError('');try{await onUpdateOrderStatus?.(order.id,filter==='preparing'?'ready':'delivered');}catch(error){setStatusError(error instanceof Error?error.message:'No se pudo actualizar.');}finally{setUpdating(null);}}} className="w-full min-h-12 p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2 transition active:scale-95">{filter === 'preparing' ? 'Pedido listo' : 'Pedido entregado'}</button>}
          {onDeleteOrder && activeEvent.status==='active' && (deleteId === order.id ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 space-y-2">
            <p className="text-xs font-bold text-rose-900">¿Eliminar este pedido?</p>
            <p className="text-xs text-rose-800">Se quitará también de ventas. {(!order.status || order.status === 'preparing') ? 'Se devolverán los insumos al inventario; confirma solo si aún no se preparó.' : 'Los insumos consumidos no se devolverán al inventario.'}</p>
            {deleteError && <p role="alert" className="text-xs text-rose-800">{deleteError}</p>}
            <div className="grid grid-cols-2 gap-2"><button disabled={deleting} onClick={async () => {
              setDeleting(true); setDeleteError('');
              try { await onDeleteOrder(order.id); setDeleteId(null); }
              catch (error) { setDeleteError(error instanceof Error ? error.message : 'No se pudo eliminar. Intenta nuevamente.'); }
              finally { setDeleting(false); }
            }} className="min-h-12 px-2 rounded-xl bg-rose-600 text-white text-xs font-bold disabled:opacity-50">{deleting ? 'Eliminando…' : 'Sí, eliminar'}</button>
            <button disabled={deleting} onClick={() => { setDeleteId(null); setDeleteError(''); }} className="min-h-12 px-2 rounded-xl border border-rose-200 bg-white text-xs font-bold">Cancelar</button></div>
          </div> : <button onClick={() => { setDeleteId(order.id); setDeleteError(''); }} className="w-full min-h-11 text-xs font-bold text-stone-500 hover:text-rose-700 flex items-center justify-center gap-2 rounded-xl hover:bg-rose-50"><Trash2 className="w-4 h-4" />Eliminar pedido</button>)}
        </div>
      </article>)}
    </div>
  </div>;
};
