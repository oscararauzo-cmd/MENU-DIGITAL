import { recipeConsumption, sealedPresentation } from './packaging.ts';
import type { BarEvent, Ingredient, Cocktail } from '../types/bar';

export function limaDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
export function eventKind(event: BarEvent): 'dia' | 'evento' {
  return event.operationType || (event.isConsignment ? 'evento' : 'dia');
}
export function selectPeriodEvents(events: BarEvent[], active: BarEvent, period: 'dia' | 'mes' | 'evento', includeEvents = true, today = limaDate()) {
  if (period === 'evento') return [active];
  return events.filter(event => (period === 'mes' ? event.date.slice(0,7) === today.slice(0,7) : event.date === today) && (period === 'dia' || !includeEvents ? event.operationType === 'dia' : true));
}
// Keep event metadata in the existing JSONB snapshot, preserving legacy numeric snapshots.
// This lets older databases store isolated inventory without a schema migration.
export function encodeEventSnapshot(event: BarEvent) {
  return { ...event.initialIngredientsSnapshot, __altura_context: {
    version: 1, operationType: eventKind(event), isConsignment: event.isConsignment,
    organizerName: event.organizerName, consignmentNotes: event.consignmentNotes,
    inventory: event.inventory || [], recipeSnapshot: event.recipeSnapshot, menuCategories: event.menuCategories, inventorySettledAt: event.inventorySettledAt,
  } };
}
export function decodeEventSnapshot(raw: unknown): Partial<BarEvent> & Pick<BarEvent, 'initialIngredientsSnapshot'> {
  const snapshot = typeof raw === 'string' ? JSON.parse(raw) : raw || {};
  const { __altura_context: meta, ...stock } = snapshot as Record<string, any>;
  return { initialIngredientsSnapshot: Object.fromEntries(Object.entries(stock).filter(([,value]) => typeof value === 'number')), ...(meta?.version === 1 ? {
    operationType: meta.operationType === 'evento' ? 'evento' : 'dia',
    isConsignment: Boolean(meta.isConsignment), organizerName: meta.organizerName,
    consignmentNotes: meta.consignmentNotes, menuCategories: Array.isArray(meta.menuCategories) ? meta.menuCategories : undefined, recipeSnapshot: Array.isArray(meta.recipeSnapshot) ? meta.recipeSnapshot : undefined, inventory: Array.isArray(meta.inventory) ? meta.inventory : [], inventorySettledAt: meta.inventorySettledAt,
  } : {}) };
}
export function eventInventory(event: BarEvent, cocktails: Cocktail[]): Ingredient[] {
  const consumed = new Map<string, number>();
  for (const order of event.orders) for (const item of order.items) {
    for (const recipe of (event.recipeSnapshot || cocktails).find(c => c.id === item.cocktailId)?.recipe || []) consumed.set(recipe.ingredientId, (consumed.get(recipe.ingredientId) || 0) + recipeConsumption(recipe, event.inventory?.find(line=>line.ingredient.id===recipe.ingredientId)?.ingredient) * item.quantity);
  }
  for (const waste of event.wastes) if (waste.ingredientId) {
    const line = event.inventory?.find(l => l.ingredient.id === waste.ingredientId);
    if (line) consumed.set(waste.ingredientId, (consumed.get(waste.ingredientId) || 0) + waste.quantity * (waste.unit === 'ml' ? 1 : line.ingredient.volumePerUnitMl));
  }
  return (event.inventory || []).map(line => ({ ...line.ingredient, initialStockUnits: line.receivedUnits,
    currentStockUnits: line.receivedUnits - (consumed.get(line.ingredient.id) || 0) / (line.ingredient.volumePerUnitMl || 1) }));
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
