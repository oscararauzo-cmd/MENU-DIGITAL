import React, { useState } from 'react';
import { Ingredient, BarEvent, WasteRecord, IngredientCategory, IngredientUnit } from '../types/bar';
import { calculateEventMetrics, getIngredientCostPerMl } from '../utils/calculations';
import {
  Boxes,
  AlertTriangle,
  PlusCircle,
  TrendingDown,
  Sparkles,
  ShoppingBag,
  Trash2,
  DollarSign,
  PackageCheck,
  CheckCircle2,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface LogisticsScreenProps {
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  activeEvent: BarEvent;
  onAddWaste: (waste: WasteRecord) => void;
  onRemoveWaste: (wasteId: string) => void;
}

export const LogisticsScreen: React.FC<LogisticsScreenProps> = ({
  ingredients,
  setIngredients,
  activeEvent,
  onAddWaste,
  onRemoveWaste,
}) => {
  const [subTab, setSubTab] = useState<'stock' | 'waste' | 'restock'>('stock');
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
  const [isAddWasteOpen, setIsAddWasteOpen] = useState(false);

  // New ingredient form state
  const [newIngName, setNewIngName] = useState('');
  const [newIngCategory, setNewIngCategory] = useState<IngredientCategory>('licor');
  const [newIngUnit, setNewIngUnit] = useState<IngredientUnit>('botella_750ml');
  const [newIngCost, setNewIngCost] = useState('45.00');
  const [newIngVolume, setNewIngVolume] = useState('750');
  const [newIngStock, setNewIngStock] = useState('6');
  const [newIngMinAlert, setNewIngMinAlert] = useState('2');

  // Waste form state
  const [wasteIngId, setWasteIngId] = useState(ingredients[0]?.id || '');
  const [wasteQty, setWasteQty] = useState('100');
  const [wasteReason, setWasteReason] = useState<WasteRecord['reason']>('derrame');
  const [wasteNotes, setWasteNotes] = useState('');

  const metrics = calculateEventMetrics(activeEvent, [], ingredients);

  // Handle adding new ingredient
  const handleSaveIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngName.trim()) return;

    const newIng: Ingredient = {
      id: `ing-${Date.now()}`,
      name: newIngName.trim(),
      category: newIngCategory,
      unit: newIngUnit,
      packageCost: parseFloat(newIngCost) || 0,
      volumePerUnitMl: parseFloat(newIngVolume) || 1,
      initialStockUnits: parseFloat(newIngStock) || 0,
      currentStockUnits: parseFloat(newIngStock) || 0,
      minAlertUnits: parseFloat(newIngMinAlert) || 1,
    };

    setIngredients(prev => [...prev, newIng]);
    setIsAddIngredientOpen(false);
    setNewIngName('');
  };

  // Handle adding waste
  const handleSaveWaste = (e: React.FormEvent) => {
    e.preventDefault();
    const ing = ingredients.find(i => i.id === wasteIngId);
    if (!ing) return;

    const qty = parseFloat(wasteQty) || 1;
    const costPerMl = getIngredientCostPerMl(ing);
    const estimatedCost = Number((costPerMl * qty).toFixed(2));

    const newWaste: WasteRecord = {
      id: `wst-${Date.now()}`,
      timestamp: Date.now(),
      ingredientId: ing.id,
      name: `Merma de ${ing.name}`,
      quantity: qty,
      unit: 'ml/u',
      reason: wasteReason,
      estimatedCost: estimatedCost > 0 ? estimatedCost : ing.packageCost,
      notes: wasteNotes.trim() || undefined,
    };

    onAddWaste(newWaste);
    setIsAddWasteOpen(false);
    setWasteNotes('');
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0e0c0a] text-[#f4efe6] overflow-hidden">
      {/* Sub-navigation bar */}
      <div className="px-4 py-2.5 bg-[#141210] border-b border-[#241f1a] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('stock')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'stock'
                ? 'bg-[#993b22] text-white shadow-md'
                : 'bg-[#1b1714] text-[#a89d91] hover:bg-[#25201b]'
            }`}
          >
            <Boxes className="w-3.5 h-3.5 text-amber-300" />
            <span>Stock & Insumos</span>
          </button>

          <button
            onClick={() => setSubTab('waste')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'waste'
                ? 'bg-[#993b22] text-white shadow-md'
                : 'bg-[#1b1714] text-[#a89d91] hover:bg-[#25201b]'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            <span>Registro de Mermas ({metrics.wastes.length})</span>
            {metrics.totalWasteCost > 0 && (
              <span className="text-[10px] px-1 rounded bg-rose-950 text-rose-300 font-mono">
                -S/. {metrics.totalWasteCost.toFixed(2)}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('restock')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'restock'
                ? 'bg-[#993b22] text-white shadow-md'
                : 'bg-[#1b1714] text-[#a89d91] hover:bg-[#25201b]'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Remanente & Siguiente Evento</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {subTab === 'stock' && (
            <button
              onClick={() => setIsAddIngredientOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#28211b] hover:bg-[#382d24] text-[#f4efe6] border border-[#44372c] active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#e67a5f]" />
              <span>Registrar Compra / Insumo</span>
            </button>
          )}

          {subTab === 'waste' && (
            <button
              onClick={() => setIsAddWasteOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800/80 text-rose-200 border border-rose-700/60 active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Registrar Nueva Merma</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* SUBTAB 1: STOCK & INGREDIENT CATALOG */}
        {subTab === 'stock' && (
          <div className="space-y-4">
            {/* Quick summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-[#151210] border border-[#27211a]">
                <p className="text-[10px] uppercase font-bold text-[#8f8275]">Total Insumos en Carta</p>
                <p className="text-xl font-extrabold text-white mt-1 font-mono">{ingredients.length}</p>
              </div>

              <div className="p-3 rounded-xl bg-[#151210] border border-[#27211a]">
                <p className="text-[10px] uppercase font-bold text-[#8f8275]">Insumos Consumidos en Noche</p>
                <p className="text-xl font-extrabold text-[#e5b869] mt-1 font-mono">
                  {metrics.ingredientStats.filter(i => i.consumedPackages > 0).length} ítems
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#151210] border border-[#27211a]">
                <p className="text-[10px] uppercase font-bold text-[#8f8275]">Mermas Totales</p>
                <p className="text-xl font-extrabold text-rose-400 mt-1 font-mono">
                  S/. {metrics.totalWasteCost.toFixed(2)}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#151210] border border-[#27211a]">
                <p className="text-[10px] uppercase font-bold text-[#8f8275]">Alertas de Reposición</p>
                <p className="text-xl font-extrabold text-amber-400 mt-1 font-mono">
                  {metrics.ingredientStats.filter(i => i.needsRestock).length} insumos
                </p>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-[#141210] rounded-xl border border-[#26201b] overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1b1714] text-[#9c8e80] border-b border-[#29221b] uppercase text-[10px] tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-3">Insumo</th>
                      <th className="py-3 px-2">Categoría</th>
                      <th className="py-3 px-2">Costo Compra</th>
                      <th className="py-3 px-2">Costo x ml/u</th>
                      <th className="py-3 px-2 text-center">Stock Inicial</th>
                      <th className="py-3 px-2 text-center">Consumo Noche</th>
                      <th className="py-3 px-2 text-center">Mermas</th>
                      <th className="py-3 px-2 text-center text-[#e5b869]">Stock Remanente</th>
                      <th className="py-3 px-3 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#221c17]">
                    {metrics.ingredientStats.map(stat => {
                      const costPerMl = (stat.packageCost / (ingredients.find(i => i.id === stat.ingredientId)?.volumePerUnitMl || 1)).toFixed(3);
                      return (
                        <tr key={stat.ingredientId} className="hover:bg-[#1a1613] transition">
                          <td className="py-2.5 px-3 font-semibold text-[#f5ede2]">
                            {stat.name}
                          </td>
                          <td className="py-2.5 px-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#201b17] border border-[#302720] text-[#b5a99d] uppercase">
                              {stat.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 font-mono text-[#d6c7b7]">
                            S/. {stat.packageCost.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-2 font-mono text-[#8a7c6f]">
                            S/. {costPerMl}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-[#f5ede2]">
                            {stat.initialStock}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-amber-300">
                            {stat.consumedPackages > 0 ? `${stat.consumedPackages} env.` : '-'}
                            <div className="text-[9px] text-[#786c5f]">({stat.totalConsumedMlOrUnits} ml/u)</div>
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-rose-400">
                            {stat.wastePackages > 0 ? `${stat.wastePackages} env.` : '-'}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-extrabold text-sm text-[#e5b869]">
                            {stat.residualStockPackages}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {stat.needsRestock ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800">
                                <AlertTriangle className="w-3 h-3" />
                                Bajo ({stat.restockSuggested > 0 ? `+${stat.restockSuggested}` : ''})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                Óptimo
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: WASTES & LOSSES */}
        {subTab === 'waste' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/40 to-[#1a1512] border border-rose-900/40 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-rose-200">
                  Control de Mermas, Derrames y Degustaciones
                </h3>
                <p className="text-xs text-[#a39485] mt-0.5">
                  Registra botellas rotas, tragos devueltos o derrames para que el conteo de caja y stock coincida con exactitud.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#a39485]">Costo Total Asumido:</span>
                <p className="text-xl font-mono font-extrabold text-rose-400">
                  S/. {metrics.totalWasteCost.toFixed(2)}
                </p>
              </div>
            </div>

            {activeEvent.wastes.length === 0 ? (
              <div className="p-12 text-center bg-[#141210] rounded-xl border border-[#241f1a]">
                <PackageCheck className="w-10 h-10 mx-auto text-emerald-500/40 mb-2" />
                <p className="text-sm font-bold text-[#d6c7b7]">¡Cero mermas registradas en este evento!</p>
                <p className="text-xs text-[#8c7f72] mt-1">
                  Si ocurrió algún derrame o rotura durante el servicio, pulsa &ldquo;Registrar Nueva Merma&rdquo;.
                </p>
              </div>
            ) : (
              <div className="bg-[#141210] rounded-xl border border-[#26201b] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1a1613] text-[#9c8e80] text-[10px] font-bold uppercase tracking-wider border-b border-[#29221b]">
                    <tr>
                      <th className="py-2.5 px-3">Hora</th>
                      <th className="py-2.5 px-3">Ítem / Insumo</th>
                      <th className="py-2.5 px-2">Motivo</th>
                      <th className="py-2.5 px-2 text-center">Cantidad</th>
                      <th className="py-2.5 px-3 text-right">Costo Estimado</th>
                      <th className="py-2.5 px-3">Notas</th>
                      <th className="py-2.5 px-2 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#221c17]">
                    {activeEvent.wastes.map(w => (
                      <tr key={w.id} className="hover:bg-[#1a1613]">
                        <td className="py-2.5 px-3 font-mono text-[#8a7c6f]">
                          {new Date(w.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#f5ede2]">
                          {w.name}
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 font-bold uppercase border border-rose-900/60">
                            {w.reason}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-[#d6c7b7]">
                          {w.quantity} {w.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                          S/. {w.estimatedCost.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-[#a89d91] italic max-w-xs truncate">
                          {w.notes || '-'}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            onClick={() => onRemoveWaste(w.id)}
                            className="text-[#6e6357] hover:text-rose-400 p-1 cursor-pointer"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 3: RESIDUAL STOCK & NEXT EVENT PLANNING */}
        {subTab === 'restock' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#181512] to-amber-950/30 border border-emerald-900/40 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-emerald-300">
                  Balance de Stock Remanente para el Siguiente Evento
                </h3>
                <p className="text-xs text-[#a39485] mt-0.5">
                  Calculado automáticamente descontando las comandas despachadas y mermas del stock inicial.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {metrics.ingredientStats.map(stat => (
                <div
                  key={stat.ingredientId}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                    stat.needsRestock
                      ? 'bg-[#1c1412] border-rose-900/60'
                      : 'bg-[#151210] border-[#29221b]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-[#f5ede2]">{stat.name}</h4>
                      <p className="text-[10px] text-[#8f8275] uppercase">{stat.unit}</p>
                    </div>
                    {stat.needsRestock ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                        COMPRA REQUERIDA
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        OK
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#26201a] grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[9px] text-[#807366] block">Inició con</span>
                      <span className="font-mono font-bold text-[#c4b6a7]">{stat.initialStock}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#807366] block">Consumo</span>
                      <span className="font-mono font-bold text-amber-400">
                        {stat.consumedPackages}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#807366] block">REMANENTE</span>
                      <span className="font-mono font-extrabold text-emerald-400 text-sm">
                        {stat.residualStockPackages}
                      </span>
                    </div>
                  </div>

                  {stat.restockSuggested > 0 && (
                    <div className="mt-2.5 p-2 rounded-lg bg-amber-950/40 border border-amber-900/40 flex items-center justify-between text-xs text-amber-200">
                      <span>Sugerencia comprar:</span>
                      <span className="font-mono font-extrabold text-amber-300">
                        +{stat.restockSuggested} botellas (~S/. {(stat.restockSuggested * stat.packageCost).toFixed(2)})
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Add Ingredient / Purchase */}
      {isAddIngredientOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#181512] border border-[#382f25] rounded-2xl p-5 shadow-2xl">
            <h3 className="text-base font-bold text-[#f5ede2] mb-1">
              Registrar Compra o Nuevo Insumo
            </h3>
            <p className="text-xs text-[#998b7e] mb-4">
              Agrega licores, mixers o frutas para costear tus cócteles con precisión.
            </p>

            <form onSubmit={handleSaveIngredient} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#b8ab9e] block mb-1">
                  Nombre del Insumo / Licor
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: Pisco Mosto Verde 750ml"
                  value={newIngName}
                  onChange={e => setNewIngName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#100e0c] border border-[#2f2720] rounded-lg text-xs text-white focus:outline-none focus:border-[#993b22]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#b8ab9e] block mb-1">Categoría</label>
                  <select
                    value={newIngCategory}
                    onChange={e => setNewIngCategory(e.target.value as IngredientCategory)}
                    className="w-full px-2.5 py-2 bg-[#100e0c] border border-[#2f2720] rounded-lg text-xs text-white focus:outline-none"
                  >
                    <option value="licor">Licor / Destilado</option>
                    <option value="mezclador">Mezclador / Soda</option>
                    <option value="fruta_jarabe">Fruta / Jarabe</option>
                    <option value="guarnicion">Guarnición / Bitter</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#b8ab9e] block mb-1">Formato Compra</label>
                  <select
                    value={newIngUnit}
                    onChange={e => setNewIngUnit(e.target.value as IngredientUnit)}
                    className="w-full px-2.5 py-2 bg-[#100e0c] border border-[#2f2720] rounded-lg text-xs text-white focus:outline-none"
                  >
                    <option value="botella_750ml">Botella 750ml</option>
                    <option value="botella_700ml">Botella 700ml</option>
                    <option value="botella_1000ml">Botella 1 Litro</option>
                    <option value="lata_355ml">Lata 355ml</option>
                    <option value="botella_200ml">Botella 200ml</option>
                    <option value="litro">1 Litro suelto</option>
                    <option value="unidad">Por Unidad</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#b8ab9e] block mb-1">Costo Compra (S/.)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newIngCost}
                    onChange={e => setNewIngCost(e.target.value)}
                    className="w-full px-3 py-2 bg-[#100e0c] border border-[#2f2720] rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#b8ab9e] block mb-1">Volumen Envase (ml)</label>
                  <input
                    type="number"
                    required
                    value={newIngVolume}
                    onChange={e => setNewIngVolume(e.target.value)}
                    className="w-full px-3 py-2 bg-[#100e0c] border border-[#2f2720] rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#b8ab9e] block mb-1">Stock Inicial (unidades)</label>
                  <input
                    type="number"
                    required
                    value={newIngStock}
                    onChange={e => setNewIngStock(e.target.value)}
                    className="w-full px-3 py-2 bg-[#100e0c] border border-[#2f2720] rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#b8ab9e] block mb-1">Alerta Stock Mínimo</label>
                  <input
                    type="number"
                    required
                    value={newIngMinAlert}
                    onChange={e => setNewIngMinAlert(e.target.value)}
                    className="w-full px-3 py-2 bg-[#100e0c] border border-[#2f2720] rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#2b251f]">
                <button
                  type="button"
                  onClick={() => setIsAddIngredientOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-[#a89d91] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#993b22] hover:bg-[#b8492d] text-white text-xs font-bold rounded-lg shadow-md"
                >
                  Guardar Insumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Waste */}
      {isAddWasteOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#181512] border border-rose-900/60 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-base font-bold text-rose-200 mb-1">
              Registrar Merma o Desperdicio de Barra
            </h3>
            <p className="text-xs text-[#998b7e] mb-4">
              Registra pérdidas por rotura, derrame o degustación.
            </p>

            <form onSubmit={handleSaveWaste} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#b8ab9e] block mb-1">
                  Insumo o Bebida Afectada
                </label>
                <select
                  value={wasteIngId}
                  onChange={e => setWasteIngId(e.target.value)}
                  className="w-full px-2.5 py-2 bg-[#100e0c] border border-[#2f2720] rounded-lg text-xs text-white focus:outline-none"
                >
                  {ingredients.map(ing => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} (S/. {ing.packageCost.toFixed(2)} por {ing.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#b8ab9e] block mb-1">
                    Cantidad perdida (ml o un)
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={wasteQty}
                    onChange={e => setWasteQty(e.target.value)}
                    className="w-full px-3 py-2 bg-[#100e0c] border border-[#2f2720] rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#b8ab9e] block mb-1">Motivo</label>
                  <select
                    value={wasteReason}
                    onChange={e => setWasteReason(e.target.value as WasteRecord['reason'])}
                    className="w-full px-2.5 py-2 bg-[#100e0c] border border-[#2f2720] rounded-lg text-xs text-white focus:outline-none"
                  >
                    <option value="derrame">Derrame en estación</option>
                    <option value="rotura">Botella rota</option>
                    <option value="degustacion">Degustación / Calidad</option>
                    <option value="preparacion_errada">Preparación cancelada</option>
                    <option value="caducado">Pérdida de gas / caducado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#b8ab9e] block mb-1">
                  Observaciones / Notas
                </label>
                <input
                  type="text"
                  placeholder="ej: Accidente con shaker en ronda de 5"
                  value={wasteNotes}
                  onChange={e => setWasteNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#100e0c] border border-[#2f2720] rounded-lg text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#2b251f]">
                <button
                  type="button"
                  onClick={() => setIsAddWasteOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-[#a89d91] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-800 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-md"
                >
                  Registrar Merma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
