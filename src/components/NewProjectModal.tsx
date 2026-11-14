import React, { useState } from 'react';
import { BarEvent, Ingredient, Cocktail } from '../types/bar';
import { X, Flame, Sun, Calendar, Check, Sparkles, Boxes, AlertTriangle, HelpCircle } from 'lucide-react';
import { limaDate } from '../utils/operationContext';
import { HelpTutorialModal } from './HelpTutorialModal';

interface NewProjectModalProps {
  ingredients?: Ingredient[];
  cocktails?: Cocktail[];
  initialType?: 'dia' | 'evento';
  isOpen: boolean;
  onClose: () => void;
  onSaveEvent: (event: BarEvent) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  ingredients = [], cocktails = [], initialType = 'dia',
  isOpen,
  onClose,
  onSaveEvent,
}) => {
  const [name, setName] = useState('');
  const [projectType, setProjectType] = useState<'dia' | 'evento'>(initialType);
  const [date, setDate] = useState(limaDate());
  const [isConsignment, setIsConsignment] = useState(true);
  const [organizerName, setOrganizerName] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newEvent: BarEvent = {
      id: `ev-${Date.now()}`,
      name: name.trim(),
      operationType: projectType,
      recipeSnapshot: projectType === 'evento' ? cocktails.map(c=>({...c,recipe:c.recipe.map(r=>({...r}))})) : undefined,
      inventory: projectType === 'evento' ? ingredients.filter(i => quantities[i.id] > 0).map(ingredient => ({ ingredient: { ...ingredient }, receivedUnits: quantities[ingredient.id], openedUnits: 0 })) : [],
      date,
      status: 'active',
      createdAt: Date.now(),
      orders: [],
      wastes: [],
      initialIngredientsSnapshot: projectType === 'evento' ? { ...quantities } : Object.fromEntries(ingredients.map(i => [i.id, i.currentStockUnits])),
      isConsignment: projectType === 'evento' ? isConsignment : false,
      organizerName: projectType === 'evento' ? organizerName.trim() : undefined,
    };

    onSaveEvent(newEvent);
    setQuantities({});
    setName('');
    setOrganizerName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="w-full max-w-lg max-h-[92dvh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
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
                Abrir jornada o evento
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
              Nombre de la jornada o evento
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

          {projectType === 'evento' && (
            <div className="p-3.5 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-2.5 animate-fade-in text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-orange-950">
                  <Boxes className="w-4 h-4 text-orange-600" />
                  <span>Modalidad de Stock en Consignación</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(true)}
                  className="p-1 text-orange-700 hover:text-orange-900 transition cursor-pointer"
                  title="Ver regla de consignación"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="consignCheck"
                  checked={isConsignment}
                  onChange={e => setIsConsignment(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded border-stone-300 focus:ring-orange-500 cursor-pointer"
                />
                <label htmlFor="consignCheck" className="text-stone-700 font-bold cursor-pointer">
                  Stock entregado por Tercero / Promotor
                </label>
              </div>

              {isConsignment && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-stone-600 block">
                    Nombre del Organizador o Promotor
                  </label>
                  <input
                    type="text"
                    placeholder="ej: Productora Sunset / DJ Marco"
                    value={organizerName}
                    onChange={e => setOrganizerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-orange-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:border-orange-500"
                  />
                  <div className="p-2 rounded-lg bg-white/80 border border-amber-200/80 text-[10px] text-amber-900 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Regla de Barra:</strong> Botella abierta durante la fiesta no se devuelve y se factura al evento. Las botellas selladas al cierre se devuelven al promotor.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {projectType === 'evento' && <fieldset className="space-y-2">
            <legend className="text-sm font-extrabold">Insumos exclusivos de este evento</legend>
            <p className="text-xs text-stone-500">Registra lo que ingresa para esta fecha. No se sumará al inventario habitual del bar.</p>
            <div className="max-h-56 overflow-y-auto divide-y divide-stone-100 border border-stone-200 rounded-2xl">
              {ingredients.map(ingredient => <label key={ingredient.id} className="p-3 flex items-center gap-3 justify-between text-xs"><span className="font-bold">{ingredient.name}<small className="block text-stone-500 font-normal">{ingredient.unit} · S/ {ingredient.packageCost.toFixed(2)}</small></span><input aria-label={`Cantidad de ${ingredient.name}`} type="number" min="0" step={ingredient.unit.startsWith('botella') ? '1' : '0.01'} value={quantities[ingredient.id] || ''} onChange={e => setQuantities(previous => ({...previous,[ingredient.id]:Math.max(0,Number(e.target.value))}))} placeholder="0" className="w-20 min-h-12 rounded-xl border border-stone-200 px-3 font-mono text-right" /></label>)}
            </div>
          </fieldset>}

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
              Abrir registro
            </button>
          </div>
        </form>
      </div>

      <HelpTutorialModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        defaultTopic="consignacion"
      />
    </div>
  );
};
