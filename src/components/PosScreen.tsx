import React, { useState, useMemo } from 'react';
import { Cocktail, Ingredient, BarEvent, Order, OrderType } from '../types/bar';
import { DrinkIllustration } from './DrinkIllustration';
import { calculateCocktailUnitCost } from '../utils/calculations';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Headphones,
  Sparkles,
  ShoppingBag,
  CheckCircle,
  Receipt,
  RotateCcw,
  Clock,
  Wine,
} from 'lucide-react';

interface PosScreenProps {
  cocktails: Cocktail[];
  ingredients: Ingredient[];
  activeEvent: BarEvent;
  onAddOrder: (order: Order) => void;
  onRemoveOrder?: (orderId: string) => void;
}

export const PosScreen: React.FC<PosScreenProps> = ({
  cocktails,
  ingredients,
  activeEvent,
  onAddOrder,
  onRemoveOrder,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [orderType, setOrderType] = useState<OrderType>('venta');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [lastConfirmedOrder, setLastConfirmedOrder] = useState<Order | null>(null);

  // Filter only enabled cocktails for the active event
  const visibleCocktails = useMemo(() => {
    return cocktails
      .filter(c => c.enabledForEvent)
      .filter(c => {
        if (selectedCategory === 'all') return true;
        return c.category === selectedCategory;
      })
      .filter(c => {
        if (!searchQuery.trim()) return true;
        return (
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
  }, [cocktails, selectedCategory, searchQuery]);

  // Compute unit costs map
  const unitCosts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of cocktails) {
      map.set(c.id, calculateCocktailUnitCost(c, ingredients));
    }
    return map;
  }, [cocktails, ingredients]);

  // Add to cart
  const handleAddToCart = (cocktailId: string) => {
    setCart(prev => ({
      ...prev,
      [cocktailId]: (prev[cocktailId] || 0) + 1,
    }));
  };

  const handleDecrementFromCart = (cocktailId: string) => {
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
    setOrderNotes('');
  };

  // Cart totals
  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([cocktailId, qty]) => {
      const cocktail = cocktails.find(c => c.id === cocktailId)!;
      const unitCost = unitCosts.get(cocktailId) || 0;
      return {
        cocktail,
        quantity: qty,
        unitPrice: cocktail.price,
        unitCost,
        subtotal: orderType === 'venta' ? cocktail.price * qty : 0,
      };
    });
  }, [cart, cocktails, unitCosts, orderType]);

  const totalCartAmount = useMemo(() => {
    if (orderType !== 'venta') return 0;
    return cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cartItems, orderType]);

  const totalCartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  // Confirm simulated order
  const handleConfirmOrder = () => {
    if (cartItems.length === 0) return;

    const newOrder: Order = {
      id: `ORD-${crypto.randomUUID()}`,
      timestamp: Date.now(),
      status: 'preparing',
      orderType,
      items: cartItems.map(item => ({
        cocktailId: item.cocktail.id,
        cocktailName: item.cocktail.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitCost: item.unitCost,
      })),
      totalAmount: totalCartAmount,
      notes: orderNotes.trim() ? orderNotes.trim() : undefined,
    };

    onAddOrder(newOrder);
    setLastConfirmedOrder(newOrder);
    setCart({});
    setOrderNotes('');

    // Reset success banner after 4 seconds
    setTimeout(() => {
      setLastConfirmedOrder(prev => (prev?.id === newOrder.id ? null : prev));
    }, 4000);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#0d0c0a] text-[#f4efe6] h-[calc(100vh-105px)]">
      {/* LEFT COLUMN: Drink Catalog with Visual Illustrations (iPad Touch Optimized) */}
      <div className="flex-1 flex flex-col border-r border-[#241f1a] overflow-hidden">
        {/* Category Filter & Search Bar */}
        <div className="p-3 bg-[#141210] border-b border-[#241f1a] flex flex-wrap items-center justify-between gap-3">
          {/* Quick Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'pisco', label: 'Piscos & Sours' },
              { id: 'autor', label: 'De Autor' },
              { id: 'clasico', label: 'Clásicos' },
              { id: 'cerveza_sin_alcohol', label: 'Cerveza & 0.0%' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-[#993b22] text-white shadow-md shadow-[#993b22]/30 border border-[#d96548]/40'
                    : 'bg-[#1e1a16] text-[#b5a99d] hover:bg-[#28221c] border border-[#2e261f]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-[#8c7f72] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar trago..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#1a1613] border border-[#332b24] rounded-lg text-xs text-[#f5ede2] placeholder-[#7d7165] focus:outline-none focus:border-[#993b22]"
            />
          </div>
        </div>

        {/* Cocktail Cards Grid (Designed specifically for swift finger taps in the dark) */}
        <div className="flex-1 overflow-y-auto p-3.5 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {visibleCocktails.map(cocktail => {
            const inCartQty = cart[cocktail.id] || 0;
            const cost = unitCosts.get(cocktail.id) || 0;
            const marginPct = cocktail.price > 0 ? (((cocktail.price - cost) / cocktail.price) * 100).toFixed(0) : 0;

            return (
              <div
                key={cocktail.id}
                onClick={() => handleAddToCart(cocktail.id)}
                className={`relative group rounded-xl p-3 bg-gradient-to-b from-[#1c1815] to-[#151210] border transition-all duration-150 cursor-pointer active:scale-[0.98] flex flex-col justify-between ${
                  inCartQty > 0
                    ? 'border-[#d96548] shadow-lg shadow-[#993b22]/20 ring-1 ring-[#d96548]/40'
                    : 'border-[#2d251f] hover:border-[#4d3e33] hover:shadow-md'
                }`}
              >
                {/* Active in Cart Badge */}
                {inCartQty > 0 && (
                  <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#993b22] text-white font-extrabold text-xs flex items-center justify-center shadow-lg border border-[#f5b8a9] animate-bounce">
                    {inCartQty}
                  </div>
                )}

                {/* Drink Illustration Header */}
                <div className="flex flex-col items-center py-1">
                  <DrinkIllustration
                    keyName={cocktail.illustrationKey}
                    size="lg"
                    className="transform group-hover:scale-105 transition-transform duration-200"
                  />
                </div>

                {/* Drink Details */}
                <div className="mt-1">
                  <div className="flex items-start justify-between gap-1 mb-0.5">
                    <h3 className="text-sm font-bold text-[#f5ede2] leading-tight group-hover:text-amber-200 transition">
                      {cocktail.name}
                    </h3>
                  </div>

                  <p className="text-[10px] text-[#9c8e80] line-clamp-1 mb-2">
                    {cocktail.description}
                  </p>

                  <div className="flex items-center justify-between pt-1.5 border-t border-[#26201a]">
                    <div>
                      <span className="text-base font-extrabold text-[#f3ba63] font-mono">
                        S/. {cocktail.price.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-1 text-[9px] text-[#85776a]">
                        <span>Costo: S/. {cost.toFixed(2)}</span>
                        <span className="text-emerald-400 font-bold">({marginPct}% mrg)</span>
                      </div>
                    </div>

                    {/* Quick increment/decrement buttons right on the card */}
                    <div
                      className="flex items-center gap-1 bg-[#26201b] rounded-lg p-0.5 border border-[#3d332b]"
                      onClick={e => e.stopPropagation()}
                    >
                      {inCartQty > 0 && (
                        <button
                          onClick={() => handleDecrementFromCart(cocktail.id)}
                          className="w-7 h-7 flex items-center justify-center rounded bg-[#352c24] hover:bg-[#483c31] text-[#e3d7cb] active:scale-90"
                          title="Restar 1"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleAddToCart(cocktail.id)}
                        className="w-7 h-7 flex items-center justify-center rounded bg-[#993b22] hover:bg-[#b8492d] text-white active:scale-90 font-bold"
                        title="Sumar 1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: Comanda / Fast Order Simulator (iPad Landscape Pad) */}
      <div className="w-full lg:w-96 bg-[#13110f] flex flex-col shrink-0 border-t lg:border-t-0 border-[#241f1a]">
        {/* Header of Comanda */}
        <div className="p-3 bg-[#181512] border-b border-[#26201b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#d97706]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#e6ded5]">
              Comanda / Pedido Rápido
            </h2>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Limpiar
            </button>
          )}
        </div>

        {/* ORDER TYPE SELECTOR: Venta Normal vs Cortesía / DJ / Regalo */}
        <div className="p-2.5 bg-[#171411] border-b border-[#26201b]">
          <div className="text-[10px] uppercase font-bold text-[#998b7e] mb-1.5 flex items-center justify-between">
            <span>Tipo de Pedido:</span>
            {orderType === 'dj' && (
              <span className="text-purple-400 font-mono text-[9px] font-bold">COSTO S/. 0.00 (Rider DJ)</span>
            )}
            {orderType === 'cortesia' && (
              <span className="text-pink-400 font-mono text-[9px] font-bold">COSTO S/. 0.00 (Regalo)</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setOrderType('venta')}
              className={`py-2 px-1.5 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                orderType === 'venta'
                  ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-500/70 shadow-sm'
                  : 'bg-[#201b17] text-[#9c8e80] hover:bg-[#28221c] border border-[#2d251f]'
              }`}
            >
              <span>Venta (S/.)</span>
              <span className="text-[9px] font-normal opacity-80">Facturada</span>
            </button>

            <button
              onClick={() => setOrderType('dj')}
              className={`py-2 px-1.5 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                orderType === 'dj'
                  ? 'bg-purple-900/60 text-purple-200 border border-purple-500/70 shadow-sm'
                  : 'bg-[#201b17] text-[#9c8e80] hover:bg-[#28221c] border border-[#2d251f]'
              }`}
            >
              <div className="flex items-center gap-1">
                <Headphones className="w-3 h-3 text-purple-400" />
                <span>DJ Cabina</span>
              </div>
              <span className="text-[9px] font-normal opacity-80">Gratis / Rider</span>
            </button>

            <button
              onClick={() => setOrderType('cortesia')}
              className={`py-2 px-1.5 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                orderType === 'cortesia'
                  ? 'bg-pink-900/60 text-pink-200 border border-pink-500/70 shadow-sm'
                  : 'bg-[#201b17] text-[#9c8e80] hover:bg-[#28221c] border border-[#2d251f]'
              }`}
            >
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-pink-400" />
                <span>Cortesía</span>
              </div>
              <span className="text-[9px] font-normal opacity-80">Regalo / Colab</span>
            </button>
          </div>
        </div>

        {/* Success Banner if order just confirmed */}
        {lastConfirmedOrder && (
          <div className="mx-2.5 mt-2 p-2 bg-emerald-950/80 border border-emerald-700/60 rounded-lg flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>
                <strong>¡Pedido registrado!</strong> ({lastConfirmedOrder.orderType.toUpperCase()})
              </span>
            </div>
            <span className="font-mono font-bold text-white">
              {lastConfirmedOrder.orderType === 'venta'
                ? `S/. ${lastConfirmedOrder.totalAmount.toFixed(2)}`
                : 'Gratis'}
            </span>
          </div>
        )}

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#756a5e]">
              <ShoppingBag className="w-10 h-10 mb-2 opacity-30 text-[#e67a5f]" />
              <p className="text-xs font-semibold text-[#a89d91]">Comanda vacía</p>
              <p className="text-[11px] mt-1 max-w-[200px]">
                Toca cualquier cóctel de la carta para agregarlo al pedido de la noche.
              </p>
            </div>
          ) : (
            cartItems.map(item => (
              <div
                key={item.cocktail.id}
                className="flex items-center justify-between p-2 rounded-lg bg-[#1a1714] border border-[#2a231d]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <DrinkIllustration keyName={item.cocktail.illustrationKey} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#f5ede2] truncate">
                      {item.cocktail.name}
                    </p>
                    <p className="text-[10px] text-[#94877b] font-mono">
                      {orderType === 'venta'
                        ? `S/. ${item.unitPrice.toFixed(2)} c/u`
                        : 'Cortesía (S/. 0.00)'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-[#25201a] border border-[#382f25] rounded-md">
                    <button
                      onClick={() => handleDecrementFromCart(item.cocktail.id)}
                      className="w-7 h-7 flex items-center justify-center text-[#e8ded3] hover:bg-[#352c23] rounded-l"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-bold text-xs font-mono text-[#f3ba63]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleAddToCart(item.cocktail.id)}
                      className="w-7 h-7 flex items-center justify-center text-[#e8ded3] hover:bg-[#352c23] rounded-r"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="w-14 text-right font-extrabold text-xs font-mono text-white">
                    S/. {item.subtotal.toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Optional Notes & Confirmation Section */}
        {cartItems.length > 0 && (
          <div className="p-3 bg-[#181512] border-t border-[#26201b] space-y-2.5">
            <div>
              <input
                type="text"
                placeholder="Nota opcional (ej: DJ Marco, Mesa 4 VIP, Promo)..."
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#12100e] border border-[#2d251f] rounded-lg text-xs text-[#f5ede2] placeholder-[#6e6357] focus:outline-none focus:border-[#993b22]"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[#a39587]">
              <span>Cantidad de tragos:</span>
              <span className="font-bold font-mono text-white">{totalCartCount} unidades</span>
            </div>

            <div className="flex items-center justify-between text-sm pt-1 border-t border-[#26201b]">
              <span className="font-bold text-[#e6ded5]">Total Cuenta:</span>
              <span className="font-extrabold text-lg text-[#e5b869] font-mono">
                {orderType === 'venta' ? `S/. ${totalCartAmount.toFixed(2)}` : 'S/. 0.00 (CORTESÍA)'}
              </span>
            </div>

            <button
              onClick={handleConfirmOrder}
              className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer ${
                orderType === 'venta'
                  ? 'bg-gradient-to-r from-[#993b22] to-[#b8492d] hover:from-[#b8492d] hover:to-[#c85538] text-white shadow-[#993b22]/30 border border-[#d96548]/40'
                  : orderType === 'dj'
                  ? 'bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-900/30 border border-purple-500/40'
                  : 'bg-gradient-to-r from-pink-800 to-rose-800 hover:from-pink-700 hover:to-rose-700 text-white shadow-pink-900/30 border border-pink-500/40'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>
                Enviar a preparación
              </span>
            </button>
          </div>
        )}

        {/* Recent Orders Bottom Tray */}
        <div className="p-2.5 bg-[#100e0c] border-t border-[#221c17] max-h-36 overflow-y-auto">
          <div className="flex items-center justify-between text-[10px] text-[#8c7e71] uppercase font-bold mb-1.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#d97706]" />
              Últimas comandas de la noche
            </span>
            <span>{activeEvent.orders.length} pedidos</span>
          </div>

          <div className="space-y-1">
            {activeEvent.orders.slice(-3).reverse().map(ord => (
              <div
                key={ord.id}
                className="flex items-center justify-between text-[11px] p-1.5 rounded bg-[#181512] border border-[#27211a]"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                      ord.orderType === 'venta'
                        ? 'bg-emerald-950 text-emerald-300'
                        : ord.orderType === 'dj'
                        ? 'bg-purple-950 text-purple-300'
                        : 'bg-pink-950 text-pink-300'
                    }`}
                  >
                    {ord.orderType}
                  </span>
                  <span className="text-[#d8cfc4] truncate">
                    {ord.items.map(i => `${i.quantity}x ${i.cocktailName}`).join(', ')}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-bold text-[#e5b869]">
                    {ord.orderType === 'venta' ? `S/. ${ord.totalAmount.toFixed(2)}` : 'S/. 0.00'}
                  </span>
                  {onRemoveOrder && (
                    <button
                      onClick={() => onRemoveOrder(ord.id)}
                      className="text-[#7d7165] hover:text-rose-400 p-0.5"
                      title="Anular pedido"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
