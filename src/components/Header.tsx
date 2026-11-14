import React, { useState, useRef, useEffect } from 'react';
import { BarEvent, BusinessProfile } from '../types/bar';
import {
  ShoppingBag,
  CircleDollarSign,
  ChefHat,
  BookOpen,
  QrCode,
  Settings,
  Printer,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  PlusCircle,
  ChevronDown,
  Calendar,
  Sun,
  Flame,
  Lock,
  KeyRound,
} from 'lucide-react';

export type MainAppView = 'inicio' | 'resumen' | 'pdv' | 'carta_compras' | 'ventas' | 'preparacion';
export type OperationMode = 'dia' | 'mes' | 'evento';

interface HeaderProps {
  currentView: MainAppView;
  onChangeView: (view: MainAppView) => void;
  activeEvent: BarEvent;
  contextLabel?: string;
  businessProfile: BusinessProfile;
  preparingCount?: number;
  onOpenPublicMenu: () => void;
  onOpenPrinterModal: () => void;
  onOpenAssistant: () => void;
  onOpenGuide: () => void;
  onOpenMenuExcel: () => void;
  onOpenOnboarding: () => void;
  onLockApp?: () => void;
  onOpenChangePin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onChangeView,
  activeEvent,
  contextLabel,
  businessProfile,
  preparingCount = 0,
  onOpenPublicMenu,
  onOpenPrinterModal,
  onOpenAssistant,
  onOpenGuide,
  onOpenMenuExcel,
  onOpenOnboarding,
  onLockApp,
  onOpenChangePin,
}) => {
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsSettingsMenuOpen(false);
      }

    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="px-3 sm:px-5 py-2 flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 border-b border-stone-200 bg-white sticky top-0 z-30 select-none shadow-2xs font-sans shrink-0">
      {/* LEFT: Brand Logo + Operation Mode Selector (Día a Día / Mes / Evento) */}
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        <button
          onClick={() => onChangeView('inicio')}
          className="h-9 px-2 py-0.5 bg-white border border-stone-200 hover:border-orange-400 rounded-xl flex items-center justify-center shadow-2xs shrink-0 transition active:scale-95 cursor-pointer"
          title="Volver al inicio de operaciones"
        >
          <img
            src={businessProfile.logoUrl || '/logo_altura.png'}
            alt={`${businessProfile.name} - Inicio`}
            className="h-6 w-auto object-contain"
          /><span className="hidden sm:inline text-xs font-bold text-stone-500 ml-2">Inicio</span>
        </button>

        {currentView!=='inicio'&&(contextLabel==='Panorama general'?<span className="text-xs font-extrabold text-orange-800 px-3">Panorama general</span>:<button onClick={()=>onChangeView('resumen')} title="Ver resumen y configuracion" className="min-h-11 px-3 rounded-xl bg-orange-50 border border-orange-200 text-left"><span className="text-[9px] text-orange-700 font-extrabold uppercase block">{contextLabel}</span><span className="text-xs font-extrabold text-stone-900 block truncate max-w-[85px] sm:max-w-[150px] lg:max-w-[190px]">{activeEvent.name}</span></button>)}
      </div>

      {/* CENTER: THE 4 ESSENTIAL VIEWS (Reduced to only essential core functions) */}
      {currentView!=='inicio'&&contextLabel!=='Panorama general'&&<nav className="order-3 lg:order-none w-full lg:w-auto flex items-center gap-0.5 sm:gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200 overflow-x-auto scrollbar-none">
        <button
          onClick={() => onChangeView('pdv')}
          className={`min-h-11 flex-1 lg:flex-none px-1 sm:px-2.5 lg:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            currentView === 'pdv'
              ? 'bg-white text-orange-600 shadow-xs font-extrabold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
          <span>Barra</span>
        </button>

        <button
          onClick={() => onChangeView('carta_compras')}
          className={`min-h-11 flex-1 lg:flex-none px-1 sm:px-2.5 lg:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            currentView === 'carta_compras'
              ? 'bg-white text-orange-600 shadow-xs font-extrabold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
          title="Editar tragos, precios, recetas y compras de insumos"
        >
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Carta & Compras</span><span className="sm:hidden">Carta</span>
        </button>

        <button
          onClick={() => onChangeView('ventas')}
          className={`min-h-11 flex-1 lg:flex-none px-1 sm:px-2.5 lg:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            currentView === 'ventas'
              ? 'bg-white text-orange-600 shadow-xs font-extrabold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
          title="Ventas del día, arqueo de caja y balance del mes"
        >
          <CircleDollarSign className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Resultados</span><span className="sm:hidden">Caja</span>
        </button>

        <button
          onClick={() => onChangeView('preparacion')}
          className={`min-h-11 flex-1 lg:flex-none px-1 sm:px-2.5 lg:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer relative whitespace-nowrap ${
            currentView === 'preparacion'
              ? 'bg-white text-orange-600 shadow-xs font-extrabold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
          title="Estación de preparación de barra"
        >
          <ChefHat className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Preparación</span><span className="sm:hidden">Preparar</span>
          {preparingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-orange-600 text-white font-mono text-[10px] font-black shrink-0">
              {preparingCount}
            </span>
          )}
        </button>
      </nav>}

      {/* RIGHT: ONLY 2 CLEAN ACTIONS (Menú Digital + Menú Ajustes) */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* 1. Menú Digital QR (Directo, visible y hermoso) */}
        {currentView!=='inicio'&&contextLabel!=='Panorama general'&&(<button
          onClick={onOpenPublicMenu}
          className="px-2.5 lg:px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-2xs"
          title="Ver cómo ven los clientes la carta con QR"
        >
          <QrCode className="w-3.5 h-3.5 text-orange-600 shrink-0" />
          <span className="hidden lg:inline">Menú Digital</span>
        </button>)}

        {/* Botón de Bloqueo Rápido */}
        {onLockApp && (
          <button
            onClick={onLockApp}
            className="p-2 rounded-xl bg-white hover:bg-amber-50 border border-stone-200 hover:border-amber-400 text-stone-600 hover:text-amber-700 shadow-2xs transition active:scale-95 cursor-pointer"
            title="Bloquear pantalla con PIN"
          >
            <Lock className="w-4 h-4" />
          </button>
        )}

        {/* 2. Menú de Ajustes y Herramientas (Agrupa todo lo secundario sin contaminar la barra) */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsSettingsMenuOpen(prev => !prev)}
            className="p-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 shadow-2xs transition active:scale-95 cursor-pointer"
            title="Herramientas y configuración"
          >
            <Settings className="w-4 h-4 text-stone-600" />
          </button>

          {isSettingsMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 p-1.5 z-50 animate-fade-in font-sans text-xs">
              <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-stone-400 border-b border-stone-100">
                Herramientas
              </div>

              <button
                onClick={() => {
                  setIsSettingsMenuOpen(false);
                  onOpenPrinterModal();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-50 font-bold transition cursor-pointer text-left"
              >
                <Printer className="w-4 h-4 text-stone-500" />
                <span>Impresora POS-D 230</span>
              </button>

              <button
                onClick={() => {
                  setIsSettingsMenuOpen(false);
                  onOpenAssistant();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-50 font-bold transition cursor-pointer text-left"
              >
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span>Asistente Inteligente</span>
              </button>

              <button
                onClick={() => {
                  setIsSettingsMenuOpen(false);
                  onOpenMenuExcel();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-50 font-bold transition cursor-pointer text-left"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Plantilla Excel Menú</span>
              </button>

              <button
                onClick={() => {
                  setIsSettingsMenuOpen(false);
                  onOpenGuide();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-50 font-bold transition cursor-pointer text-left"
              >
                <HelpCircle className="w-4 h-4 text-amber-500" />
                <span>Guía Paso a Paso</span>
              </button>

              <div className="pt-1 mt-1 border-t border-stone-100">
                <button
                  onClick={() => {
                    setIsSettingsMenuOpen(false);
                    onOpenOnboarding();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-50 font-bold transition cursor-pointer text-left"
                >
                  <Settings className="w-4 h-4 text-stone-400" />
                  <span>Configuración del Local</span>
                </button>

                {onOpenChangePin && (
                  <button
                    onClick={() => {
                      setIsSettingsMenuOpen(false);
                      onOpenChangePin();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-50 font-bold transition cursor-pointer text-left"
                  >
                    <KeyRound className="w-4 h-4 text-orange-500" />
                    <span>Cambiar PIN / Contraseña</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
