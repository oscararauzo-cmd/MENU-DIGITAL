import * as XLSX from 'xlsx';
import { BarEvent, Cocktail, Ingredient } from '../types/bar';
import { calculateEventMetrics } from './calculations';

export function exportEventToExcel(event: BarEvent, cocktails: Cocktail[], ingredients: Ingredient[]) {
  const metrics = calculateEventMetrics(event, cocktails, ingredients);

  const wb = XLSX.utils.book_new();

  // 1. Resumen Ejecutivo
  const resumenData = [
    ['ALTURA - ANDEAN TAPAS BAR'],
    ['REPORTE INTEGRAL DE CIERRE DE EVENTO Y LOGÍSTICA'],
    [''],
    ['DATOS GENERALES'],
    ['Nombre del Evento:', event.name],
    ['Fecha del Evento:', event.date],
    ['Estado del Evento:', event.status === 'active' ? 'En Curso (Activo)' : 'Cerrado'],
    ['Hora de Generación:', new Date().toLocaleString('es-PE')],
    [''],
    ['INDICADORES CLAVE DE RENDIMIENTO (KPIs)'],
    ['Concepto', 'Valor', 'Unidad / %'],
    ['Ventas Brutas de Barra', metrics.totalRevenue, 'PEN (S/.)'],
    ['Total Tragos Vendidos', metrics.totalDrinksSold, 'Unidades'],
    ['Total Cortesías / DJ / Staff', metrics.totalCourtesyDrinks, 'Unidades'],
    ['Total Tragos Despachados', metrics.totalDrinksOverall, 'Unidades'],
    ['Costo de Insumos (Venta)', metrics.totalCostSold, 'PEN (S/.)'],
    ['Ganancia Bruta', metrics.grossProfit, 'PEN (S/.)'],
    ['Margen Bruto de Ganancia', metrics.grossProfitMarginPercent, '%'],
    ['Costo Asumido en Cortesías / DJ', metrics.totalCostCourtesy, 'PEN (S/.)'],
    ['Costo Total por Mermas y Derrames', metrics.totalWasteCost, 'PEN (S/.)'],
    ['Gastos Totales de Barra', metrics.totalExpenses, 'PEN (S/.)'],
    ['Ganancia Neta Final de Barra', metrics.netProfit, 'PEN (S/.)'],
    ['Margen Neto Final', metrics.netProfitMarginPercent, '%'],
    [''],
    ['RESUMEN DE LOGÍSTICA PARA EL SIGUIENTE EVENTO'],
    ['Insumos que requieren reposición urgente:', metrics.ingredientStats.filter(i => i.needsRestock).length, 'ítems'],
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Ejecutivo');

  // 2. Tragos Vendidos y Margen
  const tragosHeaders = [
    'Cóctel / Bebida',
    'Categoría',
    'Precio Venta (S/.)',
    'Costo Prep. (S/.)',
    'Margen Unitario (S/.)',
    'Margen (%)',
    'Cantidad Vendida',
    'Cortesía / DJ',
    'Total Despachado',
    'Ingresos Totales (S/.)',
    'Costo Insumos Vendidos (S/.)',
    'Costo Cortesías (S/.)',
    'Ganancia Bruta (S/.)',
  ];

  const tragosRows = metrics.drinkStats.map(s => [
    s.name,
    s.category.toUpperCase(),
    s.unitPrice,
    s.unitCost,
    s.unitMargin,
    s.unitMarginPercent.toFixed(1) + '%',
    s.soldQty,
    s.courtesyQty,
    s.soldQty + s.courtesyQty,
    s.totalRevenue,
    s.totalCostSold,
    s.totalCostCourtesy,
    s.totalGrossProfit,
  ]);

  const wsTragos = XLSX.utils.aoa_to_sheet([tragosHeaders, ...tragosRows]);
  XLSX.utils.book_append_sheet(wb, wsTragos, 'Tragos y Margen');

  // 3. Inventario y Stock para Siguiente Evento
  const invHeaders = [
    'Insumo',
    'Categoría',
    'Formato Compra',
    'Costo Unit. Compra (S/.)',
    'Stock Inicial',
    'Consumo Receta (ml o u)',
    'Envases Consumidos',
    'Envases Merma',
    'STOCK REMANENTE (Sig. Evento)',
    '¿Necesita Reposición?',
    'Sugerencia de Compra',
  ];

  const invRows = metrics.ingredientStats.map(i => [
    i.name,
    i.category.toUpperCase(),
    i.unit,
    i.packageCost,
    i.initialStock,
    i.totalConsumedMlOrUnits,
    i.consumedPackages,
    i.wastePackages,
    i.residualStockPackages,
    i.needsRestock ? 'SÍ - CRÍTICO' : 'OK',
    i.restockSuggested > 0 ? `Comprar +${i.restockSuggested} un.` : 'Suficiente',
  ]);

  const wsInv = XLSX.utils.aoa_to_sheet([invHeaders, ...invRows]);
  XLSX.utils.book_append_sheet(wb, wsInv, 'Inventario y Remanente');

  // 4. Detalle de Mermas
  const mermaHeaders = ['Fecha / Hora', 'Ítem o Insumo', 'Cantidad', 'Unidad', 'Motivo', 'Costo Estimado (S/.)', 'Notas / Observaciones'];
  const mermaRows = metrics.wastes.map(w => [
    new Date(w.timestamp).toLocaleTimeString('es-PE'),
    w.name,
    w.quantity,
    w.unit,
    w.reason.toUpperCase(),
    w.estimatedCost,
    w.notes || '-',
  ]);

  const wsMermas = XLSX.utils.aoa_to_sheet([mermaHeaders, ...mermaRows]);
  XLSX.utils.book_append_sheet(wb, wsMermas, 'Registro de Mermas');

  // 5. Historial de Pedidos / Comandas
  const pedidosHeaders = ['N° Pedido', 'Hora', 'Tipo de Pedido', 'Método de Pago', 'Detalle de Tragos', 'Total Facturado (S/.)', 'Notas'];
  const pedidosRows = event.orders.map(o => [
    o.id,
    new Date(o.timestamp).toLocaleTimeString('es-PE'),
    o.orderType.toUpperCase(),
    (o.paymentMethod || o.orderType).toUpperCase().replace('_', ' '),
    o.items.map(it => `${it.quantity}x ${it.cocktailName}`).join(' + '),
    o.totalAmount,
    o.notes || '-',
  ]);

  const wsPedidos = XLSX.utils.aoa_to_sheet([pedidosHeaders, ...pedidosRows]);
  XLSX.utils.book_append_sheet(wb, wsPedidos, 'Registro de Pedidos');

  // Trigger browser download
  const safeName = event.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const filename = `altura_cierre_evento_${safeName}_${event.date}.xlsx`;
  XLSX.writeFile(wb, filename);
}
