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
