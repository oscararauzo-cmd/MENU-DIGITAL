# Mapa funcional y prueba del servicio — 14 noviembre 2026

## Navegación y datos

| Pantalla | Funciones | Datos |
|---|---|---|
| Inicio | Entrar al bar, crear/abrir/editar/eliminar eventos y jornadas, clasificar anteriores | Operación elegida; no duplicar selectores |
| Resumen | Ventas, costos, métricas, configuración, cierre y descarga de respaldo | Solo la operación elegida |
| Barra | Catálogo con fotos, cantidades, notas, botones de pago, enviar a preparación | Carta propia del evento o carta habitual |
| Preparación | Pendientes, listos, entregados, eliminar pedido, sonido/avisos, estado de sincronización | Pedidos de la operación elegida |
| Carta & Compras | Productos, recetas, crear/aumentar/editar/eliminar insumos, importar/exportar Excel | Inventario/carta aislados por evento |
| Resultados | Ventas, cortesías, costos y caja | Operación elegida |
| Panorama general | Período e inclusión opcional de eventos | Consolidado sin papelera |
| Papelera | Recuperar jornadas/eventos durante cinco días, acceso por PIN | Conserva contenido y estado anterior |
| Menú digital | Vista para clientes, descarga HTML sin costos/PIN/recetas internas | Carta elegida; publicación QR pendiente |
| Herramientas | Perfil, PIN, movimientos/mermas y asistente | Contexto elegido; IA requiere servidor |

## Modo de prueba urgente

Los eventos sin `inventoryMode: tracked` permiten registrar pedidos sin validar ni descontar ingredientes. No reescribe pedidos ni recetas anteriores. Los nuevos pedidos llevan `inventoryDeferred` y una captura de consumo vacía para no recalcular consumo inventado al consultar después. Costos/margen del resumen quedan pendientes si existen esos pedidos. Completar insumos después no reconstruye automáticamente el consumo omitido.

Se corrigió la creación de productos para no enlazar automáticamente el primer insumo. Las recetas históricas no se sustituyen. Los pedidos continúan validando operación abierta, producto habilitado, cantidades positivas y precios válidos.

ALTURA LIVE recibe hasta diez versiones locales adicionales por dispositivo. No sustituyen copias externas: el resumen permite descargar JSON completo del evento. Un fallo del respaldo adicional no debe impedir guardar el estado principal. No se borraron datos reales ni se probó sobre Supabase durante esta revisión.

## Instalación y publicación

`dist/` contiene la entrega estática completa para Hostinger, incluyendo manifiesto, iconos y configuración Apache. El modo standalone elimina la barra del navegador al abrir desde Inicio; el sistema operativo puede conservar su barra de estado. No se añadió caché offline de aplicación para evitar versiones antiguas durante el servicio.

El enlace exacto de Hostinger sigue pendiente. La compilación local no actualiza automáticamente esa web. Tras publicar: respaldar ALTURA LIVE, abrir el mismo enlace y evento en ambos equipos, iPad en Barra y celular en Preparación; enviar un pedido y confirmar su llegada antes de atender. Mantener Preparación abierta y activar sonido. No borrar datos de Safari ni el acceso actual durante la prueba.

## Correcciones auditadas y límites

Pruebas automáticas: 53 aprobadas; TypeScript y compilación aprobados. Prueba de interfaz aislada: pedido registrado y visible en Preparación, sin impresión ni bloqueo de stock. Evidencia: `design-reference/prueba-pedidos-sin-insumos.png`.

Se revisaron consumo histórico, eliminación de pedidos preparados, conversión de mermas, importes Excel, conservación de IDs/recetas al importar, cola de catálogo y pedidos, cambios de estado, hooks condicionales, propuestas del asistente y exportación pública. Las validaciones están en `tests/`.

Pendiente de verificar en equipos reales: sincronización entre iPad/celular, permisos y sonido de iOS, instalación standalone en la versión publicada. No hay push garantizado con pantalla bloqueada. Las políticas públicas de Supabase y PIN de interfaz no equivalen a autenticación de servidor; endurecer autenticación/RLS antes de prometer protección completa. Las actualizaciones simultáneas del mismo stock y la transferencia al cerrar requieren transacciones del servidor. No se habilitó impresión física ni se migró inventario de hoy. El asistente requiere un backend Node/API, no basta hosting estático.
