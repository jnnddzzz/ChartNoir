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

## Fase actual: el vestidor (24/10/2026)

Una sola página con scroll. Estilo **minimalista, moderno, urbano y con mucha clase**, con animaciones al hacer scroll. Jano irá añadiendo más obras e información, así que la web se mantiene limpia y sin relleno.

0. **Pantalla de carga**: número 000 → 100 (avance irregular, nunca por delante de lo que de verdad se ha descargado) y barra granate fina. Al llegar a 100: corte seco a negro (~300 ms), destello blanco breve y entrada.
1. **Portada 3D: el vestidor.** El logo flota en el centro de un pasillo de armarios negros con barras cromadas, perchas, rollos de tela en las baldas y **las prendas de Jano colgadas de frente**, cada una con su foco cenital (como en un museo). Las perchas vacías esperan las próximas obras. El logo entra grande y girado, frena en seco con una pequeña sacudida, se puede arrastrar (inercia y vuelta a ponerse de frente), se inclina hacia el cursor y la cámara tiene un paralaje suave con el ratón. **Al hacer scroll**, la cámara gira desde el logo hasta las prendas de la Obra 001 ("Colgada en el vestidor. 1/1."). Encima: "Hecho a mano. Una sola vez." y la cuenta atrás al primer drop.
   - Referencia que dio Jano: blurboys.com. No se pudo abrir desde el entorno de desarrollo; si Jano manda capturas, ajustar la portada a ellas.
2. **Obra 001**: "Mi primera obra de arte." · 1/1. El conjunto aparece montado y **se separa al hacer scroll** en chaleco y pantalón. Cada pieza se toca y abre su ficha (foto grande, 1/1, detalles, "Pedir por Instagram" y "Ver la otra pieza").
3. **El taller**: hecho a mano · telas elegidas una a una · nada se repite.
4. **Cierre**: "No es para todos. Nunca lo fue." + Instagram y TikTok.

Cuenta atrás: fecha provisional 1 de diciembre de 2026, 00:00 hora de España, en `src/config.js`.

## Lo que Jano ya ha rechazado (no volver a hacerlo)

- Niebla, transparencias, grano o cualquier efecto que haga ver el logo apagado o borroso. Todo debe verse nítido.
- Escenarios que tiñan la escena de rosa. (Antes se rechazaron paredes, pedestales y suelos iluminados por eso. El **vestidor lo pidió Jano expresamente** el 24/10/2026; se mantiene con luz blanca neutra y materiales negros para que nada se vuelva rosa. Sin pedestales.)
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
- **Plateado** pulido y nítido (metal, poca rugosidad, sin tone mapping), con **reflejos granate** del mapa de entorno.
- Cantos del monograma en plata satinada; cantos de "CHART NOIR" en granate metálico. Bisel mínimo en las letras para que la cara plateada se vea entera.
- Profundidad de extrusión ~0.7 sobre un ancho de 10 unidades del trazado.
- `assets/logo-shapes.json` contiene el logo trazado a vectores (`t:1` = letras, `t:0` = monograma). Si Jano aporta un SVG vectorizado profesional, sustituir el trazado por ese SVG (SVGLoader de Three.js).

Voz de marca: frases cortas, frías, enigmáticas. Sin emojis alegres ni exclamaciones. Ejemplos: "Los que estaban, lo saben." "No es para todos. Nunca lo fue." "Hecho a mano. Una sola vez."

## Requisitos técnicos

- Vite + Three.js (npm). Despliegue en Vercel o Netlify con dominio propio. Ninguna otra dependencia.
- Rendimiento: pixel ratio máximo 2; la escena 3D solo se dibuja con la portada a la vista.
- Responsive: el logo cabe siempre en pantalla, también en móvil vertical; respetar `env(safe-area-inset-*)`.
- Accesibilidad: respetar `prefers-reduced-motion`, descripción accesible del canvas, contraste alto, ficha de pieza con `<dialog>` (Esc la cierra).
- SEO básico: título "Chart Noir", descripción, imagen para compartir (`public/og-image.png`, el vestidor con el logo), favicon con el monograma.
- Explicar a Jano cada paso de forma sencilla: está aprendiendo desarrollo web.

