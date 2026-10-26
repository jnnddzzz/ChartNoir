# Chart Noir — Web oficial

Este archivo es la guía del proyecto. Léelo entero antes de escribir código y respétalo en cada decisión.

## Qué es Chart Noir

Marca española de streetwear fundada por Jano. Concepto: un club privado nocturno de ciudad convertido en marca de ropa. Elegancia exótica de calle (Londres, Nueva York, 3 de la mañana), atrevida pero siempre de alta clase. La web debe sentirse como un museo de arte cuya obra es la ropa. **Desde el 25/10/2026 (quinta versión) Jano pidió que se diga**: el vestidor sigue siendo un armario, pero lleva rótulos de museo ("museo de moda").

- Tono: misterioso, serio, espeluznante e impactante. La marca no da miedo: intriga.
- Público: 20-25 años. Valores: exclusividad, ambición/ascenso, autenticidad.
- **Lo que hay que transmitir (24/10/2026)**: marca innovadora; por ahora todo **hecho a mano**; **telas especialmente seleccionadas**. Cada prenda es una "obra".
- Venta: drops limitados. La primera obra es **1/1** (pieza única). Cuando se agota, se agota.
- Redes principales: Instagram y TikTok (ahora mismo, la cuenta personal @jjn.dzz).
- La música ya **no** aparece en la web: Jano decidió que no tiene que ver con la marca.

## Fase actual: el vestidor-museo (25/10/2026, sexta versión)

Una sola página con scroll. Estilo **minimalista, moderno, urbano, futurista, limpio y con mucha clase**, con animaciones al hacer scroll. Jano irá añadiendo más obras, fotos e información.

