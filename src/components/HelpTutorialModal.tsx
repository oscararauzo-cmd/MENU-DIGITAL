import React, { useState } from 'react';
import {
  X,
  HelpCircle,
  Wine,
  Boxes,
  Flame,
  CircleDollarSign,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Scale,
} from 'lucide-react';

interface HelpTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTopic?: 'carta' | 'consignacion' | 'eventos' | 'caja' | 'barra';
}

export const HelpTutorialModal: React.FC<HelpTutorialModalProps> = ({
  isOpen,
  onClose,
  defaultTopic = 'consignacion',
}) => {
  const [activeTopic, setActiveTopic] = useState<'carta' | 'consignacion' | 'eventos' | 'caja' | 'barra'>(
    defaultTopic
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in font-sans select-none">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600/30 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-orange-400">
                Guía Rápida & Tutoriales
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                ¿Cómo funciona cada parte del sistema?
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50 overflow-x-auto shrink-0 px-3 pt-2 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTopic('consignacion')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTopic === 'consignacion'
                ? 'bg-white border-t-2 border-orange-600 text-orange-600 shadow-2xs font-extrabold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Consignación vs Bodega</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTopic('eventos')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTopic === 'eventos'
                ? 'bg-white border-t-2 border-orange-600 text-orange-600 shadow-2xs font-extrabold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Eventos con Terceros</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTopic('carta')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTopic === 'carta'
                ? 'bg-white border-t-2 border-orange-600 text-orange-600 shadow-2xs font-extrabold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Wine className="w-3.5 h-3.5" />
            <span>Carta & Costeo por ml</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTopic('caja')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTopic === 'caja'
                ? 'bg-white border-t-2 border-orange-600 text-orange-600 shadow-2xs font-extrabold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <CircleDollarSign className="w-3.5 h-3.5" />
            <span>Caja & Medios de Pago</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-stone-700 leading-relaxed flex-1">
          {activeTopic === 'consignacion' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-amber-950 text-sm">
                      La Regla de Oro de la Consignación
                    </h4>
                    <p className="text-amber-900 mt-1">
                      <strong>Botella abierta = Botella pagada.</strong> En la coctelería y eventos, toda botella descorchada o abierta durante la jornada no puede devolverse al proveedor ni al organizador tercero. Las botellas que permanezcan <strong>100% selladas</strong> se devuelven intactas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl border border-stone-200 bg-white">
                  <div className="flex items-center gap-2 text-stone-900 font-bold mb-1.5">
                    <Boxes className="w-4 h-4 text-orange-600" />
                    <span>Bodega Central (Stock del Mes)</span>
                  </div>
                  <p className="text-stone-500 text-[11px]">
                    Es el inventario propio del local. Aquí cargas las compras fijas del mes a proveedores. Este stock permanece en tu almacén y se usa en los turnos día a día.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-stone-200 bg-white">
                  <div className="flex items-center gap-2 text-stone-900 font-bold mb-1.5">
                    <Flame className="w-4 h-4 text-purple-600" />
                    <span>Stock por Evento / Consignación</span>
                  </div>
                  <p className="text-stone-500 text-[11px]">
                    Cuando un promotor tercero organiza una fiesta, trae sus propias botellas o se le asigna un cupo en consignación. El sistema toma una <strong>foto inicial</strong> y al cerrar calcula cuántas botellas se abrieron y cuántas se devuelven.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTopic === 'eventos' && (
            <div className="space-y-4 animate-fade-in">
              <h4 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-600" />
                <span>Ciclo de un Evento con Terceros (Paso a Paso)</span>
              </h4>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-lg bg-orange-600 text-white font-extrabold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <strong className="text-stone-900 block">Apertura del Evento:</strong>
                    <span className="text-stone-500 text-[11px]">
                      Creas el evento (ej: "Sábado Sunset con DJ Marco"), marcas si es en consignación y anotas las botellas iniciales entregadas en barra.
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-lg bg-orange-600 text-white font-extrabold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <strong className="text-stone-900 block">Operación de Barra en Vivo:</strong>
                    <span className="text-stone-500 text-[11px]">
                      Los bármanes registran las comandas. Cada trago descuenta los ml exactos de insumos. Si se rompe una botella o hay merma, se anota en el botón de Mermas.
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-extrabold flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div>
                    <strong className="text-stone-900 block">Cierre & Liquidación Transparente:</strong>
                    <span className="text-stone-500 text-[11px]">
                      Al terminar, el sistema genera la hoja de liquidación: muestra cuántas botellas se abrieron (a cobrar), cuántas selladas se devuelven y el reparto de utilidades entre el local y el promotor.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTopic === 'carta' && (
            <div className="space-y-3 animate-fade-in">
              <h4 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                <Wine className="w-4 h-4 text-orange-600" />
                <span>Cómo costear tus tragos por mililitros (ml)</span>
              </h4>

              <p className="text-stone-600">
                Cada cóctel tiene una receta vinculada a tus insumos de compras. Por ejemplo, si una botella de Pisco te cuesta S/. 38.00 y rinde 750 ml:
              </p>

              <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-200 font-mono text-[11px] space-y-1">
                <div>Costo por ml de Pisco: S/. 38.00 / 750 ml = <strong>S/. 0.051 por ml</strong></div>
                <div>Una copa lleva 60 ml de Pisco = <strong>S/. 3.04</strong></div>
                <div>Más 30 ml de limón fresco (S/. 0.42) = <strong>Costo total: S/. 3.46</strong></div>
                <div className="text-emerald-700 font-bold">Si lo vendes a S/. 32.00, tu margen limpio es del 89%!</div>
              </div>

              <p className="text-stone-500 text-[11px]">
                Puedes ajustar los ml de cada insumo en la pestaña <strong>"Carta, Precios & Recetas"</strong> y el sistema recalculará los márgenes al instante.
              </p>
            </div>
          )}

          {activeTopic === 'caja' && (
            <div className="space-y-3 animate-fade-in">
              <h4 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                <CircleDollarSign className="w-4 h-4 text-orange-600" />
                <span>Cuadre de Caja y Formas de Pago</span>
              </h4>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <strong className="text-stone-900 block font-bold">Yape / Plin / Tarjetas vs Efectivo:</strong>
                  <span className="text-stone-500 text-[11px]">
                    El sistema separa cada cobro por método de pago para que al final del turno verifiques lo que entró en tu cuenta de banco contra lo que hay en efectivo en el cajón.
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                  <strong className="text-purple-950 block font-bold">Cortesías y Consumo de DJs / Staff:</strong>
                  <span className="text-purple-900 text-[11px]">
                    Nunca regales tragos sin registrarlos. Si marcas el pedido como "Cortesía" o "DJ", el trago descuenta el stock de las botellas pero suma S/. 0 a la caja, permitiendo que tu inventario cuadre a la perfección.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-100 border-t border-stone-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-stone-500">
            Consejo: Puedes volver a abrir esta guía en cualquier momento desde el icono <strong>?</strong> del menú.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs cursor-pointer transition active:scale-95"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

