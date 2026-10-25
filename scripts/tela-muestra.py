# Muestra de tela repetible (para los costados de las prendas 3D).
# Uso:  python scripts/tela-muestra.py foto-de-cerca.png foto-de-estudio-de-la-pieza.webp salida.webp X0 X1 Y0 Y1
#   foto-de-cerca: la tela fotografiada de cerca (si es .HEIC, convertir antes a PNG: pip install pillow-heif)
#   X0..Y1: la zona sin bolsillos ni costuras, en proporción de 0 a 1 (Génesis: 0.222 1 0.824 1)
# Qué hace: recorta esa zona, iguala la luz, la hace repetible sin cortes (mezcla con la misma
# imagen desplazada media vuelta) y la recolorea con el crudo de la foto de estudio y el granate
# real de la tela, para que case con la prenda. Necesita: pip install opencv-python-headless pillow numpy
import numpy as np, cv2, sys
from PIL import Image
src, ref_path, out_path = sys.argv[1:4]
fx0, fx1, fy0, fy1 = map(float, sys.argv[4:8])
im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
H, W = im.shape[:2]
c = im[int(fy0*H):int(fy1*H), int(fx0*W):int(fx1*W)]
c = cv2.resize(c, (2048, int(2048*c.shape[0]/c.shape[1])), interpolation=cv2.INTER_AREA)
lum = c.mean(axis=2)
low = cv2.GaussianBlur(lum, (0,0), 90)
c = c * (np.percentile(lum, 70) / np.maximum(low, 1))[:,:,None]
h, w = c.shape[:2]
r = np.roll(np.roll(c, w//2, axis=1), h//2, axis=0)
yy, xx = np.mgrid[0:h, 0:w]
wx = np.clip(np.minimum(xx, w-1-xx) / (w*0.08), 0, 1)
wy = np.clip(np.minimum(yy, h-1-yy) / (h*0.08), 0, 1)
m = (wx*wy)[:,:,None]
t = c*m + r*(1-m)
ref = np.asarray(Image.open(ref_path).convert('RGBA')).astype(np.float32)
op = ref[:,:,3] > 200
R = ref[:,:,:3][op]
L = t.mean(axis=2)
Lr = R.mean(axis=1)
cream = R[Lr > np.percentile(Lr, 80)].mean(0)
lo, hi = np.percentile(L, [5, 72])
amt = np.clip((hi - L) / (hi - lo), 0, 1)[:,:,None]
ink = t[amt[:,:,0] > 0.85].mean(0)  # el granate real de la tela, de la foto de cerca
t = np.clip(cream * (1 - amt) + ink * amt, 0, 255).astype(np.uint8)
print("cream", cream, "ink", ink)
print(w, h)
Image.fromarray(t).save(out_path, quality=88)