0. **Pantalla de carga**: número 000 → 100 (avance irregular, nunca por delante de lo descargado) y barra granate fina. Al llegar a 100: corte seco a negro (~300 ms), destello blanco breve y entrada.
1. **Portada 3D: vestidor circular convertido en museo (quinta versión, 25/10/2026; la cuarta "se adapta casi 100%").** Pantalla limpia: **sin cuenta atrás en la portada** (solo queda la pequeña de la cabecera, al salir de la portada). Referencia: blurboys.com (sala circular, logo fijo en el centro, la sala gira a su alrededor). Sala circular + recorrido de cámara de la primera versión. **Al bajar (sexta versión)**: la portada mide 420vh; en el primer 60 % del scroll la cámara viaja hasta la vitrina y, con el scroll que sigue, **Génesis da una vuelta completa de 360°** al ritmo del scroll; al terminar aparece el rótulo final.
   - **Entrada inmersiva** (26/10/2026, ~3,6 s): tras el corte a negro **el símbolo ya está ahí desde el primer instante**, enorme, de lado y brillando más que nunca en la sala a oscuras. Se gira hacia la cámara y se aleja hasta su sitio mientras **la sala da una vuelta a su alrededor y se frena**, y las luces se encienden en secuencia con un parpadeo seco (anillo del techo, juntas recorriendo la sala, columnas y halo del escaparate, focos, lámpara, charco de luz). El brillo extra del metal se calma al final. Sin sacudidas de cámara.
   - **El símbolo**: pequeño (~22 % del ancho en horizontal, ~44 % en vertical; reducido otra vez el 26/10/2026). **Entrada: aparece grande** (~3,2× en horizontal, ~2× en vertical) y **se encoge** hasta su tamaño a lo largo de la entrada; la primera vuelta automática espera a que se asiente. Flota en el centro de la sala (cámara a 4,2 m). **Siempre en el centro de la pantalla y siempre de frente a la cámara**, desde cualquier lado (también desde arriba o desde abajo), con el mismo tamaño en pantalla. Descansa de frente; **cada ~9 s da una vuelta completa de 360°**; arrastrándolo se gira libremente **en cualquier dirección** y al soltarlo vuelve solo de frente.
   - **Vista 360° en todas direcciones** (quinta versión): arrastrar fuera del símbolo gira la sala alrededor del símbolo **sin topes**: a los lados, por encima (se ve el suelo desde el techo) y por debajo (el techo desde el suelo), dando la vuelta completa. La cámara recorre una esfera alrededor del símbolo y se acerca lo justo para no salir de la sala. Con ratón, touchpad o lápiz, siempre (aunque la pantalla también sea táctil: se mira el tipo de cada arrastre, no el del aparato). Táctil: **arriba del todo, en la sala, el dedo gira la sala y el símbolo en todas direcciones** (sin modos); para bajar, botón **↓**, que hace el recorrido de cámara hasta la vitrina y la vuelta de Génesis como una secuencia (~4 s, se corta tocando); en cuanto se baja, el dedo vuelve a hacer scroll. Agarrar el símbolo: cuenta toda su zona (también los huecos entre trazos). ‹ › y flechas saltan de escaparate. En reposo (5 s sin tocar), deriva lenta y la vista vuelve despacio al horizonte; la vuelta automática del símbolo espera a que no se toque nada.
   - **Sala majestuosa**: 5 m de radio y 4,2 m de alto; pilastras acanaladas con capitel y basa de acero y línea de luz empotrada entre módulos.
   - **Escaparate principal (módulo 0)**: **vitrina con Génesis en 3D, "puesto" como si alguien lo llevara (maniquí invisible), flotando** en el centro de la vitrina, más grande que en la vida real (1,9 m de alto el conjunto montado), con un balanceo y una subida y bajada muy lentos y un aro de luz en la peana debajo. Sin barra ni perchas. Delante de un **halo retroiluminado** (caja de luz de museo), entre **dos columnas de luz**, con foco con sombras reales y dos luces laterales; fondo de roble acanalado, marco de acero, peana de mármol y placa "OBRA 001 · GÉNESIS / 1/1 · TALLA M".
   - **Museo de moda**: friso con letras de museo retroiluminadas en la cornisa de cada módulo ("MUSEO DE ARTE" sobre el escaparate, "SALA I · GÉNESIS", "COLECCIÓN PERMANENTE", "MUSEO DE MODA", "CHART NOIR · MUSEO DE ARTE"…); delante del escaparate, cordón de terciopelo burdeos entre postes de acero y atril con la **cartela** de la obra; **pared del taller** (módulo 6, enfrente del escaparate) con texto de sala "CHART NOIR / MUSEO DE ARTE / SALA I · EL TALLER" y las fotos del proceso enmarcadas (marco negro, paspartú, luz de cuadro y cartela); dos bancos de museo de piel negra; raíl circular de focos de museo en el techo.
   - **Aura** (26/10/2026): medallón en el suelo bajo el símbolo (estrella de acero, aro de luz empotrado y anillo de letras grabadas "CHART NOIR · MUSEO DE ARTE · SALA I · HECHO A MANO · UNA SOLA VEZ · COLECCIÓN PERMANENTE"), línea de luz a ras de suelo al pie de todas las paredes, cúpula estrellada (puntos de luz finos sobre negro), cascada de cristales colgando de la lámpara (varillas de acero con punta de luz), portal de luz que enmarca la vitrina principal y luz que se escapa entre las puertas de los armarios.
   - Resto de hornacinas: biblioteca de telas ("ARCHIVO DE TELAS": baldas de roble con línea de luz, telas dobladas y rollos de tela) hasta que lleguen nuevas obras. Armarios de laca acanalada con tiradores cromados y haces de luz.
   - **Suelo** de mármol negro con vetas, aros y líneas radiales de acero y charco de luz bajo el símbolo. **Techo** artesonado (cúpula con aros y radios de acero) con anillo de luz, vigas, focos, raíl de focos y lámpara central de anillos escalonados.
   - Etiqueta flotante por escaparate ("001 · Génesis · 1/1 +"); nunca encima del símbolo. Tocar una prenda abre su ficha.
   - Al final del recorrido: "Obra 001 · 1/1 · Talla M · Chaleco y pantalón — **Génesis.**" + "Verlo de cerca".
2. **Obra 001**: "Mi primera obra de arte." · 1/1 · Talla M. El conjunto aparece montado (fotos de estudio, simétricas) y **se separa al hacer scroll** en chaleco y pantalón. Cada pieza abre su ficha (con **← Volver** arriba a la izquierda, **Cerrar ✕** a la derecha, flechas **‹ ›** a los lados de la foto y contador "01 / 02 · Chaleco"; también con las flechas del teclado): foto, 1/1, talla, resumen, detalles, medidas en plano, "Pedir por Instagram", "Pujar por esta obra" y "Ver la otra pieza".
3. **Tu voz**: puja ("¿Cuánto pagarías?", cantidad + nombre y contacto opcionales) y opinión ("¿Lo recomendarías?" 1-5 + texto + nombre opcional). Las respuestas quedan registradas (ver Decisiones). El dueño ve un panel privado con todas las respuestas.
4. **El taller**: hecho a mano · telas elegidas una a una · hecho para durar, con fotos del proceso (patrón del pantalón, espalda del chaleco).
5. **Cierre**: "No es para todos. Nunca lo fue." + Instagram y TikTok.

