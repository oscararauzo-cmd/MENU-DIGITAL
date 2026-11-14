import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeImportedIngredients, updateEventInventory} from '../src/utils/ingredientImport.ts';
const ingredient={id:'pisco',name:'Pisco',currentStockUnits:100,initialStockUnits:100,packageCost:40};
test('Excel replaces matching stock without changing recipe ingredient IDs',()=>{
 const result=mergeImportedIngredients([ingredient],[{...ingredient,id:'import-1',name:' PISCO ',currentStockUnits:6}]);
 assert.equal(result.length,1);assert.equal(result[0].id,'pisco');assert.equal(result[0].currentStockUnits,6);assert.equal(ingredient.currentStockUnits,100);
});
test('increasing event stock changes only event receipts and preserves opened counts',()=>{
 const event={inventory:[{ingredient,receivedUnits:6,openedUnits:1}]};
 const current=[{...ingredient,currentStockUnits:5.8}];
 const result=updateEventInventory(event,current,[{...ingredient,currentStockUnits:8.8}],[ingredient]);
 assert.equal(result[0].receivedUnits,9);assert.equal(result[0].openedUnits,1);assert.equal(ingredient.currentStockUnits,100);
});
test('first event import matches catalog IDs while keeping catalog stock intact',()=>{
 const result=updateEventInventory({inventory:[]},[],[{...ingredient,id:'new-import-id',name:'PISCO',currentStockUnits:6}],[ingredient]);
 assert.equal(result[0].ingredient.id,'pisco');assert.equal(result[0].receivedUnits,6);assert.equal(ingredient.currentStockUnits,100);
});
