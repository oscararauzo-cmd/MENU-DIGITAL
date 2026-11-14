import React from 'react';
import { BusinessProfile, BarEvent } from '../types/bar';
import {
  Sparkles,
  Zap,
  ShoppingBag,
  CircleDollarSign,
  UtensilsCrossed,
  FileSpreadsheet,
  ChefHat,
  Boxes,
  Bot,
  QrCode,
  Calendar,
  X,
  Sliders,
  Flame,
} from 'lucide-react';

export type ActiveNavTab =
  | 'pdv'
  | 'ventas'
  | 'menu'
  | 'olaclick_excel'
  | 'cocina'
  | 'inventario'
  | 'asistente_ia';

interface OlaClickSidebarProps {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  businessProfile: BusinessProfile;
  activeEvent: BarEvent;
  onOpenOnboarding: () => void;
  onOpenPublicMenu: () => void;
  onOpenEventConfig: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  pendingOrdersCount?: number;
}

export const OlaClickSidebar: React.FC<OlaClickSidebarProps> = ({
  activeTab,
  setActiveTab,
  businessProfile,
  activeEvent,
  onOpenOnboarding,
  onOpenPublicMenu,
  onOpenEventConfig,
  isOpenMobile,
  onCloseMobile,
  pendingOrdersCount = 0,
}) => {
  // Navigation items for our proprietary, clean, all-white system
  const navItems = [
    {
      id: 'pdv' as ActiveNavTab,
      label: 'Barra de Pedidos',
      icon: ShoppingBag,
      badge: 'Caja Rápida',
    },
    {
      id: 'ventas' as ActiveNavTab,
      label: 'Ventas & Arqueo',
      icon: CircleDollarSign,
      subItems: ['Historial de pedidos', 'Cuadre de caja', 'Match SUNAT'],
    },
    {
      id: 'menu' as ActiveNavTab,
      label: 'Carta & Precios',
      icon: UtensilsCrossed,
      subItems: ['Cócteles', 'Tapas & Sándwiches', 'Variantes'],
    },
    {
      id: 'olaclick_excel' as ActiveNavTab,
      label: 'Plantilla de Menú Excel',
      icon: FileSpreadsheet,
      badge: '.XLSX',
      highlight: true,
    },
    {
      id: 'cocina' as ActiveNavTab,
      label: 'Cocina & Despacho (KDS)',
      icon: ChefHat,
      countBadge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
    },
    {
      id: 'inventario' as ActiveNavTab,
      label: 'Inventario & Bodega',
      icon: Boxes,
      subItems: ['Stock Remanente', 'Mermas y Roturas', 'Insumos'],
    },
    {
      id: 'asistente_ia' as ActiveNavTab,
      label: 'Asistente IA (Gemini)',
      icon: Bot,
      badge: 'Voz & Texto',
    },
  ];

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Clean, All-White ("Blanquito") Proprietary Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white text-stone-900 border-r border-stone-200/90 flex flex-col justify-between shadow-xl lg:shadow-none transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Brand Header & Onboarding Checklist */}
        <div className="p-4 sm:p-5 flex flex-col gap-3.5 border-b border-stone-100">
          {/* Brand Logo & Name */}
          <div className="flex items-center justify-between">
            <button
              onClick={onOpenOnboarding}
              className="flex items-center gap-2.5 group cursor-pointer text-left min-w-0"
              title="Configurar perfil de tu bar"
            >
              <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 p-1.5 flex items-center justify-center shadow-2xs shrink-0 group-hover:border-orange-400 transition">
                <img
                  src={businessProfile.logoUrl || '/logo_altura.png'}
                  alt={businessProfile.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-stone-900 group-hover:text-orange-600 transition truncate">
                    {businessProfile.name || 'ALTURA'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-100 text-orange-800 font-bold uppercase font-mono shrink-0">
                    B2B
                  </span>
                </div>
                <span className="text-[11px] text-stone-500 font-medium block truncate leading-tight">
                  {businessProfile.tagline || 'Andean Tapas Bar'}
                </span>
              </div>
            </button>

            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 lg:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Setup Progress: Clean, light card */}
          <div
            onClick={onOpenOnboarding}
            className="p-3 rounded-2xl bg-stone-50 hover:bg-orange-50/60 border border-stone-200/80 hover:border-orange-300 transition cursor-pointer shadow-2xs group"
            title="Toca para completar o editar la configuración de tu bar"
          >
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <div className="flex items-center gap-1.5 text-stone-800 group-hover:text-orange-700 transition">
                <Zap className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                <span>Configuración de Marca</span>
              </div>
              <span className="text-[11px] font-mono text-orange-600 font-extrabold">
                4/6 Pasos
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500 w-[66%]" />
            </div>

            <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1.5">
              <span className="group-hover:text-stone-700 transition">Logo, carta y stock vinculados</span>
              <span className="text-orange-600 font-bold group-hover:translate-x-0.5 transition">Editar ›</span>
            </div>
          </div>

          {/* Active Event Badge */}
          <div
            onClick={onOpenEventConfig}
            className="px-3 py-2 rounded-xl bg-orange-50/70 hover:bg-orange-100/80 border border-orange-200/80 flex items-center justify-between text-xs cursor-pointer transition"
            title="Ver o editar el evento activo"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] text-orange-700 font-bold uppercase tracking-wider block leading-none">
                  Evento en Curso
                </span>
                <span className="font-bold text-stone-900 truncate block max-w-[150px] leading-tight">
                  {activeEvent.name}
                </span>
              </div>
            </div>
            <Sliders className="w-3.5 h-3.5 text-orange-600 shrink-0" />
          </div>
        </div>

        {/* Center: Main Navigation List in Pure Clean White */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-none font-sans text-xs">
          {navItems.map(item => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;

            return (
              <div key={item.id} className="space-y-0.5">
                <button
                  onClick={() => {
                    setActiveTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl font-bold transition flex items-center justify-between text-left cursor-pointer ${
                    isSelected
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20 font-extrabold'
                      : item.highlight
                      ? 'bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200'
                      : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isSelected
                          ? 'text-white'
                          : item.highlight
                          ? 'text-orange-600'
                          : 'text-stone-500'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.countBadge && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-mono font-bold text-[10px]">
                      {item.countBadge}
                    </span>
                  )}

                  {item.badge && (
                    <span
                      className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-extrabold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : item.highlight
                          ? 'bg-orange-600 text-white'
                          : 'bg-stone-200/80 text-stone-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>

                {/* Sub-items preview for selected tab */}
                {isSelected && item.subItems && (
                  <div className="pl-8 pr-2 py-1 space-y-1">
                    {item.subItems.map((sub, sIdx) => (
                      <div
                        key={sIdx}
                        className="text-[11px] text-orange-900/80 flex items-center gap-1.5 py-0.5"
                      >
                        <span className="w-1 h-1 rounded-full bg-orange-400" />
                        <span>{sub}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Card: Carta Digital Activa (Light & Crisp) */}
        <div className="p-3 bg-stone-50 border-t border-stone-200/80 shrink-0">
          <button
            onClick={onOpenPublicMenu}
            className="w-full p-3 rounded-2xl bg-white border border-stone-200 hover:border-orange-300 text-stone-900 shadow-2xs flex items-center justify-between hover:bg-orange-50/50 transition cursor-pointer group text-left"
            title="Ver cómo ven tus clientes la carta digital en sus celulares con código QR"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-xs text-stone-900 group-hover:text-orange-600 transition block leading-tight truncate">
                  Carta Digital: Activa
                </span>
                <span className="text-[10px] text-stone-500 block leading-tight truncate">
                  Cierra 23:59 · Ver QR
                </span>
              </div>
            </div>

            <QrCode className="w-4 h-4 text-orange-600 group-hover:scale-110 transition shrink-0" />
          </button>
        </div>
      </aside>
    </>
  );
};
