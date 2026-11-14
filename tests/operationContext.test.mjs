import test from 'node:test';
import assert from 'node:assert/strict';
import { selectPeriodEvents, consignmentSettlement, eventInventory, encodeEventSnapshot, decodeEventSnapshot, limaDate } from '../src/utils/operationContext.ts';
const ingredient={id:'pisco',name:'Pisco',unit:'botella_750ml',volumePerUnitMl:750,packageCost:40,currentStockUnits:100};
const cocktail={id:'sour',recipe:[{ingredientId:'pisco',amount:75}]};
const base={id:'daily',name:'Bar',date:'2026-11-14',operationType:'dia',status:'active',createdAt:0,orders:[],wastes:[],initialIngredientsSnapshot:{pisco:100}};
const event={...base,id:'party',operationType:'evento',isConsignment:true,inventory:[{ingredient,receivedUnits:6,openedUnits:1}],recipeSnapshot:[cocktail],orders:[{id:'order',items:[{cocktailId:'sour',quantity:2}]}]};
test('daily results exclude special events and never fall back to another day',()=>{
 assert.deepEqual(selectPeriodEvents([base,event],event,'dia',true,'2026-11-14').map(e=>e.id),['daily']);
 assert.deepEqual(selectPeriodEvents([base,event],event,'dia',true,'2026-11-15'),[]);
 assert.deepEqual(selectPeriodEvents([base,event],event,'evento'),[event]);
});
test('monthly consolidation filters the month and can exclude events',()=>{
 const old={...base,id:'old',date:'2026-10-14'};
 assert.deepEqual(selectPeriodEvents([base,event,old],event,'mes',true,'2026-11-14').map(e=>e.id),['daily','party']);
 assert.deepEqual(selectPeriodEvents([base,event,old],event,'mes',false,'2026-11-14').map(e=>e.id),['daily']);
});
test('consignment bills opened bottles, returns sealed bottles and retains only opened remainder',()=>{
 const [line]=consignmentSettlement(event,[]);
 assert.equal(line.openedUnits,1);assert.equal(line.cost,40);assert.equal(line.sealedReturnedUnits,5);
 assert.ok(Math.abs(line.retainedUnits-0.8)<1e-8);
 assert.equal(ingredient.currentStockUnits,100);
 assert.equal(eventInventory(event,[])[0].currentStockUnits,5.8);
});
test('opened count can exceed recipe use and recipe changes do not rewrite history',()=>{
 const [line]=consignmentSettlement({...event,inventory:[{ingredient,receivedUnits:6,openedUnits:2}]},[{...cocktail,recipe:[{ingredientId:'pisco',amount:500}]}]);
 assert.equal(line.openedUnits,2);assert.equal(line.cost,80);assert.equal(line.sealedReturnedUnits,4);
 assert.ok(Math.abs(line.retainedUnits-1.8)<1e-8);
});
test('overconsumption prevents a valid consignment settlement',()=>{
 const [line]=consignmentSettlement({...event,inventory:[{ingredient,receivedUnits:1,openedUnits:0}],orders:[{items:[{cocktailId:'sour',quantity:20}]}]},[]);
 assert.equal(line.valid,false);
});
test('existing JSON snapshot preserves event context and legacy numeric stock',()=>{
 const restored=decodeEventSnapshot(JSON.stringify(encodeEventSnapshot(event)));
 assert.equal(restored.operationType,'evento');assert.deepEqual(restored.inventory,event.inventory);assert.deepEqual(restored.recipeSnapshot,event.recipeSnapshot);
 assert.deepEqual(restored.initialIngredientsSnapshot,{pisco:100});
 assert.deepEqual(decodeEventSnapshot({pisco:5}),{initialIngredientsSnapshot:{pisco:5}});
});
test('date boundaries use Lima rather than UTC',()=>assert.equal(limaDate(new Date('2026-11-15T02:00:00Z')),'2026-11-14'));
