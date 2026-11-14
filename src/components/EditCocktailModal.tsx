import React, { useState } from 'react';
import { Cocktail, Ingredient, CocktailCategory } from '../types/bar';
import { calculateCocktailUnitCost, getIngredientCostPerMl } from '../utils/calculations';
import {
  X,
  Check,
  Plus,
  Trash2,
  HelpCircle,
  Layers,
} from 'lucide-react';

interface EditCocktailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cocktail: Cocktail | null;
  onSave: (updatedCocktail: Cocktail) => void;
  ingredients: Ingredient[];
}

export const EditCocktailModal: React.FC<EditCocktailModalProps> = ({
  isOpen,
  onClose,
  cocktail,
  onSave,
  ingredients,
}) => {
  if (!isOpen || !cocktail) return null;

  const [name, setName] = useState(cocktail.name);
  const [category, setCategory] = useState<CocktailCategory>(cocktail.category);
  const [price, setPrice] = useState(cocktail.price.toString());
  const [recipe, setRecipe] = useState<{ ingredientId: string; amount: number }[]>(
    cocktail.recipe.length > 0
      ? cocktail.recipe
      : [{ ingredientId: ingredients[0]?.id || '', amount: 60 }]
  );

  const handleAddRecipeItem = () => {
    setRecipe(prev => [...prev, { ingredientId: ingredients[0]?.id || '', amount: 30 }]);
  };

  const handleRemoveRecipeItem = (index: number) => {
    setRecipe(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateIngredientId = (index: number, newId: string) => {
    setRecipe(prev => prev.map((item, i) => (i === index ? { ...item, ingredientId: newId } : item)));
  };

  const handleUpdateAmount = (index: number, amount: number) => {
    setRecipe(prev => prev.map((item, i) => (i === index ? { ...item, amount: Math.max(0, amount) } : item)));
  };

  // Live Unit Cost calculation
  const calculatedCost = recipe.reduce((total, item) => {
    const ing = ingredients.find(i => i.id === item.ingredientId);
    if (!ing) return total;
    const costPerMl = getIngredientCostPerMl(ing);
    return total + costPerMl * item.amount;
  }, 0);

  const priceNum = parseFloat(price) || 0;
  const marginPercent = priceNum > 0 ? (((priceNum - calculatedCost) / priceNum) * 100).toFixed(0) : '0';

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;

    const updated: Cocktail = {
      ...cocktail,
      name: name.trim(),
      category,
      price: Math.max(1, priceNum),
      recipe,
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white text-stone-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200 max-h-[90vh]">
        {/* Header: Action button PINNED AT TOP (Zero scroll to save!) */}
        <div className="px-5 py-3.5 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-extrabold text-base text-stone-900 tracking-tight">
              Editar Precio & Receta
            </h2>
            <p className="text-[11px] text-stone-500">
              {cocktail.name}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleSave()}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-sm shadow-orange-500/25 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Guardar</span>
            </button>
          </div>
        </div>

        {/* Friendly Beginner Explainer */}
        <div className="px-5 py-2.5 bg-orange-50/70 border-b border-orange-200/60 flex items-center gap-2 text-xs text-orange-950 shrink-0">
          <HelpCircle className="w-4 h-4 text-orange-600 shrink-0" />
          <span>
            <strong>¿Por qué se pone la receta?</strong> Para que cada vez que cobres este trago, el sistema descuente los mililitros exactos de tu bodega automáticamente.
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 overflow-y-auto bg-white flex-1">
          {/* Name & Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Nombre del Trago o Tapa
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Precio de Venta (S/.)
              </label>
              <input
                type="number"
                step="0.5"
                required
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Profit Margin KPI Box */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-stone-500 text-[11px] block">Costo de Insumos:</span>
              <span className="font-mono font-bold text-stone-900 text-sm">
                S/. {calculatedCost.toFixed(2)} por copa
              </span>
            </div>

            <div className="text-right">
              <span className="text-stone-500 text-[11px] block">Margen de Ganancia:</span>
              <span className="font-mono font-black text-emerald-600 text-sm">
                {marginPercent}% ({priceNum > calculatedCost ? `+S/. ${(priceNum - calculatedCost).toFixed(2)}` : '0.00'})
              </span>
            </div>
          </div>

          {/* Recipe List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-orange-600" />
                <span>Insumos que componen este trago:</span>
              </label>

              <button
                type="button"
                onClick={handleAddRecipeItem}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
              >
                + Agregar insumo
              </button>
            </div>

            <div className="space-y-1.5">
              {recipe.map((item, index) => (
                <div
                  key={index}
                  className="p-2 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between gap-2 text-xs"
                >
                  <select
                    value={item.ingredientId}
                    onChange={e => handleUpdateIngredientId(index, e.target.value)}
                    className="flex-1 px-2 py-1 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-900"
                  >
                    {ingredients.map(i => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1 w-24">
                    <input
                      type="number"
                      step="5"
                      value={item.amount}
                      onChange={e => handleUpdateAmount(index, parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-white border border-stone-300 rounded-lg text-xs font-mono font-bold text-right"
                    />
                    <span className="text-[10px] text-stone-500 font-mono">ml</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveRecipeItem(index)}
                    className="p-1 text-stone-400 hover:text-rose-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
