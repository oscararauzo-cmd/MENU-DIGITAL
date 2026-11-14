import React, { useState } from 'react';
import { BarEvent, Ingredient } from '../types/bar';
import { Calendar, Sparkles, X } from 'lucide-react';

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: Ingredient[];
  onCreateEvent: (newEvent: BarEvent) => void;
}

export const NewEventModal: React.FC<NewEventModalProps> = ({
  isOpen,
  onClose,
  ingredients,
  onCreateEvent,
}) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Snapshot initial stock for this event
    const snapshot: Record<string, number> = {};
    for (const ing of ingredients) {
      snapshot[ing.id] = ing.currentStockUnits;
    }

    const newEvent: BarEvent = {
      id: `event-${Date.now()}`,
      name: name.trim(),
      date,
      status: 'active',
      createdAt: Date.now(),
      orders: [],
      wastes: [],
      initialIngredientsSnapshot: snapshot,
    };

    onCreateEvent(newEvent);
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white border-2 border-orange-200 rounded-3xl p-6 shadow-2xl relative text-stone-900">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-9 h-9 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="font-sans text-base font-bold text-stone-900">
            Abrir Nuevo Evento de Barra
          </h3>
        </div>
        <p className="text-xs text-stone-500 mb-4">
          Inicia un nuevo conteo de pedidos de hoy, congelando el stock inicial de partida.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Nombre del Evento
            </label>
            <input
              type="text"
              required
              placeholder="ej: Sábado Sunset Sessions con DJ Marco"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border-2 border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:border-orange-500"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Fecha
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border-2 border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="p-3 rounded-2xl bg-orange-50 border border-orange-200 text-xs text-orange-900">
            <p>
              ⚡ <strong>Stock inicial sincronizado:</strong> Este evento partirá con los <strong>{ingredients.length} insumos</strong> actualmente registrados en tu bodega.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-500 hover:text-stone-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold font-sans uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/20 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Abrir Evento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
