import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
export type ConnectionState = 'local' | 'connecting' | 'online' | 'offline';
export function OrderConnection({ state, lastSync }: { state: ConnectionState; lastSync: number | null }) {
  const labels = { local: 'Solo este dispositivo', connecting: 'Conectando con barra', online: 'Conexión activa', offline: 'Sin conexión · pedidos guardados aquí' };
  const Icon = state === 'online' ? Wifi : state === 'connecting' ? RefreshCw : WifiOff;
  return <div role="status" className={`px-4 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold border-b shrink-0 ${state === 'online' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-amber-50 text-amber-900 border-amber-100'}`}>
    <span className="flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" />{labels[state]}</span>
    {lastSync && <span className="font-normal">Última actualización {new Date(lastSync).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>}
    {state === 'local' && <span className="font-normal">Tablet y celular necesitan una conexión compartida.</span>}
  </div>;
}
