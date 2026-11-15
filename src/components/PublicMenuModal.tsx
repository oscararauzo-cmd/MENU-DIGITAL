import { publicMenuHtml } from '../utils/publicMenu';
import React, { useState, useMemo } from 'react';
import { BusinessProfile, Cocktail } from '../types/bar';
import {
  X,
  Sparkles,
  QrCode,
  Download,
  SlidersHorizontal,
  Flame,
  Check,
  ChevronRight,
  Store,
} from 'lucide-react';

interface PublicMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessProfile: BusinessProfile;
  cocktails: Cocktail[];
  onOpenEditProfile: () => void;
}

export const PublicMenuModal: React.FC<PublicMenuModalProps> = ({
  isOpen,
  onClose,
  businessProfile,
  cocktails,
  onOpenEditProfile,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState(false);

  const activeCategories = useMemo(() => {
    return businessProfile.categories.filter(c => c.enabled);
  }, [businessProfile.categories]);

  const activeCocktails = useMemo(() => {
    return cocktails
      .filter(c => c.enabledForEvent)
      .filter(c => {
        if (selectedCategory === 'all') return true;
        return c.category === selectedCategory;
      });
  }, [cocktails, selectedCategory]);

  if (!isOpen) return null;

  const handleDownloadMenu = () => {
    const html=publicMenuHtml(businessProfile,cocktails,window.location.href);
    const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='Carta_clientes.html';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);setCopiedLink(true);setTimeout(()=>setCopiedLink(false),2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in overflow-y-auto">
      {/* Digital Menu Tablet / Phone Mockup Container */}
      <div className="w-full max-w-2xl bg-[#0f0e0d] text-stone-100 rounded-3xl shadow-2xl flex flex-col overflow-hidden border-2 border-stone-800 my-auto max-h-[95vh]">
        {/* Top Control Bar for Owner */}
        <div className="px-4 py-2.5 bg-stone-900 border-b border-stone-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold text-stone-300 font-mono">
              Vista previa de carta para clientes
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadMenu}
              className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Download className="w-3 h-3" />}
              <span>{copiedLink ? 'Carta descargada' : 'Descargar carta'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenEditProfile();
              }}
              className="px-2.5 py-1 rounded-lg bg-orange-600/30 hover:bg-orange-600/50 text-orange-400 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <Store className="w-3 h-3" />
              <span>Editar Marca</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Public Menu Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Hero Header with Brand Logo & Identity */}
          <div className="text-center space-y-3 py-4 border-b border-stone-800">
            <div className="w-24 h-16 mx-auto bg-white/5 border border-stone-700 rounded-2xl flex items-center justify-center p-2 shadow-inner overflow-hidden">
              <img
                src={businessProfile.logoUrl || '/logo_altura.png'}
                alt={businessProfile.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div>
              <h1 className="font-sans font-black text-2xl sm:text-3xl tracking-wider text-white">
                {businessProfile.name}
              </h1>
              <p className="text-xs uppercase tracking-widest text-orange-400 font-bold font-mono mt-0.5">
                {businessProfile.tagline || 'Andean Tapas Bar'}
              </p>
            </div>

            <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
              Bienvenidos a nuestra experiencia de coctelería y gastronomía andina de autor. Todos los precios incluyen impuestos de ley.
            </p>
          </div>

          {/* Category Filter Pills (Public Menu) */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            {activeCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Menu Items List (Visual, Appetizing, High-end) */}
          <div className="space-y-4">
            {activeCocktails.map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 flex gap-4 items-center hover:border-orange-500/50 transition group"
              >
                {/* Photo */}
                <div className="w-20 sm:w-24 aspect-square rounded-xl overflow-hidden bg-stone-950 shrink-0 border border-stone-800">
                  <img
                    src={item.imageUrl || '/assets/cocktails/pisco_sour.jpg'}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-sans font-bold text-sm sm:text-base text-stone-100 group-hover:text-orange-400 transition truncate">
                      {item.name}
                    </h3>

                    <span className="font-mono font-black text-sm sm:text-base text-amber-400 shrink-0">
                      {businessProfile.currencySymbol} {item.price.toFixed(2)}
                    </span>
                  </div>

                  <p className="text-xs text-stone-400 line-clamp-2 mt-1 leading-relaxed">
                    {item.description}
                  </p>

                  {item.category === 'tapas_comida' && (
                    <span className="inline-block mt-1.5 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-orange-950/80 text-orange-300 border border-orange-800">
                      Tapa de Autor
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Public Footer */}
          <div className="pt-6 border-t border-stone-800 text-center space-y-2">
            <p className="text-[11px] text-stone-500 font-sans">
              {businessProfile.name} · Carta Digital Oficial
            </p>
            <p className="text-[10px] text-stone-600 font-mono">
              Consumo responsable · Solo para mayores de 18 años
            </p>
          </div>
        </div>

        {/* Modal Bottom Return Button */}
        <div className="p-3.5 bg-stone-900 border-t border-stone-800 flex items-center justify-between">
          <span className="text-xs text-stone-400">
            {activeCocktails.length} ítems disponibles hoy
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-sans font-bold text-xs uppercase tracking-wider shadow-sm transition active:scale-95 cursor-pointer"
          >
            Volver a la Barra de Pedidos
          </button>
        </div>
      </div>
    </div>
  );
};
