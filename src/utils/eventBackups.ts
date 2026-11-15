import type {BarEvent} from '../types/bar';
export interface EventBackup{capturedAt:number;event:BarEvent;}
export type EventBackups=Record<string,EventBackup[]>;
export function isLiveEvent(event:BarEvent):boolean{return event.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ')==='altura live';}
export function retainEventBackups(saved:EventBackups,events:BarEvent[],now=Date.now()):EventBackups{
 const result={...saved};
 for(const event of events.filter(isLiveEvent)){
  const history=result[event.id]||[];
  if(history.length&&JSON.stringify(history[history.length-1].event)===JSON.stringify(event))continue;
  result[event.id]=[...history,{capturedAt:now,event:JSON.parse(JSON.stringify(event))}].slice(-10);
 }
 return result;
}
export function backupDocument(event:BarEvent){return {format:'altura-event-backup',version:1,capturedAt:new Date().toISOString(),event};}
export function saveProtectedEvents(events:BarEvent[]):void{
 const key='altura_protected_event_backups_v1';
 let saved:EventBackups={};try{saved=JSON.parse(localStorage.getItem(key)||'{}');}catch{}
 localStorage.setItem(key,JSON.stringify(retainEventBackups(saved,events)));
}
