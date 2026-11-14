import React, { useState } from 'react';
import { BarEvent, Cocktail, Ingredient, WasteRecord } from '../types/bar';
import { calculateEventMetrics } from '../utils/calculations';
import { exportEventToExcel } from '../utils/excelExport';
import {
  X,
  FileSpreadsheet,
  Boxes,
  HelpCircle,
  Plus,
  TrendingDown,
  Scale,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';

interface ManagementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeEvent: BarEvent;
  cocktails: Cocktail[];
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  onCloseEvent: (eventId: string) => void;
  onAddWaste: (waste: WasteRecord) => void;
}

export const ManagementDrawer: React.FC<ManagementDrawerProps> = ({
  isOpen,
  onClose,
  activeEvent,
  cocktails,
  ingredients,
  setIngredients,
  onCloseEvent,
  onAddWaste,
}) => {
  const [activeTab, setActiveTab] = useState<'tutorial' | 'stock' | 'cierre' | 'mermas'>('cierre');
  const [sunatFiscal, setSunatFiscal] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Quick purchase modal state
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [selectedIngId, setSelectedIngId] = useState(ingredients[0]?.id || '');
  const [addedQty, setAddedQty] = useState('6');
  const [addedPrice, setAddedPrice] = useState('42.00');

  // Quick waste modal state
  const [isAddingWaste, setIsAddingWaste] = useState(false);
  const [wasteIngId, setWasteIngId] = useState(ingredients[0]?.id || '');
  const [wasteQty, setWasteQty] = useState('1');
  const [wasteReason, setWasteReason] = useState<WasteRecord['reason']>('rotura');

  if (!isOpen) return null;

  const metrics = calculateEventMetrics(activeEvent, cocktails, ingredients);
  const parsedSunat = parseFloat(sunatFiscal) || 0;
  const matchDifference = parsedSunat > 0 ? metrics.totalRevenue - parsedSunat : 0;

  const handleDownloadExcel = () => {
    setIsExporting(true);
    try {
      exportEventToExcel(activeEvent, cocktails, ingredients);
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

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
      notes: 'Registrado desde panel de mermas',
    };

    onAddWaste(newWaste);
    setIsAddingWaste(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex justify-end animate-fade-in">
      <div className="w-full sm:w-[600px] h-full bg-white text-stone-900 border-l-2 border-orange-200 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans text-base font-bold tracking-wide">
                Logística, Bodega & Cierre
              </h2>
              <p className="text-xs text-orange-100">
                {activeEvent.name} ({activeEvent.date})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Pills */}
        <div className="px-5 py-2.5 bg-orange-50/70 border-b border-orange-100 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('cierre')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                activeTab === 'cierre'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-orange-50'
              }`}
            >
              📊 Cierre & Excel
            </button>

            <button
              onClick={() => setActiveTab('stock')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                activeTab === 'stock'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-orange-50'
              }`}
            >
              📦 Stock Remanente
            </button>

            <button
              onClick={() => setActiveTab('mermas')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                activeTab === 'mermas'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-orange-50'
              }`}
            >
              ⚠️ Mermas ({metrics.wastes.length})
            </button>
          </div>

          <button
            onClick={() => setActiveTab('tutorial')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
              activeTab === 'tutorial'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Tutorial Rápido</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#faf8f5]">
          {/* ========================================================================= */}
          {/* TAB 0: TUTORIAL INTERACTIVO DE LOGÍSTICA (SUPER CLARO Y SENCILLO)         */}
          {/* ========================================================================= */}
          {activeTab === 'tutorial' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-950">
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb className="w-5 h-5 text-amber-600" />
                  <h3 className="font-sans font-bold text-sm text-amber-900">
                    Guía Rápida: ¿Cómo funciona la Logística en tu Bar?
                  </h3>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Esta sección está diseñada para que lleves el control de lo que compraste, cuánto te cuesta cada cóctel y cuántas botellas te quedan exactamente para el siguiente evento sin hacer matemáticas.
                </p>
              </div>

              {/* Step 1 */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h4 className="font-sans font-bold text-xs uppercase tracking-wide text-stone-900">
                    Costo de Insumos y Botellas
                  </h4>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed pl-8">
                  Tú compras, por ejemplo, una botella de <strong>Pisco Quebranta 750ml a S/. 38.00</strong>. El sistema automáticamente divide ese monto para saber que cada mililitro cuesta <strong>S/. 0.05</strong>.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h4 className="font-sans font-bold text-xs uppercase tracking-wide text-stone-900">
                    Costo de Elaboración de Cada Trago
                  </h4>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed pl-8">
                  Cuando se prepara un <strong>Pisco Sour Clásico</strong>, entran 60ml de Pisco + 30ml Limón + 30ml Jarabe + clara y gotas de amargo. El sistema suma todo y te dice: <strong>Costo exacto del vaso: S/. 4.80</strong>.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <h4 className="font-sans font-bold text-xs uppercase tracking-wide text-stone-900">
                    Tu Margen de Ganancia Real
                  </h4>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed pl-8">
                  Si vendes ese Pisco Sour a <strong>S/. 32.00</strong> en la barra, tu margen bruto es de <strong>S/. 27.20 de ganancia neta por cóctel (85% de margen)</strong>.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center">
                    4
                  </span>
                  <h4 className="font-sans font-bold text-xs uppercase tracking-wide text-stone-900">
                    Stock Remanente para el Próximo Evento
                  </h4>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed pl-8">
                  Cada vez que presionas <em>Confirmar Pedido</em>, el sistema descuenta automáticamente los ml de cada botella. Al terminar la noche, miras la pestaña <strong>Stock Remanente</strong> y ves exactamente cuántas botellas enteras te quedan en bodega para abrir el siguiente evento.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('cierre')}
                className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition"
              >
                Entendido · Ir al Panel de Cierre
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: CIERRE DEL EVENTO & EXCEL                                          */}
          {/* ========================================================================= */}
          {activeTab === 'cierre' && (
            <div className="space-y-4 animate-fade-in">
              {/* Big Excel CTA */}
              <button
                onClick={handleDownloadExcel}
                disabled={isExporting}
                className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-sans tracking-wider font-bold text-sm shadow-xl flex items-center justify-center gap-3 transition active:scale-95 cursor-pointer border-2 border-emerald-400"
              >
                <FileSpreadsheet className={`w-5 h-5 ${isExporting ? 'animate-bounce' : ''}`} />
                <span>DESCARGAR HOJA DE EXCEL COMPLETA (.XLSX)</span>
              </button>

              {/* 3 Clear Metric Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white border-2 border-orange-200 shadow-sm text-center">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">
                    Ventas de Barra
                  </span>
                  <span className="text-lg font-black text-orange-600 font-mono mt-0.5 block">
                    S/. {metrics.totalRevenue.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-stone-600 font-bold">
                    {metrics.totalDrinksSold} tragos
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border-2 border-emerald-200 shadow-sm text-center">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">
                    Margen Ganancia
                  </span>
                  <span className="text-lg font-black text-emerald-600 font-mono mt-0.5 block">
                    {metrics.grossProfitMarginPercent}%
                  </span>
                  <span className="text-[11px] text-stone-600 font-bold">
                    +S/. {metrics.grossProfit.toFixed(0)} ganados
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border-2 border-purple-200 shadow-sm text-center">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">
                    Cortesías / DJs
                  </span>
                  <span className="text-lg font-black text-purple-600 font-mono mt-0.5 block">
                    {metrics.totalCourtesyDrinks}
                  </span>
                  <span className="text-[11px] text-purple-700 font-bold">
                    tragos regalados
                  </span>
                </div>
              </div>

              {/* SUNAT MATCH BOX */}
              <div className="p-4 rounded-2xl bg-white border-2 border-orange-200 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-orange-600" />
                  <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-stone-900">
                    Cuadre de Caja con Máquina SUNAT (Match)
                  </h4>
                </div>
                <p className="text-xs text-stone-600">
                  Ingresa el monto total facturado en tu ticket fiscal SUNAT de hoy para comparar con lo que se despachó en barra:
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Monto en máquina SUNAT (ej: 1250)..."
                    value={sunatFiscal}
                    onChange={e => setSunatFiscal(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-stone-50 border-2 border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-orange-500"
                  />
                  {parsedSunat > 0 && (
                    <div
                      className={`px-4 py-2.5 rounded-xl text-xs font-mono font-black ${
                        Math.abs(matchDifference) < 0.1
                          ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-400'
                          : matchDifference > 0
                          ? 'bg-orange-100 text-orange-900 border-2 border-orange-400'
                          : 'bg-rose-100 text-rose-900 border-2 border-rose-400'
                      }`}
                    >
                      {Math.abs(matchDifference) < 0.1
                        ? '✓ 100% CUADRADO'
                        : matchDifference > 0
                        ? `Sobrante: +S/. ${matchDifference.toFixed(2)}`
                        : `Faltante: -S/. ${Math.abs(matchDifference).toFixed(2)}`}
                    </div>
                  )}
                </div>
              </div>

              {/* Clean breakdown of sold drinks */}
              <div className="bg-white rounded-2xl border-2 border-stone-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 font-bold text-xs text-stone-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Tragos Vendidos en la Noche</span>
                  <span className="text-orange-600 font-mono">
                    {metrics.drinkStats.filter(d => d.soldQty > 0 || d.courtesyQty > 0).length} ítems
                  </span>
                </div>

                <div className="divide-y divide-stone-100">
                  {metrics.drinkStats
                    .filter(d => d.soldQty > 0 || d.courtesyQty > 0)
                    .map(d => (
                      <div key={d.cocktailId} className="p-3.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-sans font-bold text-stone-900">{d.name}</p>
                          <p className="text-[11px] text-stone-500">
                            Costo insumos: S/. {d.unitCost.toFixed(2)} · Precio venta: S/. {d.unitPrice.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-sm text-stone-900">
                            {d.soldQty} vendidos
                          </span>
                          <p className="text-[11px] font-mono text-emerald-700 font-bold">
                            +S/. {d.totalGrossProfit.toFixed(2)} ganancia
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: STOCK REMANENTE PARA EL SIGUIENTE EVENTO                           */}
          {/* ========================================================================= */}
          {activeTab === 'stock' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-stone-900">
                    Inventario & Remanente en Bodega
                  </h3>
                  <p className="text-xs text-stone-500">
                    Botellas que quedan exactamente para tu próximo evento
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingStock(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Agregar Compra</span>
                </button>
              </div>

              {/* Purchase Quick Form Modal/Box */}
              {isAddingStock && (
                <form
                  onSubmit={handleSaveStock}
                  className="p-4 rounded-2xl bg-orange-50 border-2 border-orange-300 shadow-md space-y-3"
                >
                  <h4 className="font-sans font-bold text-xs text-orange-950 uppercase">
                    Registrar Nueva Compra de Insumos
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-stone-600 block mb-1">Insumo</label>
                      <select
                        value={selectedIngId}
                        onChange={e => setSelectedIngId(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900"
                      >
                        {ingredients.map(i => (
                          <option key={i.id} value={i.id}>
                            {i.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-stone-600 block mb-1">Botellas compradas</label>
                      <input
                        type="number"
                        value={addedQty}
                        onChange={e => setAddedQty(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-stone-600 block mb-1">Costo por botella (S/.)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={addedPrice}
                        onChange={e => setAddedPrice(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 font-mono font-bold"
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

              {/* Clean, readable cards for each ingredient */}
              <div className="space-y-2.5">
                {metrics.ingredientStats.map(stat => (
                  <div
                    key={stat.ingredientId}
                    className="p-4 rounded-2xl bg-white border-2 border-stone-200 shadow-sm flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-sans font-bold text-stone-900 text-sm">
                        {stat.name}
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Inició con {stat.initialStock} botellas · Se consumieron {stat.consumedPackages} envases
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Queda para el siguiente evento
                      </span>
                      <span className="text-base font-black font-mono text-emerald-600">
                        {stat.residualStockPackages} botellas
                      </span>
                      {stat.needsRestock && (
                        <div className="text-[10px] text-rose-600 font-bold">
                          ⚠️ Comprar +{stat.restockSuggested} botellas
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: REGISTRO DE MERMAS Y ROTURAS                                       */}
          {/* ========================================================================= */}
          {activeTab === 'mermas' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-stone-900">
                    Mermas, Botellas Rotas y Derrames
                  </h3>
                  <p className="text-xs text-stone-500">
                    Total costo asumido: S/. {metrics.totalWasteCost.toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingWaste(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Anotar Merma</span>
                </button>
              </div>

              {/* Waste input form */}
              {isAddingWaste && (
                <form
                  onSubmit={handleSaveWaste}
                  className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 shadow-md space-y-3"
                >
                  <h4 className="font-sans font-bold text-xs text-rose-950 uppercase">
                    Anotar Pérdida o Botella Rota
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-stone-600 block mb-1">Insumo</label>
                      <select
                        value={wasteIngId}
                        onChange={e => setWasteIngId(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900"
                      >
                        {ingredients.map(i => (
                          <option key={i.id} value={i.id}>
                            {i.name} (S/. {i.packageCost.toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-stone-600 block mb-1">Cantidad perdida</label>
                      <input
                        type="number"
                        value={wasteQty}
                        onChange={e => setWasteQty(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-stone-600 block mb-1">Motivo</label>
                      <select
                        value={wasteReason}
                        onChange={e => setWasteReason(e.target.value as WasteRecord['reason'])}
                        className="w-full px-2.5 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900"
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
                      Anotar Merma
                    </button>
                  </div>
                </form>
              )}

              {/* List of wastes */}
              {metrics.wastes.length === 0 ? (
                <div className="p-8 text-center text-stone-500 bg-white rounded-2xl border border-stone-200 text-xs">
                  ✓ Cero mermas registradas en este evento.
                </div>
              ) : (
                <div className="space-y-2">
                  {metrics.wastes.map(w => (
                    <div
                      key={w.id}
                      className="p-3.5 rounded-2xl bg-white border-2 border-rose-100 shadow-sm flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-sans font-bold text-stone-900">{w.name}</p>
                        <p className="text-[11px] text-stone-500">
                          {w.quantity} {w.unit} · Motivo: <strong>{w.reason}</strong>
                        </p>
                      </div>

                      <span className="font-mono text-rose-600 font-black text-sm">
                        -S/. {w.estimatedCost.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
