import test from 'node:test';
import assert from 'node:assert/strict';
import {trashOperation,restoreOperation,canRestoreOperation,visibleOperations,TRASH_RETENTION_MS} from '../src/utils/operationTrash.ts';
import {encodeEventSnapshot,decodeEventSnapshot,selectPeriodEvents} from '../src/utils/operationContext.ts';
const now=Date.parse('2026-11-14T20:00:00Z');
const event={id:'party',name:'Evento',date:'2026-11-14',operationType:'evento',status:'active',createdAt:now-1000,orders:[{id:'order',items:[]}],wastes:[],recipeSnapshot:[{id:'drink',price:25}],inventory:[{ingredient:{id:'pisco'},receivedUnits:6,openedUnits:1}],initialIngredientsSnapshot:{pisco:6}};
test('moving to trash preserves orders, menu, inventory and exact five-day deadline',()=>{
 const trashed=trashOperation(event,now);
 assert.equal(trashed.status,'trashed');assert.equal(trashed.trashExpiresAt,Date.parse('2026-11-19T20:00:00Z'));
 assert.equal(trashed.trashExpiresAt-now,TRASH_RETENTION_MS);
 assert.equal(trashed.orders,event.orders);assert.equal(trashed.inventory,event.inventory);assert.equal(trashed.recipeSnapshot,event.recipeSnapshot);assert.equal(event.status,'active');
});
test('restore expires at the boundary, not the following day',()=>{
 const trashed=trashOperation(event,now);
 assert.equal(canRestoreOperation(trashed,trashed.trashExpiresAt-1),true);
 assert.equal(canRestoreOperation(trashed,trashed.trashExpiresAt),false);
 assert.throws(()=>restoreOperation(trashed,trashed.trashExpiresAt),/5 días/);
});
test('restoring closed and settled events does not reopen or repeat settlement',()=>{
 const original={...event,status:'closed',closedAt:now-1000,inventorySettledAt:now-1000};
 const restored=restoreOperation(trashOperation(original,now),now+1000);
 assert.deepEqual(restored,original);assert.equal(restored.inventorySettledAt,original.inventorySettledAt);
});
test('trashed operations do not appear in normal lists or period totals',()=>{
 const trashed=trashOperation(event,now);const day={...event,id:'day',operationType:'dia'};
 assert.deepEqual(visibleOperations([trashed,day]),[day]);
 assert.deepEqual(selectPeriodEvents([trashed,day],trashed,'evento'),[]);
 assert.deepEqual(selectPeriodEvents([trashed,day],trashed,'mes',true,'2026-11-14'),[day]);
});
test('trash metadata survives the remote snapshot and classification stays unknown for legacy records',()=>{
 const trashed=trashOperation(event,now);const decoded=decodeEventSnapshot(JSON.stringify(encodeEventSnapshot(trashed)));
 assert.equal(decoded.deletedAt,now);assert.equal(decoded.trashExpiresAt,trashed.trashExpiresAt);assert.equal(decoded.statusBeforeTrash,'active');
 assert.equal(decodeEventSnapshot(encodeEventSnapshot({...event,operationType:undefined})).operationType,undefined);
});
test('duplicate trash does not reset the five-day window',()=>assert.throws(()=>trashOperation(trashOperation(event,now),now+1000),/papelera/));
