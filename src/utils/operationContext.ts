import { usageForOrder, packagesUsed, wastePackages } from './inventoryLedger.ts';
import { visibleOperations } from './operationTrash.ts';
import { recipeConsumption, sealedPresentation } from './packaging.ts';
import type { BarEvent, Ingredient, Cocktail } from '../types/bar';

export function limaDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
export function eventKind(event: BarEvent): 'dia' | 'evento' {
  return event.operationType || (event.isConsignment ? 'evento' : 'dia');
}
export function selectPeriodEvents(events: BarEvent[], active: BarEvent, period: 'dia' | 'mes' | 'evento', includeEvents = true, today = limaDate()) {
  if (period === 'evento') return visibleOperations([active]);
  return visibleOperations(events).filter(event => (period === 'mes' ? event.date.slice(0,7) === today.slice(0,7) : event.date === today) && (period === 'dia' || !includeEvents ? event.operationType === 'dia' : true));
}
// Keep event metadata in the existing JSONB snapshot, preserving legacy numeric snapshots.
// This lets older databases store isolated inventory without a schema migration.
export function encodeEventSnapshot(event: BarEvent) {
  return { ...event.initialIngredientsSnapshot, __altura_context: {
    version: 1, operationType: event.operationType, deletedAt:event.deletedAt, trashExpiresAt:event.trashExpiresAt, statusBeforeTrash:event.statusBeforeTrash, isConsignment: event.isConsignment,
    organizerName: event.organizerName, consignmentNotes: event.consignmentNotes,
    retainedStockUsage:event.retainedStockUsage, inventory: event.inventory || [], recipeSnapshot: event.recipeSnapshot, menuCategories: event.menuCategories, inventorySettledAt: event.inventorySettledAt,
  } };
}
export function decodeEventSnapshot(raw: unknown): Partial<BarEvent> & Pick<BarEvent, 'initialIngredientsSnapshot'> {
  const snapshot = typeof raw === 'string' ? JSON.parse(raw) : raw || {};
  const { __altura_context: meta, ...stock } = snapshot as Record<string, any>;
  return { initialIngredientsSnapshot: Object.fromEntries(Object.entries(stock).filter(([,value]) => typeof value === 'number')), ...(meta?.version === 1 ? {
    operationType: meta.operationType==='evento'?'evento':meta.operationType==='dia'?'dia':undefined,
    deletedAt:meta.deletedAt,trashExpiresAt:meta.trashExpiresAt,statusBeforeTrash:meta.statusBeforeTrash,
    isConsignment: Boolean(meta.isConsignment), organizerName: meta.organizerName,
    consignmentNotes: meta.consignmentNotes, menuCategories: Array.isArray(meta.menuCategories) ? meta.menuCategories : undefined, recipeSnapshot: Array.isArray(meta.recipeSnapshot) ? meta.recipeSnapshot : undefined, retainedStockUsage:Array.isArray(meta.retainedStockUsage)?meta.retainedStockUsage:[], inventory: Array.isArray(meta.inventory) ? meta.inventory : [], inventorySettledAt: meta.inventorySettledAt,
  } : {}) };
}
export function eventInventory(event: BarEvent, cocktails: Cocktail[]): Ingredient[] {
 const catalog=(event.inventory||[]).map(line=>line.ingredient);
 const usage=[...(event.retainedStockUsage||[]),...event.orders.flatMap(order=>usageForOrder(order,event.recipeSnapshot||cocktails,catalog))];
 return (event.inventory||[]).map(line=>({...line.ingredient,initialStockUnits:line.receivedUnits,currentStockUnits:line.receivedUnits-packagesUsed(usage,line.ingredient)-event.wastes.filter(waste=>waste.ingredientId===line.ingredient.id).reduce((sum,waste)=>sum+wastePackages(waste,line.ingredient),0)}));
}
export function consignmentSettlement(event: BarEvent, cocktails: Cocktail[]) {
  const stock = eventInventory(event, cocktails);
  return (event.inventory || []).map((line, index) => {
    const used = line.receivedUnits - stock[index].currentStockUnits;
    const minimumOpened = sealedPresentation(line.ingredient) ? Math.ceil(used - 1e-8) : used;
    const opened = Math.max(line.openedUnits || 0, minimumOpened);
    return { ...line, usedUnits: used, openedUnits: opened, sealedReturnedUnits: Math.max(0, line.receivedUnits - opened), retainedUnits: Math.max(0, opened - used), cost: opened * line.ingredient.packageCost, valid: opened <= line.receivedUnits };
  });
}

export function operationCost(event:BarEvent,cocktails:Cocktail[]):number{
 if(event.isConsignment&&event.inventory?.length)return consignmentSettlement(event,cocktails).reduce((sum,line)=>sum+line.cost,0);
 return event.orders.reduce((sum,order)=>sum+order.items.reduce((n,item)=>n+item.unitCost*item.quantity,0),0)+(event.retainedStockUsage||[]).reduce((sum,usage)=>sum+usage.packages*usage.ingredient.packageCost,0)+event.wastes.reduce((sum,waste)=>sum+waste.estimatedCost,0);
}
