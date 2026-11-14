import type { Cocktail } from '../types/bar';
export function copyProductsToEvent(current: Cocktail[], source: Cocktail[], selectedIds: string[], eventId: string): Cocktail[] {
  const selected=new Set(selectedIds);
  const copies=source.filter(product=>selected.has(product.id)&&!current.some(existing=>existing.sourceCocktailId===product.id||existing.id===product.id)).map(product=>({
    ...product,id:`${eventId}:${product.id}`,sourceCocktailId:product.id,
    recipe:product.recipe.map(item=>({...item})),enabledForEvent:true,
  }));
  return [...current,...copies];
}

export function copyEventIngredientDefinitions(current: import('../types/bar').Ingredient[], catalog: import('../types/bar').Ingredient[], products: Cocktail[]): import('../types/bar').Ingredient[] {
  const needed=new Set(products.flatMap(product=>product.recipe.map(item=>item.ingredientId)));
  return [...current,...catalog.filter(ingredient=>needed.has(ingredient.id)&&!current.some(existing=>existing.id===ingredient.id)).map(ingredient=>({...ingredient,initialStockUnits:0,currentStockUnits:0}))];
}
