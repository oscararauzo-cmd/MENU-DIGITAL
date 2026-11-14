import React, { useState } from 'react';
import { BarEvent, Cocktail, Ingredient } from '../types/bar';
import { calculateEventMetrics } from '../utils/calculations';
import { exportEventToExcel } from '../utils/excelExport';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Lock,
  Headphones,
  TrendingUp,
  AlertTriangle,
  Scale,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface EventCloseScreenProps {
  activeEvent: BarEvent;
  cocktails: Cocktail[];
  ingredients: Ingredient[];
  onCloseEvent: (eventId: string) => void;
  onOpenNewEventModal: () => void;
}

export const EventCloseScreen: React.FC<EventCloseScreenProps> = ({
  activeEvent,
  cocktails,
  ingredients,
  onCloseEvent,
  onOpenNewEventModal,
}) => {
  const [sunatAmount, setSunatAmount] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const metrics = calculateEventMetrics(activeEvent, cocktails, ingredients);

  const parsedSunat = parseFloat(sunatAmount) || 0;
  const differenceWithSunat = parsedSunat > 0 ? metrics.totalRevenue - parsedSunat : 0;

  const handleExport = () => {
    setIsExporting(true);
    try {
      exportEventToExcel(activeEvent, cocktails, ingredients);
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  return (
    <div className="flex-1 bg-[#0e0c0a] text-[#f4efe6] overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner: Excel Download CTA */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#993b22]/90 via-[#782c18] to-[#45160b] border border-[#d96548]/50 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-5">
        <div>
          <span className="text-[11px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-black/40 text-amber-200 border border-amber-300/30">
            Exportación Oficial de Barra
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1.5 font-sans">
            Cierre de Evento & Descarga en Excel
          </h2>
          <p className="text-xs sm:text-sm text-[#f5ede2]/80 mt-1 max-w-xl">
            Genera al instante el libro de cálculo con 5 hojas detalladas: Resumen Ejecutivo, Tragos y Margen, Inventario con Stock Remanente para el siguiente evento, Registro de Mermas y Comandas.
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full md:w-auto px-6 py-4 rounded-xl bg-white text-[#832d18] hover:bg-[#fff7ed] font-extrabold text-sm shadow-xl flex items-center justify-center gap-2.5 transition active:scale-95 cursor-pointer shrink-0"
        >
          <FileSpreadsheet className={`w-5 h-5 text-[#993b22] ${isExporting ? 'animate-bounce' : ''}`} />
          <span>DESCARGAR EXCEL (.XLSX)</span>
        </button>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#141210] border border-[#27211a]">
          <span className="text-[10px] uppercase font-bold text-[#8c7f72] block">Ventas Totales</span>
          <p className="text-2xl font-mono font-extrabold text-[#f3ba63] mt-1">
            S/. {metrics.totalRevenue.toFixed(2)}
          </p>
          <p className="text-[10px] text-[#a39485] mt-1">
            {metrics.totalDrinksSold} tragos cobrados
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#141210] border border-[#27211a]">
          <span className="text-[10px] uppercase font-bold text-[#8c7f72] block">Margen Bruto</span>
          <p className="text-2xl font-mono font-extrabold text-emerald-400 mt-1">
            {metrics.grossProfitMarginPercent}%
          </p>
          <p className="text-[10px] text-emerald-300 mt-1 font-mono">
            +S/. {metrics.grossProfit.toFixed(2)} ganancia
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#141210] border border-[#27211a]">
          <span className="text-[10px] uppercase font-bold text-[#8c7f72] block">Cortesías / DJs</span>
          <p className="text-2xl font-mono font-extrabold text-purple-300 mt-1">
            {metrics.totalCourtesyDrinks} tragos
          </p>
          <p className="text-[10px] text-purple-400 mt-1 font-mono">
            -S/. {metrics.totalCostCourtesy.toFixed(2)} costo
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#141210] border border-[#27211a]">
          <span className="text-[10px] uppercase font-bold text-[#8c7f72] block">Mermas y Derrames</span>
          <p className="text-2xl font-mono font-extrabold text-rose-400 mt-1">
            -S/. {metrics.totalWasteCost.toFixed(2)}
          </p>
          <p className="text-[10px] text-rose-300 mt-1">
            {metrics.wastes.length} incidentes
          </p>
        </div>
      </div>

      {/* Match Simulator with SUNAT */}
      <div className="p-5 rounded-xl bg-[#141210] border border-[#2b241e] space-y-3">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-[#f5ede2]">
            Cuadre de Ventas con Sistema SUNAT (Match Nocturno)
          </h3>
        </div>
        <p className="text-xs text-[#9c8e80]">
          Ingresa aquí el total facturado que arrojó tu máquina fiscal / sistema SUNAT al terminar la noche para comparar con el conteo físico de la barra.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="text-[11px] text-[#a89d91] block mb-1">
              Total Físico Despachado en Barra (Este POS)
            </label>
            <div className="p-2.5 rounded-lg bg-[#1a1613] border border-[#2a231d] font-mono font-bold text-[#f3ba63]">
              S/. {metrics.totalRevenue.toFixed(2)}
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[#a89d91] block mb-1">
              Total Reportado por Sistema SUNAT (S/.)
            </label>
            <input
              type="number"
              step="0.5"
              placeholder="ej: 1850.00"
              value={sunatAmount}
              onChange={e => setSunatAmount(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-[#100e0c] border border-[#3d332b] font-mono font-bold text-white focus:outline-none focus:border-[#993b22]"
            />
          </div>

          <div>
            <label className="text-[11px] text-[#a89d91] block mb-1">
              Diferencia / Variación de Caja
            </label>
            <div
              className={`p-2.5 rounded-lg font-mono font-bold flex items-center justify-between border ${
                parsedSunat === 0
                  ? 'bg-[#1a1613] text-[#7d7063] border-[#2a231d]'
                  : Math.abs(differenceWithSunat) < 0.05
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                  : differenceWithSunat > 0
                  ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                  : 'bg-rose-950/80 text-rose-300 border-rose-700'
              }`}
            >
              <span>
                {parsedSunat === 0
                  ? 'Esperando dato...'
                  : Math.abs(differenceWithSunat) < 0.05
                  ? 'MATCH PERFECTO (100%)'
                  : differenceWithSunat > 0
                  ? `Sobrante barra: +S/. ${differenceWithSunat.toFixed(2)}`
                  : `Faltante barra: -S/. ${Math.abs(differenceWithSunat).toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Drinks breakdown table */}
      <div className="bg-[#141210] rounded-xl border border-[#26201b] overflow-hidden">
        <div className="p-3.5 bg-[#181512] border-b border-[#26201b] flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#e6ded5]">
            Detalle de Tragos Vendidos, Costo y Margen
          </h3>
          <span className="text-[11px] text-[#9c8e80]">
            {metrics.drinkStats.filter(d => d.soldQty > 0 || d.courtesyQty > 0).length} tragos con movimiento
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1b1714] text-[#9c8e80] text-[10px] font-bold uppercase tracking-wider border-b border-[#29221b]">
              <tr>
                <th className="py-2.5 px-3">Cóctel</th>
                <th className="py-2.5 px-2 text-center">Vendidos</th>
                <th className="py-2.5 px-2 text-center">DJs/Regalo</th>
                <th className="py-2.5 px-2">Precio Venta</th>
                <th className="py-2.5 px-2">Costo Insumos</th>
                <th className="py-2.5 px-2">Margen Unit.</th>
                <th className="py-2.5 px-2">Margen %</th>
                <th className="py-2.5 px-3 text-right">Ingreso Total</th>
                <th className="py-2.5 px-3 text-right">Ganancia Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#221c17]">
              {metrics.drinkStats
                .filter(d => d.soldQty > 0 || d.courtesyQty > 0)
                .map(d => (
                  <tr key={d.cocktailId} className="hover:bg-[#1a1613]">
                    <td className="py-2.5 px-3 font-semibold text-[#f5ede2]">
                      {d.name}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-white">
                      {d.soldQty}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-purple-300">
                      {d.courtesyQty > 0 ? d.courtesyQty : '-'}
                    </td>
                    <td className="py-2.5 px-2 font-mono text-[#d6c7b7]">
                      S/. {d.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 font-mono text-rose-300">
                      S/. {d.unitCost.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 font-mono text-emerald-400">
                      S/. {d.unitMargin.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 font-mono text-emerald-400 font-bold">
                      {d.unitMarginPercent.toFixed(0)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#f3ba63]">
                      S/. {d.totalRevenue.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-emerald-400">
                      S/. {d.totalGrossProfit.toFixed(2)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event management actions */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-[#8f8275]">
          Estado actual: <strong className="text-white">{activeEvent.status.toUpperCase()}</strong> ({activeEvent.orders.length} pedidos registrados)
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {activeEvent.status === 'active' && (
            <button
              onClick={() => onCloseEvent(activeEvent.id)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#26201b] hover:bg-[#352c24] text-zinc-300 border border-[#3d332b] text-xs font-bold transition"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Cerrar Evento Oficialmente</span>
            </button>
          )}

          <button
            onClick={onOpenNewEventModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#993b22] hover:bg-[#b8492d] text-white text-xs font-bold transition shadow-lg"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Crear Siguiente Evento</span>
          </button>
        </div>
      </div>
    </div>
  );
};
