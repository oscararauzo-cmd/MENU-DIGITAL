import { OperationsDashboard, OperationOverview } from './components/OperationsDashboard';
import { eventKind, eventInventory, consignmentSettlement, limaDate } from './utils/operationContext';
import React, { useState, useEffect, useRef } from 'react';
import { BarEvent, Cocktail, Ingredient, Order, WasteRecord, BusinessProfile, OrderPreparationStatus } from './types/bar';
import { INITIAL_EVENTS, INITIAL_COCKTAILS, INITIAL_INGREDIENTS, DEFAULT_BUSINESS_PROFILE } from './data/initialData';
import {
  claimEventClose,
  deleteOrderFromSupabase,
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
import { useOrderOutbox } from './hooks/useOrderOutbox';
import { OrderConnection, type ConnectionState } from './components/OrderConnection';
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
  const eventSaves = useRef<Record<string, BarEvent>>((() => {
    try { return JSON.parse(localStorage.getItem('altura_event_outbox_v1') || '{}') || {}; } catch { return {}; }
  })());
  const eventSavesBusy = useRef(new Set<string>());
  const flushEventSaves = async () => {
    if (!isSupabaseConfigured() || !navigator.onLine) return;
    for (const event of Object.values(eventSaves.current)) {
      if (eventSavesBusy.current.has(event.id)) continue;
      eventSavesBusy.current.add(event.id);
      try {
        const result=await syncEventToSupabase(event);
        if (result.success && eventSaves.current[event.id] === event) {
          delete eventSaves.current[event.id];
          localStorage.setItem('altura_event_outbox_v1',JSON.stringify(eventSaves.current));
        }
      } finally { eventSavesBusy.current.delete(event.id); }
    }
  };
  const queueEventSave = (event:BarEvent) => {
    if (!isSupabaseConfigured()) return;
    eventSaves.current={...eventSaves.current,[event.id]:event};
    localStorage.setItem('altura_event_outbox_v1',JSON.stringify(eventSaves.current));
    void flushEventSaves();
  };
  const deletedOrders = useRef(new Set<string>());
  const knownRemoteOrders = useRef(new Set<string>());
  const pendingOrders = useRef(new Set<string>());
  const outbox = useOrderOutbox(pendingOrders);
  const sessionOrderIds = useRef(new Set(Object.keys(outbox.queue)));
  const [connection, setConnection] = useState<ConnectionState>(isSupabaseConfigured() ? 'connecting' : 'local');
  const [lastSync, setLastSync] = useState<number | null>(null);
  // Main View: 'pdv' (Barra) | 'carta_compras' (Carta & Compras) | 'ventas' (Caja & Mes) | 'preparacion' (Cocina/Prep)
  const [currentView, setCurrentView] = useState<MainAppView>('inicio');
  const [metricsPeriod, setMetricsPeriod] = useState<OperationMode>('evento');
  const [operationMode, setOperationMode] = useState<OperationMode>('dia');
  const [newProjectType, setNewProjectType] = useState<'dia'|'evento'>('dia');
  const closingEvents = useRef(new Set<string>());
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
    let savedEvents = INITIAL_EVENTS;
    try {
      const saved = localStorage.getItem('altura_events_v3');
      if (saved && Array.isArray(JSON.parse(saved))) savedEvents = JSON.parse(saved);
    } catch (e) { console.error('Error loading events:', e); }
    const local = new Map(savedEvents.map(event=>[event.id,event]));
    for (const event of Object.values(eventSaves.current)) local.set(event.id,{...event,orders:local.get(event.id)?.orders || event.orders});
    const recovered = [...local.values()].map(event => ({ ...event, orders: [...event.orders] }));
    for (const entry of Object.values(outbox.queue)) {
      let event = recovered.find(e => e.id === entry.eventId);
      if (!event) {
        event = { ...INITIAL_EVENTS[0], id: entry.eventId, name: 'Jornada recuperada', orders: [], wastes: [] };
        recovered.push(event);
      }
      if (!event.orders.some(o => o.id === entry.order.id)) event.orders.push(entry.order);
    }
    return recovered;
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
          knownRemoteOrders.current = new Set(remote.events.flatMap(e => e.orders.map(o => o.id)));
          setEvents(previous => remote.events!.map(event => {
            const orders = new Map(event.orders.map(order => [order.id, order]));
            for (const order of previous.find(e => e.id === event.id)?.orders || []) if (sessionOrderIds.current.has(order.id)) orders.set(order.id, order);
            for (const entry of Object.values(outbox.queueRef.current)) if (entry.eventId === event.id) orders.set(entry.order.id, entry.order);
            return { ...event, ...(eventSaves.current[event.id] || {}), orders: [...orders.values()] };
          }).concat(previous.filter(event => !remote.events!.some(e => e.id === event.id) && (eventSaves.current[event.id] || Object.values(outbox.queueRef.current).some(entry => entry.eventId === event.id)))));
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
        await flushEventSaves();
        const remote = await fetchInitialStateFromSupabase();
        if (cancelled) return;
        if (!remote?.events) { setConnection('offline'); return; }
        setConnection(navigator.onLine ? 'online' : 'offline');
        setLastSync(Date.now());
        setEvents(previous => previous.map(event => {
          const incoming = remote.events?.find(e => e.id === event.id);
          if (!incoming) return event;
          const remoteIds = new Set(incoming.orders.map(o => o.id));
          const merged = new Map(event.orders.filter(o => !deletedOrders.current.has(o.id) && (!knownRemoteOrders.current.has(o.id) || remoteIds.has(o.id) || pendingOrders.current.has(o.id) || outbox.queueRef.current[o.id])).map(o => [o.id, o]));
          for (const order of incoming.orders) {
            if (!pendingOrders.current.has(order.id) && !outbox.queueRef.current[order.id] && !deletedOrders.current.has(order.id)) merged.set(order.id, order);
          }
          for (const order of incoming.orders) knownRemoteOrders.current.add(order.id);
          return { ...(eventSaves.current[event.id] ? event : {...event,...incoming}), orders: [...merged.values()] };
        }).concat(remote.events!.filter(incoming=>!previous.some(event=>event.id===incoming.id))));
      } catch { if (!cancelled) setConnection('offline'); } finally { fetching = false; }
    };
    const offline = () => setConnection('offline');
    window.addEventListener('offline', offline);
    window.addEventListener('online', refresh);
    void refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => { cancelled = true; clearInterval(timer); window.removeEventListener('offline', offline); window.removeEventListener('online', refresh); };
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
  const isSpecialEvent = eventKind(activeEvent) === 'evento';
  const activeCocktails = isSpecialEvent ? (activeEvent.recipeSnapshot || cocktails) : cocktails;
  const activeIngredients = isSpecialEvent ? eventInventory(activeEvent, cocktails) : ingredients;
  const setActiveIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>> = update => {
    if (!isSpecialEvent) { setIngredients(update); return; }
    const next = typeof update === 'function' ? update(activeIngredients) : update;
    const inventory = next.map(ingredient => {
      const prior = activeEvent.inventory?.find(l=>l.ingredient.id===ingredient.id);
      const before = activeIngredients.find(i=>i.id===ingredient.id);
      const receivedUnits = prior ? Math.max(0, prior.receivedUnits + ingredient.currentStockUnits - (before?.currentStockUnits || 0)) : ingredient.currentStockUnits;
      return { ingredient: {...ingredient}, receivedUnits, openedUnits: prior?.openedUnits || 0 };
    });
    handleSaveEvent({...activeEvent, inventory});
  };
  const openOperation = (event: BarEvent) => {
    setActiveEventId(event.id);
    setOperationMode(eventKind(event));
    setMetricsPeriod('evento');
    setCurrentView('resumen');
  };
  const changeMode = (mode: OperationMode) => {
    if (mode === 'mes') { setMetricsPeriod('mes'); setOperationMode('mes'); setCurrentView('ventas'); return; }
    if (mode === 'dia') {
      const daily = events.find(e=>eventKind(e)==='dia' && e.date===limaDate() && e.status==='active');
      if (daily) { openOperation(daily); return; }
    }
    setCurrentView('inicio');
  };


  // Add order to active event & auto-deduct consumed stock from Bodega
  const handleAddOrder = (newOrder: Order) => {
    if (activeEvent.status === 'closed') throw new Error('Este registro está cerrado. Abre una jornada o evento desde Inicio.');
    if (isSpecialEvent) {
      const required = new Map<string,number>();
      for (const item of newOrder.items) for (const recipe of activeCocktails.find(c=>c.id===item.cocktailId)?.recipe || []) required.set(recipe.ingredientId,(required.get(recipe.ingredientId)||0)+recipe.amount*item.quantity);
      for (const [id, amount] of required) {
        const ingredient=activeIngredients.find(i=>i.id===id);
        if (!ingredient || ingredient.currentStockUnits * ingredient.volumePerUnitMl + 1e-8 < amount) throw new Error(`No hay suficiente ${ingredient?.name || 'stock asignado'} en este evento. Revisa sus insumos.`);
      }
    }
    if (sessionOrderIds.current.has(newOrder.id)) return;
    if (isSupabaseConfigured()) outbox.enqueue(newOrder, activeEvent.id, {...activeEvent,orders:[],wastes:[]});
    sessionOrderIds.current.add(newOrder.id);
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
      const cocktail = activeCocktails.find(c => c.id === item.cocktailId);
      if (!cocktail) continue;
      for (const r of cocktail.recipe) {
        const prevAmt = consumedByIng.get(r.ingredientId) || 0;
        consumedByIng.set(r.ingredientId, prevAmt + r.amount * item.quantity);
      }
    }

    if (!isSpecialEvent && consumedByIng.size > 0) {
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


  };

  const handleDeleteOrder = async (orderId: string) => {
    if (pendingOrders.current.has(orderId) || outbox.queueRef.current[orderId]) throw new Error('El pedido se está sincronizando. Espera un momento y vuelve a intentar.');
    const targetEventId = activeEvent.id;
    const order = activeEvent.orders.find(o => o.id === orderId);
    if (!order) return;
    pendingOrders.current.add(orderId);
    try {
      if (isSupabaseConfigured()) {
        const result = await deleteOrderFromSupabase(orderId);
        if (!result.success) throw new Error(result.error || 'No se pudo eliminar el pedido.');
      }
      deletedOrders.current.add(orderId);
      setEvents(prev => prev.map(ev => ev.id === targetEventId ? { ...ev, orders: ev.orders.filter(o => o.id !== orderId) } : ev));
      // Only an unprepared order returns its recipe consumption to inventory.
      if (!isSpecialEvent && (!order.status || order.status === 'preparing')) {
        const returned = new Map<string, number>();
        for (const item of order.items) {
          for (const recipe of cocktails.find(c => c.id === item.cocktailId)?.recipe || []) {
            returned.set(recipe.ingredientId, (returned.get(recipe.ingredientId) || 0) + recipe.amount * item.quantity);
          }
        }
        setIngredients(prev => prev.map(ing => ing.volumePerUnitMl > 0 && returned.has(ing.id) ? { ...ing, currentStockUnits: Number((ing.currentStockUnits + returned.get(ing.id)! / ing.volumePerUnitMl).toFixed(2)) } : ing));
      }
    } finally { pendingOrders.current.delete(orderId); }
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

    if (!isSpecialEvent && newWaste.ingredientId) {
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
  const handleCloseEvent = async (eventId: string) => {
    const target = events.find(ev => ev.id === eventId);
    if (!target || target.status === 'closed' || closingEvents.current.has(eventId)) return;
    if (Object.values(outbox.queueRef.current).some(entry=>entry.eventId===eventId)) { setOrderSyncError('Hay pedidos pendientes de envío. Espera a recuperar la conexión antes de cerrar.'); return; }
    const lines = consignmentSettlement(target,cocktails);
    if (target.isConsignment && !lines.every(line=>line.valid)) { setOrderSyncError('El consumo supera los insumos asignados. Revisa el cierre.'); return; }
    const closedAt=Date.now();
    const closed:BarEvent={...target,status:'closed',closedAt,inventorySettledAt:target.isConsignment?closedAt:target.inventorySettledAt};
    closingEvents.current.add(eventId);
    try {
      if (isSupabaseConfigured()) {
        if (!navigator.onLine) throw new Error('Conéctate a internet para confirmar el cierre y evitar una devolución duplicada.');
        await flushEventSaves();
        if (eventSaves.current[eventId]) throw new Error('Los insumos del evento todavía están pendientes de sincronizar. Vuelve a intentar en unos segundos.');
        if (!await claimEventClose(closed)) throw new Error('Este registro ya fue cerrado en otro dispositivo. Actualiza para ver su cierre.');
      }
      if (target.isConsignment && !target.inventorySettledAt) {
        setIngredients(previous=>previous.map(ingredient=>{
          const line=lines.find(l=>l.ingredient.id===ingredient.id);
          return line ? {...ingredient,currentStockUnits:Number((ingredient.currentStockUnits+line.retainedUnits).toFixed(4))} : ingredient;
        }).concat(lines.filter(line=>!previous.some(i=>i.id===line.ingredient.id)&&line.retainedUnits>0).map(line=>({...line.ingredient,currentStockUnits:line.retainedUnits,initialStockUnits:line.retainedUnits}))));
      }
      setEvents(previous=>previous.map(event=>event.id===eventId?closed:event));
    } catch(error) { setOrderSyncError(error instanceof Error ? error.message : 'No se pudo confirmar el cierre. Revisa la conexión.'); }
    finally { closingEvents.current.delete(eventId); }
  };

  // Save Event from Wizard / NewProjectModal
  const handleSaveEvent = (savedEvent: BarEvent) => {
    setEvents(prev => {
      const exists = prev.some(ev => ev.id === savedEvent.id);
      if (exists) {
        return prev.map(ev => (ev.id === savedEvent.id ? {...savedEvent,orders:ev.orders,wastes:ev.wastes} : ev));
      }
      return [savedEvent, ...prev];
    });
    setActiveEventId(savedEvent.id);
    setOperationMode(eventKind(savedEvent));
    setCurrentView('resumen');

    if (isSupabaseConfigured()) {
      queueEventSave(savedEvent);
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
        onChangeView={view=>{if(view==='ventas')setMetricsPeriod('evento');setCurrentView(view);}}
        activeEvent={activeEvent}
        events={events}
        onSelectEvent={id=>{const event=events.find(e=>e.id===id);if(event)openOperation(event);}}
        businessProfile={businessProfile}
        preparingCount={preparingCount}
        operationMode={operationMode}
        onChangeOperationMode={changeMode}
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

      {currentView === 'preparacion' && <OrderConnection state={connection} lastSync={lastSync} />}
      {/* Main View Area: 100% Focused, Zero Visual Clutter */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
        {currentView === 'inicio' ? <OperationsDashboard events={events} onOpen={openOperation} onCreate={type=>{setNewProjectType(type);setIsNewProjectModalOpen(true);}} onMonth={()=>changeMode('mes')} />
        : currentView === 'resumen' || (currentView === 'pdv' && activeEvent.status === 'closed') || (currentView === 'carta_compras' && isSpecialEvent) ? <OperationOverview key={activeEvent.id} event={activeEvent} cocktails={activeCocktails} catalog={ingredients} onOrders={()=>setCurrentView('pdv')} onMetrics={()=>{setMetricsPeriod('evento');setCurrentView('ventas');}} onSave={handleSaveEvent} onClose={()=>handleCloseEvent(activeEvent.id)} />
        : currentView === 'carta_compras' ? (
          <CartaComprasScreen
            cocktails={activeCocktails}
            setCocktails={setCocktails}
            ingredients={activeIngredients}
            setIngredients={setActiveIngredients}
            businessProfile={businessProfile}
            setBusinessProfile={setBusinessProfile}
            onAddWaste={handleAddWaste}
          />
        ) : currentView === 'ventas' ? (
          <VentasScreen
            activeEvent={activeEvent}
            allEvents={events}
            cocktails={activeCocktails}
            ingredients={activeIngredients}
            operationMode={metricsPeriod}
            onChangeOperationMode={setMetricsPeriod}
          />
        ) : currentView === 'preparacion' ? (
          <KdsScreen
            activeEvent={{ ...activeEvent, orders: activeEvent.orders.filter(o => !outbox.queue[o.id]) }}
            onDeleteOrder={handleDeleteOrder}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onGoToBarra={() => setCurrentView('pdv')}
          />
        ) : (
          <MenuScreen
            cocktails={activeCocktails}
            ingredients={activeIngredients}
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
        cocktails={activeCocktails}
        setCocktails={setCocktails}
        ingredients={activeIngredients}
        setIngredients={setActiveIngredients}
        businessProfile={businessProfile}
      />

      {/* Nuevo Proyecto / Turno */}
      <NewProjectModal
        key={`${isNewProjectModalOpen}-${newProjectType}`}
        initialType={newProjectType}
        cocktails={cocktails}
        ingredients={ingredients}
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onSaveEvent={handleSaveEvent}
      />

      {/* Plantilla Excel de Menú (.xlsx) */}
      <OlaClickExcelModal
        isOpen={isMenuExcelOpen}
        onClose={() => setIsMenuExcelOpen(false)}
        cocktails={activeCocktails}
        setCocktails={setCocktails}
        businessProfile={businessProfile}
      />

      {/* Asistente IA (Gemini) */}
      <AIAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        activeEvent={activeEvent}
        cocktails={activeCocktails}
        ingredients={activeIngredients}
        setIngredients={setActiveIngredients}
        onAddOrder={handleAddOrder}
        onAddWaste={handleAddWaste}
      />

      {/* Gestión Avanzada (Cierre, Mermas & Tutorial) */}
      <ManagementDrawer
        isOpen={isManagementOpen}
        onClose={() => setIsManagementOpen(false)}
        activeEvent={activeEvent}
        cocktails={activeCocktails}
        ingredients={activeIngredients}
        setIngredients={setActiveIngredients}
        onCloseEvent={handleCloseEvent}
        onAddWaste={handleAddWaste}
      />

      {/* Editor de Carta (Activar/Desactivar tragos) */}
      <MenuEditorModal
        isOpen={isMenuEditorOpen}
        onClose={() => setIsMenuEditorOpen(false)}
        cocktails={activeCocktails}
        setCocktails={setCocktails}
        ingredients={activeIngredients}
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
        ingredients={activeIngredients}
      />

      {/* Configuración de Evento / Stock Inicial */}
      <EventWizardModal
        isOpen={isEventWizardOpen}
        onClose={() => {
          setIsEventWizardOpen(false);
          setWizardTargetEvent(undefined);
        }}
        ingredients={activeIngredients}
        cocktails={activeCocktails}
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
        cocktails={activeCocktails}
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
        cocktails={activeCocktails}
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
