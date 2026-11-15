import { useCatalogSync } from './hooks/useCatalogSync';
import { mergeCatalogQueue,restoreCatalogQueue } from './lib/catalogOutbox';
import { captureStockUsage, usageForOrder, applyStockUsage, validateStock, wastePackages, deleteOrderFromEvent } from './utils/inventoryLedger';
import { visibleOperations, isInTrash, trashOperation, restoreOperation } from './utils/operationTrash';
import { OperationEditModal, OperationTrashScreen } from './components/OperationManagement';
import { recipeConsumption, convertPresentationQuantity } from './utils/packaging';
import { updateEventInventory } from './utils/ingredientImport';
import { OperationsDashboard, OperationOverview } from './components/OperationsDashboard';
import { eventKind, eventInventory, consignmentSettlement, limaDate } from './utils/operationContext';
import React, { useState, useEffect, useRef } from 'react';
import { BarEvent, Cocktail, Ingredient, Order, WasteRecord, BusinessProfile, OrderPreparationStatus } from './types/bar';
import { INITIAL_EVENTS, INITIAL_COCKTAILS, INITIAL_INGREDIENTS, DEFAULT_BUSINESS_PROFILE } from './data/initialData';
import {
  changeOperationTrashState,
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
  const [catalogHydrated, setCatalogHydrated] = useState(!isSupabaseConfigured());
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
  const [analyticsScope,setAnalyticsScope] = useState<'context'|'general'>('context');
  const [editingOperationId,setEditingOperationId] = useState<string|null>(null);
  const [trashPinOpen,setTrashPinOpen] = useState(false);
  const [trashUnlocked,setTrashUnlocked] = useState(false);
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
        return mergeCatalogQueue('cocktails',parsed,restoreCatalogQueue(localStorage.getItem('altura_catalog_outbox_v1')));
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

  const catalogSync=useCatalogSync(ingredients,cocktails,catalogHydrated);
  const catalogReadyRef=useRef(catalogHydrated);
  catalogReadyRef.current=catalogHydrated;

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
      return saved !== null ? saved === 'true' : false;
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

        if (remote.isNewDatabase) {
          catalogSync.seed();
        } else {
          const merged=catalogSync.adoptRemote(remote.ingredients||[],remote.cocktails||[]);
          setIngredients(merged.ingredients);setCocktails(merged.cocktails);
        }
        setCatalogHydrated(true);

        if (remote.events && remote.events.length > 0) {
          knownRemoteOrders.current = new Set(remote.events.flatMap(e => e.orders.map(o => o.id)));
          setEvents(previous => remote.events!.map(event => {
            const orders = new Map(event.orders.map(order => [order.id, order]));
            for (const order of previous.find(e => e.id === event.id)?.orders || []) if (sessionOrderIds.current.has(order.id)) orders.set(order.id, order);
            for (const entry of Object.values(outbox.queueRef.current)) if (entry.eventId === event.id) orders.set(entry.order.id, entry.order);
            return { ...event, ...(event.status==='trashed'?{}:(eventSaves.current[event.id] || {})), orders: [...orders.values()] };
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
        await catalogSync.flush();
        const catalogVersion=catalogSync.version.current;
        const remote = await fetchInitialStateFromSupabase();
        if (cancelled) return;
        if (!remote?.events) { setConnection('offline'); return; }
        setConnection(navigator.onLine ? 'online' : 'offline');
        setLastSync(Date.now());
        if(catalogReadyRef.current&&catalogSync.version.current===catalogVersion){const merged=catalogSync.adoptRemote(remote.ingredients||[],remote.cocktails||[]);setIngredients(previous=>JSON.stringify(previous)===JSON.stringify(merged.ingredients)?previous:merged.ingredients);setCocktails(previous=>JSON.stringify(previous)===JSON.stringify(merged.cocktails)?previous:merged.cocktails);}
        setEvents(previous => previous.map(event => {
          const incoming = remote.events?.find(e => e.id === event.id);
          if (!incoming) return event;
          if(incoming.status==='trashed') {
            delete eventSaves.current[incoming.id];
            localStorage.setItem('altura_event_outbox_v1',JSON.stringify(eventSaves.current));
            return incoming;
          }
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
    if (catalogHydrated && isSupabaseConfigured()) {
      syncBusinessProfileToSupabase(businessProfile).catch(console.error);
    }
  }, [businessProfile, catalogHydrated]);

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

  }, [cocktails, catalogHydrated]);

  useEffect(() => {
    try {
      localStorage.setItem('altura_ingredients_v2', JSON.stringify(ingredients));
    } catch (e) {
      console.error(e);
    }

  }, [ingredients, catalogHydrated]);

  // Find currently active event
  const liveEvents = visibleOperations(events);
  const activeEvent = liveEvents.find(ev => ev.id === activeEventId) || liveEvents[0] || {...INITIAL_EVENTS[0],id:'no-operation-selected',name:'Selecciona una jornada o evento',status:'closed' as const};
  useEffect(()=>{
    if(currentView!=='papelera')setTrashUnlocked(false);
    if(events.find(event=>event.id===activeEventId)?.status==='trashed'&&currentView!=='inicio'&&currentView!=='papelera')setCurrentView('inicio');
  },[currentView,events,activeEventId]);
  const isSpecialEvent = eventKind(activeEvent) === 'evento';
  const activeCocktails = isSpecialEvent ? (activeEvent.recipeSnapshot || []) : cocktails;
  const activeIngredients = isSpecialEvent ? eventInventory(activeEvent, cocktails) : ingredients;
  const activeEventRef = useRef(activeEvent);
  activeEventRef.current = activeEvent;
  const updateActiveEventFields = (patch: Partial<BarEvent>) => {
    if(activeEventRef.current.status!=='active')throw new Error('La operación está cerrada. Su carta e inventario se conservan como historial.');
    const next = {...activeEventRef.current,...patch};
    activeEventRef.current = next;
    setEvents(previous=>previous.map(event=>event.id===next.id?{...event,...patch}:event));
    queueEventSave(next);
  };
  const setActiveIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>> = update => {
    if(activeEventRef.current.status!=='active')throw new Error('La operación está cerrada.');
    if (!isSpecialEvent) { setIngredients(update); return; }
    const event = activeEventRef.current;
    const current = eventInventory(event, cocktails);
    const next = typeof update === 'function' ? update(current) : update;
    updateActiveEventFields({inventory:updateEventInventory(event,current,next,ingredients)});
  };
  const setActiveCocktails: React.Dispatch<React.SetStateAction<Cocktail[]>> = update => {
    if(activeEventRef.current.status!=='active')throw new Error('La operación está cerrada.');
    if (!isSpecialEvent) { setCocktails(update); return; }
    const current = activeEventRef.current.recipeSnapshot || [];
    updateActiveEventFields({recipeSnapshot:typeof update === 'function' ? update(current) : update});
  };
  const activeBusinessProfile = isSpecialEvent ? {...businessProfile,categories:activeEvent.menuCategories || businessProfile.categories} : businessProfile;
  const setActiveBusinessProfile: React.Dispatch<React.SetStateAction<BusinessProfile>> = update => {
    if (!isSpecialEvent) {setBusinessProfile(update);return;}
    const current={...businessProfile,categories:activeEventRef.current.menuCategories || businessProfile.categories};
    const next=typeof update==='function'?update(current):update;
    updateActiveEventFields({menuCategories:next.categories.map(category=>({...category}))});
  };
  const handleTrashOperation = async (target:BarEvent) => {
    const current=events.find(event=>event.id===target.id);
    if(!current||isInTrash(current))throw new Error('Ya está en la papelera.');
    if(Object.values(outbox.queueRef.current).some(entry=>entry.eventId===current.id)||current.orders.some(order=>pendingOrders.current.has(order.id)))throw new Error('Hay pedidos sincronizándose. Espera a que terminen antes de eliminar.');
    if(isSupabaseConfigured()) {
      if(!navigator.onLine)throw new Error('Conéctate a internet para enviar este registro a la papelera en todos los dispositivos.');
      await flushEventSaves();
      if(eventSaves.current[current.id])throw new Error('Todavía se están guardando cambios. Vuelve a intentar en unos segundos.');
    }
    const next=trashOperation(current);
    await changeOperationTrashState(current,next);
    setEvents(previous=>previous.map(event=>event.id===next.id?{...event,...next}:event));
    if(activeEventId===next.id)setCurrentView('inicio');
    if(editingOperationId===next.id)setEditingOperationId(null);
  };
  const handleRestoreOperation = async (target:BarEvent) => {
    if(!trashUnlocked)throw new Error('Vuelve a ingresar el PIN para recuperar.');
    const current=events.find(event=>event.id===target.id);
    if(!current)throw new Error('No se encontró el registro.');
    if(isSupabaseConfigured()&&!navigator.onLine)throw new Error('Conéctate a internet para recuperar el registro.');
    const next=restoreOperation(current);
    await changeOperationTrashState(current,next);
    setEvents(previous=>previous.map(event=>event.id===next.id?{...next,orders:event.orders,wastes:event.wastes}:event));
  };
  const openOperation = (event: BarEvent) => {
    if(isInTrash(event))return;
    setActiveEventId(event.id);
    setAnalyticsScope('context');
    setMetricsPeriod('evento');
    setCurrentView('resumen');
  };
  const openGeneralResults = () => {
    setAnalyticsScope('general'); setMetricsPeriod('mes'); setCurrentView('ventas');
  };


  // Add order to active event & auto-deduct consumed stock from Bodega
  const handleAddOrder = (newOrder: Order) => {
    if (activeEvent.status !== 'active') throw new Error('Este registro está cerrado. Abre una jornada o evento desde Inicio.');
    newOrder={...newOrder,stockUsage:captureStockUsage(newOrder,activeCocktails,activeIngredients)};
    validateStock(newOrder.stockUsage!,activeIngredients);
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

    if(!isSpecialEvent)setIngredients(previous=>applyStockUsage(previous,newOrder.stockUsage!,-1));

  };

  const handleDeleteOrder = async (orderId: string) => {
    if(activeEvent.status!=='active')throw new Error('La operación está cerrada. No se pueden eliminar sus pedidos.');
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
      const nextEvent=deleteOrderFromEvent(activeEvent,order,activeCocktails,activeIngredients);
      setEvents(previous=>previous.map(event=>event.id===targetEventId?{...event,orders:event.orders.filter(existing=>existing.id!==orderId),retainedStockUsage:nextEvent.retainedStockUsage}:event));
      if(isSpecialEvent&&order.status&&order.status!=='preparing')queueEventSave(nextEvent);
      if(!isSpecialEvent&&(!order.status||order.status==='preparing'))setIngredients(previous=>applyStockUsage(previous,usageForOrder(order,activeCocktails,activeIngredients),1));

    } finally { pendingOrders.current.delete(orderId); }
  };

  // Add waste & auto-deduct from Bodega stock
  const handleAddWaste = (newWaste: WasteRecord) => {
    if(activeEvent.status!=='active')throw new Error('La operación está cerrada.');
    if(!Number.isFinite(newWaste.quantity)||newWaste.quantity<=0)throw new Error('La merma debe ser mayor que cero.');
    const affected=activeIngredients.find(ingredient=>ingredient.id===newWaste.ingredientId);
    if(newWaste.ingredientId&&!affected)throw new Error('El insumo no pertenece a esta operación.');
    if(affected&&wastePackages(newWaste,affected)>affected.currentStockUnits+1e-7)throw new Error('La merma supera las existencias disponibles.');
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
          const lostUnits = wastePackages(newWaste,ing);
          return {
            ...ing,
            currentStockUnits: Number(Math.max(0, ing.currentStockUnits - lostUnits).toFixed(8)),
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
    if (!target || target.status !== 'active' || closingEvents.current.has(eventId)) return;
    if (target.orders.some(order=>(order.status||'preparing')!=='delivered')) {setOrderSyncError('Hay pedidos sin entregar. Revisa Preparación antes de cerrar.');return;}
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
          return line ? {...ingredient,currentStockUnits:Number((ingredient.currentStockUnits+convertPresentationQuantity(line.retainedUnits,line.ingredient,ingredient)).toFixed(6))} : ingredient;
        }).concat(lines.filter(line=>!previous.some(i=>i.id===line.ingredient.id)&&line.retainedUnits>0).map(line=>({...line.ingredient,currentStockUnits:line.retainedUnits,initialStockUnits:line.retainedUnits}))));
      }
      setEvents(previous=>previous.map(event=>event.id===eventId?closed:event));
    } catch(error) { setOrderSyncError(error instanceof Error ? error.message : 'No se pudo confirmar el cierre. Revisa la conexión.'); }
    finally { closingEvents.current.delete(eventId); }
  };

  // Save Event from Wizard / NewProjectModal
  const handleSaveEvent = (savedEvent: BarEvent) => {
    if(events.find(event=>event.id===savedEvent.id)?.status==='trashed')return;
    if (eventKind(savedEvent)==='evento'&&!savedEvent.menuCategories) savedEvent={...savedEvent,menuCategories:businessProfile.categories.map(category=>({...category}))};
    setEvents(prev => {
      const exists = prev.some(ev => ev.id === savedEvent.id);
      if (exists) {
        return prev.map(ev => (ev.id === savedEvent.id ? {...savedEvent,orders:ev.orders,wastes:ev.wastes} : ev));
      }
      return [savedEvent, ...prev];
    });
    setActiveEventId(savedEvent.id);
    setAnalyticsScope('context');
    setCurrentView('resumen');

    if (isSupabaseConfigured()) {
      queueEventSave(savedEvent);
    }
  };

  // Save edited cocktail
  const handleSaveCocktail = (updated: Cocktail) => {
    setActiveCocktails(prev => prev.map(c => (c.id === updated.id ? updated : c)));
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
  const handleUpdateOrderStatus = async(orderId:string,status:OrderPreparationStatus) => {
    const eventId=activeEvent.id;
    if(activeEvent.status!=='active')throw new Error('La operación está cerrada.');
    if(pendingOrders.current.has(orderId))throw new Error('El pedido se está guardando. Espera un momento.');
    const order=activeEvent.orders.find(order=>order.id===orderId);
    if(!order)throw new Error('No se encontró el pedido.');
    const current=order.status||'preparing';
    if(!((current==='preparing'&&status==='ready')||(current==='ready'&&status==='delivered')))throw new Error('El estado cambió. Actualiza la preparación.');
    pendingOrders.current.add(orderId);
    try{
      if(isSupabaseConfigured()){
        const result=await updateOrderStatusInSupabase(orderId,status,current);
        if(!result.success)throw new Error(result.error||'No se pudo guardar el estado. Reintenta.');
      }
      setEvents(previous=>previous.map(event=>event.id===eventId?{...event,orders:event.orders.map(order=>order.id===orderId?{...order,status}:order)}:event));
    }finally{pendingOrders.current.delete(orderId);}
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
        onChangeView={view=>{if(view==='ventas'){setAnalyticsScope('context');setMetricsPeriod('evento');}setCurrentView(view);}}
        activeEvent={activeEvent}
        contextLabel={currentView==='ventas'&&analyticsScope==='general'?'Panorama general':isSpecialEvent?'Evento':'Bar habitual'}
        businessProfile={businessProfile}
        preparingCount={preparingCount}
        onOpenPublicMenu={() => setIsPublicMenuOpen(true)}
        onOpenPrinterModal={() => setIsPrinterModalOpen(true)}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenManagement={()=>setIsManagementOpen(true)}
        onOpenMenuExcel={() => setIsMenuExcelOpen(true)}
        onOpenOnboarding={() => setIsBusinessOnboardingOpen(true)}
        onLockApp={() => setIsLocked(true)}
        onOpenChangePin={() => setIsChangePinOpen(true)}
      />

      {currentView === 'preparacion' && <OrderConnection state={connection} lastSync={lastSync} />}
      {/* Main View Area: 100% Focused, Zero Visual Clutter */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
        {currentView==='papelera'&&trashUnlocked ? <OperationTrashScreen events={events.filter(isInTrash)} onRestore={handleRestoreOperation} onBack={()=>setCurrentView('inicio')}/>
        : currentView === 'inicio' ? <OperationsDashboard onTrash={handleTrashOperation} onEdit={event=>setEditingOperationId(event.id)} onOpenTrash={()=>setTrashPinOpen(true)} events={events} onOpen={openOperation} onCreate={type=>{setNewProjectType(type);setIsNewProjectModalOpen(true);}} onMonth={openGeneralResults} />
        : currentView === 'resumen' || (currentView === 'pdv' && activeEvent.status === 'closed') ? <OperationOverview key={activeEvent.id} event={activeEvent} onEdit={event=>setEditingOperationId(event.id)} onTrash={handleTrashOperation} cocktails={activeCocktails} catalog={ingredients} onConfigure={()=>setCurrentView('carta_compras')} onOrders={()=>setCurrentView('pdv')} onMetrics={()=>{setAnalyticsScope('context');setMetricsPeriod('evento');setCurrentView('ventas');}} onSave={handleSaveEvent} onClose={()=>handleCloseEvent(activeEvent.id)} />
        : currentView === 'carta_compras' ? (
          <CartaComprasScreen
            key={activeEvent.id}
            readOnly={activeEvent.status!=='active'}
            frozenPresentationIds={isSpecialEvent?(activeEvent.inventory||[]).filter(line=>line.openedUnits>0||(activeIngredients.find(i=>i.id===line.ingredient.id)?.currentStockUnits??line.receivedUnits)<line.receivedUnits-1e-8).map(line=>line.ingredient.id):[]}
            inventoryScope={isSpecialEvent ? 'evento' : 'bar'}
            ingredientCatalog={ingredients}
            barCocktails={cocktails}
            contextId={activeEvent.id}
            contextName={isSpecialEvent ? activeEvent.name : undefined}
            cocktails={activeCocktails}
            setCocktails={setActiveCocktails}
            ingredients={activeIngredients}
            setIngredients={setActiveIngredients}
            businessProfile={activeBusinessProfile}
            setBusinessProfile={setActiveBusinessProfile}
            onAddWaste={handleAddWaste}
          />
        ) : currentView === 'ventas' ? (
          <VentasScreen
            activeEvent={activeEvent}
            allEvents={liveEvents}
            cocktails={analyticsScope==='general'?cocktails:activeCocktails}
            ingredients={analyticsScope==='general'?ingredients:activeIngredients}
            scope={analyticsScope}
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
            key={activeEvent.id}
            menuScope={isSpecialEvent?'evento':'bar'}
            cocktails={activeCocktails}
            ingredients={activeIngredients}
            businessProfile={activeBusinessProfile}
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
        setCocktails={setActiveCocktails}
        ingredients={activeIngredients}
        setIngredients={setActiveIngredients}
        businessProfile={businessProfile}
      />

      {editingOperationId&&events.find(event=>event.id===editingOperationId)&&<OperationEditModal key={editingOperationId} event={events.find(event=>event.id===editingOperationId)!} onClose={()=>setEditingOperationId(null)} onSave={changes=>{const current=events.find(event=>event.id===changes.id);if(current&&!isInTrash(current))handleSaveEvent({...current,...changes});}}/>}
      <PinLockModal purpose="trash" isOpen={trashPinOpen} businessProfile={businessProfile} onClose={()=>setTrashPinOpen(false)} onUnlock={()=>{setTrashPinOpen(false);setTrashUnlocked(true);setCurrentView('papelera');}}/>

      {/* Nuevo Proyecto / Turno */}
      <NewProjectModal
        key={`${isNewProjectModalOpen}-${newProjectType}`}
        initialType={newProjectType}
        fixedType
        cocktails={cocktails}
        ingredients={ingredients}
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onSaveEvent={handleSaveEvent}
      />

      {/* Plantilla Excel de Menú (.xlsx) */}
      <OlaClickExcelModal
        readOnly={activeEvent.status!=='active'}
        key={`${activeEvent.id}-${isMenuExcelOpen}`}
        isOpen={isMenuExcelOpen}
        onClose={() => setIsMenuExcelOpen(false)}
        cocktails={activeCocktails}
        setCocktails={setActiveCocktails}
        businessProfile={businessProfile}
      />

      {/* Asistente IA (Gemini) */}
      <AIAssistantDrawer
        key={activeEvent.id}
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
        key={activeEvent.id}
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
        setCocktails={setActiveCocktails}
        ingredients={activeIngredients}
        onOpenEditCocktail={handleOpenEditCocktail}
      />

      {/* Editor de Receta Individual */}
      <EditCocktailModal
        key={`${cocktailToEdit?.id}-${isEditCocktailOpen}`}
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
        key={`${wizardTargetEvent?.id}-${isEventWizardOpen}`}
        isOpen={isEventWizardOpen}
        onClose={() => {
          setIsEventWizardOpen(false);
          setWizardTargetEvent(undefined);
        }}
        ingredients={activeIngredients}
        cocktails={activeCocktails}
        setCocktails={setActiveCocktails}
        existingEvent={wizardTargetEvent}
        onSaveEvent={handleSaveEvent}
      />

      {/* Registro B2B Experiencia Cero */}
      <BusinessOnboardingModal
        key={String(isBusinessOnboardingOpen)}
        isOpen={isBusinessOnboardingOpen}
        onClose={() => setIsBusinessOnboardingOpen(false)}
        businessProfile={businessProfile}
        onSaveProfile={handleSaveBusinessProfile}
        cocktails={activeCocktails}
        setCocktails={setActiveCocktails}
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
        businessProfile={activeBusinessProfile}
        cocktails={activeCocktails}
        onOpenEditProfile={() => setIsBusinessOnboardingOpen(true)}
      />

      {/* Guía Rápida para Principiantes: ¿Qué se hace y por qué? */}
      <BarGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onGoToBarra={() => setCurrentView('pdv')}
      />

      {(orderSyncError||catalogSync.error) && <div role="alert" className="fixed bottom-4 inset-x-4 z-[100] rounded-xl bg-rose-800 text-white p-4 flex justify-between gap-3 text-sm">
        <span>{orderSyncError||catalogSync.error}</span><button onClick={() => {setOrderSyncError('');catalogSync.dismissError();}} className="font-bold px-3">Cerrar</button>
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
