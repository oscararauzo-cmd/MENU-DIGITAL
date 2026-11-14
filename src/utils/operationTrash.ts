import type { BarEvent } from '../types/bar';
export const TRASH_RETENTION_MS=5*24*60*60*1000;
export function isInTrash(event:BarEvent):boolean {return event.status==='trashed';}
export function visibleOperations(events:BarEvent[]):BarEvent[]{return events.filter(event=>!isInTrash(event));}
export function canRestoreOperation(event:BarEvent,now=Date.now()):boolean{return isInTrash(event)&&Boolean(event.trashExpiresAt)&&now<event.trashExpiresAt!;}
export function trashOperation(event:BarEvent,now=Date.now()):BarEvent{
 if(isInTrash(event))throw new Error('Ya está en la papelera.');
 return {...event,status:'trashed',statusBeforeTrash:event.status==='closed'?'closed':'active',deletedAt:now,trashExpiresAt:now+TRASH_RETENTION_MS};
}
export function restoreOperation(event:BarEvent,now=Date.now()):BarEvent{
 if(!isInTrash(event))throw new Error('El registro ya no está en la papelera. Actualiza la lista.');
 if(!canRestoreOperation(event,now))throw new Error('El plazo de recuperación de 5 días ya terminó.');
 const {deletedAt,trashExpiresAt,statusBeforeTrash,...rest}=event;
 return {...rest,status:statusBeforeTrash==='closed'?'closed':'active'};
}
