# 🚀 Guía de Despliegue en Hostinger (Para este Sábado)

Esta guía explica paso a paso cómo subir y activar el sistema en tu hosting de **Hostinger** (Hosting Web o Cloud) para usarlo en la noche de barra.

---

## Requisitos Previos
1. Una cuenta activa en Hostinger con un dominio o subdominio asignado (ejemplo: `barra.tudominio.com` o `tudominio.com`).
2. El proyecto compilado listo para producción.

---

## Paso 1: Compilar el Proyecto
En tu máquina o terminal, ejecuta:
```bash
npm run build
```
Esto creará una carpeta llamada `dist/` con todos los archivos estáticos optimizados (`index.html`, carpeta `assets/`, imágenes, y el archivo `.htaccess`).

---

## Paso 2: Subir a Hostinger via hPanel (Administrador de Archivos)
1. Entra a tu panel de control de Hostinger (**hPanel**): `https://hpanel.hostinger.com`
2. Ve a la sección **Sitios Web** -> Clic en **Administrar** en tu dominio.
3. En el menú izquierdo, busca **Archivos** -> **Administrador de Archivos** (File Manager).
4. Abre la carpeta `public_html/`.
   - Si vas a usar un subdominio (ej: `app.tudominio.com`), entra a la carpeta correspondiente de ese subdominio.
5. Si hay un archivo `default.php` creado por Hostinger, bórralo o renómbralo.
6. Sube **todo el contenido** que está dentro de la carpeta `dist/` a `public_html/`:
   - `index.html`
   - `.htaccess` (¡Muy importante! Es el que evita errores 404 al recargar)
   - Carpeta `assets/`
   - Carpeta `public/` o imágenes asociadas

*Tip:* Puedes comprimir el contenido de `dist/` en un archivo `dist.zip`, subirlo y darle clic derecho -> **Extraer** en el Administrador de Archivos de Hostinger para subirlo en 5 segundos.

---

## Paso 3: Configurar Variables de Supabase en Producción
Para que la base de datos de Supabase se conecte en producción:
1. En tu archivo `.env` o en la compilación, define:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...tu_clave_anonima_publica...
   ```
2. Si prefieres no recompilar, el sistema ya cuenta con respaldo automático en **localStorage**, por lo que **nunca se caerá ni dejará de funcionar en tu iPad**, incluso si la conexión a internet parpadea durante la noche.

---

## Paso 4: Probar en el iPad
1. Abre **Safari** en el iPad.
2. Ingresa a tu URL (ej. `https://tu-barra.com`).
3. Toca el botón **Compartir** de Safari (icono del cuadrado con flecha arriba) y selecciona **"Agregar a Inicio"** (Add to Home Screen).
4. Ahora tendrás un icono como una App nativa en tu iPad, en pantalla completa sin barra de navegación del navegador, ultra rápido y listo para operar.
