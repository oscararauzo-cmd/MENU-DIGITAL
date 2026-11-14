import { mergeImportedIngredients } from '../utils/ingredientImport';
import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Cocktail, Ingredient, BusinessProfile, WasteRecord } from '../types/bar';
import { DEFAULT_IMAGE_GALLERY } from '../data/initialData';
import { calculateCocktailUnitCost, getIngredientCostPerMl } from '../utils/calculations';
import {
  BookOpen,
  Package,
  Plus,
  Trash2,
  Download,
  Upload,
  Check,
  Layers,
  Boxes,
  Search,
  Eye,
  EyeOff,
  Sparkles,
  Tag,
  Image as ImageIcon,
  HelpCircle,
} from 'lucide-react';
import { deleteIngredientFromSupabase, isSupabaseConfigured, syncCocktailsToSupabase } from '../lib/supabase';
import { planIngredientDeletion } from '../utils/ingredientDeletion';
import { HelpTutorialModal } from './HelpTutorialModal';

interface CartaComprasScreenProps {
  inventoryScope?: 'bar' | 'evento';
  contextName?: string;
  ingredientCatalog?: Ingredient[];
  cocktails: Cocktail[];
  setCocktails: React.Dispatch<React.SetStateAction<Cocktail[]>>;
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  businessProfile: BusinessProfile;
  setBusinessProfile?: React.Dispatch<React.SetStateAction<BusinessProfile>>;
  onAddWaste?: (waste: WasteRecord) => void;
}

