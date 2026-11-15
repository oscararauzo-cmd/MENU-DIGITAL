import type { BarEvent, Cocktail, Ingredient, Order, StockUsage, WasteRecord } from '../types/bar';
import { convertPresentationQuantity, recipeConsumption, containerVolume } from './packaging.ts';

export function captureStockUsage(order:Order,cocktails:Cocktail[],ingredients:Ingredient[]):StockUsage[]{
 const quantities=new Map<string,number>();
 if(!order.items.length)throw new Error('El pedido está vacío.');
 for(const item of order.items){
  if(!Number.isFinite(item.unitPrice)||item.unitPrice<0||!Number.isFinite(item.unitCost)||item.unitCost<0)throw new Error('El precio o costo del producto no es válido.');
  if(!Number.isInteger(item.quantity)||item.quantity<=0)throw new Error('La cantidad de cada producto debe ser un entero mayor que cero.');
  const cocktail=cocktails.find(product=>product.id===item.cocktailId);
  if(!cocktail||!cocktail.enabledForEvent)throw new Error(`El producto ${item.cocktailName} ya no está disponible en esta carta.`);
  for(const recipe of cocktail.recipe){
   const ingredient=ingredients.find(ingredient=>ingredient.id===recipe.ingredientId);
   if(!ingredient||!(ingredient.volumePerUnitMl>0)||!Number.isFinite(recipe.amount)||recipe.amount<0)throw new Error(`Revisa la receta de ${cocktail.name}: falta un insumo o su rendimiento.`);
   quantities.set(ingredient.id,(quantities.get(ingredient.id)||0)+recipeConsumption(recipe,ingredient)*item.quantity/ingredient.volumePerUnitMl);
  }
 }
 return [...quantities].map(([id,packages])=>({ingredient:{...ingredients.find(ingredient=>ingredient.id===id)!},packages}));
}
export function usageForOrder(order:Order,cocktails:Cocktail[],ingredients:Ingredient[]):StockUsage[]{
 if(order.stockUsage)return order.stockUsage;
 // Legacy orders retain their previous recipe-based calculation.
 return order.items.flatMap(item=>{try{return captureStockUsage({...order,items:[{...item,unitPrice:item.unitPrice??0,unitCost:item.unitCost??0}]},cocktails.map(product=>({...product,enabledForEvent:true})),ingredients);}catch{return [];}});
}
export function packagesUsed(usages:StockUsage[],ingredient:Ingredient):number{
 return usages.filter(usage=>usage.ingredient.id===ingredient.id).reduce((total,usage)=>total+convertPresentationQuantity(usage.packages,usage.ingredient,ingredient),0);
}
export function applyStockUsage(ingredients:Ingredient[],usages:StockUsage[],direction:1|-1):Ingredient[]{
 return ingredients.map(ingredient=>({...ingredient,currentStockUnits:Number(Math.max(0,ingredient.currentStockUnits+direction*packagesUsed(usages,ingredient)).toFixed(8))}));
}
export function validateStock(usages:StockUsage[],ingredients:Ingredient[]):void{
 for(const ingredient of ingredients){const needed=packagesUsed(usages,ingredient);if(needed>ingredient.currentStockUnits+1e-7)throw new Error(`No hay suficiente ${ingredient.name}. Revisa sus existencias.`);}
}
export function wastePackages(waste:WasteRecord,ingredient:Ingredient):number{
 const unit=waste.unit.trim().toLowerCase();
 if(['ml','g','gramos'].includes(unit))return waste.quantity/ingredient.volumePerUnitMl;
 if(['l','litro','litros','kg'].includes(unit))return waste.quantity*1000/ingredient.volumePerUnitMl;
 if(['botella','botellas','lata','latas','unidad','unidades'].includes(unit))return waste.quantity*containerVolume(ingredient)/ingredient.volumePerUnitMl;
 return waste.quantity; // Legacy botellas/un and presentation-based losses.
}
export function deleteOrderFromEvent(event:BarEvent,order:Order,cocktails:Cocktail[],ingredients:Ingredient[]):BarEvent{
 const keepConsumed=order.status==='ready'||order.status==='delivered';
 return {...event,orders:event.orders.filter(existing=>existing.id!==order.id),retainedStockUsage:keepConsumed?[...(event.retainedStockUsage||[]),...usageForOrder(order,cocktails,ingredients)]:event.retainedStockUsage};
}
// Store optional stock snapshots in the existing notes TEXT field without a schema migration.
const prefix='@altura-order-v1:';
export function encodeOrderNotes(order:Order):string{return order.stockUsage?prefix+JSON.stringify({notes:order.notes||'',stockUsage:order.stockUsage}):order.notes||'';}
export function decodeOrderNotes(raw:string):Pick<Order,'notes'|'stockUsage'>{
 if(raw?.startsWith(prefix)){try{const parsed=JSON.parse(raw.slice(prefix.length));if(Array.isArray(parsed.stockUsage))return {notes:parsed.notes||undefined,stockUsage:parsed.stockUsage};}catch{}}
 return {notes:raw||undefined};
}
