import test from 'node:test';
import assert from 'node:assert/strict';
import {captureStockUsage,usageForOrder,applyStockUsage,wastePackages,deleteOrderFromEvent,encodeOrderNotes,decodeOrderNotes} from '../src/utils/inventoryLedger.ts';
import {eventInventory,operationCost} from '../src/utils/operationContext.ts';
import {calculateEventMetrics} from '../src/utils/calculations.ts';
import {parseLocalNumber} from '../src/utils/importNumbers.ts';
import {mergeMenuImport} from '../src/utils/menuImport.ts';
import {catalogChanges,mergeCatalogQueue,restoreCatalogQueue} from '../src/lib/catalogOutbox.ts';
import {assistantActionPlan} from '../src/utils/assistantActions.ts';
import {publicMenuHtml} from '../src/utils/publicMenu.ts';
const ingredient={id:'pisco',name:'Pisco Quebranta',category:'licor',unit:'botella_750ml',volumePerUnitMl:750,packageCost:40,initialStockUnits:6,currentStockUnits:6,minAlertUnits:1};
const drink={id:'sour',name:'Sour Clásico',category:'pisco',price:30,enabledForEvent:true,description:'Sour',recipe:[{ingredientId:'pisco',amount:75}]};
const order={id:'order',timestamp:1,orderType:'venta',status:'preparing',items:[{cocktailId:'sour',cocktailName:'Sour Clásico',quantity:2,unitPrice:30,unitCost:4}],totalAmount:60,notes:'Mesa 4'};
const withUsage={...order,stockUsage:captureStockUsage(order,[drink],[ingredient])};
const event={id:'event',name:'Evento',date:'2026-11-14',status:'active',orders:[withUsage],wastes:[],initialIngredientsSnapshot:{pisco:6},inventory:[{ingredient,receivedUnits:6,openedUnits:0}],recipeSnapshot:[drink]};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('editing a recipe after selling does not rewrite historical consumption',()=>{
 const changed={...event,recipeSnapshot:[{...drink,recipe:[{ingredientId:'pisco',amount:150}]}]};
 near(eventInventory(changed,[])[0].currentStockUnits,5.8);
 near(applyStockUsage([ingredient],usageForOrder(withUsage,[],[]),-1)[0].currentStockUnits,5.8);
});
test('deleting a prepared event order keeps the consumed stock and its cost',()=>{
 const ready={...withUsage,status:'ready'};const next=deleteOrderFromEvent({...event,orders:[ready]},ready,[drink],[ingredient]);
 assert.equal(next.orders.length,0);near(eventInventory(next,[])[0].currentStockUnits,5.8);near(operationCost(next,[]),8);
});
test('deleting an unprepared order releases stock',()=>{
 const next=deleteOrderFromEvent(event,withUsage,[drink],[ingredient]);
 near(eventInventory(next,[])[0].currentStockUnits,6);assert.equal(next.retainedStockUsage,undefined);
});
test('waste recorded by presentation, ml and litres has consistent stock impact',()=>{
 near(wastePackages({quantity:1,unit:'botella/un'},ingredient),1);
 near(wastePackages({quantity:75,unit:'ml'},ingredient),0.1);
 near(wastePackages({quantity:0.75,unit:'litros'},ingredient),1);
});
test('remote notes encoding preserves user notes and exact stock snapshot',()=>{
 assert.deepEqual(decodeOrderNotes(encodeOrderNotes(withUsage)),{notes:'Mesa 4',stockUsage:withUsage.stockUsage});
 assert.deepEqual(decodeOrderNotes('Mesa 8'),{notes:'Mesa 8'});
});
test('historical costs use the cost recorded at sale, not current recipe prices',()=>{
 const metrics=calculateEventMetrics(event,[drink],[{...ingredient,packageCost:80}]);
 assert.equal(metrics.totalCostSold,8);assert.equal(metrics.totalRevenue,60);
});
test('zero, decimal comma and thousands separators import correctly',()=>{
 assert.equal(parseLocalNumber('38,50'),38.5);assert.equal(parseLocalNumber('S/ 1.234,50'),1234.5);
 assert.equal(parseLocalNumber('1,234.50'),1234.5);assert.equal(parseLocalNumber(0,25),0);
});
test('menu imports update prices while preserving recipe and identity',()=>{
 const result=mergeMenuImport([drink],[{...drink,id:'new-import',price:35,recipe:[]}]);
 assert.equal(result.length,1);assert.equal(result[0].id,'sour');assert.equal(result[0].price,35);assert.deepEqual(result[0].recipe,drink.recipe);
 assert.throws(()=>mergeMenuImport([drink],[{...drink,price:-1}]),/Precio/);
});
test('catalog changes delete missing rows and do not re-upload unchanged rows',()=>{
 const changes=catalogChanges('cocktails',[drink,{...drink,id:'other'}],[drink]);
 assert.deepEqual(changes,[{resource:'cocktails',id:'other',action:'delete'}]);
 assert.deepEqual(mergeCatalogQueue('cocktails',[drink],{'cocktails:sour':{resource:'cocktails',id:'sour',action:'delete'}}),[]);
});
test('offline catalog edits survive a remote reload and damaged outbox is safe',()=>{
 const mutation={resource:'cocktails',id:'sour',action:'upsert',record:{...drink,price:19}};
 const queue=restoreCatalogQueue(JSON.stringify({'cocktails:sour':mutation}));
 assert.equal(mergeCatalogQueue('cocktails',[drink],queue)[0].price,19);
 assert.deepEqual(restoreCatalogQueue('{broken'),{});
});
test('assistant rejects unknown or ambiguous products instead of choosing the first',()=>{
 assert.throws(()=>assistantActionPlan({type:'add_order',order:{orderType:'cortesia',items:[{cocktailName:'no existe',quantity:1}]}},[drink],[ingredient]),/encontró/);
 assert.throws(()=>assistantActionPlan({type:'update_stock',stock:{ingredientName:'pisco',addedUnits:2}},[],[ingredient,{...ingredient,id:'other',name:'Pisco Acholado'}]),/varios/);
});
test('assistant validates quantities and uses recipe cost',()=>{
 const plan=assistantActionPlan({type:'add_order',order:{orderType:'cortesia',items:[{cocktailName:drink.name,quantity:1}]}},[drink],[ingredient]);
 assert.equal(plan.value.items[0].unitCost,4);assert.equal(plan.value.totalAmount,0);
 assert.throws(()=>assistantActionPlan({type:'update_stock',stock:{ingredientName:ingredient.name,addedUnits:-2}},[],[ingredient]),/cantidad/);
});
test('customer menu export excludes costs, recipes, PIN and back-office data and escapes HTML',()=>{
 const html=publicMenuHtml({name:'<Test>',tagline:'Bar',currencySymbol:'S/',accessPin:'9876'},[{...drink,name:'<script>alert(1)</script>'}],'https://example.com/');
 assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('9876'));assert.ok(!html.includes('ingredientId'));assert.ok(!html.includes('packageCost'));
});
