import type { Ingredient, RecipeItem } from '../types/bar';

export const packageUnits = new Set(['sixpack','paquete','caja']);
export function unitsInPackage(ingredient: Ingredient): number {
  return Math.max(1, ingredient.unitsPerPackage || 1);
}
export function containerVolume(ingredient: Ingredient): number {
  return ingredient.volumePerContainerMl || ingredient.volumePerUnitMl / unitsInPackage(ingredient);
}
export function sealedPresentation(ingredient: Ingredient): boolean {
  return packageUnits.has(ingredient.unit) || ingredient.unit.startsWith('botella') || ingredient.unit.startsWith('lata') || ingredient.unit === 'unidad';
}
export function presentationLabel(ingredient: Ingredient): string {
  if (ingredient.unit === 'sixpack') return 'six-pack';
  if (ingredient.unit === 'paquete') return 'paquete';
  if (ingredient.unit === 'caja') return 'caja';
  if (ingredient.unit.startsWith('botella')) return 'botella';
  if (ingredient.unit.startsWith('lata')) return 'lata';
  return ingredient.unit === 'unidad' ? 'unidad' : ingredient.unit;
}
export function packagingDescription(ingredient: Ingredient): string {
  const count = unitsInPackage(ingredient);
  if (packageUnits.has(ingredient.unit)) return `${count} ${ingredient.containerType==='botella'?'botellas':ingredient.containerType==='lata'?'latas':'envases'} × ${containerVolume(ingredient)} ml · ${(ingredient.volumePerUnitMl / 1000).toLocaleString('es-PE')} L por ${presentationLabel(ingredient)}`;
  if (ingredient.unit === 'kg') return `${ingredient.volumePerUnitMl} g por kg`;
  if (ingredient.unit === 'unidad' && !ingredient.volumePerContainerMl) return `${ingredient.volumePerUnitMl} unidades de rendimiento`;
  return `${containerVolume(ingredient)} ml por ${presentationLabel(ingredient)}`;
}
export function stockDescription(ingredient: Ingredient, quantity = ingredient.currentStockUnits): string {
  if (!packageUnits.has(ingredient.unit)) return `${Number(quantity.toFixed(3))} ${presentationLabel(ingredient)}(s)`;
  return `${Number(quantity.toFixed(3))} ${presentationLabel(ingredient)}(s) · ${Number((quantity * unitsInPackage(ingredient)).toFixed(2))} ${ingredient.containerType==='botella'?'botellas':ingredient.containerType==='lata'?'latas':'envases'} · ${Number((quantity * ingredient.volumePerUnitMl / 1000).toFixed(3))} L`;
}
export function recipeConsumption(item: RecipeItem, ingredient?: Ingredient): number {
  if (item.unit === 'unidad' && ingredient) return item.amount * containerVolume(ingredient);
  return item.amount;
}
// Preserve packaging in the existing TEXT column, with legacy plain-unit support.
export function encodeIngredientUnit(ingredient: Ingredient): string {
  if (!ingredient.unitsPerPackage && !ingredient.volumePerContainerMl) return ingredient.unit;
  return JSON.stringify({v:1,unit:ingredient.unit,unitsPerPackage:unitsInPackage(ingredient),volumePerContainerMl:containerVolume(ingredient),...(ingredient.containerType?{containerType:ingredient.containerType}:{})});
}
export function decodeIngredientUnit(raw: string): Pick<Ingredient,'unit'|'unitsPerPackage'|'volumePerContainerMl'|'containerType'> {
  try {
    const value=JSON.parse(raw);
    if(value?.v===1&&typeof value.unit==='string'&&Number.isInteger(value.unitsPerPackage)&&value.unitsPerPackage>0&&value.volumePerContainerMl>0) return {unit:value.unit,unitsPerPackage:value.unitsPerPackage,volumePerContainerMl:value.volumePerContainerMl,...(['botella','lata'].includes(value.containerType)?{containerType:value.containerType}:{})};
  } catch { /* Legacy units are plain text. */ }
  return {unit:raw as Ingredient['unit']};
}

export function convertPresentationQuantity(quantity: number, source: Ingredient, target: Ingredient): number {
  const sourceCountsUnits=source.volumePerUnitMl===1&&!source.volumePerContainerMl;
  const targetCountsUnits=target.volumePerUnitMl===1&&!target.volumePerContainerMl;
  if(targetCountsUnits) return quantity*unitsInPackage(source);
  if(sourceCountsUnits) return quantity/unitsInPackage(target);
  return quantity*(source.volumePerUnitMl || target.volumePerUnitMl || 1)/(target.volumePerUnitMl || 1);
}
