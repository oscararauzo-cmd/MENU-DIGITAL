export type IngredientCategory = 'licor' | 'mezclador' | 'fruta_jarabe' | 'comida_insumo' | 'guarnicion' | 'otro';

export type IngredientUnit = 'botella_750ml' | 'botella_1000ml' | 'botella_700ml' | 'lata_355ml' | 'botella_200ml' | 'litro' | 'kg' | 'unidad';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  unit: IngredientUnit;
  packageCost: number; // Costo por envase o unidad comprada en S/.
  volumePerUnitMl: number; // ml o unidades que rinde el envase
  initialStockUnits: number; // Stock al inicio del evento
  currentStockUnits: number; // Stock calculado actual
  minAlertUnits: number; // Alerta de stock mínimo
}

export interface RecipeItem {
  ingredientId: string;
  amount: number; // ml o unidades por trago
}

export type BusinessSector = 'bar' | 'restaurante' | 'heladeria' | 'cafeteria' | 'pizzeria';

export interface BusinessCategoryConfig {
  id: string;
  label: string;
  enabled: boolean;
}

export interface BusinessProfile {
  id: string;
  name: string;
  tagline: string;
  sector: BusinessSector;
  logoUrl: string;
  brandColor: string; // Hex color code
  currencySymbol: string;
  categories: BusinessCategoryConfig[];
  isConfigured: boolean;
  registeredAt?: number;
}

export type CocktailCategory = 'pisco' | 'autor' | 'clasico' | 'tapas_comida' | 'cerveza_sin_alcohol' | string;

export interface Cocktail {
  id: string;
  name: string;
  category: CocktailCategory;
  price: number; // Precio de venta en S/.
  description: string;
  recipe: RecipeItem[];
  illustrationKey?: string;
  enabledForEvent: boolean;
  colorGradient?: string;
  glassType?: 'coupe' | 'highball' | 'rocks' | 'martini' | 'copper_mug' | 'cerveza' | 'copa_vino';
  imageUrl?: string;
}

export type OrderType = 'venta' | 'dj' | 'cortesia' | 'staff';

export interface OrderItem {
  cocktailId: string;
  cocktailName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
}

export type OrderPreparationStatus = 'preparing' | 'ready' | 'delivered';

export type PaymentMethod = 'yape_plin' | 'tarjeta' | 'efectivo' | 'cortesia' | 'otro';

export interface Order {
  id: string;
  timestamp: number;
  orderType: OrderType;
  paymentMethod?: PaymentMethod;
  items: OrderItem[];
  totalAmount: number; // S/. 0 si es cortesia/dj
  notes?: string;
  status?: OrderPreparationStatus;
  printed?: boolean;
}

export interface WasteRecord {
  id: string;
  timestamp: number;
  ingredientId?: string;
  cocktailId?: string;
  name: string;
  quantity: number;
  unit: string;
  reason: 'rotura' | 'derrame' | 'degustacion' | 'caducado' | 'preparacion_errada';
  estimatedCost: number;
  notes?: string;
}

export interface BarEvent {
  id: string;
  name: string;
  date: string;
  status: 'active' | 'closed';
  createdAt: number;
  closedAt?: number;
  orders: Order[];
  wastes: WasteRecord[];
  initialIngredientsSnapshot: Record<string, number>; // ingredientId -> initialStock
}
