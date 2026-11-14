import React, { useState, useEffect, useRef } from 'react';
import { BarEvent, Cocktail, Ingredient, Order, WasteRecord, BusinessProfile, OrderPreparationStatus } from './types/bar';
import { INITIAL_EVENTS, INITIAL_COCKTAILS, INITIAL_INGREDIENTS, DEFAULT_BUSINESS_PROFILE } from './data/initialData';
import {
  isSupabaseConfigured,
  fetchInitialStateFromSupabase,
  syncCocktailsToSupabase,
  syncIngredientsToSupabase,
  syncEventToSupabase,
  pushOrderToSupabase,
  updateOrderStatusInSupabase,
  pushWasteToSupabase,
  syncBusinessProfileToSupabase,
} from './lib/supabase';
import { Header, MainAppView, OperationMode } from './components/Header';
import { MenuScreen } from './components/MenuScreen';
import { CartaComprasScreen } from './components/CartaComprasScreen';
import { VentasScreen } from './components/VentasScreen';
import { KdsScreen } from './components/KdsScreen';
import { TicketModal } from './components/TicketModal';
import { PosDPrinterModal } from './components/PosDPrinterModal';
import { OlaClickExcelModal } from './components/OlaClickExcelModal';
import { RecipeCostMatrixModal } from './components/RecipeCostMatrixModal';
import { NewProjectModal } from './components/NewProjectModal';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { ManagementDrawer } from './components/ManagementDrawer';
import { MenuEditorModal } from './components/MenuEditorModal';
import { EditCocktailModal } from './components/EditCocktailModal';
import { EventWizardModal } from './components/EventWizardModal';
import { BusinessOnboardingModal } from './components/BusinessOnboardingModal';
import { PublicMenuModal } from './components/PublicMenuModal';
import { BarGuideModal } from './components/BarGuideModal';
import { PinLockModal } from './components/PinLockModal';

