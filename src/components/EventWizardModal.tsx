import { limaDate } from '../utils/operationContext';
import React, { useState } from 'react';
import { BarEvent, Ingredient, Cocktail } from '../types/bar';
import {
  Calendar,
  Check,
  X,
  HelpCircle,
  Boxes,
  Sparkles,
} from 'lucide-react';

interface EventWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: Ingredient[];
  cocktails: Cocktail[];
  setCocktails: React.Dispatch<React.SetStateAction<Cocktail[]>>;
  existingEvent?: BarEvent;
  onSaveEvent: (event: BarEvent) => void;
}

const EventWizardForm: React.FC<EventWizardModalProps> = ({
  isOpen,
  onClose,
  ingredients,
  existingEvent,
  onSaveEvent,
}) => {


  const [name, setName] = useState(existingEvent?.name || 'Sábado Sunset & DJ Sessions');
  const [date, setDate] = useState(existingEvent?.date || limaDate());

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;

    // Snapshot current ingredients
    const snapshot: Record<string, number> = {};
    for (const ing of ingredients) {
      snapshot[ing.id] = ing.currentStockUnits;
    }

    const savedEvent: BarEvent = {
      ...existingEvent,
      id: existingEvent?.id || `event-${Date.now()}`,
      name: name.trim(),
      date,
      status: existingEvent?.status || 'active',
      createdAt: existingEvent?.createdAt || Date.now(),
      orders: existingEvent?.orders || [],
      wastes: existingEvent?.wastes || [],
      initialIngredientsSnapshot: existingEvent?.initialIngredientsSnapshot || snapshot,
    };

    onSaveEvent(savedEvent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white text-stone-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200">
        {/* Header: Action buttons PINNED AT THE TOP (Zero Scroll!) */}
        <div className="px-5 py-3.5 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-extrabold text-base text-stone-900 tracking-tight">
              {existingEvent ? 'Configurar Evento' : 'Abrir Nuevo Evento'}
            </h2>
            <p className="text-[11px] text-stone-500">
              Inicia o edita la jornada de cobro de hoy
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleSubmit()}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-sm shadow-orange-500/25 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Guardar</span>
            </button>
          </div>
        </div>

        {/* Beginner Context Explainer */}
        <div className="px-5 py-2.5 bg-orange-50/70 border-b border-orange-200/60 flex items-center gap-2.5 text-xs text-orange-950">
          <HelpCircle className="w-4 h-4 text-orange-600 shrink-0" />
          <span>
            <strong>¿Por qué se crea un evento?</strong> Para agrupar las ventas y mermas de cada noche por separado, y saber exactamente cuánto dinero ganaste en la fecha.
          </span>
        </div>

        {/* Simple, Compact Form - 100% visible without any scrolling */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-white">
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Nombre de la Noche / Evento
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ej: Viernes Sunset Sessions, Noche de Pisco..."
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-orange-500"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Fecha del Evento
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Automatic Inventory Status */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center gap-2.5 text-xs text-stone-700">
            <Boxes className="w-4 h-4 text-orange-600 shrink-0" />
            <div>
              <p className="font-bold text-stone-900">Inventario Sincronizado</p>
              <p className="text-[11px] text-stone-500">
                Se vincularán automáticamente los <strong>{ingredients.length} insumos</strong> registrados en tu bodega.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export const EventWizardModal: React.FC<EventWizardModalProps> = props => props.isOpen ? <EventWizardForm {...props}/> : null;
