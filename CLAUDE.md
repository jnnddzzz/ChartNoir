# Chart Noir — Web oficial

Este archivo es la guía del proyecto. Léelo entero antes de escribir código y respétalo en cada decisión.

## Qué es Chart Noir

Marca española de streetwear fundada por Jano. Concepto: un club privado nocturno de ciudad convertido en marca de ropa. Elegancia exótica de calle (Londres, Nueva York, 3 de la mañana), atrevida pero siempre de alta clase. La web debe sentirse como un museo de arte cuya obra es la ropa, sin decirlo nunca de forma explícita.

- Tono: misterioso, serio, espeluznante e impactante. La marca no da miedo: intriga.
- Público: 20-25 años. Valores: exclusividad, ambición/ascenso, autenticidad.
- **Lo que hay que transmitir (24/10/2026)**: marca innovadora; por ahora todo **hecho a mano**; **telas especialmente seleccionadas**. Cada prenda es una "obra".
- Venta: drops limitados. La primera obra es **1/1** (pieza única). Cuando se agota, se agota.
- Redes principales: Instagram y TikTok (ahora mismo, la cuenta personal @jjn.dzz).
- La música ya **no** aparece en la web: Jano decidió que no tiene que ver con la marca.

## Fase actual: el vestidor circular (24/10/2026, segunda versión)

Una sola página con scroll. Estilo **minimalista, moderno, urbano, futurista, limpio y con mucha clase**, con animaciones al hacer scroll. Jano irá añadiendo más obras, fotos e información.

0. **Pantalla de carga**: número 000 → 100 (avance irregular, nunca por delante de lo descargado) y barra granate fina. Al llegar a 100: corte seco a negro (~300 ms), destello blanco breve y entrada.
1. **Portada 3D: vestidor circular.** Referencia de Jano: blurboys.com (grabación de pantalla: sala circular tipo cámara acorazada, logo fijo en el centro y la sala gira a su alrededor; interfaz mínima abajo). Aquí: el **logo plateado queda fijo en el centro y la sala gira** (arrastrando, con ‹ › o flechas del teclado, y media vuelta al bajar con el scroll; en reposo deriva muy despacio). La pared tiene 12 módulos: armarios de laca negra con tiradores cromados y **hornacinas iluminadas donde cuelgan las prendas**, cada una en 3D (tela curvada con relieve de tejido, percha de madera negra o de pinzas, foco cenital y sombra). Cada prenda lleva una etiqueta flotante ("001 · Chaleco +"); tocar la prenda o su etiqueta gira la sala hasta ella y abre su ficha. Las hornacinas libres esperan las próximas obras. Abajo: cuenta atrás al primer drop, botones de giro y "Ver Obra 001".
2. **Obra 001**: "Mi primera obra de arte." · 1/1 · Talla M. El conjunto aparece montado (fotos de estudio, simétricas) y **se separa al hacer scroll** en chaleco y pantalón. Cada pieza abre su ficha: foto, 1/1, talla, resumen, detalles, medidas en plano, "Pedir por Instagram", "Pujar por esta obra" y "Ver la otra pieza".
3. **Tu voz**: puja ("¿Cuánto pagarías?", cantidad + nombre y contacto opcionales) y opinión ("¿Lo recomendarías?" 1-5 + texto + nombre opcional). Las respuestas quedan registradas (ver Decisiones). El dueño ve un panel privado con todas las respuestas.
4. **El taller**: hecho a mano · telas elegidas una a una · hecho para durar, con fotos del proceso (patrón del pantalón, espalda del chaleco).
5. **Cierre**: "No es para todos. Nunca lo fue." + Instagram y TikTok.

Cuenta atrás: fecha provisional 1 de diciembre de 2026, 00:00 hora de España, en `src/config.js`.

### Datos de la Obra 001 (dados por Jano el 24/10/2026)
- Talla M. **Chaleco cropped**; **pantalón baggy**. Guardan la forma y están **doblemente forrados**.
- El pantalón tiene **dobles bolsillos delanteros** y **tiras tipo pantalón carpintero** que mantienen su estructura.
- Medidas: **inventadas provisionalmente** a petición de Jano (en `src/config.js`); sustituir por las reales cuando las dé.

## Lo que Jano ya ha rechazado (no volver a hacerlo)

