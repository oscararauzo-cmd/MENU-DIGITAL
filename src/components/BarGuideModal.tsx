import React from 'react';
import {
  HelpCircle,
  X,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  CircleDollarSign,
  Boxes,
  Gift,
  Mic,
  ArrowRight,
} from 'lucide-react';

interface BarGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToBarra?: () => void;
}

export const BarGuideModal: React.FC<BarGuideModalProps> = ({
  isOpen,
  onClose,
  onGoToBarra,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-white text-stone-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200 max-h-[92vh]">
        {/* Header - Action button PINNED AT TOP (Zero scroll!) */}
        <div className="px-5 py-4 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-stone-900 tracking-tight">
                Guía Rápida: ¿Cómo funciona tu Bar?
              </h2>
              <p className="text-xs text-stone-500">
                Todo lo que necesitas saber si eres nueva en este rubro
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
              onClick={() => {
                onClose();
                if (onGoToBarra) onGoToBarra();
              }}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-sm shadow-orange-500/25 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <span>¡Entendido! Ir a la Barra</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Body: 3 Simple Phases Explained in Human Language */}
        <div className="p-5 overflow-y-auto space-y-4 bg-[#faf8f5]">
          {/* Phase 1: Antes del Evento */}
          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 font-extrabold text-xs flex items-center justify-center">
                1
              </span>
              <div>
                <h3 className="font-extrabold text-sm text-stone-900">
                  Antes de abrir la noche: Tu Bodega y tu Carta
                </h3>
                <span className="text-[11px] text-orange-600 font-bold">Pestaña: Bodega</span>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed pl-9">
              <strong>¿Qué haces?</strong> Revisas cuántas botellas de pisco, licores y latas tienes en stock.
            </p>
            <p className="text-xs text-stone-600 leading-relaxed pl-9">
              <strong>¿Por qué lo haces?</strong> Para asegurarte de que tienes suficientes insumos para la fiesta y evitar quedarte sin limones o pisco en plena hora punta.
            </p>
          </div>

          {/* Phase 2: Durante el Evento */}
          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 font-extrabold text-xs flex items-center justify-center">
                2
              </span>
              <div>
                <h3 className="font-extrabold text-sm text-stone-900">
                  Durante el evento: Cobro Rápido en la Barra
                </h3>
                <span className="text-[11px] text-orange-600 font-bold">Pestaña: Barra</span>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed pl-9">
              <strong>¿Qué haces?</strong> Llega un cliente a la barra. Tocas la foto del cóctel o tapa (ej: 2x Pisco Sour + 1x Sánguche) y tocas el botón naranja <strong>COBRAR</strong>.
            </p>
            <p className="text-xs text-stone-600 leading-relaxed pl-9">
              <strong>¿Por qué lo haces?</strong> Porque calcula el total de inmediato, te ahorra usar calculadora mental, y descuenta automáticamente los mililitros de licor para que nadie se lleve botellas sin registrar.
            </p>
            <div className="ml-9 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
              <Gift className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <strong>¿Y si viene el DJ, el dueño o un invitado especial?</strong>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Tocas <em>Cortesía DJ / Regalo</em>. El cobro saldrá en <strong>S/. 0.00</strong>, pero el licor sí se descuenta de la bodega para que tu conteo de botellas sea 100% exacto.
                </p>
              </div>
            </div>
          </div>

          {/* Phase 3: Al Cerrar la Noche */}
          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 font-extrabold text-xs flex items-center justify-center">
                3
              </span>
              <div>
                <h3 className="font-extrabold text-sm text-stone-900">
                  Al terminar la fiesta: Cuadre de Caja y Stock Remanente
                </h3>
                <span className="text-[11px] text-orange-600 font-bold">Pestaña: Caja & Cierre</span>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed pl-9">
              <strong>¿Qué haces?</strong> Ves el total de dinero recaudado y tu margen de ganancia limpia. Si usas máquina POS/SUNAT, ingresas el monto de tu ticket para verificar si la plata cuadrada al 100% o si hubo faltantes.
            </p>
            <p className="text-xs text-stone-600 leading-relaxed pl-9">
              <strong>¿Por qué lo haces?</strong> Descargas tu Excel con 1 clic y ves cuántas botellas enteras te quedaron para el siguiente fin de semana.
            </p>
          </div>

          {/* Secret Weapon: Asistente IA */}
          <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200 flex items-start gap-3 text-xs text-orange-950">
            <Mic className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-stone-900 text-sm">
                Asistente de Voz IA (Chaski)
              </h4>
              <p className="text-stone-600 mt-0.5 leading-relaxed">
                ¿Se te cayó una botella de pisco al piso durante la noche? No te compliques buscando tablas: toca el botón <strong>IA</strong> y di: <em>«Se rompieron 2 botellas de pisco»</em>. La IA registrará la merma y recalculará los costos por ti.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
