import { mergeMenuImport } from '../utils/menuImport';
import React, { useState } from 'react';
import { Cocktail, BusinessProfile } from '../types/bar';
import {
  exportOlaClickExcel,
  parseOlaClickExcel,
  buildOlaClickProducts,
  DEFAULT_OLACLICK_MODIFIERS,
  OlaClickProductRow,
  OlaClickModifierRow,
} from '../utils/olaClickExcel';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Sparkles,
  Info,
  Utensils,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface OlaClickExcelModalProps {
  readOnly?:boolean;
  isOpen: boolean;
  onClose: () => void;
  cocktails: Cocktail[];
  setCocktails: React.Dispatch<React.SetStateAction<Cocktail[]>>;
  businessProfile: BusinessProfile;
}

export const OlaClickExcelModal: React.FC<OlaClickExcelModalProps> = ({
  readOnly=false,
  isOpen,
  onClose,
  cocktails,
  setCocktails,
  businessProfile,
}) => {
  const [activeSheet, setActiveSheet] = useState<'instrucciones' | 'productos' | 'modificadores'>('productos');
  const [products, setProducts] = useState<OlaClickProductRow[]>(() => buildOlaClickProducts(cocktails));
  const [modifiers, setModifiers] = useState<OlaClickModifierRow[]>(DEFAULT_OLACLICK_MODIFIERS);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // New product inline state
  const [newCat, setNewCat] = useState('Piscos & Sours');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('32.00');

  if (!isOpen) return null;

  const handleDownload = () => {
    setIsProcessing(true);
    try {
      exportOlaClickExcel(cocktails, businessProfile.name || 'ALTURA',products,modifiers);
      setStatusMessage('✓ Archivo "Plantilla_Menu_Bar.xlsx" descargado exitosamente.');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e: any) {
      console.error(e);
      setStatusMessage('Error al generar el archivo Excel.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const importedProducts = await parseOlaClickExcel(file);
      setProducts(importedProducts);

      // Convert to app cocktails format
      const newCocktails: Cocktail[] = importedProducts.map((p, idx) => ({
        id: `imported-${Date.now()}-${idx}`,
        name: p.nombre,
        category: p.categoria.toLowerCase().includes('plato') || p.categoria.toLowerCase().includes('tapa')
          ? 'tapas_comida'
          : p.categoria.toLowerCase().includes('pisco')
          ? 'pisco'
          : p.categoria.toLowerCase().includes('autor')
          ? 'autor'
          : p.categoria.toLowerCase().includes('cerveza') || p.categoria.toLowerCase().includes('bebida')
          ? 'cerveza_sin_alcohol'
          : 'clasico',
        price: p.precio,
        description: p.descripcion,
        enabledForEvent: true,
        recipe: [],
        illustrationKey: 'pisco-sour',
        colorGradient: 'from-amber-400 to-orange-500',
        glassType: 'rocks',
        imageUrl: '/assets/cocktails/pisco_sour.jpg',
      }));

      setCocktails(prev=>mergeMenuImport(prev,newCocktails));

      setStatusMessage(`✓ ¡Éxito! Se importaron ${importedProducts.length} productos desde tu archivo Excel.`);
      setTimeout(() => setStatusMessage(null), 4500);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Error: ${err.message || 'No se pudo leer el archivo Excel'}`);
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleAddProduct = () => {
    if(readOnly){setStatusMessage('Operación cerrada: solo consulta y descarga.');return;}
    if (!newName.trim()) return;
    const priceNum = Math.max(0,Number(newPrice)||0);
    const item: OlaClickProductRow = {
      categoria: newCat,
      nombre: newName.trim(),
      variante: '',
      descripcion: newDesc.trim(),
      precio: priceNum,
      sku: `PROD-${Date.now().toString().slice(-4)}`,
      categoriasModificadores: newCat.includes('Plato') ? 'Elige tus salsas' : 'Tipo de Pisco',
    };

    setProducts(prev => [item, ...prev]);

    // Add to cocktails
    const newCocktail: Cocktail = {
      id: `cocktail-${Date.now()}`,
      name: item.nombre,
      category: newCat.toLowerCase().includes('plato') ? 'tapas_comida' : 'pisco',
      price: priceNum,
      description: item.descripcion,
      enabledForEvent: true,
      recipe: [],
      illustrationKey: 'pisco-sour',
      colorGradient: 'from-amber-400 to-orange-500',
      glassType: 'rocks',
      imageUrl: '/assets/cocktails/pisco_sour.jpg',
    };
    setCocktails(prev => [newCocktail, ...prev]);

    setNewName('');
    setNewDesc('');
    setStatusMessage(`✓ Producto "${item.nombre}" añadido a la plantilla y a la carta.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDeleteProduct = (index: number) => {
    setProducts(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-4xl bg-white text-stone-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200 my-auto max-h-[92vh]">
        {/* Header: Clean, white, elegant */}
        <div className="px-5 py-4 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-2xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-wider text-orange-600">
                  Importador & Exportador de Menú Excel
                </span>
                <span className="text-[10px] bg-stone-100 text-stone-700 font-bold px-2 py-0.5 rounded-full border border-stone-200">
                  Formato .XLSX
                </span>
              </div>
              <h2 className="text-base font-bold tracking-tight text-stone-900 mt-0.5">
                Plantilla de Productos, Variantes y Modificadores
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Tabs */}
        <div className="px-5 py-3 bg-[#faf8f5] border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Tabs: Instrucciones, Productos, Modificadores */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-stone-200 shadow-2xs">
            <button
              onClick={() => setActiveSheet('instrucciones')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSheet === 'instrucciones'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Instrucciones
            </button>

            <button
              onClick={() => setActiveSheet('productos')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSheet === 'productos'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>Productos & Variantes</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeSheet === 'productos' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
              }`}>
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSheet('modificadores')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSheet === 'modificadores'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>Modificadores & Salsas</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeSheet === 'modificadores' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
              }`}>
                {modifiers.length}
              </span>
            </button>
          </div>

          {/* Action Buttons: Download & Upload Excel */}
          <div className="flex items-center gap-2">
            <label className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-stone-600" />
              <span>Subir Archivo (.xlsx)</span>
              <input
                type="file" disabled={readOnly}
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={handleDownload}
              disabled={isProcessing}
              className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-orange-500/20 transition active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Excel</span>
            </button>
          </div>
        </div>

        {/* Status Alert Banner */}
        {statusMessage && (
          <div className="px-5 py-2.5 bg-orange-50 border-b border-orange-200 text-orange-950 text-xs font-bold flex items-center justify-between">
            <span>{statusMessage}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-orange-700 hover:text-orange-950 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Sheet Content Area: Clean White Background */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
          {/* ================================================================= */}
          {/* HOJA 1: INSTRUCCIONES                                             */}
          {/* ================================================================= */}
          {activeSheet === 'instrucciones' && (
            <div className="space-y-4 max-w-3xl font-sans text-xs text-stone-800 animate-fade-in">
              <div className="p-4 rounded-2xl bg-[#faf8f5] border border-stone-200 space-y-1.5">
                <h3 className="font-bold text-sm text-stone-900">Cómo usar la plantilla de importación</h3>
                <ol className="list-decimal pl-4 space-y-1 text-stone-700 leading-relaxed">
                  <li>Completa la hoja <strong>Productos</strong>. Mantén intactos los nombres de las columnas.</li>
                  <li>Cada fila crea un ítem o una variante. Si repites la misma Categoría + Nombre de producto, se agrupan automáticamente como variantes del mismo producto (ej: Cóctel Simple, Doble, Jarra).</li>
                  <li>Para productos de precio único sin variantes, deja vacía la columna <em>Nombre de variante de producto</em>.</li>
                  <li>Si un producto tiene opciones o salsas, escribe sus categorías en <em>Categorías de modificadores</em> separadas por coma. Ejemplo: <code>Tipo de Pisco, Elige tus salsas</code>.</li>
                  <li>Completa la hoja <strong>Modificadores</strong> con las opciones exactas referenciadas.</li>
                  <li>Guarda el archivo en formato <code>.xlsx</code> y cárgalo con el botón <em>Subir Archivo</em>.</li>
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200 space-y-1.5">
                <h3 className="font-bold text-sm text-orange-950">Campos obligatorios</h3>
                <p className="text-stone-700"><strong>Productos:</strong> Categoría de producto, Nombre de producto y Precio.</p>
                <p className="text-stone-700"><strong>Modificadores:</strong> Nombre de Categoría de modificador, Condición, Seleccionar, Nombre del modificador y Precio.</p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <h3 className="font-bold text-sm text-stone-900">Reglas importantes & Valores Permitidos</h3>
                <ul className="list-disc pl-4 space-y-1 text-stone-600 leading-relaxed">
                  <li>No cambies el nombre de las hojas <em>Productos</em> y <em>Modificadores</em>.</li>
                  <li>Usa números limpios sin símbolos de moneda. Correcto: <code>32.00</code> o <code>28.50</code>.</li>
                  <li>Condición en modificadores: <code>Obligatorio</code> u <code>Opcional</code>.</li>
                  <li>Seleccionar en modificadores: <code>Sólo uno un modificador</code> o <code>Varios</code>.</li>
                </ul>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* HOJA 2: PRODUCTOS & VARIANTES                                     */}
          {/* ================================================================= */}
          {activeSheet === 'productos' && (
            <div className="space-y-4 animate-fade-in">
              {/* Quick Add Product Bar */}
              <div className="p-3.5 bg-[#faf8f5] rounded-2xl border border-stone-200 space-y-2">
                <span className="text-xs font-bold text-stone-800 block">
                  + Agregar Producto a la Plantilla:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <select
                    value={newCat}
                    onChange={e => setNewCat(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:border-orange-500"
                  >
                    <option value="Platos & Tapas">Platos & Tapas</option>
                    <option value="Piscos & Sours">Piscos & Sours</option>
                    <option value="De Autor">De Autor</option>
                    <option value="Clásicos">Clásicos</option>
                    <option value="Bebidas & Cervezas">Bebidas & Cervezas</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Nombre del producto..."
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-orange-500"
                  />

                  <input
                    type="text"
                    placeholder="Descripción / Ingredientes..."
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-orange-500"
                  />

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="1"
                      placeholder="Precio"
                      value={newPrice}
                      onChange={e => setNewPrice(e.target.value)}
                      className="w-20 px-2 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900 text-right focus:outline-none focus:border-orange-500"
                    />
                    <button
                      onClick={handleAddProduct}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                      + Añadir
                    </button>
                  </div>
                </div>
              </div>

              {/* Excel Table */}
              <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3 border-r border-stone-200">Categoría de producto</th>
                        <th className="py-2.5 px-3 border-r border-stone-200">Nombre de producto</th>
                        <th className="py-2.5 px-3 border-r border-stone-200">Variante</th>
                        <th className="py-2.5 px-3 border-r border-stone-200">Descripción</th>
                        <th className="py-2.5 px-3 border-r border-stone-200 text-right">Precio ({businessProfile.currencySymbol || 'S/.'})</th>
                        <th className="py-2.5 px-3 border-r border-stone-200">Categorías Modificadores</th>
                        <th className="py-2.5 px-2 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {products.map((p, idx) => (
                        <tr key={idx} className="hover:bg-orange-50/30 transition">
                          <td className="py-2 px-3 border-r border-stone-200 font-bold text-stone-900">
                            {p.categoria}
                          </td>
                          <td className="py-2 px-3 border-r border-stone-200 font-medium text-stone-900">
                            {p.nombre}
                          </td>
                          <td className="py-2 px-3 border-r border-stone-200 text-stone-400 font-mono text-[11px]">
                            {p.variante || '-'}
                          </td>
                          <td className="py-2 px-3 border-r border-stone-200 text-stone-600 text-[11px] max-w-xs truncate">
                            {p.descripcion || '-'}
                          </td>
                          <td className="py-2 px-3 border-r border-stone-200 text-right font-mono font-bold text-stone-900">
                            {p.precio.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 border-r border-stone-200 text-stone-500 text-[11px] truncate max-w-xs">
                            {p.categoriasModificadores || '-'}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              onClick={() => handleDeleteProduct(idx)}
                              className="p-1 text-stone-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                              title="Eliminar fila"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* HOJA 3: MODIFICADORES & SALSAS                                    */}
          {/* ================================================================= */}
          {activeSheet === 'modificadores' && (
            <div className="space-y-4 animate-fade-in">
              <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3 border-r border-stone-200">Nombre de Categoría de modificador</th>
                        <th className="py-2.5 px-3 border-r border-stone-200">Condición</th>
                        <th className="py-2.5 px-3 border-r border-stone-200">Seleccionar</th>
                        <th className="py-2.5 px-3 border-r border-stone-200">Nombre del modificador</th>
                        <th className="py-2.5 px-3 text-right">Precio ({businessProfile.currencySymbol || 'S/.'})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-sans">
                      {modifiers.map((m, idx) => (
                        <tr key={idx} className="hover:bg-orange-50/30 transition">
                          <td className="py-2 px-3 border-r border-stone-200 font-bold text-stone-900">
                            {m.categoriaModificador}
                          </td>
                          <td className="py-2 px-3 border-r border-stone-200">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                m.condicion === 'Obligatorio'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {m.condicion}
                            </span>
                          </td>
                          <td className="py-2 px-3 border-r border-stone-200 text-stone-700 text-[11px]">
                            {m.seleccionar}
                          </td>
                          <td className="py-2 px-3 border-r border-stone-200 font-medium text-stone-900">
                            {m.nombreModificador}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-stone-800">
                            {m.precio.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-stone-500 font-medium">
            Formato estándar compatible con importación y exportación masiva de recetas y cartas
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              Cerrar
            </button>

            <button
              onClick={handleDownload}
              className="py-2 px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm shadow-orange-500/20 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
