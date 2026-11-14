import { visibleOperations } from '../utils/operationTrash';
import { selectPeriodEvents, eventKind, limaDate, consignmentSettlement } from '../utils/operationContext';
import React, { useState, useMemo, useEffect } from 'react';
import { BarEvent, Cocktail, Ingredient } from '../types/bar';
import { exportEventToExcel, exportOperationsSummary } from '../utils/excelExport';
import {
  CircleDollarSign,
  FileSpreadsheet,
  TrendingUp,
  Receipt,
  Gift,
  Smartphone,
  Coins,
  CreditCard,
  Calendar,
  Sun,
  Flame,
} from 'lucide-react';

interface VentasScreenProps {
  scope?: 'context' | 'general';
  activeEvent: BarEvent;
  allEvents?: BarEvent[];
  cocktails: Cocktail[];
  ingredients: Ingredient[];
  operationMode?: 'dia' | 'mes' | 'evento';
  onChangeOperationMode?: (mode: 'dia' | 'mes' | 'evento') => void;
}

export const VentasScreen: React.FC<VentasScreenProps> = ({
  scope = 'context',
  activeEvent,
  allEvents = [],
  cocktails,
  ingredients,
  operationMode = 'dia',
  onChangeOperationMode,
}) => {
  const [includeEvents, setIncludeEvents] = useState(true);
  const [period, setPeriod] = useState<'dia' | 'mes' | 'evento'>(operationMode);
  const [filterType, setFilterType] = useState<'all' | 'venta' | 'dj'>('all');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Sync with Header mode selector
  useEffect(() => {
    setPeriod(operationMode);
  }, [operationMode]);

  const handleSelectPeriod = (next: 'dia' | 'mes' | 'evento') => {
    setPeriod(next);
    if (onChangeOperationMode) {
      onChangeOperationMode(next);
    }
  };

  // Pool of events based on period
  const relevantEvents = useMemo(() => {
    return scope === 'context' ? visibleOperations([activeEvent]) : visibleOperations(allEvents.length ? allEvents : [activeEvent]).filter(event=>(period==='dia'?event.date===limaDate():event.date.slice(0,7)===limaDate().slice(0,7))&&(includeEvents||event.operationType==='dia'));
  }, [period, activeEvent, allEvents, includeEvents, scope]);

  // Aggregate orders for the period
  const periodOrders = useMemo(() => {
    const list = [];
    for (const ev of relevantEvents) {
      list.push(...ev.orders);
    }
    return list;
  }, [relevantEvents]);

  // Period totals
  const periodTotalRevenue = useMemo(() => {
    return periodOrders.reduce((sum, o) => sum + (o.orderType === 'venta' ? o.totalAmount : 0), 0);
  }, [periodOrders]);

  const periodTotalDrinksSold = useMemo(() => {
    return periodOrders.reduce((sum, o) => {
      const itemsCount = o.items.reduce((s, it) => s + it.quantity, 0);
      return sum + itemsCount;
    }, 0);
  }, [periodOrders]);

  // Estimated costs
  const periodIngredientCost = useMemo(() => {
    return relevantEvents.reduce((total,event) => total + (event.isConsignment && event.inventory?.length
      ? consignmentSettlement(event,cocktails).reduce((sum,line)=>sum+line.cost,0)
      : event.orders.reduce((sum,o)=>sum+o.items.reduce((n,item)=>n+item.unitCost*item.quantity,0),0)),0);
  }, [relevantEvents,cocktails]);

  const periodNetProfit = periodTotalRevenue - periodIngredientCost;
  const periodMarginPct = periodTotalRevenue > 0 ? (periodNetProfit / periodTotalRevenue) * 100 : 0;

  // Payment method breakdown for period
  const paymentBreakdown = useMemo(() => {
    const res = { yape: 0, tarjeta: 0, efectivo: 0, cortesia: 0 };
    for (const o of periodOrders) {
      const method = o.paymentMethod || 'yape_plin';
      if (o.orderType === 'dj' || o.orderType === 'cortesia' || method === 'cortesia') {
        res.cortesia += 1;
      } else if (method === 'yape_plin') {
        res.yape += o.totalAmount;
      } else if (method === 'tarjeta') {
        res.tarjeta += o.totalAmount;
      } else if (method === 'efectivo') {
        res.efectivo += o.totalAmount;
      }
    }
    return res;
  }, [periodOrders]);

  const handleDownloadExcel = () => {
    setIsExporting(true);
    try {
      exportOperationsSummary(relevantEvents, period === 'mes' ? `Mes ${limaDate().slice(0,7)}` : activeEvent.name, event => event.isConsignment && event.inventory?.length ? consignmentSettlement(event,cocktails).reduce((sum,line)=>sum+line.cost,0) : event.orders.reduce((sum,order)=>sum+order.items.reduce((n,item)=>n+item.unitCost*item.quantity,0),0));
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  const filteredOrders = periodOrders.filter(o => {
    if (filterType === 'all') return true;
    if (filterType === 'venta') return o.orderType === 'venta';
    if (filterType === 'dj') return o.orderType === 'dj' || o.orderType === 'cortesia';
    return true;
  });

  const currentMonthLabel = new Date().toLocaleDateString('es-PE', { month: 'long', timeZone: 'America/Lima' });

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col bg-[#faf8f5] text-stone-900 overflow-y-auto p-4 sm:p-6 space-y-4 font-sans">
      {scope === 'general' && <label className="flex items-center gap-3 text-sm font-bold rounded-2xl bg-white border border-stone-200 p-4"><input type="checkbox" checked={includeEvents} onChange={e=>setIncludeEvents(e.target.checked)} className="w-5 h-5 accent-orange-600" />Incluir los eventos en el panorama general</label>}
      {/* Top Header & Period Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-stone-200 shadow-xs shrink-0">
        <div>
          <span className="text-[10px] uppercase font-extrabold text-orange-600 tracking-wider">
            Caja, Finanzas & Arqueo
          </span>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight mt-0.5 capitalize">
            {scope === 'context' ? `${eventKind(activeEvent)==='evento'?'Evento':'Jornada'}: ${activeEvent.name}` : period === 'mes'
              ? `Resumen Financiero del Mes (${currentMonthLabel})`
              : period === 'dia'
              ? 'Arqueo de Caja del Día de Hoy'
              : `${eventKind(activeEvent)==='evento'?'Evento':'Jornada'}: ${activeEvent.name}`}
          </h2>
        </div>

        {scope==='general'&&<div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200">
          <button onClick={()=>handleSelectPeriod('dia')} className={`min-h-12 px-4 rounded-xl text-xs font-bold ${period==='dia'?'bg-white text-orange-600 shadow-xs':'text-stone-600'}`}>Hoy</button>
          <button onClick={()=>handleSelectPeriod('mes')} className={`min-h-12 px-4 rounded-xl text-xs font-bold ${period==='mes'?'bg-white text-orange-600 shadow-xs':'text-stone-600'}`}>Este mes</button>
        </div>}

        <button
          onClick={handleDownloadExcel}
          disabled={isExporting}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{isExporting ? 'Generando...' : 'Descargar Excel'}</span>
        </button>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Facturado */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              {period === 'mes' ? 'Ventas del Mes' : 'Total Cobrado'}
            </span>
            <CircleDollarSign className="w-4 h-4 text-orange-600" />
          </div>
          <span className="text-2xl font-mono font-black text-stone-900 block">
            S/. {periodTotalRevenue.toFixed(2)}
          </span>
          <span className="text-[11px] text-stone-500 mt-1 block font-medium">
            {periodTotalDrinksSold} tragos y tapas servidos
          </span>
        </div>

        {/* Costo de Insumos */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Costo Insumos</span>
            <Receipt className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-2xl font-mono font-black text-rose-600 block">
            S/. {periodIngredientCost.toFixed(2)}
          </span>
          <span className="text-[11px] text-stone-500 mt-1 block font-medium">
            Licores, jarabes y tapas
          </span>
        </div>

        {/* Margen bruto estimado */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Margen bruto estimado</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-mono font-black text-emerald-600 block">
            S/. {periodNetProfit.toFixed(2)}
          </span>
          <span className="text-[11px] text-emerald-700 font-bold mt-1 block">
            {periodMarginPct.toFixed(1)}% de margen libre
          </span>
        </div>

        {/* Comandas Totales */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Comandas</span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-mono font-black text-stone-900 block">
            {periodOrders.length}
          </span>
          <span className="text-[11px] text-stone-500 mt-1 block font-medium">
            {paymentBreakdown.cortesia} cortesías DJ
          </span>
        </div>
      </div>

      {/* Payment Method Breakdown Cards */}
      <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
          Desglose por Método de Pago ({period === 'mes' ? 'Mensual' : 'De la Sesión'})
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-[#f7edf9] border border-purple-200 text-purple-950">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-800 mb-1">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Yape / Plin</span>
            </div>
            <span className="text-lg font-mono font-black block">
              S/. {paymentBreakdown.yape.toFixed(2)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#edf4fa] border border-blue-200 text-blue-950">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 mb-1">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Tarjeta POS</span>
            </div>
            <span className="text-lg font-mono font-black block">
              S/. {paymentBreakdown.tarjeta.toFixed(2)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#eef8f1] border border-emerald-200 text-emerald-950">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1">
              <Coins className="w-3.5 h-3.5" />
              <span>Efectivo en Caja</span>
            </div>
            <span className="text-lg font-mono font-black block">
              S/. {paymentBreakdown.efectivo.toFixed(2)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-600 mb-1">
              <Gift className="w-3.5 h-3.5 text-amber-500" />
              <span>Cortesías DJ / Staff</span>
            </div>
            <span className="text-lg font-mono font-black block">
              {paymentBreakdown.cortesia} pedidos
            </span>
          </div>
        </div>
      </div>

      {/* Orders List Table */}
      <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
            Historial de Comandas ({filteredOrders.length})
          </h3>

          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                filterType === 'all' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('venta')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                filterType === 'venta' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
              }`}
            >
              Ventas
            </button>
            <button
              onClick={() => setFilterType('dj')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                filterType === 'dj' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
              }`}
            >
              Cortesías
            </button>
          </div>
        </div>

        <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
          {filteredOrders.length === 0 ? (
            <p className="p-6 text-center text-xs text-stone-400">No hay comandas registradas en este período</p>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className="p-3 flex items-center justify-between text-xs hover:bg-stone-50 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-900">#{order.id}</span>
                    <span className="text-[10px] text-stone-400">
                      {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 capitalize">
                      {order.paymentMethod ? order.paymentMethod.replace('_', ' ') : order.orderType}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    {order.items.map(it => `${it.quantity}x ${it.cocktailName}`).join(', ')}
                  </p>
                </div>

                <span className="font-mono font-black text-stone-900 text-sm">
                  {order.totalAmount > 0 ? `S/. ${order.totalAmount.toFixed(2)}` : 'S/. 0.00'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
