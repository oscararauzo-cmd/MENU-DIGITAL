import React, { useState } from 'react';
import { Cocktail, Ingredient, CocktailCategory } from '../types/bar';
import { calculateCocktailUnitCost, getIngredientCostPerMl } from '../utils/calculations';
import { DrinkIllustration } from './DrinkIllustration';
import {
  Wine,
  PlusCircle,
  Edit2,
  Check,
  Percent,
  DollarSign,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  FileSpreadsheet,
} from 'lucide-react';

interface RecipesScreenProps {
  cocktails: Cocktail[];
  setCocktails: React.Dispatch<React.SetStateAction<Cocktail[]>>;
  ingredients: Ingredient[];
  onOpenFastMatrix?: () => void;
}

export const RecipesScreen: React.FC<RecipesScreenProps> = ({
  cocktails,
  setCocktails,
  ingredients,
  onOpenFastMatrix,
}) => {
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');
  const [selectedCocktailId, setSelectedCocktailId] = useState<string>(cocktails[0]?.id || '');
  const [isNewDrinkOpen, setIsNewDrinkOpen] = useState(false);

  // New cocktail state
  const [newDrinkName, setNewDrinkName] = useState('');
  const [newDrinkCategory, setNewDrinkCategory] = useState<CocktailCategory>('autor');
  const [newDrinkPrice, setNewDrinkPrice] = useState('35.00');
  const [newDrinkDesc, setNewDrinkDesc] = useState('');
  const [newDrinkGlass, setNewDrinkGlass] = useState<Cocktail['glassType']>('coupe');
  const [newDrinkIllKey, setNewDrinkIllKey] = useState('pisco-sour');
  const [newDrinkRecipe, setNewDrinkRecipe] = useState<{ ingredientId: string; amount: number }[]>([
    { ingredientId: ingredients[0]?.id || '', amount: 60 },
  ]);

  // Toggle active/inactive for event menu
  const handleToggleEventDrink = (id: string) => {
    setCocktails(prev =>
      prev.map(c => (c.id === id ? { ...c, enabledForEvent: !c.enabledForEvent } : c))
    );
  };

  // Quick inline price edit
  const handleStartEditPrice = (cocktail: Cocktail) => {
    setEditingPriceId(cocktail.id);
    setTempPrice(cocktail.price.toString());
  };

  const handleSavePrice = (id: string) => {
    const val = parseFloat(tempPrice);
    if (!isNaN(val) && val > 0) {
      setCocktails(prev =>
        prev.map(c => (c.id === id ? { ...c, price: val } : c))
      );
    }
    setEditingPriceId(null);
  };

  const activeCocktail = cocktails.find(c => c.id === selectedCocktailId) || cocktails[0];
  const activeCost = activeCocktail ? calculateCocktailUnitCost(activeCocktail, ingredients) : 0;
  const activeMargin = activeCocktail ? activeCocktail.price - activeCost : 0;
  const activeMarginPct = activeCocktail && activeCocktail.price > 0 ? (activeMargin / activeCocktail.price) * 100 : 0;

  const handleAddRecipeLine = () => {
    setNewDrinkRecipe(prev => [...prev, { ingredientId: ingredients[0]?.id || '', amount: 30 }]);
  };

  const handleSaveNewCocktail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrinkName.trim()) return;

    const newCocktail: Cocktail = {
      id: `cocktail-${Date.now()}`,
      name: newDrinkName.trim(),
      category: newDrinkCategory,
      price: parseFloat(newDrinkPrice) || 30,
      description: newDrinkDesc.trim() || 'Cóctel de autor de la casa Altura.',
      recipe: newDrinkRecipe.filter(r => r.amount > 0),
      illustrationKey: newDrinkIllKey,
      enabledForEvent: true,
      colorGradient: 'from-amber-400 to-rose-500',
      glassType: newDrinkGlass,
    };

    setCocktails(prev => [newCocktail, ...prev]);
    setSelectedCocktailId(newCocktail.id);
    setIsNewDrinkOpen(false);
    setNewDrinkName('');
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#faf8f5] text-stone-900 overflow-hidden font-sans">
      {/* LEFT LIST: All Available Cocktails with fast Toggles & Inline Price */}
      <div className="w-full md:w-1/2 lg:w-7/12 flex flex-col border-r border-stone-200 overflow-hidden bg-white">
        {/* Top toolbar */}
        <div className="p-3.5 bg-white border-b border-stone-200 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
              <Wine className="w-4 h-4 text-orange-600" />
              <span>Catálogo de Tragos & Recetas</span>
            </h2>
            <p className="text-[11px] text-stone-500">
              Activa qué ítems salen en el iPad y ajusta el precio de venta en Soles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenFastMatrix && (
              <button
                onClick={onOpenFastMatrix}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 shadow-2xs transition active:scale-95 cursor-pointer"
                title="Abrir matriz rápida de insumos y descargar en Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-orange-600" />
                <span className="hidden sm:inline">Matriz & Excel</span>
              </button>
            )}

            <button
              onClick={() => setIsNewDrinkOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Crear Cóctel</span>
            </button>
          </div>
        </div>

        {/* Scrollable List of Cocktails */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#faf8f5]">
          {cocktails.map(cocktail => {
            const cost = calculateCocktailUnitCost(cocktail, ingredients);
            const margin = cocktail.price - cost;
            const marginPct = cocktail.price > 0 ? ((margin / cocktail.price) * 100).toFixed(0) : 0;
            const isSelected = cocktail.id === selectedCocktailId;

            return (
              <div
                key={cocktail.id}
                onClick={() => setSelectedCocktailId(cocktail.id)}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition cursor-pointer select-none bg-white ${
                  isSelected
                    ? 'border-orange-500 shadow-md ring-2 ring-orange-500/20'
                    : 'border-stone-200 hover:border-orange-300 hover:shadow-2xs'
                } ${!cocktail.enabledForEvent ? 'opacity-60' : ''}`}
              >
                {/* Left: Illustration + Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <DrinkIllustration keyName={cocktail.illustrationKey} size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-stone-900 truncate">
                        {cocktail.name}
                      </h3>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 font-bold uppercase">
                        {cocktail.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                      {cocktail.description}
                    </p>

                    <div className="flex items-center gap-2 mt-1 text-[11px] font-mono">
                      <span className="text-stone-500">Costo: S/. {cost.toFixed(2)}</span>
                      <span className="text-emerald-600 font-bold">
                        Margen: S/. {margin.toFixed(2)} ({marginPct}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Editable Price & Event Menu Toggle */}
                <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                  {editingPriceId === cocktail.id ? (
                    <div className="flex items-center gap-1 bg-white border border-orange-500 rounded-lg p-1">
                      <span className="text-xs font-mono text-stone-500">S/.</span>
                      <input
                        type="number"
                        step="0.5"
                        value={tempPrice}
                        onChange={e => setTempPrice(e.target.value)}
                        className="w-16 px-1 py-0.5 bg-transparent text-xs text-stone-900 font-mono font-bold focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSavePrice(cocktail.id)}
                        className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartEditPrice(cocktail)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-300 text-xs font-mono font-extrabold text-stone-900 transition cursor-pointer shadow-2xs"
                      title="Editar precio de venta"
                    >
                      <span>S/. {cocktail.price.toFixed(2)}</span>
                      <Edit2 className="w-2.5 h-2.5 text-stone-400" />
                    </button>
                  )}

                  {/* Toggle: In Event Menu */}
                  <button
                    onClick={() => handleToggleEventDrink(cocktail.id)}
                    className="p-1 text-stone-400 hover:text-stone-700 transition cursor-pointer"
                    title={cocktail.enabledForEvent ? 'En carta del evento (click para ocultar)' : 'Oculto (click para activar)'}
                  >
                    {cocktail.enabledForEvent ? (
                      <ToggleRight className="w-8 h-8 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-stone-300" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANE: Recipe Details & Exact Unit Costing Breakdown */}
      <div className="w-full md:w-1/2 lg:w-5/12 bg-white flex flex-col overflow-y-auto p-4 sm:p-5 border-t md:border-t-0 md:border-l border-stone-200">
        {activeCocktail ? (
          <div className="space-y-4">
            {/* Cocktail Banner */}
            <div className="p-5 rounded-3xl bg-[#faf8f5] border border-stone-200 text-center relative overflow-hidden">
              <DrinkIllustration keyName={activeCocktail.illustrationKey} size="xl" className="mx-auto" />
              <h2 className="text-base font-extrabold text-stone-900 mt-2 font-sans">
                {activeCocktail.name}
              </h2>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                {activeCocktail.description}
              </p>

              {/* Costing Cards */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-stone-200 text-center">
                <div className="p-2.5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Precio Venta</span>
                  <span className="text-sm font-black text-orange-600 font-mono">
                    S/. {activeCocktail.price.toFixed(2)}
                  </span>
                </div>
                <div className="p-2.5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Costo Prep.</span>
                  <span className="text-sm font-black text-rose-600 font-mono">
                    S/. {activeCost.toFixed(2)}
                  </span>
                </div>
                <div className="p-2.5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Margen Bruto</span>
                  <span className="text-sm font-black text-emerald-600 font-mono">
                    {activeMarginPct.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Ingredients & Recipe Dosage */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-orange-600" />
                  <span>Desglose de Receta & Insumos</span>
                </h3>
                <span className="text-[11px] text-stone-500 font-bold">
                  {activeCocktail.recipe.length} ingredientes
                </span>
              </div>

              <div className="space-y-2">
                {activeCocktail.recipe.map(item => {
                  const ing = ingredients.find(i => i.id === item.ingredientId);
                  const costPerMl = ing ? getIngredientCostPerMl(ing) : 0;
                  const itemTotalCost = costPerMl * item.amount;

                  return (
                    <div
                      key={item.ingredientId}
                      className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-stone-900">
                          {ing ? ing.name : 'Insumo no encontrado'}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          Dosificación: {item.amount} {ing?.category === 'otro' ? 'un' : 'ml'}
                        </p>
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-xs font-bold text-stone-900">
                          S/. {itemTotalCost.toFixed(2)}
                        </span>
                        <div className="text-[10px] text-stone-400">
                          (S/. {costPerMl.toFixed(3)}/ml)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Profitability conclusion */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-medium">
                <p>
                  Por cada <strong>{activeCocktail.name}</strong> vendido a S/. {activeCocktail.price.toFixed(2)}, el bar gana <strong>S/. {activeMargin.toFixed(2)} netos</strong> tras cubrir el 100% de los insumos.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-stone-400">
            Selecciona un cóctel para ver su receta
          </div>
        )}
      </div>

      {/* Modal: Create Signature Cocktail */}
      {isNewDrinkOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-stone-200 rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-stone-900 mb-1">
              Crear Nuevo Cóctel de la Casa
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Configura el nuevo trago, selecciona su ilustración y añade los ingredientes de la receta.
            </p>

            <form onSubmit={handleSaveNewCocktail} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Nombre del Trago</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Sunset Spritz Andino"
                  value={newDrinkName}
                  onChange={e => setNewDrinkName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Categoría</label>
                  <select
                    value={newDrinkCategory}
                    onChange={e => setNewDrinkCategory(e.target.value as CocktailCategory)}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-orange-500"
                  >
                    <option value="pisco">Pisco & Sour</option>
                    <option value="autor">De Autor</option>
                    <option value="clasico">Clásico</option>
                    <option value="tapas_comida">Tapas & Comida</option>
                    <option value="cerveza_sin_alcohol">Cerveza / Sin Alcohol</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Precio Venta (S/.)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newDrinkPrice}
                    onChange={e => setNewDrinkPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Glass / Illustration picker */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Estilo Visual / Ilustración
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'pisco-sour', label: 'Coupe Sour' },
                    { key: 'chilcano', label: 'Highball' },
                    { key: 'negroni', label: 'Old Fashioned' },
                    { key: 'muna-mule', label: 'Cobre Mule' },
                    { key: 'capitan', label: 'Martini' },
                    { key: 'gin-tonic', label: 'Copa Balón' },
                    { key: 'cerveza', label: 'Cerveza' },
                    { key: 'mocktail-chicha', label: 'Chicha Morada' },
                  ].map(ill => (
                    <button
                      key={ill.key}
                      type="button"
                      onClick={() => setNewDrinkIllKey(ill.key)}
                      className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition ${
                        newDrinkIllKey === ill.key
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                      }`}
                    >
                      <DrinkIllustration keyName={ill.key} size="sm" />
                      <span className="text-[9px] text-stone-700 font-bold">{ill.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Descripción</label>
                <input
                  type="text"
                  placeholder="ej: Notas cítricas con toque de muña y espuma sedosa..."
                  value={newDrinkDesc}
                  onChange={e => setNewDrinkDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Recipe lines */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-700">Ingredientes de la Receta</label>
                  <button
                    type="button"
                    onClick={handleAddRecipeLine}
                    className="text-[11px] text-orange-600 hover:text-orange-800 font-bold cursor-pointer"
                  >
                    + Agregar Insumo
                  </button>
                </div>

                <div className="space-y-2">
                  {newDrinkRecipe.map((rec, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={rec.ingredientId}
                        onChange={e => {
                          const val = e.target.value;
                          setNewDrinkRecipe(prev =>
                            prev.map((r, i) => (i === idx ? { ...r, ingredientId: val } : r))
                          );
                        }}
                        className="flex-1 px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-orange-500"
                      >
                        {ingredients.map(ing => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name}
                          </option>
                        ))}
                      </select>

                      <div className="w-28 flex items-center gap-1">
                        <input
                          type="number"
                          step="5"
                          value={rec.amount}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setNewDrinkRecipe(prev =>
                              prev.map((r, i) => (i === idx ? { ...r, amount: val } : r))
                            );
                          }}
                          className="w-full px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono font-bold text-right focus:outline-none focus:border-orange-500"
                        />
                        <span className="text-[10px] text-stone-500">ml</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsNewDrinkOpen(false)}
                  className="px-3 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Guardar Trago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
