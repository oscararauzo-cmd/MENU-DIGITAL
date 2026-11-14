import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {OperationsDashboard,OperationOverview} from '../../src/components/OperationsDashboard';
import {NewProjectModal} from '../../src/components/NewProjectModal';
import {VentasScreen} from '../../src/components/VentasScreen';
import {INITIAL_EVENTS,INITIAL_COCKTAILS,INITIAL_INGREDIENTS} from '../../src/data/initialData';
import {limaDate} from '../../src/utils/operationContext';
import type {BarEvent} from '../../src/types/bar';
import '../../src/index.css';
const daily:BarEvent={...INITIAL_EVENTS[0],name:'Servicio habitual del bar',date:limaDate(),operationType:'dia'};
const party:BarEvent={...daily,id:'fixture-event',name:'Sunset Sessions · consignación',operationType:'evento',isConsignment:true,organizerName:'Promotor de ejemplo',inventory:[{ingredient:INITIAL_INGREDIENTS[0],receivedUnits:6,openedUnits:1}],orders:[],recipeSnapshot:INITIAL_COCKTAILS};
function Fixture(){
 const [events,setEvents]=useState([daily,party]);const [selected,setSelected]=useState(party.id);const [view,setView]=useState('home');const [create,setCreate]=useState<'dia'|'evento'|null>(null);
 const active=events.find(e=>e.id===selected)!;
 const save=(event:BarEvent)=>{setEvents(previous=>previous.some(e=>e.id===event.id)?previous.map(e=>e.id===event.id?event:e):[event,...previous]);setSelected(event.id);setView('overview');};
 return <div className="h-dvh flex flex-col bg-[#faf8f5]"><header className="bg-white border-b px-4 py-3 flex justify-between items-center"><button className="font-extrabold text-orange-700 min-h-11" onClick={()=>setView('home')}>ALTURA · Inicio</button><span className="text-xs text-stone-500">Prueba local · sin modificar ventas</span></header><main className="flex flex-col flex-1 min-h-0">{view==='home'?<OperationsDashboard events={events} onOpen={event=>{setSelected(event.id);setView('overview');}} onCreate={setCreate} onMonth={()=>setView('month')}/>:view==='overview'?<OperationOverview key={active.id} event={active} cocktails={INITIAL_COCKTAILS} catalog={INITIAL_INGREDIENTS} onOrders={()=>{}} onMetrics={()=>setView('metrics')} onSave={save} onClose={()=>save({...active,status:'closed',inventorySettledAt:Date.now()})}/>:<VentasScreen activeEvent={active} allEvents={events} cocktails={INITIAL_COCKTAILS} ingredients={INITIAL_INGREDIENTS} operationMode={view==='month'?'mes':'evento'} />}</main>{create&&<NewProjectModal initialType={create} isOpen ingredients={INITIAL_INGREDIENTS} cocktails={INITIAL_COCKTAILS} onClose={()=>setCreate(null)} onSaveEvent={save}/>}</div>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
