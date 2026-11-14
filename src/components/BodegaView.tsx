import React, { useState } from 'react';
import { BarEvent, Cocktail, Ingredient, WasteRecord } from '../types/bar';
import { calculateEventMetrics } from '../utils/calculations';
import {
  Boxes,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Wine,
  Package,
} from 'lucide-react';

interface BodegaViewProps {
  activeEvent: BarEvent;
  cocktails: Cocktail[];
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  onAddWaste: (waste: WasteRecord) => void;
}

export const BodegaView: React.FC<BodegaViewProps> = ({
  activeEvent,
  cocktails,
  ingredients,
  setIngredients,
  onAddWaste,
}) => {
  const metrics = calculateEventMetrics(activeEvent, cocktails, ingredients);

  // Quick purchase modal
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [selectedIngId, setSelectedIngId] = useState(ingredients[0]?.id || '');
  const [addedQty, setAddedQty] = useState('6');
  const [addedPrice, setAddedPrice] = useState('42.00');

  // Quick waste modal
  const [isAddingWaste, setIsAddingWaste] = useState(false);
  const [wasteIngId, setWasteIngId] = useState(ingredients[0]?.id || '');
  const [wasteQty, setWasteQty] = useState('1');
  const [wasteReason, setWasteReason] = useState<WasteRecord['reason']>('rotura');

  const handleSaveStock = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(addedQty) || 0;
    const price = parseFloat(addedPrice) || 0;
    if (qty <= 0) return;

    setIngredients(prev =>
      prev.map(i =>
        i.id === selectedIngId
          ? {
              ...i,
              initialStockUnits: i.initialStockUnits + qty,
              currentStockUnits: i.currentStockUnits + qty,
              packageCost: price > 0 ? price : i.packageCost,
            }
          : i
      )
    );
    setIsAddingStock(false);
  };

  const handleSaveWaste = (e: React.FormEvent) => {
    e.preventDefault();
    const ing = ingredients.find(i => i.id === wasteIngId);
    if (!ing) return;
    const qty = parseFloat(wasteQty) || 1;

    const newWaste: WasteRecord = {
      id: `wst-${Date.now()}`,
      timestamp: Date.now(),
      ingredientId: ing.id,
      name: `Merma de ${ing.name}`,
      quantity: qty,
      unit: 'botella/un',
      reason: wasteReason,
      estimatedCost: Number((ing.packageCost * qty).toFixed(2)),
      notes: 'Registrado desde bodega',
    };

    onAddWaste(newWaste);
    setIsAddingWaste(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#faf8f5] text-stone-900 overflow-y-auto p-4 sm:p-6 space-y-5 font-sans">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-stone-200 shadow-2xs">
        <div>
          <span className="text-[10px] uppercase font-extrabold text-orange-600 tracking-wider">
            Control de Insumos
          </span>
          <h2 className="text-lg font-bold text-stone-900 tracking-tight mt-0.5">
            Bodega & Stock Remanente para el Siguiente Evento
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingWaste(true)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            Anotar Merma
          </button>

          <button
            onClick={() => setIsAddingStock(true)}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-orange-500/20 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Agregar Compra</span>
          </button>
        </div>
      </div>

      {/* Friendly Beginner 1-Line Banner */}
      <div className="p-3 bg-orange-50/80 rounded-2xl border border-orange-200/60 text-xs text-orange-950 flex items-center gap-2.5">
        <span className="font-extrabold text-orange-700 shrink-0">💡 ¿Qué se hace aquí?</span>
        <span className="text-stone-700">
          Monitoreas cuántas botellas de licor y tapas te quedan. Cada vez que cobras un trago en la barra, sus mililitros se descuentan solos. Si se rompe una botella en la barra, anota una <em>Merma</em> para mantener el conteo exacto.
        </span>
      </div>

      {/* Quick Add Stock Modal */}
      {isAddingStock && (
        <form
          onSubmit={handleSaveStock}
          className="p-4 rounded-2xl bg-white border border-orange-200 shadow-md space-y-3"
        >
          <h4 className="font-bold text-xs text-stone-900 uppercase">
            Registrar Nueva Entrada a Bodega
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-bold text-stone-600 block mb-1">Insumo</label>
              <select
                value={selectedIngId}
                onChange={e => setSelectedIngId(e.target.value)}
                className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900"
              >
                {ingredients.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-600 block mb-1">Botellas / Unidades</label>
              <input
                type="number"
                value={addedQty}
                onChange={e => setAddedQty(e.target.value)}
                className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-600 block mb-1">Costo Unitario (S/.)</label>
              <input
                type="number"
                step="0.5"
                value={addedPrice}
                onChange={e => setAddedPrice(e.target.value)}
                className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 font-mono font-bold"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingStock(false)}
              className="px-3 py-1.5 text-xs text-stone-600 font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-orange-600 text-white font-bold text-xs rounded-xl shadow-sm"
            >
              Guardar en Bodega
            </button>
          </div>
        </form>
      )}

      {/* Quick Add Waste Modal */}
      {isAddingWaste && (
        <form
          onSubmit={handleSaveWaste}
          className="p-4 rounded-2xl bg-white border border-rose-200 shadow-md space-y-3"
        >
          <h4 className="font-bold text-xs text-rose-900 uppercase">
            Anotar Botella Rota o Merma
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-bold text-stone-600 block mb-1">Insumo Afectado</label>
              <select
                value={wasteIngId}
                onChange={e => setWasteIngId(e.target.value)}
                className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900"
              >
                {ingredients.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name} (S/. {i.packageCost.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-600 block mb-1">Cantidad Perdida</label>
              <input
                type="number"
                value={wasteQty}
                onChange={e => setWasteQty(e.target.value)}
                className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-600 block mb-1">Motivo</label>
              <select
                value={wasteReason}
                onChange={e => setWasteReason(e.target.value as WasteRecord['reason'])}
                className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900"
              >
                <option value="rotura">Botella rota</option>
                <option value="derrame">Derrame en estación</option>
                <option value="degustacion">Degustación / Calidad</option>
                <option value="caducado">Sin gas / Vencido</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingWaste(false)}
              className="px-3 py-1.5 text-xs text-stone-600 font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-sm"
            >
              Registrar Pérdida
            </button>
          </div>
        </form>
      )}

      {/* Stock Cards Grid: Clean, Light, Air */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {metrics.ingredientStats.map(stat => (
          <div
            key={stat.ingredientId}
            className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <h4 className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                {stat.name}
              </h4>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Inició con {stat.initialStock} · Consumidos {stat.consumedPackages}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[9px] uppercase font-bold text-stone-400 block">
                Queda en bodega
              </span>
              <span className="text-base font-black font-mono text-emerald-600">
                {stat.residualStockPackages} botellas
              </span>
              {stat.needsRestock && (
                <span className="text-[9px] text-rose-600 font-bold block mt-0.5">
                  ⚠️ Comprar +{stat.restockSuggested}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
