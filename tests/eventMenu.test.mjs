import test from 'node:test';
import assert from 'node:assert/strict';
import {copyProductsToEvent,copyEventIngredientDefinitions} from '../src/utils/eventMenu.ts';
const bar=[{id:'pisco',name:'Sour',price:30,enabledForEvent:true,recipe:[{ingredientId:'licor',amount:60}]},{id:'water',name:'Agua',price:6,enabledForEvent:true,recipe:[]}];
test('only explicitly selected bar products are copied to an event',()=>{
 const event=copyProductsToEvent([],bar,['water'],'event-one');
 assert.equal(event.length,1);assert.equal(event[0].id,'event-one:water');assert.equal(event[0].sourceCocktailId,'water');
 assert.equal(bar.length,2);assert.equal(bar[1].id,'water');
});
test('editing event prices and recipes does not change the bar menu or another event',()=>{
 const first=copyProductsToEvent([],bar,['pisco'],'event-one');
 const second=copyProductsToEvent([],bar,['pisco'],'event-two');
 first[0].price=15;first[0].recipe[0].amount=40;
 assert.equal(bar[0].price,30);assert.equal(bar[0].recipe[0].amount,60);
 assert.equal(second[0].price,30);assert.equal(second[0].recipe[0].amount,60);
 assert.notEqual(first[0].id,second[0].id);
});
test('copying twice does not duplicate products, including legacy event menus',()=>{
 const menu=copyProductsToEvent([],bar,['pisco'],'event-one');
 assert.equal(copyProductsToEvent(menu,bar,['pisco'],'event-one').length,1);
 assert.equal(copyProductsToEvent([bar[0]],bar,['pisco'],'old-event').length,1);
});
test('empty selection leaves the event menu empty',()=>assert.deepEqual(copyProductsToEvent([],bar,[],'new-event'),[]));

test('copying a recipe adds only its ingredient definitions with zero event stock',()=>{
 const stock=[{id:'licor',name:'Pisco',currentStockUnits:20,initialStockUnits:20},{id:'other',name:'Other',currentStockUnits:10}];
 const eventStock=copyEventIngredientDefinitions([],stock,[bar[0]]);
 assert.equal(eventStock.length,1);assert.equal(eventStock[0].id,'licor');assert.equal(eventStock[0].currentStockUnits,0);assert.equal(stock[0].currentStockUnits,20);
 assert.equal(copyEventIngredientDefinitions(eventStock,stock,[bar[0]]).length,1);
});
