import type {BarEvent} from '../types/bar';
export interface BarSession {eventId?:string;name?:string;date?:string;}
const key='altura_bar_session_v1';
export function readBarSession(search:string,storage:Pick<Storage,'getItem'|'setItem'>):BarSession|null{
 const params=new URLSearchParams(search);
 if(params.get('acceso')==='barra'){
  const session:BarSession=params.get('evento')?{eventId:params.get('evento')!}:{name:'ALTURA LIVE',date:'2026-11-14'};
  storage.setItem(key,JSON.stringify(session));return session;
 }
 try{const saved=JSON.parse(storage.getItem(key)||'null');return saved&&(typeof saved.eventId==='string'||(saved.name==='ALTURA LIVE'&&saved.date==='2026-11-14'))?saved:null;}catch{return null;}
}
export function resolveBarEvent(events:BarEvent[],session:BarSession):BarEvent|undefined{
 const matches=events.filter(event=>event.status!=='trashed'&&(session.eventId?event.id===session.eventId:event.name.trim().replace(/\s+/g,' ').toUpperCase()===session.name&&event.date===session.date));
 return matches.length===1?matches[0]:undefined;
}
export function clearBarSession(storage:Pick<Storage,'removeItem'>){storage.removeItem(key);}
