import type {Cocktail,Ingredient,Order,WasteRecord} from '../types/bar';
import {calculateCocktailUnitCost} from './calculations.ts';
const normalize=(value:unknown)=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
function match<T extends {name:string}>(items:T[],name:unknown):T{
 const query=normalize(name);if(query.length<3)throw new Error('Falta el nombre exacto del producto o insumo.');
 const exact=items.filter(item=>normalize(item.name)===query);const options=exact.length?exact:items.filter(item=>normalize(item.name).includes(query));
 if(options.length!==1)throw new Error(options.length?'Hay varios resultados. Especifica el nombre completo.':'No se encontró ese producto o insumo; no se modificó nada.');
 return options[0];
}
function quantity(value:unknown,integer=false){const number=Number(value);if(!Number.isFinite(number)||number<=0||(integer&&!Number.isInteger(number)))throw new Error('La cantidad propuesta no es válida.');return number;}
export function assistantActionPlan(action:any,cocktails:Cocktail[],ingredients:Ingredient[]){
 if(action?.type==='add_order'){
  const order=action.order;if(!['venta','dj','cortesia','staff'].includes(order?.orderType)||!Array.isArray(order.items)||!order.items.length)throw new Error('El pedido propuesto está incompleto.');
  const items=order.items.map((item:any)=>{const product=match(cocktails.filter(c=>c.enabledForEvent),item.cocktailName);return {cocktailId:product.id,cocktailName:product.name,quantity:quantity(item.quantity,true),unitPrice:product.price,unitCost:calculateCocktailUnitCost(product,ingredients)};});
  const value:Order={id:`AI-ORD-${crypto.randomUUID()}`,timestamp:Date.now(),orderType:order.orderType,items,totalAmount:order.orderType==='venta'?items.reduce((sum:number,item:any)=>sum+item.quantity*item.unitPrice,0):0,status:'preparing',notes:order.notes};
  return {type:'order' as const,value,summary:`Pedido: ${items.map((item:any)=>`${item.quantity}× ${item.cocktailName}`).join(', ')}`};
 }
 if(action?.type==='add_waste'){
  const source=action.waste;const ingredient=match(ingredients,source?.ingredientName);const qty=quantity(source.quantity);
  const value:WasteRecord={id:`AI-WST-${crypto.randomUUID()}`,timestamp:Date.now(),ingredientId:ingredient.id,name:ingredient.name,quantity:qty,unit:'presentaciones',reason:['rotura','derrame','degustacion','caducado','preparacion_errada'].includes(source.reason)?source.reason:'rotura',estimatedCost:qty*ingredient.packageCost,notes:source.notes};
  return {type:'waste' as const,value,summary:`Merma propuesta: ${qty} presentaciones de ${ingredient.name}`};
 }
 if(action?.type==='update_stock'){
  const source=action.stock;const ingredient=match(ingredients,source?.ingredientName);const units=quantity(source.addedUnits);const price=source.packageCost===undefined?ingredient.packageCost:Number(source.packageCost);
  if(!Number.isFinite(price)||price<0)throw new Error('El costo propuesto no es válido.');
  return {type:'stock' as const,value:{ingredientId:ingredient.id,units,price},summary:`Agregar ${units} presentaciones de ${ingredient.name}, a S/ ${price.toFixed(2)} cada una`};
 }
 throw new Error('La propuesta no contiene una acción válida.');
}
