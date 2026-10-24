# Chart Noir — foto de producto "de estudio".
# 1) Quita el fondo:   rembg i -m birefnet-general foto.jpg recorte.png   (pip install "rembg[cpu]")
# 2) Este script:      python scripts/foto-estudio.py recorte.png salida.png [--nosym] [--crop y0 y1]
#    Endereza la prenda, hace su contorno simétrico, iguala la luz y el balance de blancos.
#    Necesita: pip install opencv-python-headless pillow numpy
"""Convierte un recorte en foto de producto: endereza, simetriza el contorno,
iguala la luz y el balance de blancos. Uso: studio.py in.png out.png [--nosym] [--crop y0 y1]"""
import sys, cv2, numpy as np
from PIL import Image

args = sys.argv[1:]
src, dst = args[0], args[1]
sym = "--nosym" not in args
crop = None
if "--crop" in args:
    i = args.index("--crop"); crop = (int(args[i+1]), int(args[i+2]))

im = np.array(Image.open(src).convert("RGBA")).astype(np.float32)
if crop: im = im[crop[0]:crop[1]]
a = im[:, :, 3]
# Solo el trozo grande (fuera restos sueltos)
m = (a > 128).astype(np.uint8)
n, lab, stats, _ = cv2.connectedComponentsWithStats(m, 8)
if n > 2 and sym:
    big = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
    a[(lab != big) & (lab != 0)] = 0
    im[:, :, 3] = a

def best_angle_axis(alpha):
    small = cv2.resize(alpha, None, fx=0.25, fy=0.25)
    mk = (small > 128).astype(np.float32)
    h, w = mk.shape
    best = (-1, 0, w / 2)
    for ang in np.arange(-6, 6.01, 0.25):
        M = cv2.getRotationMatrix2D((w / 2, h / 2), ang, 1)
        r = cv2.warpAffine(mk, M, (w, h))
        cols = np.where(r.sum(0) > 0)[0]
        if len(cols) == 0: continue
        for ax in np.arange(cols.min() + (cols.max() - cols.min()) * 0.35, cols.min() + (cols.max() - cols.min()) * 0.65, 0.5):
            half = int(min(ax, w - ax))
            L = r[:, int(ax - half):int(ax)]
            R = r[:, int(ax):int(ax + half)][:, ::-1]
            k = min(L.shape[1], R.shape[1]); L, R = L[:, -k:], R[:, -k:]
            inter = (L * R).sum(); uni = np.maximum(L, R).sum()
            iou = inter / max(uni, 1)
            if iou > best[0]: best = (iou, ang, ax * 4)
    return best

if sym:
    iou, ang, axis = best_angle_axis(a)
    h, w = a.shape
    M = cv2.getRotationMatrix2D((w / 2, h / 2), ang, 1)
    # el eje se mueve con la rotación: recalculamos tras girar
    im = cv2.warpAffine(im, M, (w, h), flags=cv2.INTER_CUBIC, borderValue=(0, 0, 0, 0))
    axis = best_angle_axis(im[:, :, 3])[2]  # ya girada: solo nos interesa el eje
    # Centramos el eje y hacemos el contorno simétrico (intersección con su espejo):
    # la tela de dentro es la real, solo se recortan los bordes que sobresalen.
    half = int(min(axis, w - axis))
    im = im[:, int(axis - half):int(axis + half)]
    al = im[:, :, 3]
    im[:, :, 3] = np.minimum(al, al[:, ::-1])
    print(f"simetría IoU={iou:.3f} giro={ang:.2f}°")

rgb = im[:, :, :3]; al = im[:, :, 3] / 255.0
mask = (al > 0.5).astype(np.float32)
# Luz pareja: dividimos por la luminancia muy suavizada dentro de la prenda.
lum = rgb.mean(2)
sig = max(rgb.shape[:2]) / 12
num = cv2.GaussianBlur(lum * mask, (0, 0), sig); den = cv2.GaussianBlur(mask, (0, 0), sig) + 1e-4
low = num / den
target = np.percentile(low[mask > 0], 60)
gain = np.clip(target / np.maximum(low, 1), 0.85, 1.25)[:, :, None]
rgb = rgb * gain
# Balance de blancos: el crudo de la tela hacia un crudo limpio y neutro.
bright = (rgb.mean(2) > np.percentile(rgb.mean(2)[mask > 0], 75)) & (mask > 0)
ref = rgb[bright].mean(0)
want = np.array([238, 231, 218], np.float32)
rgb = rgb * (want / ref)
# Contraste suave y un toque de nitidez
rgb = (rgb - 128) * 1.06 + 128
blur = cv2.GaussianBlur(rgb, (0, 0), 1.2)
rgb = np.clip(rgb + 0.45 * (rgb - blur), 0, 255)
# Borde del recorte limpio
al = cv2.GaussianBlur(im[:, :, 3], (0, 0), 0.8)
al = np.clip((al - 40) * 1.25, 0, 255)
out = np.dstack([rgb, al]).astype(np.uint8)
img = Image.fromarray(out, "RGBA")
img = img.crop(img.getbbox())
img.save(dst)
print(dst, img.size)
