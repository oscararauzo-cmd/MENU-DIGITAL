// Isolated visual/interaction fixture. All actions affect React state only.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { KdsScreen } from '../../src/components/KdsScreen';
import { MenuScreen } from '../../src/components/MenuScreen';
import { OrderConnection } from '../../src/components/OrderConnection';
import { INITIAL_EVENTS, INITIAL_COCKTAILS, INITIAL_INGREDIENTS, DEFAULT_BUSINESS_PROFILE } from '../../src/data/initialData';
import type { Order } from '../../src/types/bar';
import '../../src/index.css';
const sample: Order = { id: 'ORD-PRUEBA', timestamp: Date.now(), orderType:'venta', totalAmount:64, status:'preparing', notes:'Mesa 4 · sin hielo', items:[{ cocktailId:INITIAL_COCKTAILS[0].id, cocktailName:'Pisco Sour', quantity:2, unitPrice:32, unitCost:8 }] };
function Fixture() {
  const [view, setView] = useState('barra');
  const [orders, setOrders] = useState<Order[]>([sample]);
  const [failed, setFailed] = useState(true);
  return <div className="h-dvh flex flex-col"><nav className="p-2 flex gap-2 bg-white"><strong className="p-3">Prueba local</strong><button className="p-3 border rounded-xl" onClick={()=>setView('barra')}>Caja de prueba</button><button className="p-3 border rounded-xl" onClick={()=>setView('prep')}>Barra de prueba</button><button className="p-3 border rounded-xl" onClick={()=>setOrders(previous=>[...previous,{...sample,id:`ORD-${Date.now()}`}])}>Simular llegada</button></nav>
    <OrderConnection state={failed ? 'offline':'online'} lastSync={failed ? null:Date.now()} />
    <main className="flex flex-1 min-h-0">{view==='barra' ? <MenuScreen cocktails={INITIAL_COCKTAILS} ingredients={INITIAL_INGREDIENTS} businessProfile={DEFAULT_BUSINESS_PROFILE} activeOrders={orders} outbox={failed ? { [sample.id]: {order:sample,eventId:'test',state:'error'} } : {}} onRetryOrders={()=>setFailed(false)} onAddOrder={order=>setOrders(previous=>[...previous,order])} /> : <KdsScreen activeEvent={{...INITIAL_EVENTS[0], orders}} onUpdateOrderStatus={(id,status)=>setOrders(previous=>previous.map(o=>o.id===id?{...o,status}:o))} onDeleteOrder={async id=>setOrders(previous=>previous.filter(o=>o.id!==id))} />}</main>
  </div>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
