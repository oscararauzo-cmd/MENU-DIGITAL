import React, { useState, useEffect } from 'react';
import { Lock, Unlock, KeyRound, AlertCircle, Check, X, ShieldCheck } from 'lucide-react';
import { BusinessProfile } from '../types/bar';

interface PinLockModalProps {
  purpose?: 'system'|'trash';
  isOpen: boolean;
  isChangeMode?: boolean;
  onClose?: () => void;
  businessProfile: BusinessProfile;
  onUnlock?: () => void;
  onSaveNewPin?: (newPin: string) => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  purpose = 'system',
  isOpen,
  isChangeMode = false,
  onClose,
  businessProfile,
  onUnlock,
  onSaveNewPin,
}) => {
  const currentPin = businessProfile.accessPin || '1234';
  const [pinInput, setPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setNewPinInput('');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  // Handle keyboard typing (0-9, Backspace, Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (!isChangeMode) {
          if (pinInput.length < 8) setPinInput(prev => prev + e.key);
        } else {
          if (newPinInput.length < 8) setNewPinInput(prev => prev + e.key);
        }
      } else if (e.key === 'Backspace') {
        if (!isChangeMode) {
          setPinInput(prev => prev.slice(0, -1));
        } else {
          setNewPinInput(prev => prev.slice(0, -1));
        }
      } else if (e.key === 'Enter') {
        if (!isChangeMode) {
          handleVerify();
        } else {
          handleChangePin();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pinInput, newPinInput, isChangeMode]);

  if (!isOpen) return null;

  const handleVerify = () => {
    if (pinInput === currentPin) {
      setErrorMsg(null);
      if (onUnlock) onUnlock();
    } else {
      setErrorMsg('PIN incorrecto. Intenta nuevamente.');
      setPinInput('');
    }
  };

  const handleChangePin = () => {
    if (newPinInput.length < 4) {
      setErrorMsg('El PIN debe tener al menos 4 dígitos.');
      return;
    }
    if (onSaveNewPin) {
      onSaveNewPin(newPinInput);
      setSuccessMsg('✓ Nuevo PIN guardado exitosamente.');
      setTimeout(() => {
        if (onClose) onClose();
      }, 1000);
    }
  };

  const handleNumberClick = (num: string) => {
    setErrorMsg(null);
    if (!isChangeMode) {
      if (pinInput.length < 8) setPinInput(prev => prev + num);
    } else {
      if (newPinInput.length < 8) setNewPinInput(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setErrorMsg(null);
    if (!isChangeMode) {
      setPinInput(prev => prev.slice(0, -1));
    } else {
      setNewPinInput(prev => prev.slice(0, -1));
    }
  };

  const activeValue = isChangeMode ? newPinInput : pinInput;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in font-sans select-none">
      <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-stone-100 flex flex-col items-center">
        {/* Top Header */}
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              {isChangeMode ? <KeyRound className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-stone-400">
              {purpose==='trash'?'Papelera protegida':isChangeMode ? 'Configurar Seguridad' : 'Control de Acceso'}
            </span>
          </div>

          {(isChangeMode||purpose==='trash') && onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-full text-stone-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Business Logo & Name */}
        <div className="text-center my-2">
          {businessProfile.logoUrl && (
            <img
              src={businessProfile.logoUrl}
              alt={businessProfile.name}
              className="h-10 mx-auto object-contain mb-2 brightness-95"
            />
          )}
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            {businessProfile.name || 'ALTURA BAR'}
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            {isChangeMode
              ? 'Ingresa el nuevo PIN de 4 dígitos para tu bar'
              : purpose==='trash'?'Ingresa el PIN del bar para recuperar jornadas o eventos':'Ingresa tu PIN de seguridad para acceder al sistema'}
          </p>
        </div>

        {/* PIN Dots Display */}
        <div className="my-5 flex items-center justify-center gap-3">
          {[0, 1, 2, 3].map(index => {
            const isFilled = activeValue.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                  isFilled
                    ? 'bg-orange-500 border-orange-400 scale-110 shadow-sm shadow-orange-500/50'
                    : 'border-stone-700 bg-stone-800/60'
                }`}
              />
            );
          })}
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="mb-3 px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 animate-shake">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Numeric Touch Keypad */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px] my-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleNumberClick(num)}
              className="h-14 rounded-2xl bg-stone-800/80 hover:bg-stone-700 active:bg-orange-600 active:text-white border border-stone-700/60 text-lg font-bold text-stone-100 transition duration-100 flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={() => {
              if (isChangeMode) setNewPinInput('');
              else setPinInput('');
              setErrorMsg(null);
            }}
            className="h-14 rounded-2xl bg-stone-800/40 hover:bg-stone-800 border border-stone-800 text-xs font-bold text-stone-400 hover:text-stone-200 transition duration-100 flex items-center justify-center cursor-pointer active:scale-95"
          >
            Limpiar
          </button>

          <button
            type="button"
            onClick={() => handleNumberClick('0')}
            className="h-14 rounded-2xl bg-stone-800/80 hover:bg-stone-700 active:bg-orange-600 active:text-white border border-stone-700/60 text-lg font-bold text-stone-100 transition duration-100 flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-stone-800/40 hover:bg-stone-800 border border-stone-800 text-xs font-bold text-stone-400 hover:text-stone-200 transition duration-100 flex items-center justify-center cursor-pointer active:scale-95"
          >
            Borrar
          </button>
        </div>

        {/* Main Action Button */}
        <div className="w-full mt-4">
          {!isChangeMode ? (
            <button
              onClick={handleVerify}
              disabled={pinInput.length < 1}
              className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:hover:bg-orange-600 text-white font-extrabold text-sm shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>{purpose==='trash'?'ENTRAR A PAPELERA':'DESBLOQUEAR SISTEMA'}</span>
            </button>
          ) : (
            <button
              onClick={handleChangePin}
              disabled={newPinInput.length < 4}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>GUARDAR NUEVO PIN</span>
            </button>
          )}
        </div>

        {/* Bottom Hint */}
        {!isChangeMode && purpose!=='trash' && (
          <p className="text-[11px] text-stone-500 text-center mt-3">
            (PIN por defecto:{' '}
            <span className="font-mono font-bold text-stone-400">1234</span>
            , configurable desde el menú de ajustes)
          </p>
        )}
      </div>
    </div>
  );
};

