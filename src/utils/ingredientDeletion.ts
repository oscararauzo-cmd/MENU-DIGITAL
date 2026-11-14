import type { Cocktail } from '../types/bar';

export function planIngredientDeletion(cocktails: Cocktail[], ingredientId: string) {
  const affected = cocktails.filter(cocktail => cocktail.recipe.some(item => item.ingredientId === ingredientId));
  const ids = new Set(affected.map(cocktail => cocktail.id));
  return {
    affected,
    cocktails: cocktails.map(cocktail => ids.has(cocktail.id) ? {
      ...cocktail,
      recipe: cocktail.recipe.filter(item => item.ingredientId !== ingredientId),
      enabledForEvent: false,
    } : cocktail),
  };
}