- Niebla, transparencias, grano o cualquier efecto que haga ver el logo apagado o borroso. Todo debe verse nítido.
- Escenarios que tiñan la escena de rosa. (Antes se rechazaron paredes, pedestales y suelos iluminados por eso. El **vestidor lo pidió Jano expresamente** el 24/10/2026; se mantiene con luz blanca neutra y materiales negros para que nada se vuelva rosa. Sin pedestales.)
- **Reflejos granate en el logo** ("no están bien conseguidos"). El logo lleva reflejos de estudio neutros; el granate solo queda en los cantos de las letras, satinado.
- Prendas como recortes planos colgados ("se ve muy cutre"): siempre en 3D, con volumen, textura y percha realista.
- Fotos de producto torcidas o con fondo: siempre recortadas, rectas, simétricas y con la luz igualada, como de estudio.
- Tipografías serif para los números (Bodoni), Michroma, o cursivas tipo Cormorant en la web.
- Desenfoques en las transiciones. Los efectos deben ser secos e impactantes.
- La sección de estilos musicales.
- Los números de la cuenta atrás anteriores (Archivo extra ancha y negrita con dos puntos rojos). Sustituidos por la versión estrecha y fina en plata (ver abajo).

## Identidad visual para la web

| Token | Hex | Uso |
| --- | --- | --- |
| `--negro` | #000000 | Fondo de toda la web |
| `--hueso` | #F2EEE8 | Texto principal |
| `--humo` | #7D7775 | Textos secundarios, etiquetas |
| `--plata` | #C9CCD1 | **Color protagonista**: logo, cifras de la cuenta atrás, botón principal, frase de cierre |
| `--sangre` | #8E1426 | Granate de acento: barra de carga, cantos y reflejos del logo |
| `--burdeos` | #4C0A18 | Granate profundo: reflejos del logo, rollos de tela, packaging y redes |
| `--oro-viejo` | #9C7A3C | Reservado para detalles premium futuros |

Regla: el granate y el oro se usan con cuentagotas; cuanto menos aparecen, más golpean.

Tipografía: **Archivo** (Google Fonts, variable), una sola familia.
- Titulares y cifras: **estrecha** (`wdth` 62), en mayúsculas. Titulares peso 600; cifras peso 200, en plata.
- Etiquetas: 10-12 px, mayúsculas, espaciado amplio (0.2-0.3 em), en humo.
- Texto de lectura: peso 400, en humo.

Logo 3D:
- **Plateado** pulido y nítido con **reflejos de estudio neutros** (softbox cenital, panel gris frontal y línea blanca baja: degradado metálico, no blanco plano). El plató de reflejos gira con el logo, así se ve igual mire hacia donde mire la sala.
- Cantos del monograma en plata cepillada; cantos de "CHART NOIR" en granate satinado (sin reflejos de color). Bisel mínimo en las letras.
- Profundidad de extrusión ~0.7 sobre un ancho de 10 unidades del trazado.
- `assets/logo-shapes.json` contiene el logo trazado a vectores (`t:1` = letras, `t:0` = monograma). Si Jano aporta un SVG vectorizado profesional, sustituir el trazado por ese SVG (SVGLoader de Three.js).

Voz de marca: frases cortas, frías, enigmáticas. Sin emojis alegres ni exclamaciones. Ejemplos: "Los que estaban, lo saben." "No es para todos. Nunca lo fue." "Hecho a mano. Una sola vez."

## Requisitos técnicos

- Vite + Three.js (npm). Despliegue en Vercel o Netlify con dominio propio. Ninguna otra dependencia.
- Tone mapping `Neutral` (los negros siguen negros y el plateado no se quema).
- Rendimiento: pixel ratio máximo 2; la escena 3D solo se dibuja con la portada a la vista.
- Responsive: el logo cabe siempre en pantalla, también en móvil vertical; respetar `env(safe-area-inset-*)`.
- Accesibilidad: respetar `prefers-reduced-motion`, descripción accesible del canvas, contraste alto, ficha de pieza con `<dialog>` (Esc la cierra).
- SEO básico: título "Chart Noir", descripción, imagen para compartir (`public/og-image.png`, el vestidor con el logo), favicon con el monograma.
- Explicar a Jano cada paso de forma sencilla: está aprendiendo desarrollo web.

## Decisiones tomadas en el proyecto

Registro de decisiones. Añadir aquí cada nueva decisión de marca o de diseño.