Cuenta atrás (solo en la cabecera desde la quinta versión): fecha provisional 1 de diciembre de 2026, 00:00 hora de España, en `src/config.js`.

### Datos de la Obra 001 (dados por Jano el 24/10/2026)
- Nombre: **Génesis** (propuesto el 25/10/2026 porque Jano no quería "El conjunto": es su primera obra, el origen). Cambiable en `src/config.js`.
- Talla M. **Chaleco cropped**; **pantalón baggy**. Guardan la forma y están **doblemente forrados**.
- El pantalón tiene **dobles bolsillos delanteros** y **tiras tipo pantalón carpintero** que mantienen su estructura.
- Medidas: **inventadas provisionalmente** a petición de Jano (en `src/config.js`); sustituir por las reales cuando las dé.

## Lo que Jano ya ha rechazado (no volver a hacerlo)

- Niebla, transparencias, grano o cualquier efecto que haga ver el logo apagado o borroso. Todo debe verse nítido.
- Escenarios que tiñan la escena de rosa. (Antes se rechazaron paredes, pedestales y suelos iluminados por eso. El **vestidor lo pidió Jano expresamente** el 24/10/2026; se mantiene con luz blanca neutra y materiales negros para que nada se vuelva rosa. Sin pedestales.)
- **Reflejos granate en el logo** ("no están bien conseguidos"). El granate va en los cantos de las letras, no como reflejos.
- Logo apagado o gris (segunda versión): tiene que ser llamativo y luminoso.
- Letras de los cantos superpuestas detrás del logo.
- Sala que no deja mirar 360° (arriba/abajo), interior de armario pobre, y exponer solo una pieza: el conjunto se expone completo.
- Giro solo en horizontal (cuarta versión): el logo y la sala giran 360° en **todas** direcciones, con el logo siempre en el centro.
- Cuenta atrás en la portada: la portada queda limpia.
- Llamar "El conjunto" a la obra: usar su nombre (Génesis).
- Símbolo demasiado grande al girar (quinta versión): ahora más pequeño.
- Sala que solo gira en horizontal en ordenadores táctiles o en móvil, y símbolo que "parpadea" (pasa de plata a negro) al girarlo: arreglado el 25/10/2026 (ver Vista 360° y Logo 3D).
- Web que "tiembla" en el móvil y reflejos raros en el símbolo: arreglado el 26/10/2026 (ver Requisitos técnicos).
- Símbolo girando sin parar (de canto se ve oscuro): descansa de frente y da vueltas completas de vez en cuando.
- Prendas como recortes planos colgados ("se ve muy cutre"): siempre en 3D, con volumen, textura y percha realista.
- Costados de las prendas 3D con la foto estirada, bajos del pantalón cortados en los laterales y sisas pobres (sexta versión): ahora tela real en los costados, bajos abiertos y rectos, sisas con ribete.
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
- **Llamativo** (Jano prefiere el de la primera versión): plata pulida y luminosa (softboxes blancas potentes, filos blancos), cantos del monograma en plata y cantos de "CHART NOIR" en **granate intenso**. Reflejos de estudio sin paneles de color. Un barrido de luz lento recorre el metal. El plató de reflejos gira con el logo.
- **Poca profundidad** (letras 0.26, monograma 0.4 sobre 10 de ancho) y cámara a la altura del logo: de frente solo se ve la cara plateada con un filo granate; los cantos no asoman como "letras fantasma" detrás (Jano lo rechazó).
- Tamaño y movimiento: ver "Portada" (pequeño, flotando en el centro, vueltas de 360°, se gira arrastrándolo). Los reflejos tienen laterales y fondo claros para que brille también de canto y por detrás.
- **Reflejos pegados al símbolo** (25/10/2026): el plató gira con la orientación completa del símbolo (arrastre, vuelta automática, vista desde arriba o abajo). En `main.js` se descompone el giro en orden ZXY y se pasa como `envMapRotation` en orden YXZ (Three.js lo aplica en negativo): así es exactamente la inversa, sin saltos. El plató (`stage.js`) tiene paneles grandes delante y detrás, rellenos arriba y abajo y suelo gris oscuro: el metal no pasa a negro al inclinarlo ni de espaldas.
- `assets/logo-shapes.json` contiene el logo trazado a vectores (`t:1` = letras, `t:0` = monograma). Si Jano aporta un SVG vectorizado profesional, sustituir el trazado por ese SVG (SVGLoader de Three.js).

