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
  events?: BarEvent[];
  onSelectEvent?: (eventId: string) => void;
  businessProfile: BusinessProfile;
  preparingCount?: number;
  operationMode: OperationMode;
  onChangeOperationMode: (mode: OperationMode) => void;
  onOpenPublicMenu: () => void;
  onOpenNewProjectModal: () => void;
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
  events = [],
  onSelectEvent,
  businessProfile,
  preparingCount = 0,
  operationMode,
  onChangeOperationMode,
  onOpenPublicMenu,
  onOpenNewProjectModal,
  onOpenPrinterModal,
  onOpenAssistant,
  onOpenGuide,
  onOpenMenuExcel,
  onOpenOnboarding,
  onLockApp,
  onOpenChangePin,
}) => {
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsSettingsMenuOpen(false);
      }
      if (modeRef.current && !modeRef.current.contains(e.target as Node)) {
        setIsModeSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const modeLabels: Record<OperationMode, { label: string; icon: any }> = {
    dia: { label: `${activeEvent.operationType ? 'Día a día' : 'Registro'} · ${activeEvent.name}`, icon: Sun },
    mes: { label: 'Gestión Mensual', icon: Calendar },
    evento: { label: activeEvent.name || 'Evento Activo', icon: Flame },
  };

  const CurrentModeIcon = modeLabels[operationMode].icon;

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
            alt={businessProfile.name}
            className="h-6 w-auto object-contain"
          />
        </button>

        {/* Brand Name & Operation Mode Pill */}
        <div className="relative" ref={modeRef}>
          <button
            onClick={() => setIsModeSelectorOpen(prev => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-left transition cursor-pointer"
            title="Cambiar entre modo Día a Día, Mes o Eventos Especiales"
          >
            <CurrentModeIcon className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-extrabold text-stone-900 block truncate max-w-[60px] sm:max-w-[90px] lg:max-w-[160px] leading-tight">
                {currentView==='inicio'?'Operaciones':modeLabels[operationMode].label}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-stone-400 shrink-0 ml-0.5" />
          </button>

          {/* Mode Dropdown */}
          {isModeSelectorOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-stone-200 p-1.5 z-50 animate-fade-in font-sans">
              <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-stone-400 border-b border-stone-100">
                Situación de Operación
              </div>

              <button
                onClick={() => {
                  onChangeOperationMode('dia');
                  setIsModeSelectorOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                  operationMode === 'dia'
                    ? 'bg-orange-50 text-orange-700 font-extrabold'
                    : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="block">Día a Día (Hoy)</span>
                  <span className="text-[10px] font-normal text-stone-500">Operación continua regular del local</span>
                </div>
              </button>

              <button
                onClick={() => {
                  onChangeOperationMode('mes');
                  setIsModeSelectorOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                  operationMode === 'mes'
                    ? 'bg-orange-50 text-orange-700 font-extrabold'
                    : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Calendar className="w-4 h-4 text-blue-500" />
                <div>
                  <span className="block">Balance del Mes</span>
                  <span className="text-[10px] font-normal text-stone-500">Resumen mensual de ventas y gastos</span>
                </div>
              </button>

              <button
                onClick={() => {
                  onChangeOperationMode('evento');
                  setIsModeSelectorOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                  operationMode === 'evento'
                    ? 'bg-orange-50 text-orange-700 font-extrabold'
                    : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Flame className="w-4 h-4 text-orange-600" />
                <div className="min-w-0">
                  <span className="block truncate">Evento: {activeEvent.name}</span>
                  <span className="text-[10px] font-normal text-stone-500">Control por noche o fiesta</span>
                </div>
              </button>

              {events.length > 1 && onSelectEvent && (
                <div className="pt-1 mt-1 border-t border-stone-100 max-h-36 overflow-y-auto">
                  <div className="px-3 py-1 text-[9px] font-extrabold uppercase tracking-wider text-stone-400">
                    Tus Proyectos Guardados
                  </div>
                  {events.map(ev => (
                    <button
                      key={ev.id}
                      onClick={() => {
                        onSelectEvent(ev.id);
                        setIsModeSelectorOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 rounded-lg text-[11px] font-bold text-left truncate cursor-pointer ${
                        ev.id === activeEvent.id
                          ? 'bg-orange-100 text-orange-800'
                          : 'text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      • {ev.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="pt-1 mt-1 border-t border-stone-100">
                <button
                  onClick={() => {
                    setIsModeSelectorOpen(false);
                    onOpenNewProjectModal();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-600 hover:bg-orange-50 transition text-left cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Crear Nuevo Proyecto / Noche</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CENTER: THE 4 ESSENTIAL VIEWS (Reduced to only essential core functions) */}
      <nav className="order-3 lg:order-none w-full lg:w-auto flex items-center gap-0.5 sm:gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200 overflow-x-auto scrollbar-none">
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
          <span className="hidden sm:inline">Caja & Mes</span><span className="sm:hidden">Caja</span>
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
      </nav>

      {/* RIGHT: ONLY 2 CLEAN ACTIONS (Menú Digital + Menú Ajustes) */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* 1. Menú Digital QR (Directo, visible y hermoso) */}
        <button
          onClick={onOpenPublicMenu}
          className="px-2.5 lg:px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-2xs"
          title="Ver cómo ven los clientes la carta con QR"
        >
          <QrCode className="w-3.5 h-3.5 text-orange-600 shrink-0" />
          <span className="hidden lg:inline">Menú Digital</span>
        </button>

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
