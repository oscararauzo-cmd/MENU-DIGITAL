import React, { useState } from 'react';
import { BarEvent } from '../types/bar';
import { X, Flame, Sun, Calendar, Check, Sparkles } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEvent: (event: BarEvent) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onSaveEvent,
}) => {
  const [name, setName] = useState('');
  const [projectType, setProjectType] = useState<'dia' | 'evento'>('dia');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newEvent: BarEvent = {
      id: `ev-${Date.now()}`,
      name: name.trim(),
      date,
      status: 'active',
      createdAt: Date.now(),
      orders: [],
      wastes: [],
      initialIngredientsSnapshot: {},
    };

    onSaveEvent(newEvent);
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-orange-600 tracking-wider">
                Gestión Fácil
              </span>
              <h3 className="text-base font-bold text-stone-900 leading-tight">
                Crear Nuevo Proyecto o Turno
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form: Ultra Intuitive, 2 Simple Fields! */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Situation selector */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1.5">
              ¿Para qué situación es?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProjectType('dia')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1 cursor-pointer transition ${
                  projectType === 'dia'
                    ? 'border-orange-500 bg-orange-50/70 text-orange-950 font-bold shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 text-stone-600'
                }`}
              >
                <Sun className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-bold">Día a Día (Hoy)</span>
                <span className="text-[10px] text-stone-400 font-normal">Servicio regular</span>
              </button>

              <button
                type="button"
                onClick={() => setProjectType('evento')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1 cursor-pointer transition ${
                  projectType === 'evento'
                    ? 'border-orange-500 bg-orange-50/70 text-orange-950 font-bold shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 text-stone-600'
                }`}
              >
                <Flame className="w-5 h-5 text-orange-600" />
                <span className="text-xs font-bold">Evento Especial</span>
                <span className="text-[10px] text-stone-400 font-normal">Fiesta o fecha puntual</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Nombre del Proyecto o Turno
            </label>
            <input
              type="text"
              required
              placeholder={projectType === 'dia' ? 'ej: Barra Tarde/Noche de Hoy' : 'ej: Fiesta Sunset de Sábado'}
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-orange-500"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">Fecha de Inicio</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-500 hover:text-stone-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
            >
              ✓ Iniciar Proyecto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