Voz de marca: frases cortas, frías, enigmáticas. Sin emojis alegres ni exclamaciones. Ejemplos: "Los que estaban, lo saben." "No es para todos. Nunca lo fue." "Hecho a mano. Una sola vez."

## Requisitos técnicos

- Vite + Three.js (npm). Despliegue en Vercel o Netlify con dominio propio. Ninguna otra dependencia.
- Tone mapping `Neutral` (los negros siguen negros y el plateado no se quema).
- Rendimiento: pixel ratio máximo 2 (1,5 en táctil); **calidad automática**: si no llega a ~40 imágenes por segundo, baja la resolución poco a poco hasta 1× (fluidez antes que píxeles). La escena 3D solo se dibuja con la portada a la vista. El avance del scroll se mide con la altura fija de la portada (100svh), no con `innerHeight`: en el móvil la barra del navegador la cambia y hacía temblar la cámara.
- Metal del símbolo pulido pero no espejo perfecto (rugosidad 0,18): con espejo perfecto los reflejos finos centelleaban en pantallas pequeñas.
- Responsive: el logo cabe siempre en pantalla, también en móvil vertical; respetar `env(safe-area-inset-*)`.
- Accesibilidad: respetar `prefers-reduced-motion`, descripción accesible del canvas, contraste alto, ficha de pieza con `<dialog>` (Esc la cierra).
- SEO básico: título "Chart Noir", descripción, imagen para compartir (`public/og-image.png`, el vestidor con el logo), favicon con el monograma.
- Explicar a Jano cada paso de forma sencilla: está aprendiendo desarrollo web.

## Decisiones tomadas en el proyecto

Registro de decisiones. Añadir aquí cada nueva decisión de marca o de diseño.

