import React,{useEffect,useRef,useState} from 'react';
import type {BarEvent,BusinessProfile,OrderPreparationStatus} from '../types/bar';
import type {BarSession} from '../utils/barSession';
import {clearBarSession,resolveBarEvent} from '../utils/barSession';
import {fetchInitialStateFromSupabase,isSupabaseConfigured,updateOrderStatusInSupabase} from '../lib/supabase';
import {KdsScreen} from './KdsScreen';
import {PinLockModal} from './PinLockModal';
import {OrderConnection,type ConnectionState} from './OrderConnection';

export function BarSessionScreen({session}:{session:BarSession}){
 const [event,setEvent]=useState<BarEvent>();
 const [profile,setProfile]=useState<BusinessProfile>();
 const [connection,setConnection]=useState<ConnectionState>('connecting');
 const [lastSync,setLastSync]=useState<number|null>(null);
 const [message,setMessage]=useState('Conectando con el evento…');
 const [unlock,setUnlock]=useState(false);
 const busy=useRef(new Set<string>());
 useEffect(()=>{
  let cancelled=false,fetching=false;
  const refresh=async()=>{
   if(fetching)return;fetching=true;
   try{
    if(!isSupabaseConfigured())throw new Error('Este acceso necesita conexión compartida. No se crearán datos de ejemplo.');
    const remote=await fetchInitialStateFromSupabase();
    if(!remote)throw new Error('Sin conexión. Esperando para actualizar los pedidos.');
    if(cancelled)return;
    const selected=resolveBarEvent(remote.events||[],session);
    setEvent(previous=>selected?{...selected,orders:selected.orders.map(order=>busy.current.has(order.id)?previous?.orders.find(existing=>existing.id===order.id)||order:order)}:undefined);
    if(remote.businessProfile)setProfile(remote.businessProfile);
    setMessage(selected?'':'No se encontró un único ALTURA LIVE del 14/11. Administración debe revisar el evento; no se abrirá otro automáticamente.');
    setConnection('online');setLastSync(Date.now());
   }catch(error){if(!cancelled){setConnection('offline');setMessage(error instanceof Error?error.message:'No se pudo conectar.');}}
   finally{fetching=false;}
  };
  void refresh();const timer=setInterval(refresh,5000);window.addEventListener('online',refresh);
  return()=>{cancelled=true;clearInterval(timer);window.removeEventListener('online',refresh);};
 },[session]);
 const update=async(id:string,status:OrderPreparationStatus)=>{
  if(!event||event.status!=='active')throw new Error('El evento está cerrado.');
  if(busy.current.has(id))return;
  const order=event.orders.find(order=>order.id===id),previous=order?.status||'preparing';
  if(!order||!((previous==='preparing'&&status==='ready')||(previous==='ready'&&status==='delivered')))throw new Error('El pedido cambió. Espera la actualización.');
  if(connection!=='online'||!navigator.onLine)throw new Error('Espera a recuperar la conexión para confirmar el pedido.');
  busy.current.add(id);
  try{const result=await updateOrderStatusInSupabase(id,status,previous);if(!result.success)throw new Error(result.error||'No se pudo guardar.');setEvent(current=>current?{...current,orders:current.orders.map(order=>order.id===id?{...order,status}:order)}:current);}
  finally{busy.current.delete(id);}
 };
 return <div className="app-shell flex flex-col h-dvh overflow-hidden bg-[#faf8f5] text-stone-900">
  <header className="flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-stone-200"><div><p className="text-xs font-extrabold text-orange-600">ACCESO BARRA · SOLO PREPARACIÓN</p><h1 className="font-bold">{event?.name||'ALTURA LIVE'} · {event?.date||'14/11'}</h1></div>{profile&&<button className="min-h-11 px-3 rounded-xl border border-stone-200 text-xs font-bold" onClick={()=>setUnlock(true)}>Administración</button>}</header>
  <OrderConnection state={connection} lastSync={lastSync}/>
  {message&&<p role="status" className="px-4 py-3 text-sm text-stone-600">{message}</p>}
  {event&&<KdsScreen key={event.id} activeEvent={event} onUpdateOrderStatus={update}/>}
  {profile&&<PinLockModal isOpen={unlock} businessProfile={profile} onClose={()=>setUnlock(false)} onUnlock={()=>{clearBarSession(localStorage);window.location.assign('/');}}/>}
 </div>;
}
