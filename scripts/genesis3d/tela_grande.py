# Muestra grande y repetible de la tela de Génesis, sacada de la foto plana del
# pantalón (escala real conocida: la foto mide 0,60 m de ancho).
#
# Uso:  python scripts/genesis3d/tela_grande.py public/productos/obra-001/pantalon.webp public/productos/obra-001/toile.webp
# Necesita: pip install opencv-python-headless pillow numpy
#
# Qué hace:
#  1. recorta dos zonas lisas de las perneras (sin bolsillos, pliegue ni bajos);
#  2. iguala la luz (divide por la luz de fondo muy desenfocada);
#  3. recolorea con dos tintas, crudo y granate, conservando los matices del dibujo;
#  4. une las dos zonas y cierra los bordes para que se repita sin cortes. Las uniones
#     siguen el camino donde las dos imágenes se parecen más (corte de costura mínimo),
#     así no aparecen dibujos fantasma superpuestos;
#  5. guarda la muestra e imprime cuántos metros mide (para la escala de las prendas 3D).
import sys
import numpy as np
import cv2
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
PHOTO_WIDTH_M = 0.60

rgba = np.asarray(Image.open(src).convert("RGBA")).astype(np.float32)
H, W = rgba.shape[:2]
px_per_m = W / PHOTO_WIDTH_M

def region(x0, x1, y0, y1):
    r = rgba[y0:y1, x0:x1]
    assert (r[..., 3] > 250).mean() > 0.995, "la zona tiene huecos de fondo"
    return r[..., :3].copy()

left = region(120, 478, 470, 950)
right = region(604, 962, 470, 950)

def flatten(img):
    lum = img.mean(axis=2)
    low = cv2.GaussianBlur(lum, (0, 0), 40)
    return img * (np.percentile(lum, 75) / np.maximum(low, 1))[..., None]

left, right = flatten(left), flatten(right)

def min_cut_join(a, b, overlap):
    """Une a (izquierda) y b (derecha) en horizontal solapando `overlap` columnas,
    cortando por el camino vertical de menor diferencia."""
    A = a[:, -overlap:]
    B = b[:, :overlap]
    err = ((A - B) ** 2).sum(axis=2)
    h = err.shape[0]
    cost = err.copy()
    back = np.zeros_like(err, dtype=np.int64)
    for y in range(1, h):
        for x in range(overlap):
            lo, hi = max(0, x - 1), min(overlap, x + 2)
            k = lo + int(np.argmin(cost[y - 1, lo:hi]))
            back[y, x] = k
            cost[y, x] += cost[y - 1, k]
    path = np.zeros(h, dtype=np.int64)
    path[-1] = int(np.argmin(cost[-1]))
    for y in range(h - 1, 0, -1):
        path[y - 1] = back[y, path[y]]
    mid = np.empty_like(A)
    for y in range(h):
        c = path[y]
        mid[y, :c] = A[y, :c]
        mid[y, c:] = B[y, c:]
        # Fundido de 3 px justo en el corte: ni escalón ni fantasma.
        for d in (-1, 0, 1):
            x = c + d
            if 0 <= x < overlap:
                t = (d + 1.5) / 3
                mid[y, x] = A[y, x] * (1 - t) + B[y, x] * t
    return np.concatenate([a[:, :-overlap], mid, b[:, overlap:]], axis=1)

OV = 70
strip = min_cut_join(left, right, OV)

def wrap_x(img, overlap):
    """Hace que el borde derecho case con el izquierdo (repetición horizontal)."""
    w = img.shape[1]
    joined = min_cut_join(img, img, overlap)  # img + img solapadas
    # La parte central de 'joined' de ancho w - overlap es periódica.
    return joined[:, w - overlap: 2 * w - 2 * overlap]

tile = wrap_x(strip, OV)
tile = np.transpose(wrap_x(np.transpose(tile, (1, 0, 2)), OV), (1, 0, 2))

# Recoloreado a dos tintas, con los matices intermedios del grabado.
ref = tile.reshape(-1, 3)
L = tile.mean(axis=2)
# El fondo (la mayor parte de la tela) queda crudo limpio; solo el grabado lleva tinta.
lo, hi = np.percentile(L, [2, 52])
amt = np.clip((hi - L) / (hi - lo), 0, 1)
amt = np.clip((amt - 0.08) / 0.92, 0, 1) ** 0.85
# Trazo un pelo más grueso: a distancia el grabado sigue leyéndose granate, no rosa.
amt = np.maximum(amt, cv2.dilate(amt.astype(np.float32), np.ones((2, 2), np.uint8)) * 0.8)
cream = np.array([244, 237, 226], np.float32)
ink = np.array([104, 26, 38], np.float32)
col = cream * (1 - amt[..., None]) + ink * amt[..., None]
img = np.clip(col, 0, 255).astype(np.uint8)
Image.fromarray(img).save(out, quality=90)
h, w = img.shape[:2]
print(f"muestra {w}x{h} px = {w / px_per_m:.4f} x {h / px_per_m:.4f} m")
