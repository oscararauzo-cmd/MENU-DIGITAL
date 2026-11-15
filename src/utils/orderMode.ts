import type {BarEvent,Cocktail,Ingredient,Order} from '../types/bar';
import {captureStockUsage,validateStock} from './inventoryLedger.ts';
export function prepareOperationalOrder(order:Order,event:BarEvent,products:Cocktail[],ingredients:Ingredient[]):Order{
 if(event.status!=='active')throw new Error('La operación está cerrada.');
 if(!order.items.length)throw new Error('Agrega al menos un producto al pedido.');
 for(const item of order.items){
  const product=products.find(product=>product.id===item.cocktailId&&product.enabledForEvent);
  if(!product)throw new Error(`El producto ${item.cocktailName} no está disponible en esta carta.`);
  if(!Number.isInteger(item.quantity)||item.quantity<=0||!Number.isFinite(item.unitPrice)||item.unitPrice<0)throw new Error('Revisa las cantidades y precios del pedido.');
 }
 // Inventory is explicitly opt-in. During service, incomplete recipes never block orders.
 const stockUsage=event.inventoryMode==='tracked'?captureStockUsage(order,products,ingredients):[];
 if(event.inventoryMode==='tracked')validateStock(stockUsage,ingredients);
 return {...order,stockUsage,inventoryDeferred:event.inventoryMode!=='tracked'};
}
