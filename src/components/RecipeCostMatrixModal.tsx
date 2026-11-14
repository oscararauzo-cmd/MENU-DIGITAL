import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Cocktail, Ingredient, BusinessProfile, RecipeItem } from '../types/bar';
import { calculateCocktailUnitCost, getIngredientCostPerMl } from '../utils/calculations';
import {
  FileSpreadsheet,
  Download,
  Plus,
  Trash2,
  X,
  Check,
  Percent,
  Layers,
  Sparkles,
  Info,
  DollarSign,
  Search,
  Filter,
} from 'lucide-react';

interface RecipeCostMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  cocktails: Cocktail[];
  setCocktails: React.Dispatch<React.SetStateAction<Cocktail[]>>;
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  businessProfile: BusinessProfile;
}

export const RecipeCostMatrixModal: React.FC<RecipeCostMatrixModalProps> = ({
  isOpen,
  onClose,
  cocktails,
  setCocktails,
  ingredients,
  setIngredients,
  businessProfile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Inline Quick Add Bar State
  const [newCat, setNewCat] = useState('pisco');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('32.00');
  const [newPrimaryIngId, setNewPrimaryIngId] = useState<string>(ingredients[0]?.id || '');
  const [newPrimaryAmount, setNewPrimaryAmount] = useState('60');

  // Ingredient quick add in recipe
  const [addingIngToCocktailId, setAddingIngToCocktailId] = useState<string | null>(null);
  const [selectedIngToAdd, setSelectedIngToAdd] = useState<string>(ingredients[0]?.id || '');
  const [amountToAdd, setAmountToAdd] = useState<string>('30');

  // Insumo fast creator inside modal
  const [isCreatingIngredient, setIsCreatingIngredient] = useState(false);
  const [newIngName, setNewIngName] = useState('');
  const [newIngPackageCost, setNewIngPackageCost] = useState('45.00');
  const [newIngVolumeMl, setNewIngVolumeMl] = useState('750');

  if (!isOpen) return null;

  // Filtered cocktails
  const filteredCocktails = cocktails.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || c.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Calculate costs lookup
  const unitCosts = new Map<string, number>();
  for (const c of cocktails) {
    unitCosts.set(c.id, calculateCocktailUnitCost(c, ingredients));
  }

  // Handle price inline change
  const handlePriceChange = (cocktailId: string, val: number) => {
    setCocktails(prev =>
      prev.map(c => (c.id === cocktailId ? { ...c, price: Math.max(0, val) } : c))
    );
  };

  // Handle recipe amount inline change
  const handleRecipeAmountChange = (cocktailId: string, ingredientId: string, amount: number) => {
    setCocktails(prev =>
      prev.map(c => {
        if (c.id !== cocktailId) return c;
        const updatedRecipe = c.recipe.map(r =>
          r.ingredientId === ingredientId ? { ...r, amount: Math.max(0, amount) } : r
        );
        return { ...c, recipe: updatedRecipe };
      })
    );
  };

  // Remove ingredient from recipe
  const handleRemoveIngredientFromRecipe = (cocktailId: string, ingredientId: string) => {
    setCocktails(prev =>
      prev.map(c => {
        if (c.id !== cocktailId) return c;
        return {
          ...c,
          recipe: c.recipe.filter(r => r.ingredientId !== ingredientId),
        };
      })
    );
  };

  // Add ingredient to recipe
  const handleConfirmAddIngredient = (cocktailId: string) => {
    const amt = parseFloat(amountToAdd) || 30;
    if (!selectedIngToAdd) return;

    setCocktails(prev =>
      prev.map(c => {
        if (c.id !== cocktailId) return c;
        const exists = c.recipe.some(r => r.ingredientId === selectedIngToAdd);
        let updatedRecipe: RecipeItem[];
        if (exists) {
          updatedRecipe = c.recipe.map(r =>
            r.ingredientId === selectedIngToAdd ? { ...r, amount: r.amount + amt } : r
          );
        } else {
          updatedRecipe = [...c.recipe, { ingredientId: selectedIngToAdd, amount: amt }];
        }
        return { ...c, recipe: updatedRecipe };
      })
    );

    setAddingIngToCocktailId(null);
    setStatusMessage('✓ Insumo agregado a la receta.');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  // Quick Add new Cocktail / Product
  const handleQuickAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const priceNum = parseFloat(newPrice) || 25;
    const amountNum = parseFloat(newPrimaryAmount) || 60;

    const newCocktail: Cocktail = {
      id: `cocktail-${Date.now()}`,
      name: newName.trim(),
      category: newCat,
      price: priceNum,
      description: newCat === 'tapas_comida' ? 'Tapa preparada con insumos frescos.' : 'Cóctel artesanal de la casa.',
      recipe: newPrimaryIngId ? [{ ingredientId: newPrimaryIngId, amount: amountNum }] : [],
      enabledForEvent: true,
      illustrationKey: 'pisco-sour',
      colorGradient: 'from-amber-400 to-orange-500',
      glassType: 'rocks',
      imageUrl: newCat === 'tapas_comida' ? '/assets/cocktails/chilcano.jpg' : '/assets/cocktails/pisco_sour.jpg',
    };

    setCocktails(prev => [newCocktail, ...prev]);
    setNewName('');
    setStatusMessage(`✓ Producto "${newCocktail.name}" creado con éxito.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Quick Add new Ingredient
  const handleCreateNewIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngName.trim()) return;

    const pkgCost = parseFloat(newIngPackageCost) || 35;
    const vol = parseFloat(newIngVolumeMl) || 750;

    const newIng: Ingredient = {
      id: `ing-${Date.now()}`,
      name: newIngName.trim(),
      category: 'licor',
      unit: 'botella_750ml',
      packageCost: pkgCost,
      volumePerUnitMl: vol,
      initialStockUnits: 5,
      currentStockUnits: 5,
      minAlertUnits: 2,
    };

    setIngredients(prev => [...prev, newIng]);
    setSelectedIngToAdd(newIng.id);
    setIsCreatingIngredient(false);
    setNewIngName('');
    setStatusMessage(`✓ Insumo "${newIng.name}" creado y listo para usar en recetas.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Toggle active for event
  const handleToggleEvent = (cocktailId: string) => {
    setCocktails(prev =>
      prev.map(c => (c.id === cocktailId ? { ...c, enabledForEvent: !c.enabledForEvent } : c))
    );
  };

  // =========================================================================
  // EXCEL GENERATION: 4 COMPLETE SHEETS (COSTS, ESCANDALLOS, INSUMOS & OLACLICK)
  // =========================================================================
  const handleDownloadFullExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // HOJA 1: RESUMEN DE PRODUCTOS, PRECIOS, COSTOS Y MARGEN
      const catLabels: Record<string, string> = {
        tapas_comida: 'Tapas & Comida',
        pisco: 'Piscos & Sours',
        autor: 'De Autor',
        clasico: 'Clásicos',
        cerveza_sin_alcohol: 'Cervezas & Bebidas',
      };

      const summaryHeaders = [
        'Categoría',
        'Nombre del Producto',
        'Precio Venta (S/.)',
        'Costo Insumos (S/.)',
        'Margen Bruto (S/.)',
        'Margen (%)',
        'Estado en iPad',
        'Insumos en Receta',
      ];

      const summaryRows = cocktails.map(c => {
        const cost = calculateCocktailUnitCost(c, ingredients);
        const margin = c.price - cost;
        const marginPct = c.price > 0 ? (margin / c.price) * 100 : 0;
        const recipeSummary = c.recipe
          .map(r => {
            const ing = ingredients.find(i => i.id === r.ingredientId);
            return `${ing?.name || 'Insumo'} (${r.amount}${ing?.category === 'otro' ? 'un' : 'ml'})`;
          })
          .join(', ');

        return [
          catLabels[c.category] || c.category,
          c.name,
          Number(c.price.toFixed(2)),
          Number(cost.toFixed(2)),
          Number(margin.toFixed(2)),
          Number(marginPct.toFixed(1)) + '%',
          c.enabledForEvent ? 'Activo en iPad' : 'Oculto',
          recipeSummary || 'Sin insumos asignados',
        ];
      });

      const wsSummary = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
      wsSummary['!cols'] = [
        { wch: 18 },
        { wch: 28 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 12 },
        { wch: 16 },
        { wch: 55 },
      ];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Matriz_Costos_Productos');

      // HOJA 2: ESCANDALLO DETALLADO (PORCIÓN A PORCIÓN)
      const escandalloHeaders = [
        'Producto',
        'Insumo de Receta',
        'Cantidad por Trago/Plato',
        'Unidad',
        'Costo por ml/un (S/.)',
        'Costo Insumo en Trago (S/.)',
        'Precio Trago (S/.)',
        '% del Costo Total',
      ];

      const escandalloRows: any[] = [];
      for (const c of cocktails) {
        const totalCost = calculateCocktailUnitCost(c, ingredients);
        for (const item of c.recipe) {
          const ing = ingredients.find(i => i.id === item.ingredientId);
          const costPerMl = ing ? getIngredientCostPerMl(ing) : 0;
          const itemCost = costPerMl * item.amount;
          const pctOfTotal = totalCost > 0 ? (itemCost / totalCost) * 100 : 0;

          escandalloRows.push([
            c.name,
            ing?.name || item.ingredientId,
            item.amount,
            ing?.category === 'otro' ? 'un' : 'ml',
            Number(costPerMl.toFixed(4)),
            Number(itemCost.toFixed(2)),
            Number(c.price.toFixed(2)),
            Number(pctOfTotal.toFixed(1)) + '%',
          ]);
        }
      }

      const wsEscandallo = XLSX.utils.aoa_to_sheet([escandalloHeaders, ...escandalloRows]);
      wsEscandallo['!cols'] = [
        { wch: 28 },
        { wch: 28 },
        { wch: 22 },
        { wch: 10 },
        { wch: 20 },
        { wch: 24 },
        { wch: 18 },
        { wch: 16 },
      ];
      XLSX.utils.book_append_sheet(wb, wsEscandallo, 'Escandallos_Insumos');

      // HOJA 3: BODEGA & COSTO DE BOTELLAS / ENVASES
      const ingHeaders = [
        'Insumo',
        'Categoría',
        'Unidad / Presentación',
        'Costo Paquete / Botella (S/.)',
        'Rendimiento (ml o unidades)',
        'Costo por ml / un (S/.)',
        'Stock Inicial',
        'Stock Actual',
        'Stock Mínimo Alerta',
      ];

      const ingRows = ingredients.map(i => {
        const costPerMl = getIngredientCostPerMl(i);
        return [
          i.name,
          i.category,
          i.unit,
          Number(i.packageCost.toFixed(2)),
          i.volumePerUnitMl,
          Number(costPerMl.toFixed(4)),
          i.initialStockUnits,
          i.currentStockUnits,
          i.minAlertUnits,
        ];
      });

      const wsIng = XLSX.utils.aoa_to_sheet([ingHeaders, ...ingRows]);
      wsIng['!cols'] = [
        { wch: 28 },
        { wch: 16 },
        { wch: 20 },
        { wch: 25 },
        { wch: 25 },
        { wch: 22 },
        { wch: 14 },
        { wch: 14 },
        { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(wb, wsIng, 'Inventario_Insumos');

      // Descargar archivo
      const businessTag = (businessProfile.name || 'Bar').replace(/[^a-zA-Z0-9_-]/g, '_');
      XLSX.writeFile(wb, `Recetas_Costos_Insumos_${businessTag}.xlsx`);

      setStatusMessage('✓ Archivo Excel de Recetas & Costos descargado exitosamente.');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e: any) {
      console.error(e);
      setStatusMessage('Error al generar el archivo Excel.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-6xl bg-white text-stone-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200 max-h-[94vh] my-auto">
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-2xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-wider text-orange-600">
                  Matriz de Recetas & Costeo Rápido
                </span>
                <span className="text-[10px] bg-stone-100 text-stone-700 font-bold px-2 py-0.5 rounded-full border border-stone-200">
                  {cocktails.length} Productos
                </span>
              </div>
              <h2 className="text-base font-bold text-stone-900 mt-0.5">
                Edición de Precios, Insumos, Cantidades y Descarga Excel
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadFullExcel}
              className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-orange-500/20 transition active:scale-95 cursor-pointer"
              title="Descargar matriz completa en formato Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Excel (.xlsx)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="px-5 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Quick Add Product Bar (1 Single Row!) */}
        <div className="p-3 sm:px-5 bg-[#faf8f5] border-b border-stone-200 shrink-0">
          <form onSubmit={handleQuickAddProduct} className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-extrabold text-stone-700 shrink-0 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5 text-orange-600" />
              <span>Nuevo Trago / Plato:</span>
            </span>

            <select
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-xl font-bold text-stone-800 focus:outline-none focus:border-orange-500"
            >
              <option value="pisco">Piscos & Sours</option>
              <option value="autor">De Autor</option>
              <option value="clasico">Clásicos</option>
              <option value="tapas_comida">Tapas & Comida</option>
              <option value="cerveza_sin_alcohol">Cervezas</option>
            </select>

            <input
              type="text"
              placeholder="Nombre del trago o tapa..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-stone-900 min-w-[160px] flex-1 focus:outline-none focus:border-orange-500"
              required
            />

            <div className="flex items-center gap-1 bg-white border border-stone-300 px-2 py-1 rounded-xl">
              <span className="text-[11px] text-stone-500 font-bold">Precio S/.</span>
              <input
                type="number"
                step="0.5"
                value={newPrice}
                onChange={e => setNewPrice(e.target.value)}
                className="w-16 font-mono font-bold text-stone-900 text-right focus:outline-none"
              />
            </div>

            <select
              value={newPrimaryIngId}
              onChange={e => setNewPrimaryIngId(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-xl text-stone-700 max-w-[180px] truncate focus:outline-none focus:border-orange-500"
            >
              <option value="">(Sin insumo inicial)</option>
              {ingredients.map(ing => (
                <option key={ing.id} value={ing.id}>
                  {ing.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 bg-white border border-stone-300 px-2 py-1 rounded-xl">
              <input
                type="number"
                step="5"
                value={newPrimaryAmount}
                onChange={e => setNewPrimaryAmount(e.target.value)}
                className="w-12 font-mono font-bold text-stone-900 text-right focus:outline-none"
              />
              <span className="text-[11px] text-stone-400">ml</span>
            </div>

            <button
              type="submit"
              className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              + Crear Producto
            </button>

            <button
              type="button"
              onClick={() => setIsCreatingIngredient(prev => !prev)}
              className="text-stone-500 hover:text-stone-900 underline text-[11px] cursor-pointer ml-auto"
            >
              {isCreatingIngredient ? 'Cancelar nuevo insumo' : '+ Crear nuevo insumo en bodega'}
            </button>
          </form>

          {/* Collapsible New Ingredient Creator */}
          {isCreatingIngredient && (
            <form
              onSubmit={handleCreateNewIngredient}
              className="mt-2.5 pt-2.5 border-t border-stone-200 flex flex-wrap items-center gap-2 text-xs bg-white p-2.5 rounded-xl"
            >
              <span className="font-bold text-stone-700">Insumo Nuevo:</span>
              <input
                type="text"
                placeholder="Nombre (ej. Vodka Absolut, Ron Cartavio)..."
                value={newIngName}
                onChange={e => setNewIngName(e.target.value)}
                className="px-2.5 py-1 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 flex-1 min-w-[160px]"
                required
              />
              <div className="flex items-center gap-1 bg-stone-50 border border-stone-300 px-2 py-0.5 rounded-lg">
                <span className="text-stone-400 text-[10px]">Costo Botella S/.</span>
                <input
                  type="number"
                  step="0.5"
                  value={newIngPackageCost}
                  onChange={e => setNewIngPackageCost(e.target.value)}
                  className="w-14 font-mono font-bold text-right text-stone-900"
                />
              </div>
              <div className="flex items-center gap-1 bg-stone-50 border border-stone-300 px-2 py-0.5 rounded-lg">
                <span className="text-stone-400 text-[10px]">Rinde ml</span>
                <input
                  type="number"
                  step="50"
                  value={newIngVolumeMl}
                  onChange={e => setNewIngVolumeMl(e.target.value)}
                  className="w-14 font-mono font-bold text-right text-stone-900"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-lg shadow-xs cursor-pointer"
              >
                Guardar Insumo
              </button>
            </form>
          )}
        </div>

        {/* Filter Toolbar */}
        <div className="px-5 py-2.5 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'tapas_comida', label: '🥪 Tapas & Comida' },
              { id: 'pisco', label: 'Piscos & Sours' },
              { id: 'autor', label: 'De Autor' },
              { id: 'clasico', label: 'Clásicos' },
              { id: 'cerveza_sin_alcohol', label: 'Cervezas' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar producto o trago..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-orange-500 w-48 sm:w-60"
            />
          </div>
        </div>

        {/* Matrix Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-white space-y-3">
          <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3 border-r border-stone-200">Producto</th>
                    <th className="py-2.5 px-3 border-r border-stone-200">Categoría</th>
                    <th className="py-2.5 px-3 border-r border-stone-200 text-right">
                      Precio Venta ({businessProfile.currencySymbol || 'S/.'})
                    </th>
                    <th className="py-2.5 px-4 border-r border-stone-200 min-w-[280px]">
                      Insumos & Cantidades (ml / un)
                    </th>
                    <th className="py-2.5 px-3 border-r border-stone-200 text-right">Costo Insumos</th>
                    <th className="py-2.5 px-3 border-r border-stone-200 text-right">Margen Bruto</th>
                    <th className="py-2.5 px-3 text-center">Estado iPad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredCocktails.map(cocktail => {
                    const cost = calculateCocktailUnitCost(cocktail, ingredients);
                    const margin = cocktail.price - cost;
                    const marginPct = cocktail.price > 0 ? (margin / cocktail.price) * 100 : 0;
                    const isAddingIng = addingIngToCocktailId === cocktail.id;

                    return (
                      <tr key={cocktail.id} className="hover:bg-stone-50/60 transition group">
                        {/* Producto & Foto */}
                        <td className="py-2.5 px-3 border-r border-stone-200 align-top">
                          <div className="flex items-center gap-2">
                            <img
                              src={cocktail.imageUrl || '/assets/cocktails/pisco_sour.jpg'}
                              alt={cocktail.name}
                              className="w-8 h-8 rounded-lg object-cover border border-stone-200 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-stone-900 leading-snug">{cocktail.name}</p>
                              <p className="text-[10px] text-stone-400 line-clamp-1">{cocktail.description}</p>
                            </div>
                          </div>
                        </td>

                        {/* Categoría */}
                        <td className="py-2.5 px-3 border-r border-stone-200 align-top">
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-bold uppercase">
                            {cocktail.category}
                          </span>
                        </td>

                        {/* Precio de Venta (Editable en vivo!) */}
                        <td className="py-2.5 px-3 border-r border-stone-200 align-top text-right">
                          <div className="inline-flex items-center gap-1 bg-stone-50 hover:bg-white border border-stone-200 hover:border-orange-500 rounded-lg px-2 py-1 transition shadow-2xs">
                            <span className="text-[11px] font-mono text-stone-500">S/.</span>
                            <input
                              type="number"
                              step="0.5"
                              value={cocktail.price}
                              onChange={e => handlePriceChange(cocktail.id, parseFloat(e.target.value) || 0)}
                              className="w-16 font-mono font-bold text-right text-stone-900 focus:outline-none"
                            />
                          </div>
                        </td>

                        {/* Insumos & Cantidades */}
                        <td className="py-2.5 px-4 border-r border-stone-200 align-top">
                          <div className="space-y-1.5">
                            {cocktail.recipe.length === 0 ? (
                              <p className="text-[11px] text-stone-400 italic">Sin insumos asignados</p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {cocktail.recipe.map(item => {
                                  const ing = ingredients.find(i => i.id === item.ingredientId);
                                  const costPerMl = ing ? getIngredientCostPerMl(ing) : 0;
                                  const itemCost = costPerMl * item.amount;

                                  return (
                                    <div
                                      key={item.ingredientId}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-100 border border-stone-200 text-[11px] text-stone-800"
                                    >
                                      <span className="font-semibold">{ing?.name || 'Insumo'}:</span>
                                      <input
                                        type="number"
                                        step="5"
                                        value={item.amount}
                                        onChange={e =>
                                          handleRecipeAmountChange(
                                            cocktail.id,
                                            item.ingredientId,
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        className="w-10 text-right font-mono font-bold bg-white px-1 py-0.2 rounded border border-stone-300 focus:outline-none"
                                      />
                                      <span className="text-[9px] text-stone-500">
                                        {ing?.category === 'otro' ? 'un' : 'ml'}
                                      </span>
                                      <span className="text-[9px] text-stone-400 font-mono ml-0.5">
                                        (S/.{itemCost.toFixed(2)})
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRemoveIngredientFromRecipe(cocktail.id, item.ingredientId)
                                        }
                                        className="text-stone-400 hover:text-rose-600 ml-1 cursor-pointer"
                                        title="Quitar de la receta"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Add Insumo Inline Drawer */}
                            {isAddingIng ? (
                              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-orange-50 border border-orange-200 mt-1">
                                <select
                                  value={selectedIngToAdd}
                                  onChange={e => setSelectedIngToAdd(e.target.value)}
                                  className="px-2 py-1 bg-white border border-stone-300 rounded-lg text-[11px] text-stone-800 max-w-[150px]"
                                >
                                  {ingredients.map(ing => (
                                    <option key={ing.id} value={ing.id}>
                                      {ing.name}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  step="5"
                                  value={amountToAdd}
                                  onChange={e => setAmountToAdd(e.target.value)}
                                  placeholder="ml"
                                  className="w-12 px-1.5 py-1 bg-white border border-stone-300 rounded-lg text-right font-mono text-[11px]"
                                />
                                <span className="text-[10px] text-stone-500">ml</span>
                                <button
                                  type="button"
                                  onClick={() => handleConfirmAddIngredient(cocktail.id)}
                                  className="px-2.5 py-1 bg-orange-600 text-white rounded-lg font-bold text-[10px] hover:bg-orange-700 cursor-pointer"
                                >
                                  Añadir
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAddingIngToCocktailId(null)}
                                  className="px-2 py-1 text-stone-500 hover:text-stone-800 text-[10px] cursor-pointer"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setAddingIngToCocktailId(cocktail.id);
                                  setSelectedIngToAdd(ingredients[0]?.id || '');
                                }}
                                className="text-[10px] font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1 pt-0.5 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Añadir insumo a este trago</span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Costo Insumos */}
                        <td className="py-2.5 px-3 border-r border-stone-200 align-top text-right font-mono font-bold text-rose-600">
                          S/. {cost.toFixed(2)}
                        </td>

                        {/* Margen Bruto */}
                        <td className="py-2.5 px-3 border-r border-stone-200 align-top text-right">
                          <div className="font-mono font-extrabold text-emerald-600">
                            S/. {margin.toFixed(2)}
                          </div>
                          <span
                            className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-bold mt-0.5 ${
                              marginPct >= 70
                                ? 'bg-emerald-100 text-emerald-800'
                                : marginPct >= 50
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {marginPct.toFixed(0)}%
                          </span>
                        </td>

                        {/* Estado iPad */}
                        <td className="py-2.5 px-3 align-top text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleEvent(cocktail.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition ${
                              cocktail.enabledForEvent
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-stone-100 text-stone-500 border border-stone-200'
                            }`}
                            title="Haz clic para activar u ocultar este trago en la comanda del iPad"
                          >
                            {cocktail.enabledForEvent ? '✓ En iPad' : 'Oculto'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Info className="w-4 h-4 text-orange-600 shrink-0" />
            <span>
              Todos los cambios en precios, insumos y cantidades se guardan al instante en tu base de datos y memoria.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              Cerrar
            </button>

            <button
              onClick={handleDownloadFullExcel}
              className="py-2 px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm shadow-orange-500/20 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Archivo Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