export default function App() {
  const [orderSyncError, setOrderSyncError] = useState('');
  const pendingOrders = useRef(new Set<string>());
  // Main View: 'pdv' (Barra) | 'carta_compras' (Carta & Compras) | 'ventas' (Caja & Mes) | 'preparacion' (Cocina/Prep)
  const [currentView, setCurrentView] = useState<MainAppView>('pdv');
  const [operationMode, setOperationMode] = useState<OperationMode>('dia');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState<boolean>(false);

  // Business B2B Profile
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(() => {
    try {
      const saved = localStorage.getItem('altura_business_profile_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_BUSINESS_PROFILE;
  });

  // Load persistent or default data (v3 starts clean with 4 starter items + 12 photo library templates + 0 fake orders)
  const [events, setEvents] = useState<BarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('altura_events_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading events:', e);
    }
    return INITIAL_EVENTS;
  });

  const [activeEventId, setActiveEventId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem('altura_active_event_id_v3');
      if (savedId) return savedId;
    } catch (e) {
      console.error(e);
    }
    return INITIAL_EVENTS[0]?.id || '';
  });

  const [cocktails, setCocktails] = useState<Cocktail[]>(() => {
    try {
      const saved = localStorage.getItem('altura_cocktails_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        const existingIds = new Set(parsed.map((c: Cocktail) => c.id));
        const missing = INITIAL_COCKTAILS.filter(c => !existingIds.has(c.id));
        if (missing.length > 0) return [...parsed, ...missing];
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_COCKTAILS;
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    try {
      const saved = localStorage.getItem('altura_ingredients_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_INGREDIENTS;
  });

  // Modals & Drawers State
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isMenuEditorOpen, setIsMenuEditorOpen] = useState(false);
  const [isMenuExcelOpen, setIsMenuExcelOpen] = useState(false);
  const [isRecipeMatrixOpen, setIsRecipeMatrixOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Cocktail Editor State
  const [isEditCocktailOpen, setIsEditCocktailOpen] = useState(false);
  const [cocktailToEdit, setCocktailToEdit] = useState<Cocktail | null>(null);

  // Event Wizard State
  const [isEventWizardOpen, setIsEventWizardOpen] = useState(false);
  const [wizardTargetEvent, setWizardTargetEvent] = useState<BarEvent | undefined>(undefined);

  // B2B Experiencia Cero & Public Menu Modals
  const [isBusinessOnboardingOpen, setIsBusinessOnboardingOpen] = useState(false);
  const [isPublicMenuOpen, setIsPublicMenuOpen] = useState(false);

  // Printer & Thermal Ticket State (POS-D Basic 230)
  const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('altura_autoprint_v1');
      return saved !== null ? saved === 'true' : true;
    } catch (e) {
      return true;
    }
  });
  const [printerPaperWidth, setPrinterPaperWidth] = useState<'80mm' | '58mm'>(() => {
    try {
      const saved = localStorage.getItem('altura_printer_width_v1');
      return saved === '58mm' ? '58mm' : '80mm';
    } catch (e) {
      return '80mm';
    }
  });
  const [printerStationName, setPrinterStationName] = useState<string>(() => {
    try {
      return localStorage.getItem('altura_printer_station_v1') || 'BARRA PRINCIPAL';
    } catch (e) {
      return 'BARRA PRINCIPAL';
    }
  });
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [ticketOrder, setTicketOrder] = useState<Order | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Hydrate from Supabase on startup if configured (seed defaults if DB empty)
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let isCancelled = false;

    fetchInitialStateFromSupabase()
      .then(remote => {
        if (isCancelled || !remote) return;

        if (remote.businessProfile) {
          setBusinessProfile(remote.businessProfile);
        } else {
          syncBusinessProfileToSupabase(businessProfile).catch(console.error);
        }

        if (remote.ingredients && remote.ingredients.length > 0) {
          setIngredients(remote.ingredients);
        } else {
          syncIngredientsToSupabase(ingredients).catch(console.error);
        }

        if (remote.cocktails && remote.cocktails.length > 0) {
          setCocktails(remote.cocktails);
        } else {
          syncCocktailsToSupabase(cocktails).catch(console.error);
        }

        if (remote.events && remote.events.length > 0) {
          setEvents(remote.events);
          setActiveEventId(prevId =>
            remote.events!.some(ev => ev.id === prevId) ? prevId : remote.events![0].id
          );
        } else if (events[0]) {
          syncEventToSupabase(events[0]).catch(console.error);
        }
      })
      .catch(console.error);

    return () => {
      isCancelled = true;
    };
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh orders across tablet and phone without overwriting local stock or drafts.
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    let fetching = false;
    const refresh = async () => {
      if (fetching) return;
      fetching = true;
      try {
        const remote = await fetchInitialStateFromSupabase();
        if (cancelled || !remote?.events) return;
        setEvents(previous => previous.map(event => {
          const incoming = remote.events?.find(e => e.id === event.id);
          if (!incoming) return event;
          const merged = new Map(event.orders.map(o => [o.id, o]));
          for (const order of incoming.orders) {
            if (!pendingOrders.current.has(order.id)) merged.set(order.id, order);
          }
          return { ...event, orders: [...merged.values()] };
        }));
      } finally { fetching = false; }
    };
    const timer = window.setInterval(refresh, 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  // Sync to localStorage & Supabase
  useEffect(() => {
    try {
      localStorage.setItem('altura_business_profile_v1', JSON.stringify(businessProfile));
    } catch (e) {
      console.error(e);
    }
    if (isSupabaseConfigured()) {
      syncBusinessProfileToSupabase(businessProfile).catch(console.error);
    }
  }, [businessProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('altura_events_v3', JSON.stringify(events));
    } catch (e) {
      console.error(e);
    }
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem('altura_active_event_id_v3', activeEventId);
    } catch (e) {
      console.error(e);
    }
  }, [activeEventId]);

  useEffect(() => {
    try {
      localStorage.setItem('altura_cocktails_v3', JSON.stringify(cocktails));
    } catch (e) {
      console.error(e);
    }
    if (isSupabaseConfigured()) {
      syncCocktailsToSupabase(cocktails).catch(console.error);
    }
  }, [cocktails]);

  useEffect(() => {
    try {
      localStorage.setItem('altura_ingredients_v2', JSON.stringify(ingredients));
    } catch (e) {
      console.error(e);
    }
    if (isSupabaseConfigured()) {
      syncIngredientsToSupabase(ingredients).catch(console.error);
    }
  }, [ingredients]);

  // Find currently active event
  const activeEvent = events.find(ev => ev.id === activeEventId) || events[0] || INITIAL_EVENTS[0];

  // Add order to active event & auto-deduct consumed stock from Bodega
  const handleAddOrder = (newOrder: Order) => {
    setEvents(prev =>
      prev.map(ev => {
        if (ev.id === activeEvent.id) {
          return {
            ...ev,
            orders: [...ev.orders, newOrder],
          };
        }
        return ev;
      })
    );

    // Compute total ingredient usage (in ml or units) across sold items
    const consumedByIng = new Map<string, number>();
    for (const item of newOrder.items) {
      const cocktail = cocktails.find(c => c.id === item.cocktailId);
      if (!cocktail) continue;
      for (const r of cocktail.recipe) {
        const prevAmt = consumedByIng.get(r.ingredientId) || 0;
        consumedByIng.set(r.ingredientId, prevAmt + r.amount * item.quantity);
      }
    }

    if (consumedByIng.size > 0) {
      setIngredients(prev =>
        prev.map(ing => {
          const usedAmount = consumedByIng.get(ing.id);
          if (!usedAmount || !ing.volumePerUnitMl || ing.volumePerUnitMl <= 0) return ing;
          const usedUnits = usedAmount / ing.volumePerUnitMl;
          return {
            ...ing,
            currentStockUnits: Number(Math.max(0, ing.currentStockUnits - usedUnits).toFixed(2)),
          };
        })
      );
    }

    if (isSupabaseConfigured()) {
      pendingOrders.current.add(newOrder.id);
      pushOrderToSupabase(newOrder, activeEvent.id).then(result => { setOrderSyncError(result.success ? '' : 'El pedido se guardó en este dispositivo, pero no llegó a la nube. Revisa la conexión antes de continuar.'); }).catch(() => setOrderSyncError('No se pudo enviar el pedido a la nube.')).finally(() => pendingOrders.current.delete(newOrder.id));
    }
  };

  // Add waste & auto-deduct from Bodega stock
  const handleAddWaste = (newWaste: WasteRecord) => {
    setEvents(prev =>
      prev.map(ev => {
        if (ev.id === activeEvent.id) {
          return {
            ...ev,
            wastes: [...ev.wastes, newWaste],
          };
        }
        return ev;
      })
    );

    if (newWaste.ingredientId) {
      setIngredients(prev =>
        prev.map(ing => {
          if (ing.id !== newWaste.ingredientId || !ing.volumePerUnitMl || ing.volumePerUnitMl <= 0) return ing;
          const lostUnits = newWaste.quantity / ing.volumePerUnitMl;
          return {
            ...ing,
            currentStockUnits: Number(Math.max(0, ing.currentStockUnits - lostUnits).toFixed(2)),
          };
        })
      );
    }

    if (isSupabaseConfigured()) {
      pushWasteToSupabase(newWaste, activeEvent.id).catch(console.error);
    }
  };

  // Close event
  const handleCloseEvent = (eventId: string) => {
    const target = events.find(ev => ev.id === eventId);
    const closedAt = Date.now();
    setEvents(prev =>
      prev.map(ev => {
        if (ev.id === eventId) {
          return {
            ...ev,
            status: 'closed' as const,
            closedAt,
          };
        }
        return ev;
      })
    );

    if (target && isSupabaseConfigured()) {
      syncEventToSupabase({ ...target, status: 'closed', closedAt }).catch(console.error);
    }
  };

  // Save Event from Wizard / NewProjectModal
  const handleSaveEvent = (savedEvent: BarEvent) => {
    setEvents(prev => {
      const exists = prev.some(ev => ev.id === savedEvent.id);
      if (exists) {
        return prev.map(ev => (ev.id === savedEvent.id ? savedEvent : ev));
      }
      return [savedEvent, ...prev];
    });
    setActiveEventId(savedEvent.id);

    if (isSupabaseConfigured()) {
      syncEventToSupabase(savedEvent).catch(console.error);
    }
  };

  // Save edited cocktail
  const handleSaveCocktail = (updated: Cocktail) => {
    setCocktails(prev => prev.map(c => (c.id === updated.id ? updated : c)));
  };

  const handleOpenEditCocktail = (cocktail: Cocktail) => {
    setCocktailToEdit(cocktail);
    setIsEditCocktailOpen(true);
  };

  const handleSaveBusinessProfile = (profile: BusinessProfile) => {
    setBusinessProfile(profile);
    if (isSupabaseConfigured()) {
      syncBusinessProfileToSupabase(profile).catch(console.error);
    }
  };

  // Update preparation status of an order
  const handleUpdateOrderStatus = (orderId: string, status: OrderPreparationStatus) => {
    setEvents(prev =>
      prev.map(ev => {
        if (ev.id === activeEvent.id) {
          return {
            ...ev,
            orders: ev.orders.map(o => (o.id === orderId ? { ...o, status } : o)),
          };
        }
        return ev;
      })
    );

    if (isSupabaseConfigured()) {
      pendingOrders.current.add(orderId);
      updateOrderStatusInSupabase(orderId, status).then(result => { setOrderSyncError(result.success ? '' : 'El cambio de estado no llegó a la nube. Revisa la conexión.'); }).catch(() => setOrderSyncError('No se pudo actualizar el estado en la nube.')).finally(() => pendingOrders.current.delete(orderId));
    }
  };

  const handlePrintOrder = (order: Order) => {
    setTicketOrder(order);
    setIsTicketModalOpen(true);
  };

  const handleSaveNewPin = (newPin: string) => {
    setBusinessProfile(prev => {
      const updated = { ...prev, accessPin: newPin };
      try {
        localStorage.setItem('altura_business_profile_v1', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      syncBusinessProfileToSupabase(updated);
      return updated;
    });
    setIsChangePinOpen(false);
  };

  const preparingCount = activeEvent.orders.filter(o => !o.status || o.status === 'preparing').length;

  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden bg-[#faf8f5] text-stone-900 font-sans antialiased selection:bg-orange-500 selection:text-white">
      {/* Light, Clean Top Header: Reduced by 80%, mode selector, 4 core views and settings dropdown */}
      <Header
        currentView={currentView}
        onChangeView={setCurrentView}
        activeEvent={activeEvent}
        events={events}
        onSelectEvent={setActiveEventId}
        businessProfile={businessProfile}
        preparingCount={preparingCount}
        operationMode={operationMode}
        onChangeOperationMode={setOperationMode}
        onOpenPublicMenu={() => setIsPublicMenuOpen(true)}
        onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
        onOpenPrinterModal={() => setIsPrinterModalOpen(true)}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenMenuExcel={() => setIsMenuExcelOpen(true)}
        onOpenOnboarding={() => setIsBusinessOnboardingOpen(true)}
        onLockApp={() => setIsLocked(true)}
        onOpenChangePin={() => setIsChangePinOpen(true)}
      />

      {/* Main View Area: 100% Focused, Zero Visual Clutter */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
        {currentView === 'carta_compras' ? (
          <CartaComprasScreen
            cocktails={cocktails}
            setCocktails={setCocktails}
            ingredients={ingredients}
            setIngredients={setIngredients}
            businessProfile={businessProfile}
            setBusinessProfile={setBusinessProfile}
            onAddWaste={handleAddWaste}
          />
        ) : currentView === 'ventas' ? (
          <VentasScreen
            activeEvent={activeEvent}
            allEvents={events}
            cocktails={cocktails}
            ingredients={ingredients}
            operationMode={operationMode}
            onChangeOperationMode={setOperationMode}
          />
        ) : currentView === 'preparacion' ? (
          <KdsScreen
            activeEvent={activeEvent}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onGoToBarra={() => setCurrentView('pdv')}
          />
        ) : (
          <MenuScreen
            cocktails={cocktails}
            ingredients={ingredients}
            businessProfile={businessProfile}
            onAddOrder={handleAddOrder}
            onGoToCartaCompras={() => setCurrentView('carta_compras')}
          />
        )}
      </main>

      {/* ==================================================================== */}
      {/* MODALS & DRAWERS (DISCLOSURE ONLY WHEN USER CLICKS)                   */}
      {/* ==================================================================== */}

      {/* Matriz Rápida de Recetas, Insumos, Costos & Excel */}
      <RecipeCostMatrixModal
        isOpen={isRecipeMatrixOpen}
        onClose={() => setIsRecipeMatrixOpen(false)}
        cocktails={cocktails}
        setCocktails={setCocktails}
        ingredients={ingredients}
        setIngredients={setIngredients}
        businessProfile={businessProfile}
      />

      {/* Nuevo Proyecto / Turno */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onSaveEvent={handleSaveEvent}
      />

      {/* Plantilla Excel de Menú (.xlsx) */}
      <OlaClickExcelModal
        isOpen={isMenuExcelOpen}
        onClose={() => setIsMenuExcelOpen(false)}
        cocktails={cocktails}
        setCocktails={setCocktails}
        businessProfile={businessProfile}
      />

      {/* Asistente IA (Gemini) */}
      <AIAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        activeEvent={activeEvent}
        cocktails={cocktails}
        ingredients={ingredients}
        setIngredients={setIngredients}
        onAddOrder={handleAddOrder}
        onAddWaste={handleAddWaste}
      />

      {/* Gestión Avanzada (Cierre, Mermas & Tutorial) */}
      <ManagementDrawer
        isOpen={isManagementOpen}
        onClose={() => setIsManagementOpen(false)}
        activeEvent={activeEvent}
        cocktails={cocktails}
        ingredients={ingredients}
        setIngredients={setIngredients}
        onCloseEvent={handleCloseEvent}
        onAddWaste={handleAddWaste}
      />

      {/* Editor de Carta (Activar/Desactivar tragos) */}
      <MenuEditorModal
        isOpen={isMenuEditorOpen}
        onClose={() => setIsMenuEditorOpen(false)}
        cocktails={cocktails}
        setCocktails={setCocktails}
        ingredients={ingredients}
        onOpenEditCocktail={handleOpenEditCocktail}
      />

      {/* Editor de Receta Individual */}
      <EditCocktailModal
        isOpen={isEditCocktailOpen}
        onClose={() => {
          setIsEditCocktailOpen(false);
          setCocktailToEdit(null);
        }}
        cocktail={cocktailToEdit}
        onSave={handleSaveCocktail}
        ingredients={ingredients}
      />

      {/* Configuración de Evento / Stock Inicial */}
      <EventWizardModal
        isOpen={isEventWizardOpen}
        onClose={() => {
          setIsEventWizardOpen(false);
          setWizardTargetEvent(undefined);
        }}
        ingredients={ingredients}
        cocktails={cocktails}
        setCocktails={setCocktails}
        existingEvent={wizardTargetEvent}
        onSaveEvent={handleSaveEvent}
      />

      {/* Registro B2B Experiencia Cero */}
      <BusinessOnboardingModal
        isOpen={isBusinessOnboardingOpen}
        onClose={() => setIsBusinessOnboardingOpen(false)}
        businessProfile={businessProfile}
        onSaveProfile={handleSaveBusinessProfile}
        cocktails={cocktails}
        setCocktails={setCocktails}
        onOpenEventWizard={() => {
          setWizardTargetEvent(activeEvent);
          setIsEventWizardOpen(true);
        }}
        onOpenPublicMenu={() => setIsPublicMenuOpen(true)}
      />

      {/* Vista Previa de la Carta QR para Clientes */}
      <PublicMenuModal
        isOpen={isPublicMenuOpen}
        onClose={() => setIsPublicMenuOpen(false)}
        businessProfile={businessProfile}
        cocktails={cocktails}
        onOpenEditProfile={() => setIsBusinessOnboardingOpen(true)}
      />

      {/* Guía Rápida para Principiantes: ¿Qué se hace y por qué? */}
      <BarGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onGoToBarra={() => setCurrentView('pdv')}
      />

      {orderSyncError && <div role="alert" className="fixed bottom-4 inset-x-4 z-[100] rounded-xl bg-rose-800 text-white p-4 flex justify-between gap-3 text-sm">
        <span>{orderSyncError}</span><button onClick={() => setOrderSyncError('')} className="font-bold px-3">Cerrar</button>
      </div>}

      {/* Ticket Térmico de Comanda (Impresión y Envío a Preparación) */}
      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => {
          setIsTicketModalOpen(false);
          setTicketOrder(null);
        }}
        order={ticketOrder}
        businessProfile={businessProfile}
        autoPrintEnabled={autoPrintEnabled}
        paperWidth={printerPaperWidth}
        stationName={printerStationName}
        onToggleAutoPrint={val => {
          setAutoPrintEnabled(val);
          try {
            localStorage.setItem('altura_autoprint_v1', String(val));
          } catch (e) {
            console.error(e);
          }
        }}
        onGoToPreparacion={() => {
          setIsTicketModalOpen(false);
          setTicketOrder(null);
          setCurrentView('preparacion');
        }}
      />

      {/* Conexión e Instrucciones Impresora Térmica POS-D Basic 230 */}
      <PosDPrinterModal
        isOpen={isPrinterModalOpen}
        onClose={() => setIsPrinterModalOpen(false)}
        businessProfile={businessProfile}
        autoPrintEnabled={autoPrintEnabled}
        paperWidth={printerPaperWidth}
        stationName={printerStationName}
        onChangePaperWidth={width => {
          setPrinterPaperWidth(width);
          try {
            localStorage.setItem('altura_printer_width_v1', width);
          } catch (e) {
            console.error(e);
          }
        }}
        onChangeStationName={name => {
          setPrinterStationName(name);
          try {
            localStorage.setItem('altura_printer_station_v1', name);
          } catch (e) {
            console.error(e);
          }
        }}
        onToggleAutoPrint={val => {
          setAutoPrintEnabled(val);
          try {
            localStorage.setItem('altura_autoprint_v1', String(val));
          } catch (e) {
            console.error(e);
          }
        }}
        onTestPrint={() => {
          const testOrder: Order = {
            id: 'TEST-230',
            timestamp: Date.now(),
            orderType: 'venta',
            paymentMethod: 'yape_plin',
            items: [
              { cocktailId: 'cocktail-pisco-sour', cocktailName: 'Pisco Sour Clásico', quantity: 2, unitPrice: 32, unitCost: 4.8 },
              { cocktailId: 'food-sanguche-chicharron', cocktailName: 'Sánguche de Chicharrón Andino', quantity: 1, unitPrice: 26, unitCost: 7.5 },
            ],
            totalAmount: 90,
            notes: `Ticket de Prueba POS-D Basic 230 (${printerPaperWidth})`,
            status: 'preparing',
          };
          setIsPrinterModalOpen(false);
          handlePrintOrder(testOrder);
        }}
      />

      {/* Bloqueo de Seguridad con PIN */}
      <PinLockModal
        isOpen={isLocked}
        isChangeMode={false}
        businessProfile={businessProfile}
        onUnlock={() => setIsLocked(false)}
      />

      {/* Modal para Cambiar PIN */}
      <PinLockModal
        isOpen={isChangePinOpen}
        isChangeMode={true}
        businessProfile={businessProfile}
        onClose={() => setIsChangePinOpen(false)}
        onSaveNewPin={handleSaveNewPin}
      />
    </div>
  );
}
