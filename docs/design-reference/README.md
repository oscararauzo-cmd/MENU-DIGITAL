# Referencia visual de ALTURA

Esta carpeta conserva el lenguaje visual consolidado. Simplificar un proceso significa reducir pasos y ventanas, conservando su diseño.

## Fuentes de referencia

- `src/components/MenuScreen.tsx`: catálogo con fotografías, precios sobre la foto y comanda lateral.
- `src/components/CartaComprasScreen.tsx`: tarjetas administrativas, bordes y jerarquía.
- `src/components/Header.tsx`: marca y navegación compacta.
- `src/index.css`: tipografías y comportamiento táctil.
- `tablet-pedidos.png` y `celular-comanda.png`: capturas de la interfaz revisada.

## Paleta y componentes

- Fondo cálido `#faf8f5`; superficies blancas; bordes stone-200.
- Acción principal naranja orange-600, hover orange-700.
- Yape / Plin morado `#702082`; tarjeta azul `#0f4c81`; efectivo emerald-600; cortesía purple-950 con texto amber-300.
- Conservar esos colores en todos los botones de pago, con selección destacada mediante aro naranja y estado `aria-pressed`.
- Titulares Outfit; interfaz Plus Jakarta Sans; importes y cantidades monoespaciados.
- Tarjetas grandes rounded-3xl, controles rounded-xl o rounded-2xl, sombras suaves, iconos Lucide.
- Mantener fotografías, etiquetas de precio, contraste, cantidades destacadas y estados vacíos con iconos.

## Tablet y celular

- Controles principales de al menos 44–48 px de alto; selección de pago en cuadrícula 2 × 2, nunca un desplegable.
- Desde 768 px: catálogo y comanda lateral, lista de productos con scroll propio y envío visible.
- Celular: catálogo de dos columnas, acceso inferior a la comanda y una sola hoja para revisar, elegir pago y enviar.
- Cabecera en dos filas hasta 1024 px; cuatro accesos visibles con etiquetas cortas en celular.
- Preparación: una columna en celular, dos en tablet y más columnas en pantallas amplias.
- Probar como mínimo 390 × 844, 768 × 1024 y 1024 × 768, además de revisar 320 px y orientación horizontal.

## Flujo de pedidos

1. Agregar productos y notas.
2. Elegir Yape / Plin, tarjeta, efectivo o cortesía mediante botones.
3. Enviar a preparación sin abrir impresión.
4. Marcar listo y luego entregado en acciones separadas.
5. Eliminar desde la tarjeta con confirmación dentro de ella; indicar su efecto en ventas e inventario.

## Criterio para futuros cambios

Antes de modificar una pantalla, revisar estas referencias y conservar sus colores, tipografía, imágenes, redondeados y jerarquía. No sustituirlas por controles genéricos ni quitar botones táctiles para reducir código. Cambiar la identidad visual requiere una petición explícita del usuario.

## Conexión y avisos de pedidos

- La franja de conexión y última actualización se muestra únicamente en Preparación.
- La pantalla de creación de pedidos solo contiene catálogo, comanda, medios de pago y envío. No agregar listas de pedidos anteriores, estados, seguimiento, reintentos ni controles de conexión. Todo el seguimiento ocurre en Preparación.
- La cola local persiste antes de enviar. Reintenta al volver internet y cada 10 segundos, manteniendo el ID. La creación remota ignora duplicados para no devolver un pedido ya listo a preparación.
- El sonido se activa manualmente en Preparación, con una prueba corta. No se promete sonido ni notificaciones con la aplicación cerrada.
- `preparacion-avisos.png` muestra la prueba local con datos ficticios.
- Prueba visual aislada: `/tests/fixtures/order-flow.html` con el servidor de desarrollo. No escribe pedidos en Supabase.
- Pruebas de recuperación y deduplicación: `node --experimental-strip-types --test tests/orderOutbox.test.mjs`.

## Separación de operaciones

- Al abrir la aplicación aparece Inicio: Día a día, Eventos especiales y Consolidado del mes.
- La marca ALTURA vuelve a Inicio. Seleccionar una operación abre su resumen, no mezcla el contexto con otras fechas.
- Los registros anteriores sin tipo explícito se muestran por clasificar; no asumir automáticamente que son jornadas normales.
- Cada evento lleva inventario y recetas propios, guardados en el JSONB de su snapshot mediante el campo reservado `__altura_context` (versión 1). Las cantidades numéricas históricas se conservan.
- Los insumos del evento no se descuentan de la bodega habitual. Al cierre de consignación se devuelven sellados y solo los remanentes abiertos se incorporan al bar. La liquidación carga envases abiertos completos.
- El cierre conectado reclama el registro abierto antes de transferir remanentes, para que otro dispositivo no repita el cierre. Requiere conexión cuando Supabase está configurado.
- Las métricas abren aisladas por registro. «Hoy» incluye solo jornadas clasificadas de hoy en Lima; «Mes» filtra el mes actual y permite incluir o excluir eventos. No recurrir a otra fecha si no hay datos.
- Guardar el contexto y los cambios de inventario de eventos pendientes de sincronización. Los pedidos pendientes conservan el contexto del evento al reintentarse.
- La creación de pedidos sigue limpia: esta administración se hace en Inicio y Resumen, nunca en el catálogo.
- `inicio-operaciones.png` es una referencia con datos ficticios; prueba aislada en `/tests/fixtures/operations.html`.

## Eliminación de insumos

- La confirmación permanece dentro de la fila. Mostrar las recetas afectadas antes de confirmar.
- Permitir eliminar insumos usados en recetas: quitar su referencia y pausar solo los productos afectados hasta que se revisen. Mantener los pedidos anteriores y las copias de inventario/recetas de los eventos.
- Los errores de conexión o permisos aparecen en la fila y conservan el insumo. Si falla borrar después de actualizar recetas, intentar restaurarlas.
- Leer primero el catálogo remoto antes de activar las escrituras automáticas al iniciar. Una lista remota vacía no debe reponer automáticamente los insumos eliminados.

## Carta & Compras dentro de eventos

- La pestaña siempre abre CartaComprasScreen. No redirigirla al resumen del evento ni reemplazarla por un formulario reducido.
- Conservar carta/precios/recetas, crear insumos, agregar cantidades, edición rápida, eliminar, importar y exportar Excel.
- El alcance del evento se indica con una línea discreta arriba. La pantalla de compras del evento abre por defecto en Insumos.
- El selector permite agregar insumos del catálogo al evento con cantidad inicial cero, sin copiar el stock del bar.
- Los cambios se guardan sin salir de Carta & Compras. Carta e inventario del evento permanecen separados del bar.
- Importar un insumo existente conserva su ID para mantener los vínculos con recetas. Las filas nuevas que coinciden con el catálogo del bar usan su identidad, conservando cantidades independientes.
- `carta-compras-evento.png` muestra el aumento manual y las herramientas Excel, con datos de prueba.
