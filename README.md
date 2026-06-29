# Rock Camp Vega 2026 — Galería de fotos

Web estática para mostrar las fotos del campamento. Pensada para alojarse
en **GitHub Pages**.

## Estructura

```
index.html
styles.css
script.js
logos/
  logo_rockcamp_superhorizontal.svg   ← sustituye este archivo por el logo oficial (mismo nombre)
fotos/
  (aquí van las fotos de la galería)
```

## Cómo funciona el escaneo automático

GitHub Pages es alojamiento estático: no hay servidor que pueda "leer"
una carpeta en el momento. Para conseguir el efecto de detección
automática, `script.js` usa la **API pública de GitHub** para listar
el contenido de la carpeta `fotos/` cada vez que alguien abre la página.

Esto significa que:

- **No tienes que tocar ningún código** para añadir fotos nuevas.
  Solo sube los archivos a la carpeta `fotos/` del repositorio (puedes
  hacerlo directamente desde la web de GitHub, arrastrando archivos).
- La próxima vez que alguien abra la página (o recargue), la foto nueva
  aparecerá sola.
- El orden de la galería es alfabético por nombre de archivo. Si quieres
  controlar el orden, usa un prefijo numérico o de fecha en el nombre
  (ej. `2026-07-01_001.jpg`).
- Formatos admitidos: `.jpg` `.jpeg` `.png` `.webp` `.gif` `.avif`.

### Límite de peticiones a la API de GitHub

La API pública de GitHub permite 60 peticiones por hora sin
autenticación, por IP. Para una galería de uso normal (familias,
campamento) es más que suficiente; si esperas tráfico muy alto,
contempla generar un `manifest.json` con un script en lugar de
consultar la API en vivo.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub y sube todos estos archivos
   (manteniendo la estructura de carpetas).
2. Sustituye `logos/logo_rockcamp_superhorizontal.svg` por el logo
   oficial, **con el mismo nombre de archivo**.
3. Sube las fotos del campamento a la carpeta `fotos/`.
4. En el repositorio, ve a **Settings → Pages**, y en "Source"
   selecciona la rama (normalmente `main`) y la carpeta raíz (`/`).
5. GitHub te dará una URL del tipo
   `https://tu-usuario.github.io/nombre-del-repo/`. Esa es tu web.

La detección de usuario/repositorio es automática a partir de esa URL,
así que no necesitas configurar nada más. Si en el futuro usas un
dominio propio (no `*.github.io`), rellena las variables `owner` y
`repo` al principio de `script.js`.

## Si el repositorio es privado

La API de contenidos de GitHub no funciona sin autenticación en
repositorios privados, así que el repositorio debe ser **público**
para que la galería pueda leer la carpeta `fotos/` (GitHub Pages
gratuito requiere de todas formas un repo público, salvo plan de pago).
