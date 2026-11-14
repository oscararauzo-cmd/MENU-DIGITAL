import React from 'react';
import {
  Printer,
  X,
  Wifi,
  Cable,
  CheckCircle2,
  Sparkles,
  Play,
  Layers,
  Ruler,
  MapPin,
} from 'lucide-react';
import { BusinessProfile } from '../types/bar';

interface PosDPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessProfile: BusinessProfile;
  autoPrintEnabled: boolean;
  onToggleAutoPrint: (enabled: boolean) => void;
  paperWidth: '80mm' | '58mm';
  onChangePaperWidth: (width: '80mm' | '58mm') => void;
  stationName: string;
  onChangeStationName: (name: string) => void;
  onTestPrint: () => void;
}

export const PosDPrinterModal: React.FC<PosDPrinterModalProps> = ({
  isOpen,
  onClose,
  autoPrintEnabled,
  onToggleAutoPrint,
  paperWidth,
  onChangePaperWidth,
  stationName,
  onChangeStationName,
  onTestPrint,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in font-sans">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200 max-h-[92vh]">
        {/* Header - Pinned Actions at Top (Zero scroll!) */}
        <div className="px-5 py-4 bg-white border-b border-stone-200 flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-sm sm:text-base text-stone-900 tracking-tight truncate">
                  Impresora POS-D Basic 230
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold font-mono shrink-0">
                  {paperWidth} · Térmica
                </span>
              </div>
              <p className="text-xs text-stone-500 truncate">
                Ajustes de ticket y conexión rápida desde tu iPad hacia Barra
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onTestPrint}
              className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              title="Manda un ticket de prueba al diálogo de impresión"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Probar Impresión</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Printer Settings Strip */}
        <div className="px-5 py-3 bg-orange-50/80 border-b border-orange-200/60 space-y-2.5 text-xs text-orange-950 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
              <span className="font-bold text-stone-900">
                Impresión Automática al Cobrar:
              </span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoPrintEnabled}
                onChange={e => onToggleAutoPrint(e.target.checked)}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 accent-orange-600 cursor-pointer"
              />
              <span className="font-bold text-xs text-orange-900">
                {autoPrintEnabled ? '✓ Activado (sale el ticket al cobrar)' : 'Manual (botón Imprimir)'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-orange-200/50">
            <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-orange-200/70">
              <span className="font-bold text-stone-700 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-orange-600" />
                <span>Ancho Papel:</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onChangePaperWidth('80mm')}
                  className={`px-2 py-0.5 rounded-lg font-mono font-bold text-[11px] cursor-pointer transition ${
                    paperWidth === '80mm'
                      ? 'bg-orange-600 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  80mm
                </button>
                <button
                  type="button"
                  onClick={() => onChangePaperWidth('58mm')}
                  className={`px-2 py-0.5 rounded-lg font-mono font-bold text-[11px] cursor-pointer transition ${
                    paperWidth === '58mm'
                      ? 'bg-orange-600 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  58mm
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-orange-200/70">
              <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <input
                type="text"
                value={stationName}
                onChange={e => onChangeStationName(e.target.value)}
                placeholder="Ej: BARRA PRINCIPAL"
                className="w-full text-xs font-bold text-stone-800 uppercase bg-transparent focus:outline-none"
                title="Nombre de la estación que aparece arriba en el ticket"
              />
            </div>
          </div>
        </div>

        {/* Content Body: Direct & Actionable Setup Guide */}
        <div className="p-5 overflow-y-auto space-y-4 bg-[#faf8f5]">
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 leading-relaxed">
              <p className="font-extrabold text-emerald-900">
                Flujo recomendado en vivo (Sábado / Evento)
              </p>
              <p className="text-emerald-800 mt-0.5">
                Cuando caja cobra un trago, el pedido entra <strong>automáticamente</strong> a la pantalla <strong>Prep</strong> del bartender y abre el ticket térmico de {paperWidth} listo para la <strong>POS-D Basic 230</strong>.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500">
              Cómo conectar el iPad con la POS-D Basic 230 (Elige 1 opción):
            </h3>

            {/* Option 1 */}
            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-stone-900">
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h4 className="font-extrabold text-sm flex items-center gap-1.5">
                  <Wifi className="w-4 h-4 text-orange-600" />
                  <span>Opción A (La mejor en barras): Cable LAN al Router WiFi</span>
                </h4>
              </div>

              <ol className="list-decimal pl-9 space-y-1 text-xs text-stone-600 leading-relaxed">
                <li>
                  Conecta la <strong>POS-D Basic 230</strong> con cable de red (RJ45) al router WiFi de la barra.
                </li>
                <li>
                  Conecta el <strong>iPad</strong> al mismo WiFi. En Safari/Chrome al dar clic en <strong>Probar Impresión</strong>, selecciona la impresora en red (vía AirPrint / PrintBridge) y el ticket sale con corte automático.
                </li>
              </ol>
            </div>

            {/* Option 2 */}
            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-stone-900">
                <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h4 className="font-extrabold text-sm flex items-center gap-1.5">
                  <Cable className="w-4 h-4 text-stone-600" />
                  <span>Opción B: Cable USB conectado a una Laptop en Barra</span>
                </h4>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed pl-9">
                Conecta la POS-D por USB a una laptop/PC en caja, activa <strong>«Compartir impresora en red»</strong> (o abre esta misma web directo en esa laptop en Hostinger) y cada cobro imprimirá en 1 clic.
              </p>
            </div>

            {/* Option 3 */}
            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-stone-900">
                <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h4 className="font-extrabold text-sm flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-stone-600" />
                  <span>Opción C: Sin impresora usando 2 pantallas (Caja + Prep)</span>
                </h4>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed pl-9">
                Si en algún evento no tienes la impresora conectada, abre la web en el celular del bartender en la pestaña <strong>Prep</strong>: cada pedido pagado aparece al instante para marcarlo como Listo.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-stone-500 font-medium">
            Formato: {paperWidth} térmico · Alto contraste
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white font-extrabold text-xs transition active:scale-95 cursor-pointer"
          >
            Guardar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
