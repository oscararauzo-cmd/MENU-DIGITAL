import test from 'node:test';
import assert from 'node:assert/strict';
import {planIngredientDeletion} from '../src/utils/ingredientDeletion.ts';
const cocktails=[{id:'sour',name:'Sour',enabledForEvent:true,recipe:[{ingredientId:'pisco',amount:60},{ingredientId:'limon',amount:30}]},{id:'other',name:'Other',enabledForEvent:true,recipe:[{ingredientId:'gin',amount:60}]}];
test('deleting a linked ingredient removes its reference and pauses only affected products',()=>{
 const plan=planIngredientDeletion(cocktails,'pisco');
 assert.deepEqual(plan.affected.map(c=>c.id),['sour']);
 assert.deepEqual(plan.cocktails[0].recipe,[{ingredientId:'limon',amount:30}]);
 assert.equal(plan.cocktails[0].enabledForEvent,false);
 assert.equal(plan.cocktails[1],cocktails[1]);
 assert.equal(cocktails[0].recipe.length,2);
 assert.equal(cocktails[0].enabledForEvent,true);
});
test('deleting an unused ingredient leaves recipes and sale availability intact',()=>{
 const plan=planIngredientDeletion(cocktails,'unused');
 assert.equal(plan.affected.length,0);
 assert.deepEqual(plan.cocktails,cocktails);
});
test('deletion is idempotent and preserves other recipe quantities',()=>{
 const first=planIngredientDeletion(cocktails,'pisco');
 const second=planIngredientDeletion(first.cocktails,'pisco');
 assert.deepEqual(second.cocktails,first.cocktails);
 assert.equal(second.cocktails[0].recipe[0].amount,30);
});
