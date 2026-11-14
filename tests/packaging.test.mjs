import test from 'node:test';
import assert from 'node:assert/strict';
import {consignmentSettlement,eventInventory} from '../src/utils/operationContext.ts';
import {calculateCocktailUnitCost} from '../src/utils/calculations.ts';
import {encodeIngredientUnit,decodeIngredientUnit,convertPresentationQuantity,stockDescription} from '../src/utils/packaging.ts';
const beer={id:'pilsen',name:'Pilsen',category:'licor',unit:'sixpack',unitsPerPackage:6,volumePerContainerMl:330,volumePerUnitMl:1980,packageCost:24,initialStockUnits:3,currentStockUnits:3,minAlertUnits:1};
const recipe={id:'beer',price:8,recipe:[{ingredientId:'pilsen',amount:1,unit:'unidad'}]};
const event={id:'event',operationType:'evento',orders:[{items:[{cocktailId:'beer',quantity:1}]}],wastes:[],inventory:[{ingredient:beer,receivedUnits:3,openedUnits:0}],recipeSnapshot:[recipe]};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('3 six-packs contain 18 bottles and 5.94 litres',()=>{
 const summary=stockDescription(beer);
 assert.ok(summary.includes('18 envases'));assert.ok(summary.includes('5.94 L'));
 assert.equal(calculateCocktailUnitCost(recipe,[beer]),4);
});
test('selling one bottle opens a whole six-pack and returns only two sealed packs',()=>{
 near(eventInventory(event,[])[0].currentStockUnits,17/6);
 const [line]=consignmentSettlement(event,[]);
 assert.equal(line.openedUnits,1);assert.equal(line.sealedReturnedUnits,2);assert.equal(line.cost,24);
 near(line.retainedUnits*6,5);
});
test('manually opening an extra pack excludes it from returns even when its bottles are unused',()=>{
 const [line]=consignmentSettlement({...event,inventory:[{ingredient:beer,receivedUnits:3,openedUnits:2}]},[]);
 assert.equal(line.sealedReturnedUnits,1);assert.equal(line.cost,48);near(line.retainedUnits*6,11);
});
test('water packages use the same outer-package rule',()=>{
 const water={...beer,id:'water',name:'Agua',unit:'paquete',unitsPerPackage:12,volumePerContainerMl:625,volumePerUnitMl:7500,packageCost:18};
 const e={...event,inventory:[{ingredient:water,receivedUnits:3,openedUnits:1}],recipeSnapshot:[{...recipe,recipe:[{ingredientId:'water',amount:1,unit:'unidad'}]}]};
 const [line]=consignmentSettlement(e,[]);
 assert.equal(line.sealedReturnedUnits,2);assert.equal(line.cost,18);near(line.retainedUnits*12,11);
});
test('volume recipes and unit recipes charge their actual contents',()=>{
 assert.equal(calculateCocktailUnitCost({...recipe,recipe:[{ingredientId:'pilsen',amount:330,unit:'ml'}]},[beer]),4);
 assert.equal(calculateCocktailUnitCost({...recipe,recipe:[{ingredientId:'pilsen',amount:2,unit:'unidad'}]},[beer]),8);
});
test('remaining bottles convert correctly into the bar presentation',()=>{
 near(convertPresentationQuantity(5/6,beer,{...beer,unit:'botella',unitsPerPackage:1,volumePerUnitMl:330}),5);
 near(convertPresentationQuantity(5/6,beer,{...beer,unit:'unidad',unitsPerPackage:undefined,volumePerContainerMl:undefined,volumePerUnitMl:1}),5);
 near(convertPresentationQuantity(5/6,beer,beer),5/6);
});
test('packaging survives remote encoding while legacy units still work',()=>{
 assert.deepEqual(decodeIngredientUnit(encodeIngredientUnit(beer)),{unit:'sixpack',unitsPerPackage:6,volumePerContainerMl:330});
 assert.deepEqual(decodeIngredientUnit('botella_750ml'),{unit:'botella_750ml'});
});
