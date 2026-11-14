import * as XLSX from 'xlsx';
import { Cocktail, BusinessProfile } from '../types/bar';

export interface OlaClickProductRow {
  categoria: string;
  nombre: string;
  variante: string;
  descripcion: string;
  precio: number;
  precioDescuento?: number;
  sku?: string;
  categoriasModificadores?: string;
}

export interface OlaClickModifierRow {
  categoriaModificador: string;
  condicion: 'Obligatorio' | 'Opcional';
  seleccionar: 'Sólo uno un modificador' | 'Varios';
  nombreModificador: string;
  precio: number;
  precioDescuento?: number;
  sku?: string;
  costoModificador?: number;
}

export const DEFAULT_OLACLICK_MODIFIERS: OlaClickModifierRow[] = [
  // Modificadores de Barra & Coctelería
  { categoriaModificador: 'Tipo de Pisco', condicion: 'Obligatorio', seleccionar: 'Sólo uno un modificador', nombreModificador: 'Quebranta Puro (Tradicional)', precio: 0.0 },
  { categoriaModificador: 'Tipo de Pisco', condicion: 'Obligatorio', seleccionar: 'Sólo uno un modificador', nombreModificador: 'Acholado Aromático', precio: 2.0 },
  { categoriaModificador: 'Tipo de Pisco', condicion: 'Obligatorio', seleccionar: 'Sólo uno un modificador', nombreModificador: 'Mosto Verde Premium', precio: 6.0 },

  { categoriaModificador: 'Nivel de Hielo', condicion: 'Opcional', seleccionar: 'Sólo uno un modificador', nombreModificador: 'Hielo Roca Estándar', precio: 0.0 },
  { categoriaModificador: 'Nivel de Hielo', condicion: 'Opcional', seleccionar: 'Sólo uno un modificador', nombreModificador: 'Poco Hielo', precio: 0.0 },
  { categoriaModificador: 'Nivel de Hielo', condicion: 'Opcional', seleccionar: 'Sólo uno un modificador', nombreModificador: 'Sin Hielo (Frappé servido aparte)', precio: 0.0 },

  { categoriaModificador: 'Extras de Coctelería', condicion: 'Opcional', seleccionar: 'Varios', nombreModificador: 'Doble Shot de Pisco (+1.5 oz)', precio: 12.0 },
  { categoriaModificador: 'Extras de Coctelería', condicion: 'Opcional', seleccionar: 'Varios', nombreModificador: 'Dash extra Amargo Chuncho', precio: 1.0 },

  // Modificadores de Tapas & Comida (Exacto como en las capturas de OlaClick!)
  { categoriaModificador: 'Elige el término de la carne', condicion: 'Obligatorio', seleccionar: 'Sólo uno un modificador', nombreModificador: 'Medio', precio: 0.0 },
  { categoriaModificador: 'Elige el término de la carne', condicion: 'Obligatorio', seleccionar: 'Sólo uno un modificador', nombreModificador: '3/4', precio: 0.0 },
  { categoriaModificador: 'Elige el término de la carne', condicion: 'Obligatorio', seleccionar: 'Sólo uno un modificador', nombreModificador: 'Bien cocida', precio: 0.0 },

  { categoriaModificador: 'Elige tus salsas', condicion: 'Obligatorio', seleccionar: 'Sólo uno un modificador', nombreModificador: 'Mayonesa', precio: 0.0 },
  { categoriaModificador: 'Elige tus salsas', condicion: 'Obligatorio', seleccionar: 'Sólo uno un modificador', nombreModificador: 'Ketchup', precio: 0.0 },
  { categoriaModificador: 'Elige tus salsas', condicion: 'Obligatorio', seleccionar: 'Sólo uno un modificador', nombreModificador: 'Ají', precio: 0.0 },

  { categoriaModificador: 'Elige los modificadores que quieras', condicion: 'Obligatorio', seleccionar: 'Varios', nombreModificador: 'Fresa', precio: 0.0 },
  { categoriaModificador: 'Elige los modificadores que quieras', condicion: 'Obligatorio', seleccionar: 'Varios', nombreModificador: 'Plátano', precio: 0.0 },
  { categoriaModificador: 'Elige los modificadores que quieras', condicion: 'Obligatorio', seleccionar: 'Varios', nombreModificador: 'Granola', precio: 0.0 },
  { categoriaModificador: 'Elige los modificadores que quieras', condicion: 'Obligatorio', seleccionar: 'Varios', nombreModificador: 'Miel', precio: 0.0 },
];