## Decisiones tomadas en el proyecto

Registro de decisiones. Añadir aquí cada nueva decisión de marca o de diseño.

- **Estructura**: proyecto Vite en la raíz del repositorio `jnnddzzz/chartnoir`. (La versión solo-web-cerrada queda en `mi-portfolio/chart-noir-web`.)
- **Obras en `src/config.js`**: cada obra tiene sus piezas (foto sin fondo, nombre, detalle, "caja" dentro del conjunto y tipo de percha). Todas las piezas se cuelgan solas en el vestidor, en orden: la primera obra a la izquierda junto al logo.
- **Fotos de producto**: fondo quitado con un modelo de recorte automático (rembg/BiRefNet) y guardadas en `.webp` en `public/productos/<obra>/`. El conjunto se separó por la franja vacía entre las dos piezas.
- **Recorrido de cámara**: tres puntos (frente al logo → girando hacia la izquierda → frente a la obra). La cámara nunca atraviesa el logo; en móvil vertical se aleja lo necesario para que entren todas las piezas.
- **Luz del vestidor**: blanca y neutra (tiras LED en techo y baldas, focos sobre las prendas y el logo). Paredes casi negras para que no parezca neblina.
- **Rollos de tela de colores lisos**: con estampado parecían troncos de madera a esa distancia.
- **Cuenta atrás**: cifras estrechas y finas en plata, separadas por líneas finas; cada cifra cae como en un marcador al cambiar. La de la cabecera aparece al salir de la portada.
- **Separación del conjunto**: en escritorio las piezas se abren en diagonal y su nombre aparece al lado; en móvil solo se separan en vertical y el nombre va debajo.
- **Entradas sin riesgo**: ninguna animación empieza con el contenido invisible si puede quedarse atascada (la ficha de pieza entra con un desplazamiento corto, sin recortes).
- **Plan B sin WebGL**: se ve el logo plano (`public/logo.svg`) con el resto de la web.
- **Iconos**: `favicon.svg` y `logo.svg` se generan desde `assets/logo-shapes.json` con `npm run iconos`.
- **Eliminado**: secciones de Sonido, Código y Archivo, y la ficha de drop con precios y unidades.

## Próximas fases (no empezar sin que Jano lo pida)

1. Más obras: añadirlas en `src/config.js` (se cuelgan solas en el vestidor). Si hay varias, la sección Obra pasará a ser una galería.
2. Lista privada de acceso: campo de email; los miembros compran antes. Conectar a un proveedor de email marketing.
3. Página de drop: cuando la cuenta atrás llega a cero, la web se convierte en la tienda del drop.
4. Archivo: cada pieza vendida pasa a una galería con su número, como en un museo.
5. Tienda completa (pagos, envíos, stock).

## Archivos

- `index.html` — la página: textos de las secciones, SEO, imagen para compartir.
- `src/config.js` — fecha del drop, redes y **obras** (lo que más vas a tocar).
- `src/main.js` — une las piezas, el recorrido de cámara y las animaciones de scroll.
- `src/scene/stage.js` — renderizador, cámara y mapa de reflejos (plata y granate).
- `src/scene/logo.js` — el logo 3D plateado.
- `src/scene/closet.js` — el vestidor: armarios, perchas, prendas, telas y luces.
- `src/interaction.js` — ratón, dedo y teclado.
- `src/intro.js` — pantalla de carga 000-100 y entrada.
- `src/countdown.js` — cuenta atrás (la grande y la de la cabecera).
- `src/content.js` — la obra, la ficha de cada pieza, redes y apariciones.
- `src/styles.css` — estilos y tokens.
- `public/productos/` — fotos sin fondo de cada obra.
- `public/` — favicon, logo plano, imagen para compartir.
- `scripts/generar-iconos.mjs` — genera los iconos desde el trazado.
- `referencia/prototipo-web-cerrada.html` — prototipo original de la web cerrada.
- `assets/` — logos originales y trazado del logo.
