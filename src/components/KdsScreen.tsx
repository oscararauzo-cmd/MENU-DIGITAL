import React, { useState } from 'react';
import { BarEvent, Order, OrderPreparationStatus } from '../types/bar';
import {
  ChefHat,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
  ShoppingBag,
  Check,
  AlertCircle,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';

interface KdsScreenProps {
  activeEvent: BarEvent;
  onUpdateOrderStatus?: (orderId: string, status: OrderPreparationStatus) => void;
  onPrintOrder?: (order: Order) => void;
  onGoToBarra?: () => void;
}

export const KdsScreen: React.FC<KdsScreenProps> = ({
  activeEvent,
  onUpdateOrderStatus,
  onPrintOrder,
  onGoToBarra,
}) => {
  const [filter, setFilter] = useState<'all' | 'preparing' | 'ready'>('preparing');

  // Filter orders
  const allOrders = [...activeEvent.orders].reverse();
  const preparingOrders = allOrders.filter(o => !o.status || o.status === 'preparing');
  const readyOrders = allOrders.filter(o => o.status === 'ready' || o.status === 'delivered');

  const displayedOrders = filter === 'all'
    ? allOrders
    : filter === 'preparing'
    ? preparingOrders
    : readyOrders;

  const handleToggleStatus = (order: Order) => {
    if (!onUpdateOrderStatus) return;
    const current = order.status || 'preparing';
    const nextStatus: OrderPreparationStatus = current === 'preparing' ? 'ready' : 'preparing';
    onUpdateOrderStatus(order.id, nextStatus);
  };

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col bg-[#faf8f5] text-stone-900 overflow-hidden font-sans">
      {/* Top Header */}
      <div className="px-4 sm:px-6 py-3 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold tracking-tight text-stone-900">
                Carrito & Estación de Preparación
              </h2>
              {preparingOrders.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-orange-600 text-white font-mono font-bold text-xs animate-pulse">
                  {preparingOrders.length} en cola
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500">
              Comandas cobradas en caja enviadas automáticamente para preparar
            </p>
          </div>
        </div>

        {/* Filter Pills & Barra Shortcut */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200">
            <button
              onClick={() => setFilter('preparing')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                filter === 'preparing'
                  ? 'bg-white text-orange-600 shadow-xs font-extrabold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>⏳ Preparando</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-orange-100 text-orange-700 font-mono">
                {preparingOrders.length}
              </span>
            </button>

            <button
              onClick={() => setFilter('ready')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                filter === 'ready'
                  ? 'bg-white text-emerald-600 shadow-xs font-extrabold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>✓ Listos / Servidos</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                {readyOrders.length}
              </span>
            </button>

            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-stone-900 shadow-xs font-extrabold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Todos ({allOrders.length})
            </button>
          </div>

          {onGoToBarra && (
            <button
              onClick={onGoToBarra}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-orange-500/20 transition active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Volver a la Barra</span>
            </button>
          )}
        </div>
      </div>

      {/* Friendly Beginner 1-Line Banner */}
      <div className="px-4 sm:px-6 py-2 bg-orange-50/80 border-b border-orange-200/60 flex items-center gap-2 text-xs text-orange-950 shrink-0">
        <HelpCircle className="w-4 h-4 text-orange-600 shrink-0" />
        <span className="text-stone-700">
          <strong>¿Qué se hace aquí?</strong> Aquí el bartender o quien está preparando los tragos ve cada comanda que se acaba de pagar en caja. Cuando termines de mezclar y servir, pulsa <strong>✓ Listo para Servir</strong>.
        </span>
      </div>

      {/* Orders Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
        {displayedOrders.length === 0 ? (
          <div className="col-span-full py-16 text-center text-stone-400 bg-white rounded-3xl border border-stone-200 p-8 shadow-2xs">
            <ChefHat className="w-12 h-12 mx-auto text-orange-300 mb-2" />
            <p className="text-sm font-extrabold text-stone-800">
              {filter === 'preparing' ? '¡Todo al día! No hay pedidos pendientes de preparación' : 'No hay pedidos en esta sección'}
            </p>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Cada vez que marques "Confirmar Pagado" en la barra, la orden aparecerá aquí de inmediato con los tragos a mezclar.
            </p>
            {onGoToBarra && (
              <button
                onClick={onGoToBarra}
                className="mt-4 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Ir a cobrar a la Barra</span>
              </button>
            )}
          </div>
        ) : (
          displayedOrders.map(order => {
            const minutesAgo = Math.max(0, Math.floor((Date.now() - order.timestamp) / 60000));
            const isCourtesy = order.orderType === 'dj' || order.orderType === 'cortesia';
            const isReady = order.status === 'ready' || order.status === 'delivered';
            const totalDrinks = order.items.reduce((sum, item) => sum + item.quantity, 0);

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl border-2 shadow-2xs flex flex-col justify-between overflow-hidden transition-all ${
                  isReady
                    ? 'border-emerald-200 bg-emerald-50/20 opacity-80'
                    : 'border-orange-300 ring-2 ring-orange-400/20 shadow-md'
                }`}
              >
                {/* Ticket Top Header */}
                <div
                  className={`p-3.5 border-b flex items-center justify-between ${
                    isCourtesy
                      ? 'bg-purple-50/80 border-purple-200 text-purple-900'
                      : isReady
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-stone-50 border-stone-200 text-stone-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm tracking-tight">
                      #{order.id}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        isCourtesy
                          ? 'bg-purple-200 text-purple-900'
                          : order.paymentMethod === 'yape_plin'
                          ? 'bg-purple-100 text-purple-900'
                          : order.paymentMethod === 'tarjeta'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {isCourtesy
                        ? 'CORTESÍA DJ'
                        : order.paymentMethod === 'yape_plin'
                        ? '📱 YAPE'
                        : order.paymentMethod === 'tarjeta'
                        ? '💳 TARJETA'
                        : '💵 EFECTIVO'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-stone-500">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>{minutesAgo === 0 ? 'Ahora' : `${minutesAgo} min`}</span>
                  </div>
                </div>

                {/* Items to Prepare List */}
                <div className="p-4 flex-1 space-y-2.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 block">
                    Tragos a Preparar ({totalDrinks}):
                  </span>

                  {order.items.map((item, iIdx) => (
                    <div
                      key={iIdx}
                      className="p-2 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-xl bg-orange-600 text-white font-mono font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {item.quantity}x
                        </span>
                        <span className="font-extrabold text-xs sm:text-sm text-stone-900 truncate">
                          {item.cocktailName}
                        </span>
                      </div>
                    </div>
                  ))}

                  {order.notes && (
                    <p className="text-[11px] italic text-stone-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      📝 {order.notes}
                    </p>
                  )}
                </div>

                {/* Ticket Bottom Actions: Status Toggle & Print Ticket */}
                <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-2">
                  {onPrintOrder && (
                    <button
                      onClick={() => onPrintOrder(order)}
                      className="p-2 rounded-xl bg-white hover:bg-stone-100 text-stone-600 border border-stone-300 text-xs font-bold transition active:scale-95 cursor-pointer"
                      title="Imprimir ticket de comanda"
                    >
                      <Printer className="w-4 h-4 text-stone-600" />
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleStatus(order)}
                    className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                      isReady
                        ? 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/25'
                    }`}
                  >
                    {isReady ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Mover a Preparando</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>✓ Listo para Servir</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