/**
 * Convierte los cócteles y tapas de la app en la estructura exacta de productos de OlaClick
 */
export function buildOlaClickProducts(cocktails: Cocktail[]): OlaClickProductRow[] {
  const categoryLabels: Record<string, string> = {
    tapas_comida: 'Platos & Tapas',
    pisco: 'Piscos & Sours',
    autor: 'De Autor',
    clasico: 'Clásicos',
    cerveza_sin_alcohol: 'Bebidas & Cervezas',
  };

  const rows: OlaClickProductRow[] = [];

  for (const c of cocktails) {
    const catName = categoryLabels[c.category] || 'Cócteles';

    // Determinar modificadores aplicables
    let modCat = '';
    if (c.category === 'tapas_comida') {
      modCat = 'Elige tus salsas';
    } else if (c.category === 'pisco' || c.category === 'autor' || c.category === 'clasico') {
      modCat = 'Tipo de Pisco, Nivel de Hielo';
    }

    rows.push({
      categoria: catName,
      nombre: c.name,
      variante: '',
      descripcion: c.description || '',
      precio: c.price,
      sku: c.id.slice(0, 15),
      categoriasModificadores: modCat,
    });
  }

  return rows;
}

/**
 * Genera y descarga el archivo .xlsx idéntico a las capturas de pantalla de OlaClick
 */
export function exportOlaClickExcel(cocktails: Cocktail[], businessName: string = 'ALTURA'): void {
  const wb = XLSX.utils.book_new();

  // =========================================================================
  // HOJA 1: INSTRUCCIONES (Copia fiel del screenshot de OlaClick)
  // =========================================================================
  const instruccionesAoa = [
    [`Plantilla de Menú, Variantes y Modificadores - ${businessName.toUpperCase()}`],
    [''],
    ['Cómo usarla'],
    ['1. Completa la hoja Productos. No cambies los nombres de las columnas.'],
    ['2. Cada fila de Productos crea una variante. Si repites Categoría + Nombre de producto, se agrupan como variantes del mismo producto.'],
    ['3. Para productos sin variantes, deja vacía la columna Nombre de variante de producto.'],
    ['4. Si un producto tiene modificadores, escribe sus categorías en Categorías de modificadores separadas por coma. Ejemplo: Salsas, Extras.'],
    ['5. Completa la hoja Modificadores con las categorías referenciadas desde Productos. Los nombres deben coincidir exactamente.'],
    ['6. Guarda el archivo como .xlsx y súbelo desde la opción Excel.'],
    [''],
    ['Campos obligatorios'],
    ['Productos: Categoría de producto, Nombre de producto y Precio.'],
    ['Modificadores: Nombre de Categoría de modificador, Condición, Seleccionar, Nombre del modificador y Precio.'],
    [''],
    ['Reglas importantes'],
    ['No cambies el nombre de las hojas Productos y Modificadores.'],
    ['No cambies, elimines ni reordenes las columnas de las hojas Productos y Modificadores.'],
    ['Usa números sin símbolos de moneda. Correcto: 15000 o 15000.50.'],
    ['Precio con descuento es opcional. Si queda vacío, se usará Precio.'],
    ['SKU es opcional y se importará con máximo 20 caracteres.'],
    ['Esta plantilla no importa imágenes.'],
    [''],
    ['Valores permitidos en Modificadores'],
    ['Condición: Obligatorio u Opcional.'],
    ['Seleccionar: Varios o Sólo uno un modificador.'],
    [''],
    ['Límites del importador'],
    ['Máximo 50 categorías de productos.'],
    ['Máximo 50 productos por categoría.'],
    ['Máximo 30 variantes por producto.'],
    ['Máximo 100 categorías de modificadores.'],
    ['Máximo 100 modificadores por categoría.'],
  ];

  const wsInstrucciones = XLSX.utils.aoa_to_sheet(instruccionesAoa);
  wsInstrucciones['!cols'] = [{ wch: 90 }];
  XLSX.utils.book_append_sheet(wb, wsInstrucciones, 'Instrucciones');

  // =========================================================================
  // HOJA 2: PRODUCTOS (Columnas exactas del screenshot de OlaClick)
  // =========================================================================
  const productHeaders = [
    'Categoría de producto',
    'Nombre de producto',
    'Nombre de variante de producto',
    'Descripción',
    'Precio',
    'Precio con descuento',
    'SKU',
    'Categorías de modificadores',
  ];

  const productRows = buildOlaClickProducts(cocktails).map(p => [
    p.categoria,
    p.nombre,
    p.variante,
    p.descripcion,
    p.precio,
    p.precioDescuento || '',
    p.sku || '',
    p.categoriasModificadores || '',
  ]);

  const wsProductos = XLSX.utils.aoa_to_sheet([productHeaders, ...productRows]);
  wsProductos['!cols'] = [
    { wch: 22 }, // Categoría
    { wch: 30 }, // Nombre
    { wch: 20 }, // Variante
    { wch: 55 }, // Descripción
    { wch: 12 }, // Precio
    { wch: 16 }, // Descuento
    { wch: 14 }, // SKU
    { wch: 35 }, // Modificadores
  ];
  XLSX.utils.book_append_sheet(wb, wsProductos, 'Productos');

  // =========================================================================
  // HOJA 3: MODIFICADORES (Columnas exactas del screenshot de OlaClick)
  // =========================================================================
  const modifierHeaders = [
    'Nombre de Categoría de modificador',
    'Condición',
    'Seleccionar',
    'Nombre del modificador',
    'Precio',
    'Precio con descuento',
    'SKU',
    'Costo de modificador',
  ];

  const modifierRows = DEFAULT_OLACLICK_MODIFIERS.map(m => [
    m.categoriaModificador,
    m.condicion,
    m.seleccionar,
    m.nombreModificador,
    m.precio,
    m.precioDescuento || '',
    m.sku || '',
    m.costoModificador || '',
  ]);

  const wsModificadores = XLSX.utils.aoa_to_sheet([modifierHeaders, ...modifierRows]);
  wsModificadores['!cols'] = [
    { wch: 34 }, // Categoría
    { wch: 14 }, // Condición
    { wch: 24 }, // Seleccionar
    { wch: 28 }, // Nombre modificador
    { wch: 12 }, // Precio
    { wch: 16 }, // Descuento
    { wch: 12 }, // SKU
    { wch: 16 }, // Costo
  ];
  XLSX.utils.book_append_sheet(wb, wsModificadores, 'Modificadores');

  // Guardar y descargar
  const safeName = businessName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  XLSX.writeFile(wb, `Plantilla_Menu_${safeName}.xlsx`);
}

