# Instrucciones del proyecto

Antes de cambiar la interfaz, lee `docs/design-reference/README.md` y revisa sus capturas. Conserva el estilo visual consolidado de ALTURA: fondos cálidos, fotografías, tarjetas redondeadas, tipografía, iconos y colores de los medios de pago. Simplifica pasos sin empobrecer el diseño. Prioriza tablet y celular, controles táctiles de 44–48 px y navegación accesible. Los medios de pago se presentan como botones, nunca como un desplegable. No reintroduzcas impresión automática al crear pedidos.

La pantalla de creación de pedidos debe mantenerse simple: no agregar historial, listas de seguimiento, estados de pedidos anteriores, botones de reintento ni indicadores de conexión. El seguimiento y la conexión se consultan en Preparación. Mantén la sincronización y los reintentos automáticos en segundo plano.

Separar inventarios por evento NO debe ocultar ni sustituir funcionalidades existentes. Carta & Compras siempre debe abrir sus herramientas completas: carta, recetas, crear insumos, aumentar cantidades, editar stock, eliminar, subir Excel y descargar Excel. El resumen del evento tiene su propia vista. En eventos, los cambios deben guardarse en su inventario/carta sin navegar fuera de la pantalla ni modificar la bodega habitual.
