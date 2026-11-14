import React, { useState } from 'react';
import { Cocktail, Ingredient } from '../types/bar';
import { calculateCocktailUnitCost } from '../utils/calculations';
import {
  X,
  Check,
  Edit3,
  Sliders,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  DollarSign,
  Layers,
} from 'lucide-react';

interface MenuEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  cocktails: Cocktail[];
  setCocktails: React.Dispatch<React.SetStateAction<Cocktail[]>>;
  ingredients: Ingredient[];
  onOpenEditCocktail?: (cocktail: Cocktail) => void;
}

export const MenuEditorModal: React.FC<MenuEditorModalProps> = ({
  isOpen,
  onClose,
  cocktails,
  setCocktails,
  ingredients,
  onOpenEditCocktail,
}) => {
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  if (!isOpen) return null;

  // Toggle cocktail active for tonight's event
  const handleToggleDrink = (id: string) => {
    setCocktails(prev =>
      prev.map(c => (c.id === id ? { ...c, enabledForEvent: !c.enabledForEvent } : c))
    );
  };

  // Quick presets
  const handleSelectAll = (enable: boolean) => {
    setCocktails(prev => prev.map(c => ({ ...c, enabledForEvent: enable })));
  };

  const handleSelectPiscoOnly = () => {
    setCocktails(prev =>
      prev.map(c => ({
        ...c,
        enabledForEvent: c.category === 'pisco' || c.id === 'cocktail-pisco-sour',
      }))
    );
  };

  // Save price
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

  const activeCount = cocktails.filter(c => c.enabledForEvent).length;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-2xl max-h-[92vh] bg-white text-stone-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200">
        {/* Header - White, crisp, action PINNED at top */}
        <div className="px-5 py-3.5 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-stone-900 tracking-tight">
                Carta Activa del Evento
              </h2>
              <p className="text-[11px] text-stone-500">
                {activeCount} de {cocktails.length} productos activos en la barra
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-sm shadow-orange-500/25 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>✓ Listo</span>
            </button>
          </div>
        </div>

        {/* Beginner Context Explanation */}
        <div className="px-5 py-2.5 bg-orange-50/70 border-b border-orange-200/60 flex items-center gap-2 text-xs text-orange-950 shrink-0">
          <span className="font-bold text-orange-600">💡 ¿Para qué sirve?</span>
          <span>
            Solo los tragos y tapas que marques como <strong>activos</strong> aparecerán en la barra para cobrar rápido.
          </span>
        </div>

        {/* Quick Presets Ribbon */}
        <div className="px-5 py-3 bg-orange-50/70 border-b border-orange-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-orange-950 uppercase tracking-wider">
              Atajos Rápidos:
            </span>
            <button
              onClick={() => handleSelectAll(true)}
              className="px-3 py-1 rounded-full text-xs font-bold bg-white text-orange-600 border border-orange-300 hover:bg-orange-100 shadow-sm transition active:scale-95 cursor-pointer"
            >
              ✓ Activar Todos
            </button>
            <button
              onClick={() => handleSelectAll(false)}
              className="px-3 py-1 rounded-full text-xs font-bold bg-white text-stone-600 border border-stone-300 hover:bg-stone-100 shadow-sm transition active:scale-95 cursor-pointer"
            >
              ✕ Desactivar Todos
            </button>
            <button
              onClick={handleSelectPiscoOnly}
              className="px-3 py-1 rounded-full text-xs font-bold bg-orange-600 text-white shadow-sm hover:bg-orange-700 transition active:scale-95 cursor-pointer"
            >
              ⭐ Solo Piscos de Altura
            </button>
          </div>

          <span className="text-xs font-bold text-orange-800 font-mono">
            {activeCount} de {cocktails.length} en la carta
          </span>
        </div>

        {/* List of Cocktails with Toggle & Editable Price */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#faf8f5]">
          {cocktails.map(cocktail => {
            const cost = calculateCocktailUnitCost(cocktail, ingredients);
            const margin = cocktail.price - cost;
            const marginPct = cocktail.price > 0 ? ((margin / cocktail.price) * 100).toFixed(0) : 0;
            const isEditing = editingPriceId === cocktail.id;

            return (
              <div
                key={cocktail.id}
                className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 ${
                  cocktail.enabledForEvent
                    ? 'bg-white border-orange-300 shadow-md ring-1 ring-orange-200'
                    : 'bg-stone-100/80 border-stone-200 opacity-60'
                }`}
              >
                {/* Image + Title */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-xl overflow-hidden shadow-md shrink-0 border border-orange-200 bg-stone-900">
                    <img
                      src={cocktail.imageUrl || '/assets/cocktails/pisco_sour.jpg'}
                      alt={cocktail.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-sans font-bold text-sm text-stone-900 truncate">
                        {cocktail.name}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-orange-100 text-orange-800">
                        {cocktail.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                      {cocktail.description}
                    </p>

                    <div className="flex items-center gap-3 mt-1 text-[11px] font-mono">
                      <span className="text-stone-500">
                        Costo Insumos: <strong>S/. {cost.toFixed(2)}</strong>
                      </span>
                      <span className="text-emerald-700 font-bold">
                        Margen: S/. {margin.toFixed(2)} ({marginPct}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price Edit, Recipe Costing & Enable Toggle */}
                <div className="flex items-center gap-2.5 shrink-0">
                  {onOpenEditCocktail && (
                    <button
                      type="button"
                      onClick={() => onOpenEditCocktail(cocktail)}
                      className="px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 hover:border-orange-400 text-xs font-bold text-orange-900 flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                      title="Editar nombre, foto, insumos, receta y ver margen exacto"
                    >
                      <Layers className="w-3.5 h-3.5 text-orange-600" />
                      <span className="hidden sm:inline">Receta & Insumos</span>
                    </button>
                  )}

                  {/* Inline Price */}
                  {isEditing ? (
                    <div className="flex items-center gap-1 bg-orange-50 p-1 rounded-xl border border-orange-300">
                      <span className="text-xs font-bold font-mono text-orange-600 pl-1">S/.</span>
                      <input
                        type="number"
                        step="0.5"
                        value={tempPrice}
                        onChange={e => setTempPrice(e.target.value)}
                        className="w-16 px-1.5 py-1 text-xs font-bold font-mono bg-white rounded border border-orange-400 focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSavePrice(cocktail.id)}
                        className="p-1 rounded bg-orange-600 text-white hover:bg-orange-700 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartEditPrice(cocktail)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-orange-50 border border-stone-200 hover:border-orange-300 text-xs font-mono font-bold text-stone-900 flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                      title="Haz clic para cambiar el precio de venta rápido"
                    >
                      <span>S/. {cocktail.price.toFixed(2)}</span>
                      <Edit3 className="w-3 h-3 text-orange-600" />
                    </button>
                  )}

                  {/* Enable / Disable Toggle Switch */}
                  <button
                    onClick={() => handleToggleDrink(cocktail.id)}
                    className="p-1.5 text-stone-400 hover:text-orange-600 transition cursor-pointer"
                    title={cocktail.enabledForEvent ? 'Trago activo en el evento (clic para ocultar)' : 'Trago oculto (clic para activar)'}
                  >
                    {cocktail.enabledForEvent ? (
                      <ToggleRight className="w-9 h-9 text-orange-600" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-stone-400" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info note */}
        <div className="px-5 py-2.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0 text-xs text-stone-500">
          <span>Los cambios se guardan automáticamente.</span>
          <button
            onClick={onClose}
            className="font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
          >
            Listo, volver a la barra →
          </button>
        </div>
      </div>
    </div>
  );
};
