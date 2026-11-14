# 🚀 Guía Completa: Hostinger + Base de Datos + Primer Evento

Todo el sistema ya está preparado para subir **directamente a Hostinger (sin necesidad de GitHub)** y funcionar en tu iPad el día de mañana.

---

## 💬 Mensaje Final para Pegar en Antigravity (Mínimo gasto de créditos)
Copia y pega este mensaje exacto cuando abras el proyecto en Antigravity:

```markdown
Este proyecto es un sistema POS de Bar/Restaurante hecho en Vite + React + TypeScript + Tailwind CSS listo para desplegarse como sitio estático SPA en Hostinger (`public_html`).

Ya están incluidos en el repositorio:
- `public/.htaccess` (reglas SPA + caché + compresión para Hostinger)
- `src/lib/supabase.ts` y `supabase_schema.sql` (conexión completa con Supabase y fallback offline en localStorage)
- `hostinger_mysql_schema.sql` (esquema opcional por si usamos MySQL/phpMyAdmin en Hostinger)

Por favor realiza ÚNICAMENTE estos 3 pasos técnicos sin modificar la interfaz ni las funcionalidades existentes:
1. Crea o actualiza el archivo `.env` con las credenciales de Supabase (`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`) que te indique, o déjalo listo para compilación estática si vamos directo con localStorage.
2. Verifica que `npm install` y `npm run build` terminen sin errores y genera la carpeta `dist/` lista para subir por completo (incluyendo `dist/.htaccess`) a `public_html` en Hostinger.
3. Confírmame paso a paso qué debo subir a `public_html` y cómo cargar mi stock inicial hoy para el evento de mañana.
```

---

## 📦 ¿Cómo funciona la Base de Datos en Hostinger? (Elige 1 de las 3 opciones)

1. **Opción A — Directo en Hostinger (Más rápido para mañana, 0 configuración):**
   - Solo subes el contenido de `dist/` a `public_html` en Hostinger.
   - El navegador del iPad guarda todo automáticamente (stock, carta, precios, comandas y cierre) y al final de la noche descargas el **Excel** de respaldo.
2. **Opción B — Hostinger + Supabase Gratis (Recomendada para sincronizar varios dispositivos):**
   - Pegas `supabase_schema.sql` en el *SQL Editor* de Supabase y agregas `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env` antes de correr `npm run build`.
   - Sube el `dist/` a `public_html` de Hostinger y ¡listo! Todo queda sincronizado en la nube + respaldo offline en el iPad.
3. **Opción C — Base de Datos MySQL de Hostinger:**
   - Si prefieres crear la base dentro del mismo hPanel de Hostinger (*Bases de datos MySQL -> phpMyAdmin*), importa el archivo `hostinger_mysql_schema.sql` incluido en este proyecto.

---

## 🍸 Pasitos Rápidos para Hoy (Preparar tu Stock para Mañana)
1. Entra a **Carta & Compras** -> pestaña **Compras de Insumos & Bodega**:
   - Edita directo en la lista cuánto stock real tienes para mañana (ej. `12` botellas de Pisco) y su costo real por botella/paquete.
   - Si te falta un insumo nuevo, usa **+ Nuevo Insumo**.
2. Pasa a la pestaña **Carta, Precios & Recetas**:
   - Ya tienes 4 tragos/tapas activos de ejemplo y **12 ejemplos más con foto** listos abajo: solo haz clic en **`+ Activar`** en los que sí venderás mañana.
   - Si necesitas una sección nueva (ej. *Shots*, *Botellas*, *Combos*), pulsa **`+ Cat`**.
3. Pulsa el ícono de **Ajustes (⚙️) -> Impresora POS-D 230**:
   - Elige ancho **80mm** y pon el nombre de tu barra, conecta la impresora al router WiFi o laptop de barra y dale a **Probar Impresión**.
4. ¡Listo! Mañana solo abres **Barra**, tocas los tragos y cobras con **1 toque**.
