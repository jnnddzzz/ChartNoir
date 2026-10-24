# Chart Noir

La web oficial de Chart Noir: pantalla de carga, un vestidor en 3D con el logo plateado flotando entre las prendas, la cuenta atrás hasta el primer drop, la Obra 001 (pieza 1/1) que se separa en chaleco y pantalón al hacer scroll, y el taller (hecho a mano, telas elegidas una a una).

Hecha con **Vite** (la herramienta que sirve la web mientras trabajas y la empaqueta para publicarla) y **Three.js** (la librería que dibuja el logo en 3D).

## Ponerla en marcha en tu ordenador

Necesitas tener instalado [Node.js](https://nodejs.org) (versión 20 o más nueva).

```bash
cd Chart-Noir
npm install     # descarga Three.js y Vite (solo la primera vez)
npm run dev     # abre la web en http://localhost:5173
```

Mientras `npm run dev` está encendido, cada vez que guardas un archivo la web se actualiza sola en el navegador.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Web en local para trabajar, con recarga automática. |
| `npm run build` | Crea la versión final optimizada en la carpeta `dist/`. |
| `npm run preview` | Enseña esa versión final en local, para revisarla antes de publicar. |
| `npm run iconos` | Regenera `favicon.svg` y `logo.svg` desde el trazado del logo. |

## Cambiar la fecha del drop

Abre `src/config.js` y cambia esta línea:

```js
export const DROP_DATE = new Date("2026-12-01T00:00:00+01:00");
```

`+01:00` es la hora de España en invierno. Si el drop cae en verano (de finales de marzo a finales de octubre), usa `+02:00`.

## Añadir una prenda (una "obra")

1. Quita el fondo a las fotos (una por pieza) y guárdalas en `.webp` o `.png` en `public/productos/obra-002/`.
2. Abre `src/config.js` y, dentro de `OBRAS`, copia el bloque de la obra 001 y cambia el número, el nombre, los textos y las rutas de las fotos.
3. Guarda. La prenda aparece colgada en el vestidor 3D automáticamente.

Las redes (`REDES`) y la fecha del drop (`DROP_DATE`) también están en `src/config.js`.

## Cómo está organizado

```
Chart-Noir/
├── index.html            la página: textos de todas las secciones
├── src/
│   ├── config.js         fecha del drop, redes y obras
│   ├── main.js           une las piezas y anima el logo
│   ├── styles.css        colores y tipografía de la marca
│   ├── intro.js          pantalla de carga 0 → 100
│   ├── countdown.js      cuenta atrás
│   ├── content.js        la obra, la ficha de cada pieza y las redes
│   ├── interaction.js    ratón, dedo y teclado
│   └── scene/
│       ├── stage.js      cámara y reflejos (plata y granate)
│       ├── logo.js       el logo plateado en 3D
│       └── closet.js     el vestidor: armarios, perchas y prendas
├── public/               favicon, logo plano, imagen para compartir
│   └── productos/        fotos sin fondo de cada obra
├── assets/               logos originales y trazado del logo
├── referencia/           el prototipo aprobado
└── CLAUDE.md             la guía de marca y del proyecto
```

## Publicarla (Vercel o Netlify)

1. Sube los cambios a GitHub.
2. En [Vercel](https://vercel.com) o [Netlify](https://netlify.com), crea un proyecto nuevo desde este repositorio.
3. Detectan Vite solos: comando `npm run build`, carpeta `dist`.
4. Conecta tu dominio en los ajustes del proyecto.
5. Cuando tengas dominio, cambia en `index.html` la ruta de `og:image` por la dirección completa (por ejemplo `https://chartnoir.com/og-image.png`).
