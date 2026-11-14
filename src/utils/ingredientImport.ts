import { convertPresentationQuantity } from './packaging.ts';
import type { Ingredient, BarEvent } from '../types/bar';

export function mergeImportedIngredients(existing: Ingredient[], incoming: Ingredient[]): Ingredient[] {
  const merged = new Map(existing.map(ingredient => [ingredient.name.trim().toLocaleLowerCase(), ingredient]));
  for (const ingredient of incoming) {
    const key = ingredient.name.trim().toLocaleLowerCase();
    const prior = merged.get(key);
    merged.set(key, prior ? { ...ingredient, id: prior.id } : ingredient);
  }
  return [...merged.values()];
}

export function updateEventInventory(event: BarEvent, current: Ingredient[], next: Ingredient[], catalog: Ingredient[]): NonNullable<BarEvent['inventory']> {
  return next.map(ingredient => {
    // Imported rows matching an existing catalog item must retain its recipe ID.
    const canonical = catalog.find(item => item.id === ingredient.id || item.name.trim().toLocaleLowerCase() === ingredient.name.trim().toLocaleLowerCase());
    const id = canonical?.id || ingredient.id;
    const prior = event.inventory?.find(line => line.ingredient.id === id);
    const before = current.find(item => item.id === id);
    const receivedUnits = prior ? Math.max(0, ingredient.currentStockUnits + convertPresentationQuantity(prior.receivedUnits - (before?.currentStockUnits || 0), prior.ingredient, ingredient)) : ingredient.currentStockUnits;
    return { ingredient: { ...ingredient, id }, receivedUnits, openedUnits: prior?.openedUnits || 0 };
  });
}