export const CartaComprasScreen: React.FC<CartaComprasScreenProps> = ({
  inventoryScope = 'bar', contextName, ingredientCatalog = [],
  cocktails,
  setCocktails,
  ingredients,
  setIngredients,
  businessProfile,
  setBusinessProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'carta' | 'compras'>(inventoryScope === 'evento' ? 'compras' : 'carta');
  const [selectedCocktailId, setSelectedCocktailId] = useState<string>(cocktails[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Dynamic Categories from BusinessProfile
  const editableCategories = useMemo(
    () => businessProfile.categories.filter(c => c.id !== 'all' && c.enabled),
    [businessProfile.categories]
  );

  // Add Category Inline State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [helpTopic, setHelpTopic] = useState<'carta' | 'consignacion'>('carta');

  // New Cocktail Simple Form
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCat, setNewProdCat] = useState(editableCategories[0]?.id || 'pisco');
  const [newProdPrice, setNewProdPrice] = useState('30.00');
  const [newProdImage, setNewProdImage] = useState(DEFAULT_IMAGE_GALLERY[0].url);
  const [showEditPhotoPicker, setShowEditPhotoPicker] = useState(false);

  const purchaseOptions = inventoryScope === 'evento'
    ? [...ingredients, ...ingredientCatalog.filter(item=>!ingredients.some(existing=>existing.id===item.id)).map(item=>({...item,currentStockUnits:0}))]
    : ingredients;
  // Quick Purchase Form (Compras de Insumos)
  const [purchaseIngId, setPurchaseIngId] = useState<string>(purchaseOptions[0]?.id || '');
  const [purchaseQty, setPurchaseQty] = useState('6');
  const [purchaseUnitCost, setPurchaseUnitCost] = useState(
    (purchaseOptions[0]?.packageCost ?? 38).toString()
  );

  // New Insumo Creator (inside Compras tab)
  const [isCreatingIng, setIsCreatingIng] = useState(false);
  const [newIngName, setNewIngName] = useState('');
  const [newIngCategory, setNewIngCategory] = useState<Ingredient['category']>('licor');
  const [newIngCost, setNewIngCost] = useState('45.00');
  const [newIngVolume, setNewIngVolume] = useState('750');
  const [newIngInitialStock, setNewIngInitialStock] = useState('6');

  // Active selected cocktail for editing
  const activeCocktail = cocktails.find(c => c.id === selectedCocktailId) || cocktails[0];
  const activeCost = activeCocktail ? calculateCocktailUnitCost(activeCocktail, ingredients) : 0;
  const activeMargin = activeCocktail ? activeCocktail.price - activeCost : 0;
  const activeMarginPct =
    activeCocktail && activeCocktail.price > 0 ? (activeMargin / activeCocktail.price) * 100 : 0;

  const filteredCocktails = cocktails.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateCocktailField = (updates: Partial<Cocktail>) => {
    if (!activeCocktail) return;
    setCocktails(prev =>
      prev.map(c => (c.id === activeCocktail.id ? { ...c, ...updates } : c))
    );
  };

  const handleDeleteActiveCocktail = () => {
    if (!activeCocktail) return;
    const remaining = cocktails.filter(c => c.id !== activeCocktail.id);
    setCocktails(remaining);
    setSelectedCocktailId(remaining[0]?.id || '');
    setStatusMessage(`✓ "${activeCocktail.name}" eliminado de la carta.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const [deletingIngredient, setDeletingIngredient] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const deleteLock = useRef(false);
  const handleDeleteIngredient = async (ingredient: Ingredient) => {
    if (deleteLock.current) return;
    deleteLock.current = true;
    setDeleteBusy(true);
    setDeleteError('');
    const plan = planIngredientDeletion(cocktails, ingredient.id);
    let recipesUpdated = false;
    try {
      if (inventoryScope === 'bar' && isSupabaseConfigured()) {
        if (!navigator.onLine) throw new Error('No hay conexión. El insumo se conserva; vuelve a intentar cuando tengas internet.');
        if (plan.affected.length) {
          const changed = plan.cocktails.filter(c => plan.affected.some(original => original.id === c.id));
          const result = await syncCocktailsToSupabase(changed);
          if (!result.success) throw new Error('No se pudieron actualizar las recetas. El insumo se conserva.');
          recipesUpdated = true;
        }
        const result = await deleteIngredientFromSupabase(ingredient.id);
        if (!result.success) throw new Error(result.error || 'No se pudo eliminar el insumo.');
      }
      setCocktails(previous => planIngredientDeletion(previous, ingredient.id).cocktails);
      setIngredients(previous => previous.filter(i => i.id !== ingredient.id));
      if (purchaseIngId === ingredient.id) setPurchaseIngId(ingredients.find(i => i.id !== ingredient.id)?.id || '');
      setDeletingIngredient(null);
      setStatusMessage(`✓ ${ingredient.name} eliminado.${plan.affected.length ? ` ${plan.affected.length} producto(s) pausados para revisar su receta.` : ''}`);
    } catch (error) {
      let message = error instanceof Error ? error.message : 'No se pudo eliminar el insumo. Vuelve a intentar.';
      if (recipesUpdated) {
        const restored = await syncCocktailsToSupabase(plan.affected);
        if (!restored.success) {
          setCocktails(previous => planIngredientDeletion(previous, ingredient.id).cocktails);
          message += ' Los productos afectados quedaron pausados; revisa sus recetas al recuperar la conexión.';
        }
      }
      setDeleteError(message);
    } finally {
      deleteLock.current = false;
      setDeleteBusy(false);
    }
  };

  const handleUpdateRecipeAmount = (ingredientId: string, amount: number) => {
    if (!activeCocktail) return;
    setCocktails(prev =>
      prev.map(c => {
        if (c.id !== activeCocktail.id) return c;
        const newRecipe = c.recipe.map(r =>
          r.ingredientId === ingredientId ? { ...r, amount: Math.max(0, amount) } : r
        );
        return { ...c, recipe: newRecipe };
      })
    );
  };

  const handleRemoveRecipeItem = (ingredientId: string) => {
    if (!activeCocktail) return;
    setCocktails(prev =>
      prev.map(c => {
        if (c.id !== activeCocktail.id) return c;
        return {
          ...c,
          recipe: c.recipe.filter(r => r.ingredientId !== ingredientId),
        };
      })
    );
  };

  const handleAddRecipeItem = (ingredientId: string) => {
    if (!activeCocktail) return;
    setCocktails(prev =>
      prev.map(c => {
        if (c.id !== activeCocktail.id) return c;
        if (c.recipe.some(r => r.ingredientId === ingredientId)) return c;
        return {
          ...c,
          recipe: [...c.recipe, { ingredientId, amount: 30 }],
        };
      })
    );
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newCategoryLabel.trim();
    if (!label || !setBusinessProfile) return;

    const id = label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '') || `cat_${Date.now()}`;

    setBusinessProfile(prev => {
      if (prev.categories.some(c => c.id === id)) return prev;
      return {
        ...prev,
        categories: [...prev.categories, { id, label, enabled: true }],
      };
    });

    setNewProdCat(id);
    setNewCategoryLabel('');
    setIsAddingCategory(false);
    setStatusMessage(`✓ Categoría "${label}" agregada a tu carta y barra.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDeleteCategory = (catId: string, catLabel: string) => {
    if (!setBusinessProfile) return;
    if (window.confirm(`¿Estás seguro de eliminar la categoría "${catLabel}"? Los tragos asociados se mantendrán en la carta.`)) {
      setBusinessProfile(prev => ({
        ...prev,
        categories: prev.categories.filter(c => c.id !== catId),
      }));
      setStatusMessage(`✓ Categoría "${catLabel}" eliminada.`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleToggleCocktailVisibility = (cocktailId: string, enable: boolean) => {
    setCocktails(prev =>
      prev.map(c => (c.id === cocktailId ? { ...c, enabledForEvent: enable } : c))
    );
    setSelectedCocktailId(cocktailId);
  };

  const handleActivateAllLibrary = () => {
    setCocktails(prev => prev.map(c => ({ ...c, enabledForEvent: true })));
    setStatusMessage('✓ Todos los tragos y tapas sugeridos con foto fueron activados.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const newCocktail: Cocktail = {
      id: `cocktail-${Date.now()}`,
      name: newProdName.trim(),
      category: newProdCat,
      price: parseFloat(newProdPrice) || 25,
      description: 'Producto registrado en carta.',
      recipe: ingredients[0] ? [{ ingredientId: ingredients[0].id, amount: 60 }] : [],
      enabledForEvent: true,
      illustrationKey: 'pisco-sour',
      colorGradient: 'from-amber-400 to-orange-500',
      glassType: 'rocks',
      imageUrl: newProdImage || '/assets/cocktails/pisco_sour.jpg',
    };

    setCocktails(prev => [newCocktail, ...prev]);
    setSelectedCocktailId(newCocktail.id);
    setNewProdName('');
    setIsCreatingProduct(false);
    setStatusMessage(`✓ ¡"${newCocktail.name}" añadido a la carta con éxito!`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleRegisterPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(purchaseQty) || 0;
    const cost = parseFloat(purchaseUnitCost) || 0;
    if (qty <= 0) return;

    const targetIng = purchaseOptions.find(i => i.id === purchaseIngId);
    if (!targetIng) return;

    setIngredients(prev => prev.some(i=>i.id===purchaseIngId) ? prev.map(i=>i.id===purchaseIngId ? {...i,currentStockUnits:i.currentStockUnits+qty,packageCost:cost>0?cost:i.packageCost} : i) : [...prev,{...targetIng,currentStockUnits:qty,initialStockUnits:qty,packageCost:cost>0?cost:targetIng.packageCost}]);

    setStatusMessage(`✓ +${qty} unidades de ${targetIng.name} agregadas ${inventoryScope === 'evento' ? 'a este evento' : 'a bodega'}.`);
    setTimeout(() => setStatusMessage(null), 3500);
    setPurchaseQty('6');
  };

  const handleCreateIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngName.trim()) return;

    const initialQty = parseFloat(newIngInitialStock) || 0;
    const newIng: Ingredient = {
      id: `ing-${Date.now()}`,
      name: newIngName.trim(),
      category: newIngCategory,
      unit: newIngCategory === 'otro' ? 'unidad' : 'botella_750ml',
      packageCost: parseFloat(newIngCost) || 35,
      volumePerUnitMl: parseFloat(newIngVolume) || 750,
      initialStockUnits: initialQty,
      currentStockUnits: initialQty,
      minAlertUnits: 2,
    };

    setIngredients(prev => [newIng, ...prev]);
    setPurchaseIngId(newIng.id);
    setPurchaseUnitCost(newIng.packageCost.toString());
    setNewIngName('');
    setIsCreatingIng(false);
    setStatusMessage(`✓ Nuevo insumo "${newIng.name}" guardado en bodega.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleUpdateIngredientQuick = (id: string, updates: Partial<Ingredient>) => {
    setIngredients(prev => prev.map(i => (i.id === id ? { ...i, ...updates } : i)));
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Carta, Precios, Costos & Recetas
    const headers = [
      'Categoría',
      'Producto',
      'Visible en iPad',
      'Precio Venta (S/.)',
      'Costo Insumos (S/.)',
      'Margen Bruto (S/.)',
      'Margen (%)',
      'Insumos que lleva',
    ];

    const rows = cocktails.map(c => {
      const cost = calculateCocktailUnitCost(c, ingredients);
      const margin = c.price - cost;
      const marginPct = c.price > 0 ? (margin / c.price) * 100 : 0;
      const recipeText = c.recipe
        .map(r => {
          const ing = ingredients.find(i => i.id === r.ingredientId);
          return `${ing?.name || 'Insumo'} (${r.amount}${ing?.category === 'otro' ? 'un' : 'ml'})`;
        })
        .join(', ');

      return [
        c.category,
        c.name,
        c.enabledForEvent ? 'Sí' : 'Oculto',
        Number(c.price.toFixed(2)),
        Number(cost.toFixed(2)),
        Number(margin.toFixed(2)),
        Number(marginPct.toFixed(1)) + '%',
        recipeText || 'Sin insumos',
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [
      { wch: 18 },
      { wch: 28 },
      { wch: 15 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 12 },
      { wch: 50 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Carta_y_Costos');

    // Hoja 2: Inventario de Insumos y Costo Botella
    const ingHeaders = [
      'Insumo',
      'Categoría',
      'Presentación',
      'Costo Paquete (S/.)',
      'Rinde (ml/un)',
      'Stock Actual',
      'Stock Mínimo',
    ];
    const ingRows = ingredients.map(i => [
      i.name,
      i.category,
      i.unit,
      Number(i.packageCost.toFixed(2)),
      i.volumePerUnitMl,
      i.currentStockUnits,
      i.minAlertUnits,
    ]);
    const wsIng = XLSX.utils.aoa_to_sheet([ingHeaders, ...ingRows]);
    wsIng['!cols'] = [
      { wch: 28 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, wsIng, 'Inventario_Bodega');

    XLSX.writeFile(wb, `Carta_Precios_Insumos_${businessProfile.name || 'Bar'}.xlsx`);

    setStatusMessage('✓ Archivo Excel (.xlsx) descargado con Carta e Inventario.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        // Buscar hoja de inventario o tomar la primera
        const sheetName =
          wb.SheetNames.find(
            n =>
              n.toLowerCase().includes('inventario') ||
              n.toLowerCase().includes('insumo') ||
              n.toLowerCase().includes('bodega')
          ) || wb.SheetNames[0];

        const ws = wb.Sheets[sheetName];
        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (!data || data.length < 2) {
          setStatusMessage('⚠️ El archivo Excel no contiene filas de datos.');
          setTimeout(() => setStatusMessage(null), 3500);
          return;
        }

        // Buscar encabezados
        const headers = data[0].map((h: any) => String(h || '').toLowerCase().trim());
        const nameIdx = headers.findIndex(h => h.includes('insumo') || h.includes('nombre') || h.includes('producto'));
        const catIdx = headers.findIndex(h => h.includes('categor'));
        const unitIdx = headers.findIndex(h => h.includes('present') || h.includes('unidad'));
        const costIdx = headers.findIndex(h => h.includes('costo') || h.includes('precio'));
        const volumeIdx = headers.findIndex(h => h.includes('rinde') || h.includes('ml') || h.includes('volumen'));
        const stockIdx = headers.findIndex(h => h.includes('stock actual') || h.includes('stock') || h.includes('cantidad'));
        const minIdx = headers.findIndex(h => h.includes('mínimo') || h.includes('min') || h.includes('alerta'));

        const parsedIngredients: Ingredient[] = [];

        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;
          const name = nameIdx !== -1 ? String(row[nameIdx] || '').trim() : String(row[0] || '').trim();
          if (!name || name.toLowerCase().includes('total')) continue;

          const rawCat = catIdx !== -1 ? String(row[catIdx] || '').toLowerCase() : 'licor';
          const category: Ingredient['category'] = rawCat.includes('mezclador')
            ? 'mezclador'
            : rawCat.includes('fruta') || rawCat.includes('jarabe')
            ? 'fruta_jarabe'
            : rawCat.includes('comida')
            ? 'comida_insumo'
            : rawCat.includes('guarnicion')
            ? 'guarnicion'
            : rawCat.includes('otro')
            ? 'otro'
            : 'licor';

          const rawUnit = unitIdx !== -1 ? String(row[unitIdx] || '').toLowerCase() : 'botella_750ml';
          const unit: Ingredient['unit'] = rawUnit.includes('1000') || rawUnit.includes('1l')
            ? 'botella_1000ml'
            : rawUnit.includes('litro')
            ? 'litro'
            : rawUnit.includes('kg')
            ? 'kg'
            : rawUnit.includes('lata')
            ? 'lata_355ml'
            : rawUnit.includes('unidad')
            ? 'unidad'
            : 'botella_750ml';

          const packageCost =
            costIdx !== -1
              ? parseFloat(String(row[costIdx]).replace(/[^0-9.]/g, '')) || 0
              : parseFloat(String(row[3])) || 0;

          const volumePerUnitMl =
            volumeIdx !== -1 ? parseFloat(String(row[volumeIdx])) || 750 : 750;

          const currentStockUnits =
            stockIdx !== -1 ? parseFloat(String(row[stockIdx])) || 0 : parseFloat(String(row[5])) || 0;

          const minAlertUnits =
            minIdx !== -1 ? parseFloat(String(row[minIdx])) || 2 : 2;

          const existing = ingredients.find(ing => ing.name.toLowerCase() === name.toLowerCase());
          const id = existing?.id || `ing-${Date.now()}-${i}`;

          parsedIngredients.push({
            id,
            name,
            category,
            unit,
            packageCost,
            volumePerUnitMl,
            initialStockUnits: currentStockUnits,
            currentStockUnits,
            minAlertUnits,
          });
        }

        if (parsedIngredients.length > 0) {
          setIngredients(prev => mergeImportedIngredients(prev, parsedIngredients));
          setStatusMessage(`✓ Se importaron ${parsedIngredients.length} insumos exitosamente.`);
          setTimeout(() => setStatusMessage(null), 4000);
        } else {
          setStatusMessage('⚠️ No se encontraron insumos válidos en el archivo.');
          setTimeout(() => setStatusMessage(null), 3000);
        }
      } catch (err: any) {
        console.error(err);
        setStatusMessage('Error al procesar el archivo Excel.');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    };

    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col bg-[#faf8f5] text-stone-900 overflow-hidden font-sans">
      {statusMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold text-center shadow-sm animate-fade-in flex items-center justify-center gap-2 shrink-0">
          <Check className="w-4 h-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {inventoryScope === 'evento' && <div className="px-4 sm:px-6 py-2 bg-orange-50 border-b border-orange-100 text-xs text-orange-900 shrink-0"><strong>Evento: {contextName}</strong> · Insumos, cantidades y Excel de este evento. El inventario habitual del bar se mantiene separado.</div>}
      {/* Top Navigation */}
      <div className="px-4 sm:px-6 py-3 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-2xl border border-stone-200">
          <button
            onClick={() => setActiveTab('carta')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'carta'
                ? 'bg-white text-orange-600 shadow-xs font-extrabold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Carta, Precios & Recetas</span>
          </button>

          <button
            onClick={() => setActiveTab('compras')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'compras'
                ? 'bg-white text-orange-600 shadow-xs font-extrabold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>{inventoryScope === 'evento' ? 'Insumos del evento' : 'Compras de Insumos & Bodega'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setHelpTopic(activeTab === 'carta' ? 'carta' : 'consignacion');
              setIsHelpModalOpen(true);
            }}
            className="h-8 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
            title="Ver mini-tutorial y guía práctica"
          >
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Tutorial & Ayuda</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportExcel}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-700/20 transition active:scale-95 cursor-pointer"
            title="Subir archivo Excel con insumos o compras para cargarlos automáticamente"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Subir Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-orange-500/20 transition active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Excel</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CARTA, PRECIOS & RECETAS */}
      {activeTab === 'carta' && (
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Product List */}
          <div className="w-full md:w-5/12 lg:w-4/12 bg-white border-b md:border-b-0 md:border-r border-stone-200 flex flex-col overflow-hidden max-h-[38dvh] md:max-h-none min-h-0">
            <div className="p-3 border-b border-stone-200 space-y-2 shrink-0">
              <div className="flex items-center justify-between gap-1.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar trago o tapa..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {setBusinessProfile && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(prev => !prev)}
                    className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold shrink-0 transition cursor-pointer flex items-center gap-1"
                    title="Agregar una categoría nueva (ej. Shots, Botellas)"
                  >
                    <Tag className="w-3 h-3 text-orange-600" />
                    <span>+ Cat</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsCreatingProduct(prev => !prev)}
                  className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shrink-0 transition active:scale-95 cursor-pointer"
                >
                  + Crear
                </button>
              </div>

              {isAddingCategory && setBusinessProfile && (
                <div className="p-3 bg-orange-50/80 rounded-2xl border border-orange-200 space-y-2 text-xs animate-fade-in shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-orange-950 text-[11px] uppercase tracking-wider">
                      Gestionar Categorías
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(false)}
                      className="text-stone-400 hover:text-stone-700 font-bold text-xs cursor-pointer"
                    >
                      ✕ Cerrar
                    </button>
                  </div>

                  <form onSubmit={handleAddCategory} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Nueva categoría (ej. Shots, Promos)..."
                      value={newCategoryLabel}
                      onChange={e => setNewCategoryLabel(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-orange-500 text-xs"
                      required
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold cursor-pointer shrink-0 text-xs"
                    >
                      + Agregar
                    </button>
                  </form>

                  {/* Lista de categorías para eliminar */}
                  <div className="pt-2 border-t border-orange-200/60">
                    <span className="text-[10px] text-stone-500 block mb-1.5">
                      Categorías activas (toca el tacho 🗑️ para eliminarla):
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      {businessProfile.categories.map(cat => (
                        <div
                          key={cat.id}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-xs text-stone-800 font-medium shadow-2xs"
                        >
                          <span>{cat.label}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id, cat.label)}
                            className="p-0.5 text-stone-400 hover:text-rose-600 transition cursor-pointer"
                            title={`Eliminar categoría "${cat.label}"`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isCreatingProduct && (
              <form
                onSubmit={handleSaveProduct}
                className="p-3 bg-orange-50/60 border-b border-orange-200 space-y-2 text-xs shrink-0 max-h-60 overflow-y-auto"
              >
                <span className="font-bold text-orange-950 block">Nuevo Trago o Tapa:</span>
                <input
                  type="text"
                  placeholder="Nombre del trago..."
                  value={newProdName}
                  onChange={e => setNewProdName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-stone-900"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newProdCat}
                    onChange={e => setNewProdCat(e.target.value)}
                    className="px-2 py-1.5 bg-white border border-stone-300 rounded-lg font-bold"
                  >
                    {editableCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Precio Venta S/."
                    value={newProdPrice}
                    onChange={e => setNewProdPrice(e.target.value)}
                    className="px-2 py-1.5 bg-white border border-stone-300 rounded-lg font-mono font-bold text-right"
                  />
                </div>

                {/* Visual Default Image Picker */}
                <div>
                  <span className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                    Foto por defecto:
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {DEFAULT_IMAGE_GALLERY.map(img => (
                      <button
                        key={img.url}
                        type="button"
                        onClick={() => setNewProdImage(img.url)}
                        className={`w-9 h-9 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition ${
                          newProdImage === img.url
                            ? 'border-orange-600 scale-105 shadow-xs'
                            : 'border-stone-200 opacity-70 hover:opacity-100'
                        }`}
                        title={img.label}
                      >
                        <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingProduct(false)}
                    className="px-2.5 py-1 text-stone-500 hover:text-stone-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            )}

            <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-3 bg-[#faf8f5]">
              {/* Section 1: Active on Bar */}
              <div className="space-y-1.5">
                <div className="px-1 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                    ✓ En tu Barra ({filteredCocktails.filter(c => c.enabledForEvent).length})
                  </span>
                </div>

                {filteredCocktails
                  .filter(item => item.enabledForEvent)
                  .map(item => {
                    const isSelected = item.id === selectedCocktailId;
                    const cost = calculateCocktailUnitCost(item, ingredients);
                    const margin = item.price - cost;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedCocktailId(item.id)}
                        className={`p-2.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-white border-orange-500 shadow-md ring-2 ring-orange-500/20'
                            : 'bg-white border-stone-200 hover:border-orange-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={item.imageUrl || '/assets/cocktails/pisco_sour.jpg'}
                            alt={item.name}
                            className="w-10 h-10 rounded-xl object-cover border border-stone-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-stone-900 truncate">{item.name}</p>
                            <p className="text-[10px] text-stone-400 capitalize truncate">
                              {editableCategories.find(c => c.id === item.category)?.label || item.category}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-extrabold text-xs text-orange-600 block">
                            S/. {item.price.toFixed(2)}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-600 font-bold block">
                            +S/. {margin.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Section 2: Default Examples Library with Photos (1-click Activate) */}
              {filteredCocktails.some(c => !c.enabledForEvent) && (
                <div className="space-y-1.5 pt-2 border-t border-stone-200">
                  <div className="px-1 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-orange-500" />
                      <span>Ejemplos con Foto ({filteredCocktails.filter(c => !c.enabledForEvent).length})</span>
                    </span>

                    <button
                      type="button"
                      onClick={handleActivateAllLibrary}
                      className="text-[10px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                    >
                      + Activar todos
                    </button>
                  </div>

                  {filteredCocktails
                    .filter(item => !item.enabledForEvent)
                    .map(item => {
                      const isSelected = item.id === selectedCocktailId;

                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedCocktailId(item.id)}
                          className={`p-2 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-white border-orange-500 shadow-sm'
                              : 'bg-white/75 border-stone-200 hover:bg-white hover:border-orange-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={item.imageUrl || '/assets/cocktails/pisco_sour.jpg'}
                              alt={item.name}
                              className="w-9 h-9 rounded-xl object-cover border border-stone-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-stone-800 truncate">{item.name}</p>
                              <p className="text-[10px] font-mono text-stone-500">
                                S/. {item.price.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleToggleCocktailVisibility(item.id, true);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-orange-100 hover:bg-orange-600 text-orange-800 hover:text-white font-bold text-[10px] shrink-0 transition cursor-pointer"
                          >
                            + Activar
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: In-Place Fast Recipe & Price Editor */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-white space-y-4">
            {activeCocktail ? (
              <div className="max-w-2xl space-y-4">
                <div className="p-4 sm:p-5 rounded-3xl bg-[#faf8f5] border border-stone-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                      <button
                        type="button"
                        onClick={() => setShowEditPhotoPicker(prev => !prev)}
                        className="relative w-14 h-14 rounded-2xl overflow-hidden border border-stone-200 shadow-2xs shrink-0 group cursor-pointer"
                        title="Cambiar foto por defecto"
                      >
                        <img
                          src={activeCocktail.imageUrl || '/assets/cocktails/pisco_sour.jpg'}
                          alt={activeCocktail.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] font-bold py-0.5 text-center opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-0.5">
                          <ImageIcon className="w-2.5 h-2.5" /> Foto
                        </span>
                      </button>

                      <div className="flex-1 min-w-0 space-y-1">
                        <select
                          value={activeCocktail.category}
                          onChange={e => handleUpdateCocktailField({ category: e.target.value })}
                          className="text-[10px] uppercase font-bold text-orange-600 bg-transparent border-b border-orange-200 focus:outline-none cursor-pointer"
                        >
                          {editableCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={activeCocktail.name}
                          onChange={e => handleUpdateCocktailField({ name: e.target.value })}
                          className="w-full text-base font-extrabold text-stone-900 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-orange-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={activeCocktail.description}
                          onChange={e => handleUpdateCocktailField({ description: e.target.value })}
                          placeholder="Descripción breve para tu carta QR..."
                          className="w-full text-xs text-stone-500 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Big Editable Price */}
                    <div className="bg-white border-2 border-orange-500 rounded-2xl p-2.5 shadow-xs text-right shrink-0">
                      <span className="text-[10px] font-bold uppercase text-stone-500 block">
                        Precio de Venta:
                      </span>
                      <div className="flex items-baseline justify-end gap-1 mt-0.5">
                        <span className="font-mono text-xs text-stone-400">S/.</span>
                        <input
                          type="number"
                          step="0.5"
                          value={activeCocktail.price}
                          onChange={e =>
                            handleUpdateCocktailField({ price: Math.max(0, parseFloat(e.target.value) || 0) })
                          }
                          className="w-20 font-mono font-black text-xl text-orange-600 text-right focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {showEditPhotoPicker && (
                    <div className="pt-2 border-t border-stone-200/80">
                      <span className="text-[10px] font-bold uppercase text-stone-500 block mb-1.5">
                        Elige una foto por defecto para este producto:
                      </span>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {DEFAULT_IMAGE_GALLERY.map(img => (
                          <button
                            key={img.url}
                            type="button"
                            onClick={() => {
                              handleUpdateCocktailField({ imageUrl: img.url });
                              setShowEditPhotoPicker(false);
                            }}
                            className={`w-10 h-10 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer transition ${
                              activeCocktail.imageUrl === img.url
                                ? 'border-orange-600 scale-105'
                                : 'border-stone-200 opacity-75 hover:opacity-100'
                            }`}
                            title={img.label}
                          >
                            <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Visibility & Delete Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-200/80 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateCocktailField({ enabledForEvent: !activeCocktail.enabledForEvent })
                      }
                      className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition ${
                        activeCocktail.enabledForEvent
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {activeCocktail.enabledForEvent ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {activeCocktail.enabledForEvent ? 'Visible en iPad y Carta QR' : 'Oculto temporalmente'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteActiveCocktail}
                      className="text-stone-400 hover:text-rose-600 font-bold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar producto</span>
                    </button>
                  </div>
                </div>

                {/* Profitability Smile Banner */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                      ✓
                    </div>
                    <div>
                      <span className="font-bold text-emerald-950 block">
                        Costo de preparación: S/. {activeCost.toFixed(2)} por porción
                      </span>
                      <span className="text-emerald-800 text-[11px]">
                        Ganas <strong>S/. {activeMargin.toFixed(2)}</strong> limpios (
                        {activeMarginPct.toFixed(0)}% de margen)
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-sm text-emerald-700 bg-white px-2.5 py-1 rounded-xl border border-emerald-300 shrink-0">
                    +{activeMarginPct.toFixed(0)}%
                  </span>
                </div>

                {/* Recipe Ingredients Dosage Box */}
                <div className="p-4 rounded-3xl bg-white border border-stone-200 space-y-3 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-orange-600" />
                        <span>Insumos que lleva este producto</span>
                      </h4>
                      <p className="text-[11px] text-stone-400">
                        Edita las cantidades en ml o unidades. El costo se actualiza al instante.
                      </p>
                    </div>

                    <select
                      onChange={e => {
                        if (e.target.value) {
                          handleAddRecipeItem(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold cursor-pointer"
                    >
                      <option value="">+ Añadir Insumo...</option>
                      {ingredients.map(ing => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    {activeCocktail.recipe.length === 0 ? (
                      <p className="text-xs text-stone-400 italic p-4 text-center">
                        No tiene insumos asignados. Usa el selector de arriba para agregarlos.
                      </p>
                    ) : (
                      activeCocktail.recipe.map(item => {
                        const ing = ingredients.find(i => i.id === item.ingredientId);
                        const costPerMl = ing ? getIngredientCostPerMl(ing) : 0;
                        const itemCost = costPerMl * item.amount;

                        return (
                          <div
                            key={item.ingredientId}
                            className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-stone-900">{ing?.name || 'Insumo'}</p>
                              <p className="text-[10px] text-stone-400">
                                {ing?.packageCost ? `S/. ${ing.packageCost.toFixed(2)} por ${ing.unit}` : ''}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="flex items-center gap-1 bg-white border border-stone-300 rounded-xl px-2 py-1">
                                <input
                                  type="number"
                                  step="5"
                                  value={item.amount}
                                  onChange={e =>
                                    handleUpdateRecipeAmount(
                                      item.ingredientId,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-12 font-mono font-bold text-stone-900 text-right focus:outline-none"
                                />
                                <span className="text-[10px] text-stone-500 font-bold">
                                  {ing?.category === 'otro' ? 'un' : 'ml'}
                                </span>
                              </div>

                              <span className="font-mono font-bold text-stone-700 w-16 text-right">
                                S/. {itemCost.toFixed(2)}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleRemoveRecipeItem(item.ingredientId)}
                                className="text-stone-400 hover:text-rose-600 p-1 rounded-lg cursor-pointer transition"
                                title="Quitar insumo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-stone-400">Selecciona o crea un producto</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COMPRAS DE INSUMOS & BODEGA */}
      {activeTab === 'compras' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5 max-w-4xl mx-auto w-full">
          {/* Purchase Fast Form */}
          <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-orange-600 tracking-wider">
                  Registro Rápido de Compras
                </span>
                <h3 className="text-base font-extrabold text-stone-900 mt-0.5">
                  {inventoryScope === 'evento' ? 'Agregar o aumentar insumos del evento' : '¿Qué compraste hoy o para el mes?'}
                </h3>
                <p className="text-xs text-stone-500">
                  {inventoryScope === 'evento' ? 'Registra lo recibido o importa el Excel desde Subir Excel (.xlsx).' : 'Suma botellas o insumos a tu bodega con 1 toque.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreatingIng(prev => !prev)}
                className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isCreatingIng ? 'Cancelar Nuevo Insumo' : 'Crear Insumo Nuevo'}</span>
              </button>
            </div>

            {isCreatingIng && (
              <form
                onSubmit={handleCreateIngredient}
                className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs"
              >
                <div className="sm:col-span-2">
                  <label className="font-bold text-orange-950 block mb-1">Nombre del Insumo</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Ron Cartavio Black, Hielo..."
                    value={newIngName}
                    onChange={e => setNewIngName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-orange-950 block mb-1">Costo Botella (S/.)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newIngCost}
                    onChange={e => setNewIngCost(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-orange-950 block mb-1">Rinde (ml o un)</label>
                  <input
                    type="number"
                    step="10"
                    value={newIngVolume}
                    onChange={e => setNewIngVolume(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-1.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold cursor-pointer"
                  >
                    + Guardar
                  </button>
                </div>
              </form>
            )}

            <form onSubmit={handleRegisterPurchase} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-stone-700 block mb-1">Insumo / Botella</label>
                <select
                  value={purchaseIngId}
                  onChange={e => {
                    setPurchaseIngId(e.target.value);
                    const ing = purchaseOptions.find(i => i.id === e.target.value);
                    if (ing) setPurchaseUnitCost(ing.packageCost.toString());
                  }}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-orange-500"
                >
                  {purchaseOptions.map(ing => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} (Stock: {ing.currentStockUnits})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">{inventoryScope === 'evento' ? 'Cantidad recibida' : 'Cantidad Comprada'}</label>
                <input
                  type="number"
                  step="1"
                  value={purchaseQty}
                  onChange={e => setPurchaseQty(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Costo Unitario (S/.)</label>
                <input
                  type="number"
                  step="0.5"
                  value={purchaseUnitCost}
                  onChange={e => setPurchaseUnitCost(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="sm:col-span-4 flex items-center justify-between pt-2 border-t border-stone-100">
                <span className="text-xs text-stone-600 font-bold">
                  Total de esta compra:{' '}
                  <span className="font-mono text-orange-600 text-sm font-black">
                    S/. {((parseFloat(purchaseQty) || 0) * (parseFloat(purchaseUnitCost) || 0)).toFixed(2)}
                  </span>
                </span>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                >
                  {inventoryScope === 'evento' ? 'Agregar cantidad al evento' : '✓ Registrar Compra'}
                </button>
              </div>
            </form>
          </div>

          {/* Current Stock in Bodega (with live editable Cost & Stock!) */}
          <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-orange-600" />
              <span>{inventoryScope === 'evento' ? 'Inventario del evento (edición rápida)' : 'Inventario Actual en Bodega (Edición Rápida)'}</span>
            </h4>

            <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden">
              {ingredients.map(ing => (
                <div
                  key={ing.id}
                  className="p-3 flex flex-wrap items-center justify-between gap-3 text-xs hover:bg-stone-50 transition"
                >
                  <div className="min-w-[160px] flex-1">
                    <p className="font-bold text-stone-900">{ing.name}</p>
                    <p className="text-[10px] text-stone-400">
                      Rinde {ing.volumePerUnitMl} ml · {ing.unit}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl px-2 py-1">
                      <span className="text-[10px] text-stone-400">S/.</span>
                      <input
                        type="number"
                        step="0.5"
                        value={ing.packageCost}
                        onChange={e =>
                          handleUpdateIngredientQuick(ing.id, {
                            packageCost: Math.max(0, parseFloat(e.target.value) || 0),
                          })
                        }
                        className="w-14 font-mono font-bold text-right text-stone-900 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl px-2 py-1">
                      <span className="text-[10px] text-stone-400">Stock:</span>
                      <input
                        type="number"
                        step="1"
                        value={ing.currentStockUnits}
                        onChange={e =>
                          handleUpdateIngredientQuick(ing.id, {
                            currentStockUnits: Math.max(0, parseFloat(e.target.value) || 0),
                          })
                        }
                        className="w-12 font-mono font-bold text-right text-stone-900 focus:outline-none"
                      />
                    </div>

                    {deletingIngredient === ing.id ? <div className="w-full sm:max-w-sm rounded-2xl border border-rose-200 bg-rose-50 p-3 space-y-2">
                      <p className="text-xs font-bold text-rose-900">¿Eliminar {ing.name} del inventario?</p>
                      {cocktails.some(c => c.recipe.some(r => r.ingredientId === ing.id)) && <p className="text-xs leading-relaxed text-rose-800">Se quitará de las recetas de <strong>{cocktails.filter(c => c.recipe.some(r => r.ingredientId === ing.id)).map(c => c.name).join(', ')}</strong>. Esos productos se pausarán hasta que revises sus recetas. Los pedidos anteriores y los inventarios propios de eventos se conservan.</p>}
                      {deleteError && <p role="alert" className="text-xs font-semibold text-rose-800">{deleteError}</p>}
                      <div className="flex flex-wrap gap-2"><button type="button" disabled={deleteBusy} onClick={() => handleDeleteIngredient(ing)} className="min-h-12 px-3 rounded-xl bg-rose-600 text-white font-bold disabled:opacity-50">{deleteBusy ? 'Eliminando…' : 'Sí, eliminar'}</button>
                      <button type="button" disabled={deleteBusy} onClick={() => { setDeletingIngredient(null); setDeleteError(''); }} className="min-h-12 px-3 rounded-xl border border-rose-200 bg-white font-bold">Cancelar</button></div>
                    </div> : <button type="button" disabled={deleteBusy} onClick={() => { setDeletingIngredient(ing.id); setDeleteError(''); }} className="min-h-11 px-3 rounded-xl text-rose-700 border border-rose-200 flex items-center gap-1"><Trash2 className="w-4 h-4" />Eliminar</button>}


                    <span
                      className={`text-[10px] font-bold w-24 text-right ${
                        ing.currentStockUnits <= ing.minAlertUnits
                          ? 'text-rose-600 font-extrabold'
                          : 'text-emerald-600'
                      }`}
                    >
                      {ing.currentStockUnits <= ing.minAlertUnits ? '⚠️ Reponer' : '✓ Suficiente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mini-Tutorial Modal */}
      <HelpTutorialModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        defaultTopic={helpTopic}
      />
    </div>
  );
};