- **Publicación** (25/10/2026): la web pública está en **https://chartnoir.github.io** (organización de GitHub `ChartNoir`, repositorio `ChartNoir/chartnoir.github.io`, que contiene **solo la web construida**: el contenido de `dist/` + `.nojekyll`). El código fuente sigue en `jnnddzzz/ChartNoir`. Para publicar un cambio: `npm run build`, copiar `dist/` al repositorio `chartnoir.github.io` y subirlo (Claude lo hace en cada cambio). Dominio propio (ej. chartnoir.com): pendiente de que Jano lo compre; entonces se añade un archivo `CNAME` en el repositorio publicado y se cambian `og:url`/`og:image` en `index.html`. Registro de pujas y opiniones: hoja de Google "Chart Noir · Respuestas" en el Drive de Jano + `scripts/google-sheets.gs`; la URL /exec va en `FEEDBACK_ENDPOINT`.
- **Estructura**: proyecto Vite en la raíz del repositorio `jnnddzzz/chartnoir`. (La versión solo-web-cerrada queda en `mi-portfolio/chart-noir-web`.)
- **Obras en `src/config.js`**: cada obra tiene talla y sus piezas (foto, ancho real, tipo de percha, resumen, detalles, medidas y "caja" dentro del conjunto). Cada pieza se cuelga sola en una hornacina, en orden (las dos primeras a cada lado del logo al empezar).
- **Fotos de producto "de estudio"**: fondo quitado con rembg/BiRefNet; después se enderezan, el contorno se hace simétrico (intersección con su espejo: la tela de dentro es la real, solo se recortan bordes) y se iguala la luz y el balance de blancos (crudo limpio). Script: `scripts/foto-estudio.py` (instrucciones dentro); Claude lo repite con cada foto nueva. El pantalón usa la foto frontal nueva (se ven los bolsillos).
- **Prendas 3D** (`src/scene/garment.js`, séptima versión 25/10/2026), `createWornOutfit`: la malla **sigue el contorno de la foto** fila a fila con precisión de subpíxel (bordes limpios por construcción, sin recorte por alfa). Cada fila es una sección redondeada (hondo máx. 0,17 × ancho de la pieza) con la costura justo en el borde. El chaleco es un tubo con **hombros cosidos, cuello abierto en el centro y sisas abiertas** (forro gris oscuro dentro); el pantalón son dos mitades de la cintura al bajo que se separan suave en la entrepierna (cada pernera, su tubo). **Bajos, cintura, cuello y sisas abiertos y rectos con ribete** (canto de tela con grosor). **Costados con la tela real**: muestra repetible sacada de la foto de cerca de Jano (`public/productos/obra-001/tela.webp`, `tela` en `config.js`, script `scripts/tela-muestra.py`), proyectada en los costados y fundida con la foto según hacia dónde mira la superficie. Detrás se ve la misma foto (las fotos son simétricas); si Jano aporta foto de la espalda, usarla para la cara trasera. (`createGarment`, la prenda colgada con percha, queda en el archivo por si vuelve a hacer falta.)
- **Sala** (`src/scene/room.js`, texturas en `src/scene/textures.js`): 12 módulos de 30°; módulo 0 = escaparate del conjunto; pares = escaparates de obras o biblioteca de telas; impares = armarios acanalados. Texturas generadas por código (mármol, acanalado, roble ahumado, placa grabada): sin descargas extra. Suelo, laca y cromo reflejan la sala real (foto cúbica al cargar). Solo el foco del escaparate principal proyecta sombras (rendimiento).
- **Cámara** (`src/main.js`): órbita esférica alrededor del logo, sin topes (giro y elevación libres; boca abajo el giro lateral se invierte para que el arrastre siga siendo natural); siempre mira al logo y su distancia se acorta por arriba y por abajo para no atravesar techo ni suelo. El logo copia la orientación de la cámara (siempre de frente) y sus reflejos de estudio la acompañan. Al bajar con el scroll recorre una curva que pasa por un lado del logo (nunca lo atraviesa) hasta quedar frente al escaparate. Tone mapping Neutral, exposición 1.0; la tela lleva un color base un punto por debajo del blanco para que el estampado no se lave bajo el foco.
- **Pujas y opiniones** (`src/feedback.js`): en la vista previa de Claude se guardan en la base de datos del artifact (cada persona escribe solo lo suyo en `pujas/<id>` y `opiniones/<id>`; solo el dueño lo lee todo). En la web publicada se envían a `FEEDBACK_ENDPOINT` (Google Apps Script → Google Sheets, `scripts/google-sheets.gs`). Sin ninguna de las dos, los formularios se desactivan y lo dicen: nunca se finge un envío.
- **Cuenta atrás**: cifras estrechas y finas en plata. Quitada de la portada el 25/10/2026 (pantalla más limpia); queda la de la cabecera, que aparece al salir de la portada. `startCountdown` mantiene la versión grande con cifras que caen por si vuelve.
- **Museo** (25/10/2026): rótulos, cartelas y texto de sala dibujados en canvas con Archivo (`friezeTexture`, `cardTexture` en `textures.js`; se espera a la fuente antes de montar la sala). Los textos del friso están en `FRIEZE` (`room.js`). La pared del taller solo aparece si el módulo 6 no lo ocupa una obra.
- **Separación del conjunto**: en escritorio las piezas se abren en diagonal con su nombre al lado; en móvil solo en vertical, con el nombre debajo.
- **Entradas sin riesgo**: ninguna animación empieza con el contenido invisible si puede quedarse atascada.
- **Plan B sin WebGL**: logo plano (`public/logo.svg`) y el resto de la web.
- **Iconos**: `favicon.svg` y `logo.svg` se generan desde `assets/logo-shapes.json` con `npm run iconos`.
- **Eliminado**: Sonido, Código, Archivo, la ficha de precios del drop, el vestidor en pasillo y la primera sala circular (prendas sueltas en hornacinas separadas).

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
- `src/scene/room.js` — la sala circular: escaparates, museo (friso, cartela, cordón, pared del taller, bancos), biblioteca de telas, armarios, suelo, techo y luces.
- `src/scene/textures.js` — mármol, acanalado, roble, placa, friso y cartelas, generados por código.
- `src/scene/garment.js` — cada prenda en 3D "puesta" (contorno, sisas, ribetes, tela en los costados).
- `scripts/tela-muestra.py` — saca la muestra de tela repetible de una foto de cerca.
- `src/feedback.js` — dónde se guardan pujas y opiniones.
- `src/interaction.js` — vista 360° (arrastre, modo 360° táctil, botones, teclado) y tocar prendas.
- `src/intro.js` — pantalla de carga 000-100 y entrada.
- `src/countdown.js` — cuenta atrás (la de la cabecera; la grande ya no se usa en la portada).
- `src/content.js` — la obra, la ficha de cada pieza, puja y opinión, taller, redes y apariciones.
- `src/styles.css` — estilos y tokens.
- `public/productos/` — fotos de estudio de cada obra y fotos del proceso.
- `public/` — favicon, logo plano, imagen para compartir.
- `scripts/generar-iconos.mjs` — genera los iconos desde el trazado.
- `scripts/google-sheets.gs` — recibe pujas y opiniones en una hoja de Google (web publicada).
- `referencia/prototipo-web-cerrada.html` — prototipo original de la web cerrada.
- `assets/` — logos originales y trazado del logo.
