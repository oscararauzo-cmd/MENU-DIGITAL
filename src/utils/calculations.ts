import { usageForOrder, packagesUsed, wastePackages } from './inventoryLedger.ts';
import { recipeConsumption } from './packaging.ts';
import type { Cocktail, Ingredient, BarEvent, WasteRecord } from '../types/bar';

export function getIngredientCostPerMl(ingredient: Ingredient): number {
  if (!ingredient.volumePerUnitMl || ingredient.volumePerUnitMl <= 0) return 0;
  return ingredient.packageCost / ingredient.volumePerUnitMl;
}

export function calculateCocktailUnitCost(cocktail: Cocktail, ingredients: Ingredient[]): number {
  const ingMap = new Map<string, Ingredient>(ingredients.map(i => [i.id, i]));
  let totalCost = 0;

  for (const item of cocktail.recipe) {
    const ing = ingMap.get(item.ingredientId);
    if (ing) {
      const costPerUnit = getIngredientCostPerMl(ing);
      totalCost += costPerUnit * recipeConsumption(item, ing);
    }
  }

  return Number(totalCost.toFixed(2));
}

export interface DrinkSalesStats {
  cocktailId: string;
  name: string;
  category: string;
  soldQty: number;
  courtesyQty: number;
  unitPrice: number;
  unitCost: number;
  unitMargin: number;
  unitMarginPercent: number;
  totalRevenue: number;
  totalCostSold: number;
  totalCostCourtesy: number;
  totalGrossProfit: number;
}

export interface IngredientStockStats {
  ingredientId: string;
  name: string;
  category: string;
  unit: string;
  packageCost: number;
  initialStock: number; // en unidades/botellas
  totalConsumedMlOrUnits: number; // en ml o unidades
  consumedPackages: number; // botellas/envases consumidos teóricamente
  wastePackages: number; // envases/unidades perdidos en merma
  residualStockPackages: number; // Stock que queda para el siguiente evento
  needsRestock: boolean;
  restockSuggested: number;
}

export interface EventMetrics {
  totalRevenue: number;
  totalDrinksSold: number;
  totalCourtesyDrinks: number;
  totalDrinksOverall: number;
  totalCostSold: number;
  totalCostCourtesy: number;
  totalWasteCost: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  grossProfitMarginPercent: number;
  netProfitMarginPercent: number;
  paymentBreakdown: {
    yapePlin: number;
    tarjeta: number;
    efectivo: number;
    cortesia: number;
  };
  drinkStats: DrinkSalesStats[];
  ingredientStats: IngredientStockStats[];
  wastes: WasteRecord[];
}

