# Chart Noir — Web oficial

Este archivo es la guía del proyecto. Léelo entero antes de escribir código y respétalo en cada decisión.

## Qué es Chart Noir

Marca española de streetwear fundada por Jano. Concepto: un club privado nocturno de ciudad convertido en marca de ropa. Elegancia exótica de calle (Londres, Nueva York, 3 de la mañana), atrevida pero siempre de alta clase. La web debe sentirse como un museo de arte cuya obra es la ropa, sin decirlo nunca de forma explícita.

- Tono: misterioso, serio, espeluznante e impactante. La marca no da miedo: intriga.
- Público: 20-25 años. Valores: exclusividad, ambición/ascenso, autenticidad.
- Venta: solo drops limitados y numerados (ej. Nº 027/150). Cuando se agota, se agota.
- Precios de referencia: sudaderas y pantalones 70-80 €, conjunto ~150 €. Muchas prendas unisex; habrá accesorios.
- Redes principales: Instagram y TikTok.
- Música (pilar de la marca): trap internacional (Central Cee, Lil Baby), trap italiano, afro, house, sonidos misteriosos.

## Fase actual: web de marca con cuenta atrás

Jano pidió (15/10/2026) pasar de la web cerrada a una web de marca completa, en su propio repositorio `Chart-Noir`. Es una sola página con scroll:

0. **Pantalla de carga + portada**: exactamente la web cerrada descrita abajo (carga 0-100, logo 3D, mensaje y cuenta atrás), ahora ocupando la primera pantalla.
1. **Cabecera fija**: monograma + CHART NOIR, enlaces a secciones y, al bajar de la portada, una cuenta atrás mini.
2. **01 Manifiesto**: el club privado nocturno; "No es para todos. Nunca lo fue."
3. **02 Drops**: limitado, numerado, agotado es agotado + ficha del drop (número, fecha, hora, unidades, unisex, precios de referencia, serie Nº 027/150).
4. **03 Código**: exclusividad, ascenso, autenticidad.
5. **04 Sonido**: los géneros de la marca (sin nombrar artistas, para no sugerir colaboraciones).
6. **05 Archivo**: vacío "por ahora", con marcos numerados (anticipa la fase de archivo).
7. **06 Redes**: Instagram y TikTok; muestran "Muy pronto" hasta que se pongan los enlaces en `src/config.js`.

Base: la web cerrada original. La web está cerrada hasta el primer drop. Su comportamiento:

1. **Pantalla de carga**: fondo negro puro, número grande que cuenta de 0 a 100 con avance irregular y una barra roja fina abajo. Al llegar a 100: corte seco a negro (~300 ms), destello blanco muy breve y entrada del logo.
2. **Logo 3D interactivo** (el protagonista): entra grande y girado y frena en seco en su sitio con una pequeña sacudida de cámara. Se puede arrastrar para girarlo (con inercia y vuelta suave a ponerse de frente), se inclina levemente hacia el cursor, y una luz blanca sigue al ratón por la superficie. Funciona con el dedo en móvil y con las flechas del teclado.
3. **Mensaje + cuenta atrás** abajo: "Se acerca algo serio." / "El primer drop está en camino. No avisaremos dos veces." y cuenta atrás días:horas:min:seg hasta el drop. Fecha provisional: 1 de diciembre de 2026, 00:00 hora de España; dejarla en una constante fácil de cambiar.

La referencia exacta de esta fase está en `referencia/prototipo-web-cerrada.html` (Three.js r128 en un único HTML). Úsala como punto de partida y respeta su comportamiento: el objetivo es convertirla en un proyecto bien estructurado y mejorarla, no rediseñarla.

## Lo que Jano ya ha rechazado (no volver a hacerlo)

- Niebla, transparencias, grano o cualquier efecto que haga ver el logo apagado o borroso. Todo debe verse nítido.
- Paredes, pedestales, suelos o escenarios iluminados alrededor del logo: tiñeron la escena de rosa. Fondo negro puro y nada más.
- Tipografías serif para los números (Bodoni), Michroma, o cursivas tipo Cormorant en la web.
- Desenfoques en las transiciones. Los efectos deben ser secos e impactantes.

## Identidad visual para la web

| Token | Hex | Uso |
| --- | --- | --- |
| `--negro` | #000000 | Fondo de toda la web |
| `--hueso` | #F2EEE8 | Texto principal y cara del logo |
| `--humo` | #7D7775 | Textos secundarios, etiquetas |
| `--sangre` | #8E1426 | Acentos puntuales: barra de carga, separadores, cantos de las letras del logo |
| `--burdeos` | #4C0A18 | Color de marca para piezas, packaging y redes |
| `--oro-viejo` | #9C7A3C | Solo detalles premium (futuro: etiquetas, tienda) |

Regla: el rojo y el oro se usan con cuentagotas; cuanto menos aparecen, más golpean.

Tipografía: **Archivo** (Google Fonts, variable). Versión extra ancha (`wdth` 125) y peso 800-900 para números y titulares; peso 400 para textos secundarios. Una sola familia en toda la web.

Logo 3D:
- Cara frontal en hueso, brillante y bien iluminada (sin tone mapping que la apague).
- Cantos del monograma en gris metálico; cantos de "CHART NOIR" en rojo sangre.
- Más grueso que el logo plano; profundidad de extrusión ~0.7 sobre un ancho de 10 unidades.
- `assets/logo-shapes.json` contiene el logo trazado a vectores (formas con agujeros; `t:1` = letras, `t:0` = monograma). Si Jano aporta un SVG vectorizado profesional, sustituir el trazado por ese SVG (SVGLoader de Three.js).

