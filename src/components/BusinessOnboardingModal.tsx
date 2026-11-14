import React, { useState } from 'react';
import {
  BusinessProfile,
  Cocktail,
} from '../types/bar';
import {
  Check,
  X,
  Upload,
  Sparkles,
  HelpCircle,
  Coins,
} from 'lucide-react';

interface BusinessOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessProfile: BusinessProfile;
  onSaveProfile: (profile: BusinessProfile) => void;
  cocktails: Cocktail[];
  setCocktails: React.Dispatch<React.SetStateAction<Cocktail[]>>;
  onOpenEventWizard: () => void;
  onOpenPublicMenu: () => void;
}

export const BusinessOnboardingModal: React.FC<BusinessOnboardingModalProps> = ({
  isOpen,
  onClose,
  businessProfile,
  onSaveProfile,
  onOpenPublicMenu,
}) => {
  if (!isOpen) return null;

  // Form State
  const [name, setName] = useState<string>(businessProfile.name || 'ALTURA');
  const [tagline, setTagline] = useState<string>(businessProfile.tagline || 'Andean Tapas Bar');
  const [logoUrl, setLogoUrl] = useState<string>(businessProfile.logoUrl || '/logo_altura.png');
  const [currencySymbol, setCurrencySymbol] = useState<string>(businessProfile.currencySymbol || 'S/.');

  // Preset Logos
  const presetLogos = [
    { label: 'ALTURA Oficial', url: '/logo_altura.png' },
    { label: 'Pisco Sour', url: '/assets/cocktails/pisco_sour.jpg' },
    { label: 'Tapas Gourmet', url: '/assets/food/tapas_trucha.jpg' },
    { label: 'Barra Sunset', url: '/assets/cocktails/chilcano.jpg' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      if (typeof event.target?.result === 'string') {
        setLogoUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updatedProfile: BusinessProfile = {
      ...businessProfile,
      name: name.trim() || 'Mi Bar',
      tagline: tagline.trim() || 'Bar & Tapas',
      logoUrl,
      currencySymbol,
      isConfigured: true,
    };
    onSaveProfile(updatedProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white text-stone-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200">
        {/* Header: Title + Action buttons PINNED AT THE TOP (Zero Scroll!) */}
        <div className="px-5 py-3.5 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-extrabold text-base text-stone-900 tracking-tight">
              Identidad de tu Bar
            </h2>
            <p className="text-[11px] text-stone-500">
              Personaliza el nombre y logo que verán tus clientes
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleSave()}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-sm shadow-orange-500/25 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Guardar</span>
            </button>
          </div>
        </div>

        {/* Friendly Beginner Explainer */}
        <div className="px-5 py-2.5 bg-orange-50/70 border-b border-orange-200/60 flex items-center gap-2.5 text-xs text-orange-950">
          <HelpCircle className="w-4 h-4 text-orange-600 shrink-0" />
          <span>
            <strong>¿Para qué sirve?</strong> Tu nombre y logo aparecerán en el encabezado de tu pantalla y en la carta QR que escanean los comensales.
          </span>
        </div>

        {/* Compact Form - Everything visible without scroll */}
        <form onSubmit={handleSave} className="p-5 space-y-4 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Nombre del Bar / Local
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="ej: ALTURA"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Subtítulo o Especialidad
              </label>
              <input
                type="text"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                placeholder="ej: Andean Tapas Bar"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Logo Selection Box */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800">
                Logotipo del Negocio
              </span>

              <label className="px-2.5 py-1 rounded-lg bg-white border border-stone-300 hover:border-orange-400 text-stone-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition">
                <Upload className="w-3 h-3 text-orange-600" />
                <span>Subir archivo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Selected Logo Preview & Quick Presets */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-20 bg-white border border-stone-300 rounded-xl flex items-center justify-center p-1 shadow-2xs shrink-0 overflow-hidden">
                <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {presetLogos.map(l => (
                  <button
                    key={l.label}
                    type="button"
                    onClick={() => setLogoUrl(l.url)}
                    className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                      logoUrl === l.url
                        ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Currency */}
          <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-orange-600" />
              <span>Símbolo de Moneda:</span>
            </span>

            <div className="flex items-center gap-1">
              {['S/.', '$', '€'].map(cur => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => setCurrencySymbol(cur)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                    currencySymbol === cur
                      ? 'bg-orange-600 text-white shadow-2xs'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
