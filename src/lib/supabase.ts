import { encodeOrderNotes, decodeOrderNotes } from '../utils/inventoryLedger';
import { encodeIngredientUnit, decodeIngredientUnit } from '../utils/packaging';
import { encodeEventSnapshot, decodeEventSnapshot } from '../utils/operationContext';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Cocktail,
  Ingredient,
  BarEvent,
  Order,
  WasteRecord,
  BusinessProfile,
  OrderPreparationStatus,
} from '../types/bar';

/**
 * Cliente Supabase completo con carga inicial, sincronización bidireccional
 * y fallback seguro a localStorage cuando las variables aún no están configuradas.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('TU_PROYECTO')
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

// ============================================================================
// CARGA INICIAL COMPLETA DESDE SUPABASE
// ============================================================================
export interface LoadedSupabaseState {
  businessProfile?: BusinessProfile;
  cocktails?: Cocktail[];
  ingredients?: Ingredient[];
  isNewDatabase?: boolean;
  events?: BarEvent[];
}

export async function fetchInitialStateFromSupabase(): Promise<LoadedSupabaseState | null> {
  if (!supabase) return null;

  try {
    const [profileRes, ingRes, cockRes, eventsRes, ordersRes, itemsRes, wastesRes] = await Promise.all([
      supabase.from('business_profiles').select('*').limit(1),
      supabase.from('ingredients').select('*'),
      supabase.from('cocktails').select('*'),
      supabase.from('events').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: true }),
      supabase.from('order_items').select('*'),
      supabase.from('wastes').select('*'),
    ]);

    if (profileRes.error || ingRes.error || cockRes.error || eventsRes.error || ordersRes.error || itemsRes.error) return null;
    const result: LoadedSupabaseState = { ingredients: [], cocktails: [], events: [], isNewDatabase: !profileRes.data?.length && !ingRes.data?.length && !cockRes.data?.length && !eventsRes.data?.length };

    if (profileRes.data && profileRes.data.length > 0) {
      const p = profileRes.data[0];
      result.businessProfile = {
        id: p.id,
        name: p.name,
        tagline: p.tagline || '',
        sector: p.sector || 'bar',
        logoUrl: p.logo_url || '/logo_altura.png',
        brandColor: p.brand_color || '#ea580c',
        currencySymbol: p.currency_symbol || 'S/.',
        categories: typeof p.categories_json === 'string' ? JSON.parse(p.categories_json) : (p.categories_json || []),
        isConfigured: Boolean(p.is_configured),
        accessPin: p.access_pin || '1234',
      };
    }

    if (ingRes.data && ingRes.data.length > 0) {
      result.ingredients = ingRes.data.map((i: any) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        ...decodeIngredientUnit(i.unit),
        packageCost: Number(i.package_cost),
        volumePerUnitMl: Number(i.volume_per_unit_ml),
        initialStockUnits: Number(i.initial_stock_units),
        currentStockUnits: Number(i.current_stock_units),
        minAlertUnits: Number(i.min_alert_units),
      }));
    }

    if (cockRes.data && cockRes.data.length > 0) {
      result.cocktails = cockRes.data.map((c: any) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        price: Number(c.price),
        description: c.description || '',
        illustrationKey: c.illustration_key || 'pisco-sour',
        enabledForEvent: Boolean(c.enabled_for_event),
        colorGradient: c.color_gradient || '',
        glassType: c.glass_type || 'rocks',
        imageUrl: c.image_url || '/assets/cocktails/pisco_sour.jpg',
        recipe: typeof c.recipe_json === 'string' ? JSON.parse(c.recipe_json) : (c.recipe_json || []),
      }));
    }

    if (eventsRes.data && eventsRes.data.length > 0) {
      const itemsByOrder = new Map<string, any[]>();
      for (const it of itemsRes.data || []) {
        const list = itemsByOrder.get(it.order_id) || [];
        list.push({
          cocktailId: it.cocktail_id || '',
          cocktailName: it.cocktail_name,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unit_price),
          unitCost: Number(it.unit_cost),
        });
        itemsByOrder.set(it.order_id, list);
      }

      const ordersByEvent = new Map<string, Order[]>();
      for (const o of ordersRes.data || []) {
        if (!itemsByOrder.get(o.id)?.length) continue;
        const list = ordersByEvent.get(o.event_id) || [];
        list.push({
          id: o.id,
          timestamp: o.created_at ? new Date(o.created_at).getTime() : Date.now(),
          orderType: o.order_type || 'venta',
          paymentMethod: o.payment_method || 'yape_plin',
          items: itemsByOrder.get(o.id) || [],
          totalAmount: Number(o.total_amount),
          ...decodeOrderNotes(o.notes || ''),
          status: o.status || 'preparing',
          printed: Boolean(o.printed),
        });
        ordersByEvent.set(o.event_id, list);
      }

      const wastesByEvent = new Map<string, WasteRecord[]>();
      for (const w of wastesRes.data || []) {
        const list = wastesByEvent.get(w.event_id) || [];
        list.push({
          id: w.id,
          timestamp: w.created_at ? new Date(w.created_at).getTime() : Date.now(),
          ingredientId: w.ingredient_id,
          cocktailId: w.cocktail_id,
          name: w.name,
          quantity: Number(w.quantity),
          unit: w.unit,
          reason: w.reason,
          estimatedCost: Number(w.estimated_cost),
          notes: w.notes || '',
        });
        wastesByEvent.set(w.event_id, list);
      }

      result.events = eventsRes.data.map((ev: any) => ({
        id: ev.id,
        name: ev.name,
        date: ev.date,
        status: ev.status || 'active',
        createdAt: ev.created_at ? new Date(ev.created_at).getTime() : Date.now(),
        closedAt: ev.closed_at ? new Date(ev.closed_at).getTime() : undefined,
        orders: ordersByEvent.get(ev.id) || [],
        wastes: wastesByEvent.get(ev.id) || [],
        ...decodeEventSnapshot(ev.initial_ingredients_snapshot),
      }));
    }

    return result;
  } catch (err) {
    console.error('Error cargando estado inicial desde Supabase:', err);
    return null;
  }
}

// ============================================================================
// SINCRONIZACIÓN DE ESCRITURA EN TIEMPO REAL
// ============================================================================

export async function syncCocktailsToSupabase(cocktails: Cocktail[]): Promise<{ success: boolean; error?: string }> {
  if (!supabase || cocktails.length === 0) return { success: false };

  try {
    const records = cocktails.map(c => ({
      id: c.id,
      name: c.name,
      category: c.category,
      price: c.price,
      description: c.description,
      illustration_key: c.illustrationKey || 'pisco-sour',
      enabled_for_event: c.enabledForEvent,
      color_gradient: c.colorGradient || '',
      glass_type: c.glassType || 'rocks',
      image_url: c.imageUrl || '/assets/cocktails/pisco_sour.jpg',
      recipe_json: c.recipe || [],
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('cocktails').upsert(records, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Error sincronizando cocktails a Supabase:', err);
    return { success: false, error: err.message };
  }
}

export async function syncIngredientsToSupabase(ingredients: Ingredient[]): Promise<{ success: boolean; error?: string }> {
  if (!supabase || ingredients.length === 0) return { success: false };

  try {
    const records = ingredients.map(i => ({
      id: i.id,
      name: i.name,
      category: i.category,
      unit: encodeIngredientUnit(i),
      package_cost: i.packageCost,
      volume_per_unit_ml: i.volumePerUnitMl,
      initial_stock_units: i.initialStockUnits,
      current_stock_units: i.currentStockUnits,
      min_alert_units: i.minAlertUnits,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('ingredients').upsert(records, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Error sincronizando insumos a Supabase:', err);
    return { success: false, error: err.message };
  }
}

export async function syncEventToSupabase(event: BarEvent): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false };

  try {
    const existing = await supabase.from('events').select('status').eq('id',event.id).maybeSingle();
    if(existing.error) throw existing.error;
    if(existing.data?.status==='trashed'&&event.status!=='trashed') return {success:false,error:'El registro está en la papelera. Recupéralo antes de editar.'};

    const payload = {
      id:event.id,name:event.name,date:event.date,status:event.status,
      initial_ingredients_snapshot:encodeEventSnapshot(event),
      created_at:new Date(event.createdAt).toISOString(),
      closed_at:event.closedAt?new Date(event.closedAt).toISOString():null,
    };
    if(existing.data) {
      const result=await supabase.from('events').update(payload).eq('id',event.id).eq('status',existing.data.status).select('id');
      if(result.error)throw result.error;
      if(!result.data?.length)return {success:false,error:'El registro cambió en otro dispositivo.'};
    } else {
      const result=await supabase.from('events').upsert(payload,{onConflict:'id',ignoreDuplicates:true});
      if(result.error)throw result.error;
    }
    return { success: true };
  } catch (err: any) {
    console.error('Error sincronizando evento a Supabase:', err);
    return { success: false, error: err.message };
  }
}

export async function pushOrderToSupabase(order: Order, eventId: string, eventContext?: BarEvent): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false };

  try {
    // Asegurar que el evento padre exista en Supabase
    await supabase.from('events').upsert({
      id: eventId,
      name: eventContext?.name || 'Jornada de Barra',
      initial_ingredients_snapshot: eventContext ? encodeEventSnapshot(eventContext) : {},
      date: eventContext?.date || new Date().toISOString().split('T')[0],
      status: eventContext?.status || 'active',
    }, { onConflict: 'id', ignoreDuplicates: true });

    const parent = await supabase.from('events').select('status').eq('id',eventId).maybeSingle();
    if(parent.error) throw parent.error;
    if(parent.data?.status==='trashed') throw new Error('El evento está en la papelera; el pedido se conserva pendiente.');

    const { error: orderError } = await supabase.from('orders').upsert({
      id: order.id,
      event_id: eventId,
      order_type: order.orderType,
      payment_method: order.paymentMethod || 'yape_plin',
      total_amount: order.totalAmount,
      notes: encodeOrderNotes(order),
      status: order.status || 'preparing',
      printed: order.printed || false,
      created_at: new Date(order.timestamp).toISOString(),
    }, { onConflict: 'id', ignoreDuplicates: true });

    if (orderError) throw orderError;

    const itemRecords = order.items.map((item, idx) => ({
      id: `${order.id}-item-${idx}`,
      order_id: order.id,
      cocktail_id: item.cocktailId,
      cocktail_name: item.cocktailName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      unit_cost: item.unitCost,
    }));

    if (itemRecords.length > 0) {
      const { error: itemsError } = await supabase
        .from('order_items')
        .upsert(itemRecords, { onConflict: 'id', ignoreDuplicates: true });
      if (itemsError) throw itemsError;
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error enviando orden a Supabase:', err);
    return { success: false, error: err.message };
  }
}

export async function updateOrderStatusInSupabase(
  orderId: string,
  status: OrderPreparationStatus, previousStatus?:OrderPreparationStatus
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false };

  try {
    let query=supabase.from('orders').update({status}).eq('id',orderId);
    if(previousStatus)query=query.eq('status',previousStatus);
    const {data,error}=await query.select('id');
    if(error)throw error;
    if(!data?.length)return {success:false,error:'El pedido cambió en otro dispositivo o no se pudo guardar. Actualiza y reintenta.'};
    return { success: true };
  } catch (err: any) {
    console.error('Error actualizando estado en Supabase:', err);
    return { success: false, error: err.message };
  }
}

export async function pushWasteToSupabase(waste: WasteRecord, eventId: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false };

  try {
    const { error } = await supabase.from('wastes').upsert({
      id: waste.id,
      event_id: eventId,
      ingredient_id: waste.ingredientId || null,
      cocktail_id: waste.cocktailId || null,
      name: waste.name,
      quantity: waste.quantity,
      unit: waste.unit,
      reason: waste.reason,
      estimated_cost: waste.estimatedCost,
      notes: waste.notes || '',
      created_at: new Date(waste.timestamp).toISOString(),
    }, { onConflict: 'id' });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Error enviando merma a Supabase:', err);
    return { success: false, error: err.message };
  }
}

export async function syncBusinessProfileToSupabase(profile: BusinessProfile): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false };

  try {
    const payload: any = {
      id: profile.id || 'default_profile',
      name: profile.name,
      tagline: profile.tagline,
      sector: profile.sector,
      logo_url: profile.logoUrl,
      brand_color: profile.brandColor,
      currency_symbol: profile.currencySymbol,
      categories_json: profile.categories || [],
      is_configured: profile.isConfigured,
      updated_at: new Date().toISOString(),
    };
    if (profile.accessPin) {
      payload.access_pin = profile.accessPin;
    }

    const { error } = await supabase.from('business_profiles').upsert(payload, { onConflict: 'id' });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Error sincronizando perfil a Supabase:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteIngredientFromSupabase(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Sin conexión configurada' };
  const { error } = await supabase.from('ingredients').delete().eq('id', id);
  if (error) return { success: false, error: error.code === '23503' ? 'El insumo tiene registros vinculados en la base de datos. No se eliminó; revisa esos vínculos primero.' : 'No se pudo eliminar en la base de datos. Revisa la conexión y los permisos e intenta nuevamente.' };
  const verification = await supabase.from('ingredients').select('id').eq('id', id);
  if (verification.error || verification.data?.length) return { success: false, error: 'La base de datos no confirmó la eliminación. El insumo se conserva; revisa los permisos o vuelve a intentar.' };
  return { success: true };
}

export async function deleteOrderFromSupabase(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Sin conexión configurada' };
  // order_items are removed by the foreign key ON DELETE CASCADE.
  const { data, error } = await supabase.from('orders').delete().eq('id', id).select('id');
  return error ? { success: false, error: error.message } : data?.length ? { success: true } : { success: false, error: 'No se pudo verificar la eliminación del pedido.' };
}

export async function claimEventClose(event: BarEvent): Promise<boolean> {
  if (!supabase) return true;
  const { data, error } = await supabase.from('events').update({ status: 'closed', closed_at: new Date(event.closedAt!).toISOString(), initial_ingredients_snapshot: encodeEventSnapshot(event) }).eq('id', event.id).eq('status','active').select('id');
  if (error) throw error;
  return Boolean(data?.length);
}

export async function changeOperationTrashState(previous: BarEvent, next: BarEvent): Promise<void> {
  if (!supabase) return;
  let query=supabase.from('events').update({ status: next.status, initial_ingredients_snapshot: encodeEventSnapshot(next) }).eq('id',previous.id).eq('status',previous.status);
  if(previous.status==='trashed')query=query.eq('initial_ingredients_snapshot->__altura_context->>deletedAt',String(previous.deletedAt));
  const { data,error }=await query.select('id');
  if (error) throw new Error('No se pudo guardar el cambio en la papelera. Revisa la conexión y vuelve a intentar.');
  if (!data?.length) throw new Error('Este registro cambió en otro dispositivo. Espera a que se actualice y vuelve a intentar.');
}

export async function applyCatalogMutation(mutation:import('./catalogOutbox').CatalogMutation):Promise<{success:boolean;error?:string}>{
 if(!supabase)return {success:false};
 if(mutation.action==='upsert')return mutation.resource==='ingredients'?syncIngredientsToSupabase([mutation.record as Ingredient]):syncCocktailsToSupabase([mutation.record as Cocktail]);
 const {error}=await supabase.from(mutation.resource).delete().eq('id',mutation.id);
 if(error)return {success:false,error:error.message};
 const check=await supabase.from(mutation.resource).select('id').eq('id',mutation.id);
 return check.error||check.data?.length?{success:false,error:'No se pudo confirmar la eliminación.'}:{success:true};
}