Voz de marca: frases cortas, frías, enigmáticas. Sin emojis alegres ni exclamaciones. Ejemplos: "Los que estaban, lo saben." "No es para todos. Nunca lo fue." "Medianoche. 150 unidades."

## Requisitos técnicos

- Stack sugerido: Vite + Three.js (versión actual vía npm). Despliegue en Vercel o Netlify con dominio propio.
- Rendimiento: carga rápida, pixel ratio limitado a 2-2.5, sin dependencias innecesarias.
- Responsive: el logo debe caber siempre en pantalla, también en móvil vertical; respetar `env(safe-area-inset-*)`.
- Accesibilidad: respetar `prefers-reduced-motion` (entrada casi instantánea, sin sacudidas), descripción accesible del canvas, contraste alto.
- SEO básico: título "Chart Noir", descripción, imagen para compartir (Open Graph) con el logo sobre negro, favicon con el monograma.
- Explicar a Jano cada paso de forma sencilla: está aprendiendo desarrollo web.

## Decisiones tomadas en el proyecto

Registro de decisiones. Añadir aquí cada nueva decisión de marca o de diseño.

- **Estructura**: proyecto Vite en la raíz del repositorio `Chart-Noir` (la versión solo-web-cerrada queda en `mi-portfolio/chart-noir-web`). Three.js y Vite por npm; ninguna otra dependencia.
- **Ajustes y contenido editable**: en `src/config.js` (`DROP_DATE`, datos del drop y precios, enlaces de redes, duración de la carga, pixel ratio, colores de la escena). Los datos del drop son provisionales.
- **Estética de museo**: secciones numeradas (01-06) con etiqueta pequeña en humo y número en sangre, titulares Archivo 900 `wdth` 125, líneas finas neutras (#222020) para separar. Apariciones al hacer scroll solo con opacidad y desplazamiento, sin desenfoques.
- **Oro viejo**: se usa una única vez, en el número de serie de la ficha del drop (es un detalle tipo etiqueta).
- **Scroll y 3D conviven**: el logo solo vive en la portada; en móvil el dedo en horizontal gira el logo y en vertical hace scroll (`touch-action: pan-y`). ↑ ↓ del teclado hacen scroll; ← → giran el logo. Fuera de pantalla, el logo deja de dibujarse.
- **Brillo del logo igual al prototipo**: las versiones actuales de Three.js calculan color y luz de forma "física", lo que oscurecía el logo respecto al r128 aprobado. Se desactiva `ColorManagement` y las intensidades de las luces se multiplican por PI (`src/scene/stage.js`). Comprobado con capturas lado a lado: mismo aspecto.
- **Cuenta atrás en fila**: el prototipo tenía un fallo de CSS (`.info .line` forzaba `display:block`) que apilaba la cuenta atrás en columna encima del logo. Corregido: días : horas : min : seg en una sola fila.
- **Carga honesta**: el contador se queda en 99 hasta que la tipografía está lista (máx. 3 s). Durante la carga no se dibuja la escena, para que el contador vaya fluido; se prepara con un render oculto.
- **Inercia independiente de la pantalla**: la animación se calcula por tiempo, no por fotograma, para que se sienta igual en móviles de 120 Hz.
- **Móvil**: la pista dice "Desliza el logo para girarlo" en pantallas táctiles; al soltar el dedo, el logo deja de inclinarse hacia el último punto tocado.
- **Plan B sin WebGL**: si el navegador no puede mostrar 3D, se ve el logo plano (`public/logo.svg`) con el mensaje y la cuenta atrás.
- **Iconos**: `favicon.svg` (monograma hueso sobre negro) y `logo.svg` se generan desde `assets/logo-shapes.json` con `npm run iconos`. `og-image.png` (1200×630) es una captura del logo 3D real sobre negro.

## Próximas fases (no empezar sin que Jano lo pida)

1. Lista privada de acceso (encajaría en la sección de Redes): campo de email en la web cerrada; los miembros compran antes. Conectar a un proveedor de email marketing.
2. Página de drop: cuando la cuenta atrás llega a cero, la home se convierte en la tienda del drop (fotos editoriales, unidades restantes numeradas).
3. Archivo: cada prenda agotada pasa a una galería con su número de serie, como en un museo.
4. Tienda completa (pagos, envíos, stock).

## Archivos

- `index.html` — la página: textos de todas las secciones, SEO, imagen para compartir.
- `src/config.js` — ajustes fáciles de cambiar (fecha del drop).
- `src/main.js` — une todas las piezas y anima el logo en cada fotograma.
- `src/scene/stage.js` — renderizador, cámara, luces y encuadre.
- `src/scene/logo.js` — construye el logo 3D desde el trazado.
- `src/interaction.js` — ratón, dedo y teclado.
- `src/intro.js` — pantalla de carga 0-100 y entrada.
- `src/countdown.js` — cuenta atrás (la grande y la mini de la cabecera).
- `src/content.js` — rellena drop y redes desde config, apariciones y cabecera.
- `src/styles.css` — estilos y tokens de color.
- `public/` — favicon, logo plano, imagen para compartir.
- `scripts/generar-iconos.mjs` — genera los iconos desde el trazado.
- `referencia/prototipo-web-cerrada.html` — prototipo funcional de la fase actual.
- `assets/logo-original.jpg` — logo original (blanco sobre burdeos).
- `assets/logo-grueso.png` — versión engrosada para tamaños pequeños.
- `assets/logo-shapes.json` — logo trazado para la extrusión 3D.