export function calculateEventMetrics(
  event: BarEvent,
  cocktails: Cocktail[],
  ingredients: Ingredient[]
): EventMetrics {
  const ingMap = new Map<string, Ingredient>(ingredients.map(i => [i.id, i]));
  const cocktailMap = new Map<string, Cocktail>(cocktails.map(c => [c.id, c]));

  // 1. Initial maps for drink stats
  const drinkStatsMap = new Map<string, DrinkSalesStats>();
  for (const c of cocktails) {
    const unitCost = calculateCocktailUnitCost(c, ingredients);
    const unitMargin = c.price - unitCost;
    const unitMarginPercent = c.price > 0 ? (unitMargin / c.price) * 100 : 0;

    drinkStatsMap.set(c.id, {
      cocktailId: c.id,
      name: c.name,
      category: c.category,
      soldQty: 0,
      courtesyQty: 0,
      unitPrice: c.price,
      unitCost,
      unitMargin,
      unitMarginPercent,
      totalRevenue: 0,
      totalCostSold: 0,
      totalCostCourtesy: 0,
      totalGrossProfit: 0,
    });
  }

  // 2. Accumulate ingredient consumption
  const ingConsumedMap = new Map<string, number>(); // ingredientId -> ml or units
  for (const ing of ingredients) {
    ingConsumedMap.set(ing.id, 0);
  }

  let totalRevenue = 0;
  let totalDrinksSold = 0;
  let totalCourtesyDrinks = 0;
  let totalCostSold = 0;
  let totalCostCourtesy = 0;

  let yapePlin = 0;
  let tarjeta = 0;
  let efectivo = 0;
  let cortesia = 0;

  for (const order of event.orders) {
    const isPaid = order.orderType === 'venta';
    const method = order.paymentMethod || (isPaid ? 'efectivo' : 'cortesia');

    if (isPaid) {
      if (method === 'yape_plin') yapePlin += order.totalAmount;
      else if (method === 'tarjeta') tarjeta += order.totalAmount;
      else if (method === 'efectivo') efectivo += order.totalAmount;
      else efectivo += order.totalAmount;
    } else {
      cortesia += order.totalAmount;
    }

    for (const item of order.items) {
      let stats = drinkStatsMap.get(item.cocktailId);
      const cocktail = cocktailMap.get(item.cocktailId);

      const unitCost = Number.isFinite(item.unitCost) ? item.unitCost : cocktail ? calculateCocktailUnitCost(cocktail, ingredients) : 0;
      const unitPrice = item.unitPrice;

      if (!stats) {
        stats = {
          cocktailId: item.cocktailId,
          name: item.cocktailName,
          category: cocktail?.category || 'otro',
          soldQty: 0,
          courtesyQty: 0,
          unitPrice,
          unitCost,
          unitMargin: unitPrice - unitCost,
          unitMarginPercent: unitPrice > 0 ? ((unitPrice - unitCost) / unitPrice) * 100 : 0,
          totalRevenue: 0,
          totalCostSold: 0,
          totalCostCourtesy: 0,
          totalGrossProfit: 0,
        };
        drinkStatsMap.set(item.cocktailId, stats);
      }

      if (isPaid) {
        stats.soldQty += item.quantity;
        const revenue = item.quantity * unitPrice;
        const cost = item.quantity * unitCost;
        stats.totalRevenue += revenue;
        stats.totalCostSold += cost;
        stats.totalGrossProfit += (revenue - cost);

        totalRevenue += revenue;
        totalDrinksSold += item.quantity;
        totalCostSold += cost;
      } else {
        stats.courtesyQty += item.quantity;
        const cost = item.quantity * unitCost;
        stats.totalCostCourtesy += cost;

        totalCourtesyDrinks += item.quantity;
        totalCostCourtesy += cost;
      }

    }
    for(const usage of usageForOrder(order,cocktails,ingredients)){
      const ingredient=ingMap.get(usage.ingredient.id);if(!ingredient)continue;
      ingConsumedMap.set(ingredient.id,(ingConsumedMap.get(ingredient.id)||0)+packagesUsed([usage],ingredient)*ingredient.volumePerUnitMl);
    }
  }
  for(const usage of event.retainedStockUsage||[]){const ingredient=ingMap.get(usage.ingredient.id);if(ingredient)ingConsumedMap.set(ingredient.id,(ingConsumedMap.get(ingredient.id)||0)+packagesUsed([usage],ingredient)*ingredient.volumePerUnitMl);}

  // 3. Wastes
  let totalWasteCost = (event.retainedStockUsage||[]).reduce((sum,usage)=>sum+usage.packages*usage.ingredient.packageCost,0);
  const ingWasteMap = new Map<string, number>();
  for (const w of event.wastes) {
    totalWasteCost += w.estimatedCost;
    if (w.ingredientId) {
      const prev = ingWasteMap.get(w.ingredientId) || 0;
      const ingredient=ingMap.get(w.ingredientId);
      ingWasteMap.set(w.ingredientId, prev + (ingredient?wastePackages(w,ingredient)*ingredient.volumePerUnitMl:w.quantity));
    }
  }

  // 4. Ingredient stocks & residual calculation
  const ingredientStats: IngredientStockStats[] = ingredients.map(ing => {
    const initial = event.initialIngredientsSnapshot?.[ing.id] ?? ing.initialStockUnits;
    const consumedAmount = ingConsumedMap.get(ing.id) || 0;
    const wasteAmount = ingWasteMap.get(ing.id) || 0;

    const consumedPackages = ing.volumePerUnitMl > 0 ? consumedAmount / ing.volumePerUnitMl : 0;
    const wastePackages = ing.volumePerUnitMl > 0 ? wasteAmount / ing.volumePerUnitMl : 0;

    const residual = Math.max(0, initial - consumedPackages - wastePackages);
    const needsRestock = residual <= ing.minAlertUnits;
    const restockSuggested = needsRestock ? Math.ceil((ing.minAlertUnits * 2) - residual) : 0;

    return {
      ingredientId: ing.id,
      name: ing.name,
      category: ing.category,
      unit: ing.unit,
      packageCost: ing.packageCost,
      initialStock: Number(initial.toFixed(1)),
      totalConsumedMlOrUnits: Number(consumedAmount.toFixed(1)),
      consumedPackages: Number(consumedPackages.toFixed(2)),
      wastePackages: Number(wastePackages.toFixed(2)),
      residualStockPackages: Number(residual.toFixed(2)),
      needsRestock,
      restockSuggested,
    };
  });

  const grossProfit = totalRevenue - totalCostSold;
  const totalExpenses = totalCostSold + totalCostCourtesy + totalWasteCost;
  const netProfit = totalRevenue - totalExpenses;
  const grossProfitMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const netProfitMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return {
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalDrinksSold,
    totalCourtesyDrinks,
    totalDrinksOverall: totalDrinksSold + totalCourtesyDrinks,
    totalCostSold: Number(totalCostSold.toFixed(2)),
    totalCostCourtesy: Number(totalCostCourtesy.toFixed(2)),
    totalWasteCost: Number(totalWasteCost.toFixed(2)),
    totalExpenses: Number(totalExpenses.toFixed(2)),
    grossProfit: Number(grossProfit.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    grossProfitMarginPercent: Number(grossProfitMarginPercent.toFixed(1)),
    netProfitMarginPercent: Number(netProfitMarginPercent.toFixed(1)),
    paymentBreakdown: {
      yapePlin: Number(yapePlin.toFixed(2)),
      tarjeta: Number(tarjeta.toFixed(2)),
      efectivo: Number(efectivo.toFixed(2)),
      cortesia: Number(cortesia.toFixed(2)),
    },
    drinkStats: Array.from(drinkStatsMap.values()),
    ingredientStats,
    wastes: event.wastes,
  };
}
