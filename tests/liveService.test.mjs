import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareOperationalOrder} from '../src/utils/orderMode.ts';
import {retainEventBackups} from '../src/utils/eventBackups.ts';
const order={id:'o',items:[{cocktailId:'fernet',cocktailName:'Fernet',quantity:1,unitPrice:20,unitCost:0}],totalAmount:20};
const product={id:'fernet',enabledForEvent:true,recipe:[{ingredientId:'panceta',amount:50}]};
const event={id:'live',name:'ALTURA LIVE',status:'active',orders:[order]};
test('service accepts an order despite a missing ingredient and does not debit stock',()=>{
 const result=prepareOperationalOrder(order,event,[product],[]);
 assert.equal(result.inventoryDeferred,true);assert.deepEqual(result.stockUsage,[]);assert.deepEqual(event.orders,[order]);
});
test('tracked inventory still checks missing recipes',()=>assert.throws(()=>prepareOperationalOrder(order,{...event,inventoryMode:'tracked'},[product],[])));
test('closed operations and invalid quantities remain blocked',()=>{
 assert.throws(()=>prepareOperationalOrder(order,{...event,status:'closed'},[product],[]));
 assert.throws(()=>prepareOperationalOrder({...order,items:[{...order.items[0],quantity:-1}]},event,[product],[]));
});
test('ALTURA LIVE snapshots are independent, deduplicated and bounded',()=>{
 const source=structuredClone(event);const saved=retainEventBackups({},[source],1);source.orders=[];
 assert.equal(saved.live[0].event.orders.length,1);
 assert.equal(retainEventBackups(saved,[event],2).live.length,1);
 let history=saved;for(let n=0;n<20;n++)history=retainEventBackups(history,[{...event,name:'ALTURA LIVE',date:String(n)}],n+3);
 assert.equal(history.live.length,10);assert.equal(saved.live.length,1);
});