/**
 * Lee un archivo .xlsx cargado por el usuario y extrae los productos
 */
export async function parseOlaClickExcel(file: File): Promise<OlaClickProductRow[]> {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data);

  // Buscar la hoja 'Productos'
  const sheetName = wb.SheetNames.find(n => n.trim().toLowerCase() === 'productos') || wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];

  if (!sheet) {
    throw new Error('No se encontró la hoja "Productos" en el archivo Excel.');
  }

  const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (rawRows.length < 2) {
    throw new Error('La hoja "Productos" está vacía.');
  }

  // Primera fila encabezados
  const headers: string[] = rawRows[0].map((h: any) => String(h || '').trim().toLowerCase());
  const catIdx = headers.findIndex(h => h.includes('categoría') || h.includes('categoria'));
  const nameIdx = headers.findIndex(h => h.includes('nombre') && !h.includes('variante') && !h.includes('modificador'));
  const varIdx = headers.findIndex(h => h.includes('variante'));
  const descIdx = headers.findIndex(h => h.includes('descrip'));
  const priceIdx = headers.findIndex(h => h.includes('precio'));
  const modsIdx = headers.findIndex(h => h.includes('modificador'));

  const parsedProducts: OlaClickProductRow[] = [];

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    const nombre = String(row[nameIdx >= 0 ? nameIdx : 1] || '').trim();
    if (!nombre) continue;

    const categoria = String(row[catIdx >= 0 ? catIdx : 0] || 'General').trim();
    const variante = varIdx >= 0 ? String(row[varIdx] || '').trim() : '';
    const descripcion = descIdx >= 0 ? String(row[descIdx] || '').trim() : '';
    const precioRaw = priceIdx >= 0 ? row[priceIdx] : 0;
    const precio = typeof precioRaw === 'number' ? precioRaw : parseFloat(String(precioRaw).replace(/[^0-9.]/g, '')) || 0;
    const categoriasModificadores = modsIdx >= 0 ? String(row[modsIdx] || '').trim() : '';

    parsedProducts.push({
      categoria,
      nombre,
      variante,
      descripcion,
      precio,
      categoriasModificadores,
    });
  }

  return parsedProducts;
}
