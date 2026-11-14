import React, { useEffect } from 'react';
import { Order, BusinessProfile } from '../types/bar';
import { Printer, X, ArrowRight } from 'lucide-react';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  businessProfile: BusinessProfile;
  autoPrintEnabled: boolean;
  onToggleAutoPrint: (enabled: boolean) => void;
  onGoToPreparacion?: () => void;
  paperWidth?: '80mm' | '58mm';
  stationName?: string;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  order,
  businessProfile,
  autoPrintEnabled,
  onToggleAutoPrint,
  onGoToPreparacion,
  paperWidth = '80mm',
  stationName = 'BARRA PRINCIPAL',
}) => {
  useEffect(() => {
    if (isOpen && autoPrintEnabled && order) {
      // Auto trigger print safely with small timeout to allow render
      const timer = setTimeout(() => {
        try {
          window.print();
        } catch (e) {
          console.error('Print error:', e);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrintEnabled, order]);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.error(e);
    }
  };

  const isCourtesy = order.orderType === 'dj' || order.orderType === 'cortesia';
  const orderTime = new Date(order.timestamp).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const orderDate = new Date(order.timestamp).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in font-sans">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200 max-h-[92vh]">
        {/* Header - Actions PINNED AT TOP (Zero scroll!) */}
        <div className="px-5 py-3.5 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-extrabold text-sm text-stone-900">
              Ticket de Comanda ({paperWidth})
            </h3>
            <span className="text-[11px] text-emerald-600 font-bold">
              ✓ Enviado a Barra / Preparación
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auto-print Toggle Switch Ribbon */}
        <div className="px-4 py-2 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs text-stone-700 shrink-0">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoPrintEnabled}
              onChange={e => onToggleAutoPrint(e.target.checked)}
              className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 accent-orange-600 cursor-pointer"
            />
            <span className="font-medium text-[11px]">
              Imprimir automáticamente al cobrar
            </span>
          </label>

          {onGoToPreparacion && (
            <button
              onClick={() => {
                onClose();
                onGoToPreparacion();
              }}
              className="text-orange-600 hover:text-orange-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Carrito</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Printable Thermal Receipt Container */}
        <div className="p-4 overflow-y-auto bg-stone-100/60 flex items-center justify-center">
          <div
            id="printable-ticket"
            className={`${
              paperWidth === '58mm' ? 'ticket-58mm max-w-[230px]' : 'max-w-[310px]'
            } w-full bg-white p-5 rounded-2xl border border-stone-300 shadow-sm text-stone-900 font-mono text-xs space-y-3 leading-tight`}
          >
            {/* Ticket Header */}
            <div className="text-center pb-2 border-b-2 border-dashed border-stone-300 space-y-1">
              <div className="text-[10px] font-black tracking-widest uppercase bg-stone-100 text-stone-800 py-0.5 px-2 rounded inline-block">
                {stationName || 'BARRA PRINCIPAL'}
              </div>
              <h2 className="font-black text-sm tracking-widest uppercase">
                {businessProfile.name}
              </h2>
              <p className="text-[10px] text-stone-500">
                {businessProfile.tagline || 'Barra & Eventos'}
              </p>
              <p className="text-[10px] text-stone-600">
                {orderDate} · {orderTime}
              </p>
              <div className="pt-1">
                <span className="inline-block px-2 py-0.5 rounded bg-black text-white text-[10px] font-bold tracking-wider">
                  COMANDA #{order.id}
                </span>
              </div>
            </div>

            {/* Preparation Order Type & Payment Method */}
            <div className="flex justify-between items-center text-[11px] py-1 border-b border-dashed border-stone-200">
              <span className="text-stone-500 font-bold uppercase">Pago:</span>
              <span className="font-extrabold text-stone-900 uppercase">
                {order.paymentMethod === 'yape_plin'
                  ? '📱 YAPE / PLIN'
                  : order.paymentMethod === 'tarjeta'
                  ? '💳 TARJETA / POS'
                  : order.paymentMethod === 'efectivo'
                  ? '💵 EFECTIVO'
                  : isCourtesy
                  ? '🎁 CORTESÍA DJ'
                  : 'VENTA BARRA'}
              </span>
            </div>

            {/* Items for Bartender Preparation */}
            <div className="py-2 space-y-2 border-b-2 border-dashed border-stone-300">
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Tragos a Preparar:
              </div>
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="font-black text-sm text-stone-950">
                      {item.quantity}x
                    </span>
                    <span className="font-bold text-xs text-stone-900">
                      {item.cocktailName}
                    </span>
                  </div>
                  <span className="text-stone-600 text-[11px] font-bold">
                    {isCourtesy ? 'S/. 0.00' : `S/. ${(item.unitPrice * item.quantity).toFixed(2)}`}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="pt-1 space-y-1">
              <div className="flex justify-between items-baseline font-black text-sm">
                <span>TOTAL:</span>
                <span>
                  {isCourtesy ? 'S/. 0.00 (Cort.)' : `S/. ${order.totalAmount.toFixed(2)}`}
                </span>
              </div>
              {order.notes && (
                <p className="text-[10px] italic text-stone-500 pt-1">
                  Nota: {order.notes}
                </p>
              )}
            </div>

            {/* Thermal Tear line */}
            <div className="text-center pt-3 text-[9px] text-stone-400 border-t border-dashed border-stone-300">
              *** ENVIADO AL CARRITO DE PREPARACIÓN ***
            </div>
          </div>
        </div>

        {/* Footer Quick Close */}
        <div className="p-3 bg-white border-t border-stone-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-stone-500">
            {order.items.reduce((sum, i) => sum + i.quantity, 0)} ítems en comanda
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white font-extrabold text-xs transition active:scale-95 cursor-pointer"
          >
            Siguiente Pedido →
          </button>
        </div>
      </div>
    </div>
  );
};