- **Estructura**: proyecto Vite en la raíz del repositorio `jnnddzzz/chartnoir`. (La versión solo-web-cerrada queda en `mi-portfolio/chart-noir-web`.)
- **Obras en `src/config.js`**: cada obra tiene talla y sus piezas (foto, ancho real, tipo de percha, resumen, detalles, medidas y "caja" dentro del conjunto). Cada pieza se cuelga sola en una hornacina, en orden (las dos primeras a cada lado del logo al empezar).
- **Fotos de producto "de estudio"**: fondo quitado con rembg/BiRefNet; después se enderezan, el contorno se hace simétrico (intersección con su espejo: la tela de dentro es la real, solo se recortan bordes) y se iguala la luz y el balance de blancos (crudo limpio). Script: `scripts/foto-estudio.py` (instrucciones dentro); Claude lo repite con cada foto nueva. El pantalón usa la foto frontal nueva (se ven los bolsillos).
- **Prendas 3D** (`src/scene/garment.js`): malla curvada (volumen de pecho/perneras, caída y pliegues), relieve de tejido generado, brillo de tela (sheen), percha de madera negra con gancho cromado o percha de pinzas, sombra suave en el fondo de la hornacina.
- **Sala** (`src/scene/room.js`): 12 módulos de 30°; hornacinas en los pares, armarios en los impares. Líneas de luz verticales entre módulos, anillo de luz en el techo, aro de acero en el suelo, bañadores de luz sobre los armarios y foco por hornacina. Suelo, laca y cromo reflejan la sala real (una foto cúbica tomada al cargar).
- **Cámara**: por detrás del centro, mirando a la pared; el logo siempre de frente delante de ella. En móvil vertical el logo sube y la cámara mira algo hacia arriba para que la prenda se vea debajo.
- **Pujas y opiniones** (`src/feedback.js`): en la vista previa de Claude se guardan en la base de datos del artifact (cada persona escribe solo lo suyo en `pujas/<id>` y `opiniones/<id>`; solo el dueño lo lee todo). En la web publicada se envían a `FEEDBACK_ENDPOINT` (Google Apps Script → Google Sheets, `scripts/google-sheets.gs`). Sin ninguna de las dos, los formularios se desactivan y lo dicen: nunca se finge un envío.
- **Cuenta atrás**: cifras estrechas y finas en plata; cada cifra cae como en un marcador. La de la cabecera aparece al salir de la portada.
- **Separación del conjunto**: en escritorio las piezas se abren en diagonal con su nombre al lado; en móvil solo en vertical, con el nombre debajo.
- **Entradas sin riesgo**: ninguna animación empieza con el contenido invisible si puede quedarse atascada.
- **Plan B sin WebGL**: logo plano (`public/logo.svg`) y el resto de la web.
- **Iconos**: `favicon.svg` y `logo.svg` se generan desde `assets/logo-shapes.json` con `npm run iconos`.
- **Eliminado**: Sonido, Código, Archivo, la ficha de precios del drop y el vestidor en pasillo (sustituido por el circular).

## Próximas fases (no empezar sin que Jano lo pida)

1. Más obras: añadirlas en `src/config.js` (se cuelgan solas en el vestidor). Si hay varias, la sección Obra pasará a ser una galería.
2. Lista privada de acceso: campo de email; los miembros compran antes. Conectar a un proveedor de email marketing.
3. Mostrar opiniones públicas (moderadas) como recomendaciones, si Jano lo quiere: ahora son privadas.
4. Página de drop: cuando la cuenta atrás llega a cero, la web se convierte en la tienda del drop.
5. Archivo: cada pieza vendida pasa a una galería con su número, como en un museo.
6. Tienda completa (pagos, envíos, stock).

## Archivos

- `index.html` — la página: textos de las secciones, SEO, imagen para compartir.
- `src/config.js` — fecha del drop, redes y **obras** (lo que más vas a tocar).
- `src/main.js` — une las piezas, el recorrido de cámara y las animaciones de scroll.
- `src/scene/stage.js` — renderizador, cámara y reflejos de estudio del logo.
- `src/scene/logo.js` — el logo 3D plateado.
- `src/scene/room.js` — la sala circular: armarios, hornacinas, luces.
- `src/scene/garment.js` — cada prenda en 3D con su percha y su sombra.
- `src/feedback.js` — dónde se guardan pujas y opiniones.
- `src/interaction.js` — girar la sala (arrastre, botones, teclado) y tocar prendas.
- `src/intro.js` — pantalla de carga 000-100 y entrada.
- `src/countdown.js` — cuenta atrás (la grande y la de la cabecera).
- `src/content.js` — la obra, la ficha de cada pieza, puja y opinión, taller, redes y apariciones.
- `src/styles.css` — estilos y tokens.
- `public/productos/` — fotos de estudio de cada obra y fotos del proceso.
- `public/` — favicon, logo plano, imagen para compartir.
- `scripts/generar-iconos.mjs` — genera los iconos desde el trazado.
- `scripts/google-sheets.gs` — recibe pujas y opiniones en una hoja de Google (web publicada).
- `referencia/prototipo-web-cerrada.html` — prototipo original de la web cerrada.
- `assets/` — logos originales y trazado del logo.
