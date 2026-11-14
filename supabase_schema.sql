-- ============================================================================
-- BASE DE DATOS SUPABASE (POSTGRESQL) PARA SISTEMA DE BAR & RESTAURANTE
-- Listo para ejecutar 1 sola vez en: Supabase -> SQL Editor -> New Query -> Run
-- ============================================================================

-- 1. Tabla de Perfiles de Negocio / Restaurante / Bar
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id TEXT PRIMARY KEY DEFAULT 'default_profile',
  name TEXT NOT NULL DEFAULT 'ALTURA',
  tagline TEXT DEFAULT 'Coctelería de Autor & Bar Contemporáneo',
  sector TEXT DEFAULT 'bar',
  logo_url TEXT DEFAULT '/logo_altura.png',
  brand_color TEXT DEFAULT '#ea580c',
  currency_symbol TEXT DEFAULT 'S/.',
  categories_json JSONB DEFAULT '[]'::jsonb,
  is_configured BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. Tabla de Insumos Base (Bodega / Inventario)
CREATE TABLE IF NOT EXISTS public.ingredients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'licor',
  unit TEXT NOT NULL DEFAULT 'botella_750ml',
  package_cost NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  volume_per_unit_ml NUMERIC(10,2) NOT NULL DEFAULT 750,
  initial_stock_units NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  current_stock_units NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  min_alert_units NUMERIC(10,2) NOT NULL DEFAULT 2.00,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. Tabla de Cócteles, Bebidas y Tapas (Carta / Productos)
CREATE TABLE IF NOT EXISTS public.cocktails (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'clasico',
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  description TEXT DEFAULT '',
  illustration_key TEXT DEFAULT 'pisco-sour',
  enabled_for_event BOOLEAN DEFAULT true,
  color_gradient TEXT DEFAULT '',
  glass_type TEXT DEFAULT 'rocks',
  image_url TEXT DEFAULT '/assets/cocktails/pisco_sour.jpg',
  recipe_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. Tabla de Eventos / Jornadas / Proyectos
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active', -- 'active' o 'closed'
  initial_ingredients_snapshot JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  closed_at TIMESTAMPTZ
);

-- 5. Tabla de Comandas y Pedidos en Barra
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE,
  order_type TEXT NOT NULL DEFAULT 'venta', -- 'venta', 'dj', 'cortesia', 'staff'
  payment_method TEXT NOT NULL DEFAULT 'yape_plin', -- 'yape_plin', 'tarjeta', 'efectivo', 'cortesia'
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'preparing', -- 'preparing', 'ready', 'delivered'
  printed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 6. Tabla de Ítems de cada Pedido (Detalle)
CREATE TABLE IF NOT EXISTS public.order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  cocktail_id TEXT,
  cocktail_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 7. Tabla de Registro de Mermas y Roturas
CREATE TABLE IF NOT EXISTS public.wastes (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE,
  ingredient_id TEXT,
  cocktail_id TEXT,
  name TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1.00,
  unit TEXT NOT NULL DEFAULT 'botella',
  reason TEXT NOT NULL DEFAULT 'derrame',
  estimated_cost NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Índices para máxima velocidad en iPad
CREATE INDEX IF NOT EXISTS idx_orders_event_id ON public.orders(event_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_wastes_event_id ON public.wastes(event_id);

-- ============================================================================
-- POLÍTICAS DE SEGURIDAD RLS (Row Level Security)
-- ============================================================================

ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cocktails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wastes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Manage Business Profiles" ON public.business_profiles;
CREATE POLICY "Public Manage Business Profiles" ON public.business_profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Manage Ingredients" ON public.ingredients;
CREATE POLICY "Public Manage Ingredients" ON public.ingredients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Manage Cocktails" ON public.cocktails;
CREATE POLICY "Public Manage Cocktails" ON public.cocktails FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Manage Events" ON public.events;
CREATE POLICY "Public Manage Events" ON public.events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Manage Orders" ON public.orders;
CREATE POLICY "Public Manage Orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Manage Order Items" ON public.order_items;
CREATE POLICY "Public Manage Order Items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Manage Wastes" ON public.wastes;
CREATE POLICY "Public Manage Wastes" ON public.wastes FOR ALL USING (true) WITH CHECK (true);
