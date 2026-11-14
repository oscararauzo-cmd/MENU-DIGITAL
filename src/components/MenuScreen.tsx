import React, { useState, useMemo, useRef } from 'react';
import { Cocktail, Order, OrderType, Ingredient, PaymentMethod, BusinessProfile } from '../types/bar';
import { isSupabaseConfigured } from '../lib/supabase';
import { calculateCocktailUnitCost } from '../utils/calculations';
import {
  X,
  Minus,
  Plus,
  Receipt,
  Trash2,
  CreditCard,
  Gift,
  Sparkles,
  Smartphone,
  Coins,
  ChevronUp,
  Edit3,
} from 'lucide-react';

interface MenuScreenProps {
  cocktails: Cocktail[];
  ingredients: Ingredient[];
  businessProfile: BusinessProfile;
  onAddOrder: (order: Order) => void;
  onGoToCartaCompras?: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  cocktails,
  ingredients,
  businessProfile,
  onAddOrder,
  onGoToCartaCompras,
}) => {
  const submitting = useRef(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orderNote, setOrderNote] = useState<string>('');
  const [lastNotification, setLastNotification] = useState<string | null>(null);

  // Desktop/Tablet right panel collapse state
  const [isComandaCollapsed, setIsComandaCollapsed] = useState<boolean>(false);
  // Compact screen (< 768px) or collapsed pop-up sheet state
  const [isMobilePopupOpen, setIsMobilePopupOpen] = useState<boolean>(false);

  // Compute unit costs
  const unitCosts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of cocktails) {
      map.set(c.id, calculateCocktailUnitCost(c, ingredients));
    }
    return map;
  }, [cocktails, ingredients]);

  const categories = useMemo(() => {
    const profileCats = businessProfile.categories.filter(c => c.enabled);
    if (profileCats.length > 0) return profileCats;
    return [
      { id: 'all', label: 'Todos', enabled: true },
      { id: 'tapas_comida', label: '🥪 Tapas & Comida', enabled: true },
      { id: 'pisco', label: 'Piscos & Sours', enabled: true },
      { id: 'autor', label: 'De Autor', enabled: true },
      { id: 'clasico', label: 'Clásicos', enabled: true },
      { id: 'cerveza_sin_alcohol', label: 'Cervezas', enabled: true },
    ];
  }, [businessProfile.categories]);

  const activeCocktails = useMemo(() => {
    return cocktails.filter(c => c.enabledForEvent);
  }, [cocktails]);

  const filteredCocktails = useMemo(() => {
    return activeCocktails.filter(c => {
      if (selectedCategory === 'all') return true;
      return c.category === selectedCategory;
    });
  }, [activeCocktails, selectedCategory]);

  const handleAddDrink = (cocktailId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCart(prev => ({
      ...prev,
      [cocktailId]: (prev[cocktailId] || 0) + 1,
    }));
  };

  const handleDecrement = (cocktailId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCart(prev => {
      const current = prev[cocktailId] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[cocktailId];
        return next;
      }
      return {
        ...prev,
        [cocktailId]: current - 1,
      };
    });
  };

  const handleClearCart = () => {
    setCart({});
    setOrderNote('');
    setIsMobilePopupOpen(false);
  };

  const cartEntries = useMemo(() => {
    return Object.entries(cart).map(([cocktailId, qty]) => {
      const cocktail = cocktails.find(c => c.id === cocktailId) || {
        id: cocktailId,
        name: 'Ítem',
        category: 'clasico' as const,
        price: 25,
        recipe: [],
        description: '',
        imageUrl: '/assets/cocktails/pisco_sour.jpg',
        enabledForEvent: true,
      };
      return {
        cocktail,
        quantity: qty,
        unitPrice: cocktail.price,
        unitCost: unitCosts.get(cocktailId) || 0,
        subtotal: cocktail.price * qty,
      };
    });
  }, [cart, cocktails, unitCosts]);

  const totalAmount = useMemo(() => {
    return cartEntries.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cartEntries]);

  const totalCount = useMemo(() => {
    return cartEntries.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartEntries]);

  // Rapid 1-tap checkout
  const handleExecuteOrder = (paymentMethod: PaymentMethod) => {
    if (cartEntries.length === 0 || submitting.current) return;

    const isCourtesy = paymentMethod === 'cortesia';
    const finalAmount = isCourtesy ? 0 : totalAmount;
    const orderType: OrderType = isCourtesy ? 'cortesia' : 'venta';

    const newOrder: Order = {
      id: `ORD-${crypto.randomUUID()}`,
      timestamp: Date.now(),
      orderType,
      paymentMethod,
      items: cartEntries.map(item => ({
        cocktailId: item.cocktail.id,
        cocktailName: item.cocktail.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitCost: item.unitCost,
      })),
      totalAmount: finalAmount,
      notes: orderNote.trim() || (isCourtesy ? 'Cortesía' : 'Barra'),
      status: 'preparing',
    };

    submitting.current = true;
    try { onAddOrder(newOrder); }
    catch (error) {
      submitting.current = false;
      setLastNotification(error instanceof Error ? error.message : 'No se pudo guardar. Conservamos tu comanda.');
      return;
    }
    window.setTimeout(() => { submitting.current = false; }, 300);

    const msg = `✓ Pedido guardado${isSupabaseConfigured() ? ' · enviando a barra' : ' en este dispositivo'} · ${newOrder.items.reduce((n, i) => n + i.quantity, 0)} productos`;

    setLastNotification(msg);
    setTimeout(() => setLastNotification(null), 3000);

    setCart({});
    setOrderNote('');
    setIsMobilePopupOpen(false);
  };

  // Shared Comanda Inner Content (used both in docked tablet panel and floating mobile pop-up)
  const renderComandaBody = (onClosePopup: () => void, closeTitle: string) => (
    <>
      {/* Comanda Header */}
      <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between bg-stone-50/90 shrink-0">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-orange-600" />
          <span className="font-extrabold text-sm text-stone-900">
            Comanda
          </span>
          {totalCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[11px] font-mono font-bold">
              {totalCount} {totalCount === 1 ? 'ítem' : 'ítems'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {totalCount > 0 && (
            <button
              onClick={handleClearCart}
              className="text-stone-400 hover:text-rose-600 p-1.5 rounded-xl transition cursor-pointer"
              title="Borrar comanda"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClosePopup}
            className="p-1.5 rounded-xl hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition cursor-pointer"
            title={closeTitle}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Items List (fills exact remaining height, never pushes buttons off-screen) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 bg-white">
        {cartEntries.length === 0 ? (
          <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-5 text-stone-400 space-y-1.5">
            <Receipt className="w-8 h-8 text-stone-300 stroke-1" />
            <p className="text-xs font-bold text-stone-600">Comanda vacía</p>
            <p className="text-[11px] text-stone-400">
              Toca los tragos o tapas en la pantalla para armar el pedido.
            </p>
          </div>
        ) : (
          cartEntries.map(entry => (
            <div
              key={entry.cocktail.id}
              className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs"
            >
              <div className="min-w-0 pr-2">
                <p className="font-bold text-stone-900 truncate">
                  {entry.cocktail.name}
                </p>
                <p className="text-[10px] text-stone-400 font-mono">
                  S/. {entry.unitPrice.toFixed(2)} c/u
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 bg-white border border-stone-300 rounded-lg px-1.5 py-0.5">
                  <button
                    type="button"
                    onClick={() => handleDecrement(entry.cocktail.id)}
                    className="p-1 text-stone-500 hover:text-stone-900 cursor-pointer active:scale-90"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono font-bold text-xs px-1 text-stone-900">
                    {entry.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddDrink(entry.cocktail.id)}
                    className="p-1 text-stone-500 hover:text-stone-900 cursor-pointer active:scale-90"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <span className="font-mono font-bold text-xs text-stone-900 w-16 text-right">
                  S/. {(entry.unitPrice * entry.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Pinned Payment Area: ALWAYS visible without scrolling */}
      <div className="p-3 bg-stone-50 border-t border-stone-200 space-y-2 shrink-0">
        {totalCount > 0 && (
          <input
            type="text"
            placeholder="Nota rápida: ej. sin hielo, mesa 4..."
            value={orderNote}
            onChange={e => setOrderNote(e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-orange-500"
          />
        )}

        <div className="flex items-baseline justify-between px-1">
          <span className="font-extrabold text-xs uppercase tracking-wider text-stone-500">
            Total a Cobrar:
          </span>
          <span className="text-xl lg:text-2xl font-mono font-black text-orange-600">
            S/. {(paymentMethod === 'cortesia' ? 0 : totalAmount).toFixed(2)}
          </span>
        </div>

        <fieldset>
          <legend className="mb-2 text-[10px] uppercase tracking-wider font-extrabold text-stone-500">Forma de pago</legend>
          <div className="grid grid-cols-2 gap-2">
            {([
              { id: 'yape_plin', label: 'Yape / Plin', icon: Smartphone, color: 'bg-[#702082] border-[#702082] text-white shadow-purple-900/20' },
              { id: 'tarjeta', label: 'Tarjeta / POS', icon: CreditCard, color: 'bg-[#0f4c81] border-[#0f4c81] text-white shadow-blue-900/20' },
              { id: 'efectivo', label: 'Efectivo', icon: Coins, color: 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-700/20' },
              { id: 'cortesia', label: 'Cortesía', icon: Gift, color: 'bg-purple-950 border-purple-950 text-amber-300' },
            ] as const).map(method => <button key={method.id} type="button" aria-pressed={paymentMethod === method.id}
              onClick={() => setPaymentMethod(method.id)}
              className={`min-h-12 rounded-2xl border-2 px-2 py-2.5 text-xs font-extrabold flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer ${method.color} ${paymentMethod === method.id ? 'shadow-md ring-2 ring-offset-2 ring-orange-400' : 'opacity-80 hover:opacity-100'}`}>
              <method.icon className="w-4 h-4 shrink-0" />{method.label}
            </button>)}
          </div>
        </fieldset>
        <button onClick={() => handleExecuteOrder(paymentMethod)} disabled={totalCount === 0}
          className="w-full min-h-12 rounded-2xl bg-orange-600 hover:bg-orange-700 p-3 font-extrabold text-white shadow-sm shadow-orange-500/20 transition active:scale-[0.98] disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none">
          Enviar a preparación
        </button>
      </div>
    </>
  );

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col md:flex-row bg-[#faf8f5] text-stone-900 overflow-hidden relative font-sans">
      {/* Toast Notification */}
      {lastNotification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-50 px-5 py-2.5 rounded-full bg-stone-900 text-amber-300 text-xs sm:text-sm font-extrabold shadow-2xl animate-bounce flex items-center gap-2 border border-orange-500">
          <Sparkles className="w-4 h-4 text-orange-400" />
          <span>{lastNotification}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* LEFT / CENTER PANEL: Categorías + Catálogo                           */}
      {/* ==================================================================== */}
      <div className="flex-1 min-h-0 h-full flex flex-col overflow-hidden min-w-0 transition-all duration-300">
        {/* Category Toolbar */}
        <div className="px-4 sm:px-5 py-2.5 bg-white border-b border-stone-200 shadow-2xs flex items-center justify-between gap-2 z-20 shrink-0">
          <nav className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap active:scale-95 ${
                  selectedCategory === cat.id
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {onGoToCartaCompras && (
              <button
                onClick={onGoToCartaCompras}
                className="text-stone-500 hover:text-orange-600 text-xs font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-stone-50 transition cursor-pointer"
                title="Editar precios, recetas e insumos de la carta"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Editar Carta</span>
              </button>
            )}

            {isComandaCollapsed && (
              <button
                onClick={() => setIsComandaCollapsed(false)}
                className="hidden md:flex px-3 py-1.5 rounded-xl bg-orange-600 text-white font-extrabold text-xs items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Ver Comanda</span>
                {totalCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-white text-orange-600 text-[10px] font-mono font-bold">
                    {totalCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Catalog Grid: scrolls independently inside viewport, bottom padding avoids overlap with floating bar on mobile/collapsed */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 grid gap-3 auto-rows-max pb-24 md:pb-5 ${
            isComandaCollapsed
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
          } ${isComandaCollapsed ? 'md:pb-24' : ''}`}
        >
          {filteredCocktails.map(item => {
            const count = cart[item.id] || 0;

            return (
              <div
                key={item.id}
                onClick={() => handleAddDrink(item.id)}
                className={`relative rounded-2xl overflow-hidden border transition-all duration-150 cursor-pointer select-none bg-white flex flex-col justify-between active:scale-[0.98] ${
                  count > 0
                    ? 'border-orange-500 ring-2 ring-orange-500/30 shadow-md'
                    : 'border-stone-200 hover:border-orange-300 hover:shadow-2xs'
                }`}
              >
                {/* Product Photo */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                  <img
                    src={item.imageUrl || '/assets/cocktails/pisco_sour.jpg'}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                    loading="lazy"
                  />

                  {/* Price Pill */}
                  <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-lg bg-black/80 backdrop-blur-xs text-amber-300 font-mono font-bold text-xs shadow-xs">
                    S/. {item.price.toFixed(2)}
                  </div>

                  {/* Food Tag */}
                  {item.category === 'tapas_comida' && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-orange-600 text-white font-bold text-[9px] uppercase tracking-wider">
                      Tapa
                    </div>
                  )}
                </div>

                {/* Title & Counter */}
                <div className="p-2.5 sm:p-3 flex items-center justify-between gap-2 min-h-[48px]">
                  <span className="font-bold text-xs sm:text-sm text-stone-900 leading-snug truncate">
                    {item.name}
                  </span>

                  {count > 0 ? (
                    <div
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1 bg-orange-600 text-white px-2 py-0.5 rounded-full font-mono font-bold text-xs shrink-0 shadow-xs"
                    >
                      <button
                        type="button"
                        onClick={e => handleDecrement(item.id, e)}
                        className="hover:text-yellow-200 p-1 cursor-pointer active:scale-90"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs px-1">{count}</span>
                      <button
                        type="button"
                        onClick={e => handleAddDrink(item.id, e)}
                        className="hover:text-yellow-200 p-1 cursor-pointer active:scale-90"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-orange-600 group-hover:text-white transition">
                      +
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredCocktails.length === 0 && (
            <div className="col-span-full py-12 px-4 text-center space-y-3 bg-white rounded-3xl border border-dashed border-stone-300">
              <p className="text-sm font-bold text-stone-700">
                Aún no hay productos activados en esta categoría
              </p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Ve a <strong>Carta & Compras</strong> para activar con 1 clic los tragos de ejemplo con foto o crear nuevos productos.
              </p>
              {onGoToCartaCompras && (
                <button
                  onClick={onGoToCartaCompras}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                >
                  Ir a Carta & Compras →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TABLET & DESKTOP (md+): COMANDA SIEMPRE FIJA A LA DERECHA (0 SCROLL) */}
      {/* ==================================================================== */}
      {!isComandaCollapsed && (
        <aside className="hidden md:flex md:w-[300px] lg:w-[340px] xl:w-[380px] h-full min-h-0 bg-white border-l border-stone-200 flex-col shrink-0 shadow-lg z-30">
          {renderComandaBody(() => setIsComandaCollapsed(true), 'Ocultar panel lateral')}
        </aside>
      )}

      {/* ==================================================================== */}
      {/* ALWAYS-VISIBLE FLOATING COMANDA POP-UP BAR (< md OR COLLAPSED)       */}
      {/* Nunca más hay que scrollear hacia abajo para ver o cobrar la comanda */}
      {/* ==================================================================== */}
      <div
        className={`${
          isComandaCollapsed ? 'flex' : 'flex md:hidden'
        } fixed bottom-3 left-3 right-3 sm:left-5 sm:right-5 z-40 bg-white/95 backdrop-blur-md border border-stone-300 rounded-2xl p-2.5 shadow-2xl items-center justify-between gap-2 animate-fade-in`}
      >
        {/* Left: Open Pop-Up Trigger */}
        <button
          onClick={() => {
            if (isComandaCollapsed) {
              setIsComandaCollapsed(false);
            } else {
              setIsMobilePopupOpen(true);
            }
          }}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-950 font-black text-xs cursor-pointer transition active:scale-95 min-w-0"
        >
          <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            {totalCount > 0 ? totalCount : <Receipt className="w-4 h-4" />}
          </div>
          <div className="text-left min-w-0">
            <span className="block text-[10px] text-stone-500 font-bold uppercase tracking-wider truncate">
              {totalCount > 0 ? 'Comanda Activa' : 'Comanda vacía'}
            </span>
            <span className="text-sm sm:text-base font-mono font-black text-orange-600 block leading-tight">
              S/. {totalAmount.toFixed(2)}
            </span>
          </div>
          <ChevronUp className="w-4 h-4 text-orange-600 shrink-0" />
        </button>

        <button onClick={() => { if (isComandaCollapsed) setIsComandaCollapsed(false); else setIsMobilePopupOpen(true); }}
          className="min-h-12 px-4 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs flex items-center gap-2 active:scale-95 cursor-pointer shrink-0 shadow-sm shadow-orange-500/20">
          <Receipt className="w-4 h-4" /><span>{totalCount > 0 ? 'Revisar pedido' : 'Abrir comanda'}</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* FLOATING POP-UP MODAL FOR COMPACT / MOBILE SCREENS (< md)            */}
      {/* ==================================================================== */}
      {isMobilePopupOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-2 sm:p-4 md:hidden animate-fade-in"
          onClick={() => setIsMobilePopupOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md h-[90dvh] max-h-[90dvh] bg-white rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden"
          >
            {renderComandaBody(() => setIsMobilePopupOpen(false), 'Cerrar pop-up de comanda')}
          </div>
        </div>
      )}
    </div>
  );
};
