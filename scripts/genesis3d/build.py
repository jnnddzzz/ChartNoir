# Génesis en 3D: el maniquí y el conjunto puesto, hechos con Blender.
#
# Uso (Blender como módulo de Python, sin interfaz):
#   uv venv -p python3.13 bvenv && uv pip install -p bvenv/bin/python bpy==5.2.3
#   bvenv/bin/python scripts/genesis3d/build.py genesis-completo.glb [vista.png] [--quick]
#   npx gltfpack@0.24.0 -i genesis-completo.glb -o public/productos/obra-001/genesis.glb -cc -kn -km -vtf
#   (gltfpack comprime ~5 veces; la web lo lee con el MeshoptDecoder que trae Three.js.
#    --quick: sin horneado de sombras, para probar formas; vista.png: renders de control.)
#
# Medidas reales (persona de 1,80 m, tomadas del vídeo de Jano con el conjunto puesto);
# la web lo escala a tamaño heroico. Blender: Z arriba, el maniquí mira a -Y.
#
#  - Maniquí: esqueleto con radios (modificador Piel) + subdivisión: un cuerpo liso,
#    sin cara, brazos relajados a los lados, de pie y sin calzado.
#  - Pantalón: patrón de pantalón de verdad (cadera, tiro y dos perneras anchas hasta
#    media pierna) y SIMULACIÓN DE TELA: cintura sujeta, cae con la gravedad sobre el
#    cuerpo y hace sus propios pliegues. Pinza central delantera, bolsillos con solapa.
#  - Chaleco: corte recto y cuadrado (tela doble, rígida), hombro caído, sisas amplias,
#    cuello alto y CIERRE CRUZADO: el panel izquierdo monta sobre el derecho, con el
#    borde en diagonal desde el cuello y luego recto, esquina redondeada abajo.
#  - Grosor de tela en todos los bordes (bajos, sisas, cuello, cintura) y forro dentro.
#  - Sombras de contacto (oclusión ambiental) horneadas en los vértices con Cycles:
#    pliegues, interior, bajo el chaleco... así la ropa "pesa" y no parece pegada.
#  - UV en metros reales para la tela (la web pone la muestra de toile a su escala).
import sys
import math
import numpy as np
import bpy
import bmesh
from mathutils import Vector

OUT = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else sys.argv[1]
PREVIEW = None
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
OUT = args[0]
if len(args) > 1:
    PREVIEW = args[1]
QUICK = "--quick" in sys.argv          # sin horneado de sombras (para probar formas)

TILE_W, TILE_H = 0.3224, 0.2295        # medida real de la muestra de tela (tela_grande.py)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.scale_length = 1.0


def mesh_object(name, verts, faces, uvs=None):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces])
    me.update()
    if uvs is not None:
        uvl = me.uv_layers.new(name="UVMap")
        for poly in me.polygons:
            for li in poly.loop_indices:
                vi = me.loops[li].vertex_index
                uvl.data[li].uv = uvs[vi]
    obj = bpy.data.objects.new(name, me)
    scene.collection.objects.link(obj)
    return obj


def select_only(obj):
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def apply_all(obj):
    select_only(obj)
    for m in list(obj.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)


def shade_smooth(obj):
    for p in obj.data.polygons:
        p.use_smooth = True


# ------------------------------------------------------------------ maniquí
def build_body():
    # (punto, radio x, radio y) del esqueleto; aristas entre índices.
    P = []
    E = []

    def add(p, rx, ry=None):
        P.append((p, rx, rx if ry is None else ry))
        return len(P) - 1

    pelvis = add((0, 0.0, 0.95), 0.150, 0.105)
    waist = add((0, -0.004, 1.06), 0.128, 0.092)
    chest = add((0, -0.012, 1.25), 0.150, 0.102)
    upper = add((0, -0.004, 1.38), 0.162, 0.094)
    neck0 = add((0, 0.012, 1.475), 0.058, 0.056)
    neck1 = add((0, 0.008, 1.57), 0.052, 0.052)
    E += [(pelvis, waist), (waist, chest), (chest, upper), (upper, neck0), (neck0, neck1)]
    for s in (-1, 1):
        sh = add((s * 0.172, 0.012, 1.42), 0.05, 0.047)
        arm1 = add((s * 0.215, 0.02, 1.33), 0.045)
        elbow = add((s * 0.266, 0.03, 1.14), 0.035)
        fore = add((s * 0.28, 0.014, 1.02), 0.034, 0.031)
        wrist = add((s * 0.29, -0.004, 0.905), 0.024, 0.02)
        hand = add((s * 0.294, -0.01, 0.835), 0.035, 0.016)
        tip = add((s * 0.293, -0.01, 0.755), 0.022, 0.011)
        E += [(upper, sh), (sh, arm1), (arm1, elbow), (elbow, fore), (fore, wrist), (wrist, hand), (hand, tip)]
        hip = add((s * 0.088, 0.0, 0.9), 0.088)
        thigh = add((s * 0.096, -0.004, 0.72), 0.072)
        knee = add((s * 0.1, -0.006, 0.5), 0.05)
        calf = add((s * 0.103, 0.012, 0.36), 0.054)
        ankle = add((s * 0.106, 0.004, 0.085), 0.03)
        heel = add((s * 0.107, 0.03, 0.035), 0.032)
        mid = add((s * 0.111, -0.07, 0.03), 0.042, 0.024)
        toe = add((s * 0.115, -0.145, 0.026), 0.04, 0.02)
        E += [(pelvis, hip), (hip, thigh), (thigh, knee), (knee, calf), (calf, ankle), (ankle, heel), (heel, mid), (mid, toe)]
    me = bpy.data.meshes.new("esqueleto")
    me.from_pydata([p[0] for p in P], E, [])
    obj = bpy.data.objects.new("Maniqui", me)
    scene.collection.objects.link(obj)
    skin = obj.modifiers.new("piel", "SKIN")
    skin.use_smooth_shade = True
    for i, (_, rx, ry) in enumerate(P):
        obj.data.skin_vertices[0].data[i].radius = (rx, ry)
    obj.data.skin_vertices[0].data[pelvis].use_root = True
    sub = obj.modifiers.new("lisa", "SUBSURF")
    sub.levels = 3
    sub.render_levels = 3
    apply_all(obj)

    # Cabeza: óvalo sin rasgos, barbilla algo más estrecha.
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=40, radius=1)
    head = bpy.context.active_object
    for v in head.data.vertices:
        x, y, z = v.co
        low = max(0.0, -z)
        x *= 1 - 0.2 * low
        y = y * (1 - 0.1 * low) - 0.15 * low * max(0.0, -y)
        v.co = (x * 0.082, y * 0.098, z * 0.118)
    head.location = (0, 0.0, 1.675)
    select_only(head)
    bpy.ops.object.transform_apply(location=True, scale=True)
    shade_smooth(head)
    # Unimos cabeza y cuerpo en un objeto.
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.join()
    shade_smooth(obj)
    return obj


# ------------------------------------------------------------------ pantalón
def build_pants():
    K = 44            # medio contorno de la cadera
    m = 10            # puntos del tiro (entrepierna)
    zw, zc, zh = 1.045, 0.74, 0.29        # cintura, tiro bajo, bajo a media pierna larga (como en el vídeo)
    rows_hip = 18
    rows_leg = 66
    verts, uvs, faces = [], [], []
    rng = np.random.default_rng(7)

    def hip_ab(z):
        t = (zw - z) / (zw - zc)          # 0 cintura … 1 tiro
        a = 0.158 + (0.248 - 0.158) * min(1, t * 1.6) ** 0.7
        b = 0.112 + (0.158 - 0.112) * min(1, t * 1.4) ** 0.8
        return a, b

    def ring_point(a, b, th, n=2.4):
        s, c = math.sin(th), math.cos(th)
        x = a * math.copysign(abs(s) ** (2 / n), s)
        y = -b * math.copysign(abs(c) ** (2 / n), c)
        return x, y

    # Cadera: anillos de 2K puntos (0 = centro delante, K = centro detrás).
    hip_idx = []
    for r in range(rows_hip + 1):
        z = zw - (zw - zc) * r / rows_hip
        a, b = hip_ab(z)
        row = []
        for j in range(2 * K):
            th = math.pi * j / K
            x, y = ring_point(a, b, th)
            verts.append((x, y + 0.012, z))
            uvs.append((j / (2 * K) * 1.15 / TILE_W, z / TILE_H))
            row.append(len(verts) - 1)
        hip_idx.append(row)
    for r in range(rows_hip):
        A, B = hip_idx[r], hip_idx[r + 1]
        for j in range(2 * K):
            j2 = (j + 1) % (2 * K)
            faces.append((A[j], A[j2], B[j2], B[j]))
    bottom = hip_idx[-1]
    a_c, b_c = hip_ab(zc)

    # Tiro: curva de detrás a delante pasando por debajo (compartida por las dos perneras).
    crotch = []
    for i in range(1, m + 1):
        u = i / (m + 1)                     # 0 detrás … 1 delante
        y = b_c * (1 - 2 * u)
        z = zc - 0.045 * (1 - (2 * u - 1) ** 2)
        verts.append((0.0, y + 0.012, z))
        uvs.append((0.5, z / TILE_H))
        crotch.append(len(verts) - 1)

    F, Bk = bottom[0], bottom[K]
    right_first = [F] + bottom[1:K] + [Bk] + crotch
    left_first = [F] + crotch[::-1] + [Bk] + bottom[K + 1:]
    Mr = len(right_first)

    def leg(first, side):
        cx0 = side * a_c / 2
        # Ángulo de cada punto del primer anillo alrededor del centro de la pernera.
        co = np.array([verts[i][:2] for i in first]) - np.array([cx0, 0.012])
        ang = np.unwrap(np.arctan2(co[:, 0], -co[:, 1]))
        if ang[-1] < ang[0]:
            ang = ang  # sentido ya coherente
        phase = rng.uniform(0, 2 * math.pi)
        rows = [first]
        for r in range(1, rows_leg + 1):
            t = r / rows_leg
            z = zc - 0.05 - (zc - 0.05 - zh) * t
            # Pernera ancha que cae recta y se abre un poco abajo (baggy, tela rígida).
            a = a_c / 2 * (1.0 + 0.07 * t)
            b = b_c * (1.0 + 0.16 * t)
            cx = side * (a_c / 2 + 0.006 * t)
            row = []
            arc = 0.0
            prev = None
            for k, th in enumerate(ang):
                x, y = ring_point(a, b, th, n=2.2)
                # Pliegues previos que la simulación convierte en caída natural.
                w = 0.22 * t ** 0.9 * (math.sin(4 * th + phase) * 0.55 + math.sin(6 * th + 2 * phase) * 0.45)
                rr = 1 + w
                p = (cx + x * rr, y * rr + 0.012, z)
                if prev is not None:
                    arc += math.dist(p[:2], prev[:2])
                prev = p
                verts.append(p)
                uvs.append(((0.55 if side > 0 else 0.05) + arc / TILE_W, z / TILE_H))
                row.append(len(verts) - 1)
            rows.append(row)
        n = len(first)
        for r in range(rows_leg):
            A, B = rows[r], rows[r + 1]
            for j in range(n):
                j2 = (j + 1) % n
                faces.append((A[j], A[j2], B[j2], B[j]))

    leg(right_first, 1)
    leg(left_first, -1)
    obj = mesh_object("Pantalon", verts, faces, uvs)
    # Normales hacia fuera.
    select_only(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    # Cintura sujeta (la simulación no la mueve).
    vg = obj.vertex_groups.new(name="sujeto")
    vg.add([i for row in hip_idx[:4] for i in row], 1.0, "REPLACE")
    vg.add([i for row in hip_idx[4:7] for i in row], 0.5, "REPLACE")
    shade_smooth(obj)
    return obj


def simulate(cloth_obj, body, frames=110):
    col = body.modifiers.new("choque", "COLLISION")
    body.collision.thickness_outer = 0.012
    body.collision.cloth_friction = 8
    mod = cloth_obj.modifiers.new("tela", "CLOTH")
    s = mod.settings
    s.quality = 7
    s.mass = 0.18
    s.air_damping = 2.0
    s.tension_stiffness = 60
    s.compression_stiffness = 60
    s.shear_stiffness = 30
    s.bending_stiffness = 2.2          # algodón doble: pliegues grandes y limpios
    s.tension_damping = 15
    s.bending_damping = 2.0
    s.vertex_group_mass = "sujeto"
    cs = mod.collision_settings
    cs.collision_quality = 4
    cs.distance_min = 0.006
    cs.use_self_collision = False
    cs.self_distance_min = 0.004
    scene.frame_start = 1
    scene.frame_end = frames
    mod.point_cache.frame_end = frames
    import time
    t0 = time.time()
    for f in range(1, frames + 1):
        scene.frame_set(f)
        if f % 10 == 0:
            print(f"  tela: fotograma {f}/{frames} ({time.time() - t0:.0f} s)", flush=True)
    # Congelamos el último fotograma.
    select_only(cloth_obj)
    bpy.ops.object.modifier_apply(modifier="tela")
    body.modifiers.remove(col)
    # Suavizado después de simular: pliegues redondos, sin facetas.
    sub = cloth_obj.modifiers.new("lisa", "SUBSURF")
    sub.levels = 1
    apply_all(cloth_obj)


# ------------------------------------------------------------------ chaleco
def build_vest():
    NU, NV = 300, 130
    zh = 1.03                              # bajo: a la cintura, cropped
    z_open = 1.29                          # desde aquí sube hacia los hombros
    xn = 0.07                              # medio ancho del cuello (cuello alto, pegado)
    W0, D0 = 0.228, 0.142

    def shoulder_z(x):
        ax = abs(x)
        if ax <= xn:
            return None
        # Hombro que cae y se redondea al final (hombro caído, sin esquina de hombrera).
        k = min(1.0, max(0.0, (ax - 0.16) / 0.07))
        return 1.53 - (ax - xn) * 0.42 - 0.045 * k ** 1.6

    def neck_z(x, front):
        t = min(1.0, abs(x) / xn)
        return (1.49 if front else 1.535) + (1.53 - (1.49 if front else 1.535)) * t ** 2.2

    verts, uvs = [], []
    grid = np.zeros((NV + 1, NU), dtype=np.int64)
    for i in range(NU):
        th = 2 * math.pi * i / NU                 # 0 = centro delante (-Y), crece hacia +X
        s, c = math.sin(th), math.cos(th)
        n = 3.2
        bx = W0 * math.copysign(abs(s) ** (2 / n), s)
        by = -D0 * math.copysign(abs(c) ** (2 / n), c)
        front = by < 0
        sz = shoulder_z(bx)
        if sz is None:
            ztop = neck_z(bx, front)
            ytop = (-0.066 if front else 0.064) * math.sqrt(max(0.0, 1 - (bx / xn) ** 2)) + 0.012
            xtop = bx
        else:
            ztop = sz
            ytop = 0.01
            xtop = bx
        for j in range(NV + 1):
            t = j / NV
            z = zh + (ztop - zh) * t
            # Abajo: caja recta; arriba: front y espalda se cierran sobre el hombro.
            g = 0.0 if z <= z_open else ((z - z_open) / max(1e-6, ztop - z_open))
            g = min(1.0, max(0.0, g))
            g = g ** 1.6                       # hombro redondo, no una tapa plana
            dfac = 1 + 0.025 * (1 - t)            # se abre un pelo hacia el bajo
            x = bx * (1 + 0.012 * (1 - t)) * (1 - g) + xtop * g
            y = (by * dfac + 0.004) * (1 - g) + ytop * g
            verts.append([x, y, z])
            uvs.append((i / NU * 1.2 / TILE_W, z / TILE_H))
            grid[j, i] = len(verts) - 1
    V = np.array(verts)

    # Medida de la tela a lo largo de la superficie (de abajo arriba): así el estampado
    # no se estira donde la prenda sube hacia el hombro.
    arcv = np.zeros(len(V))
    for i in range(NU):
        acc = zh
        arcv[grid[0, i]] = acc
        for j in range(1, NV + 1):
            acc += float(np.linalg.norm(V[grid[j, i]] - V[grid[j - 1, i]]))
            arcv[grid[j, i]] = acc

    # Sisas: aberturas ovaladas en los costados.
    def sisa(x, y, z):
        if abs(x) < 0.17:
            return 9.0
        return ((y - 0.006) / 0.122) ** 2 + ((z - 1.3) / 0.1) ** 2
    keep = np.ones((NV, NU), dtype=bool)
    for j in range(NV):
        for i in range(NU):
            i2 = (i + 1) % NU
            cs = [grid[j, i], grid[j, i2], grid[j + 1, i2], grid[j + 1, i]]
            if any(sisa(*V[c]) < 1.0 for c in cs):
                keep[j, i] = False
    used = set()
    faces = []
    for j in range(NV):
        for i in range(NU):
            if keep[j, i]:
                i2 = (i + 1) % NU
                f = (grid[j, i], grid[j + 1, i], grid[j + 1, i2], grid[j, i2])
                faces.append(f)
                used.update(f)
    # Borde de la sisa limpio: los vértices del borde (los que tocan una cara quitada)
    # se colocan exactamente sobre el óvalo.
    removed = set()
    for j in range(NV):
        for i in range(NU):
            if not keep[j, i]:
                i2 = (i + 1) % NU
                removed.update((grid[j, i], grid[j + 1, i], grid[j + 1, i2], grid[j, i2]))
    for k in used & removed:
        x, y, z = V[k]
        e = sisa(x, y, z)
        if 1.0 <= e < 2.0:
            r = math.sqrt(e)
            V[k, 1] = 0.006 + (y - 0.006) / r
            V[k, 2] = 1.3 + (z - 1.3) / r
    # Cierre cruzado: el panel izquierdo (visto de frente) monta sobre el derecho.
    # Es una pieza aparte de verdad: a lo largo del borde los vértices se duplican, así
    # el panel de encima tiene su propio canto de tela (grosor y sombra) y su estampado
    # no casa con el de debajo.
    R_CORNER = 0.055

    def edge_x(z):
        ex = 0.042
        if z > 1.405:                       # tramo diagonal desde el cuello
            k = min(1.0, (z - 1.405) / (1.488 - 1.405))
            ex = 0.042 - k * (0.042 + 0.052)
        if z < zh + R_CORNER:               # esquina redondeada abajo
            dz = (zh + R_CORNER - z) / R_CORNER
            ex -= R_CORNER * (1 - math.sqrt(max(0.0, 1 - dz * dz)))
        return ex

    V = V.tolist()
    flap = []
    for f in faces:
        c = np.mean([V[k] for k in f], axis=0)
        flap.append(c[1] < -0.02 and c[0] < edge_x(c[2]))
    owners = {}
    for fi, f in enumerate(faces):
        for k in f:
            owners.setdefault(k, set()).add(flap[fi])
    dup = {}
    for k, kinds in owners.items():
        x, y, z = V[k]
        if kinds == {True, False} and y < -0.02 and x > edge_x(z) - 0.03:
            V[k][0] = max(x, edge_x(z) - 0.004) if x < edge_x(z) - 0.004 else x
            dup[k] = len(V)
            V.append(list(V[k]))
            arcv = np.append(arcv, arcv[k])
            uvs.append(uvs[k])
    for fi, f in enumerate(faces):
        if flap[fi]:
            faces[fi] = tuple(dup.get(k, k) for k in f)
    # El panel de encima se separa 6 mm y vuelve poco a poco hacia el costado.
    flap_verts = {k for fi, f in enumerate(faces) if flap[fi] for k in f}
    for k in flap_verts:
        x = V[k][0]
        fade = min(1.0, max(0.0, (x + 0.2) / 0.08))
        V[k][1] -= 0.006 * fade
    obj = mesh_object("Chaleco", V, faces, uvs)
    me = obj.data
    a_arc = me.attributes.new("arcv", "FLOAT", "POINT")
    a_arc.data.foreach_set("value", arcv.astype(np.float32))
    a_flap = me.attributes.new("solapa", "INT", "FACE")
    a_flap.data.foreach_set("value", np.array(flap, dtype=np.int32))
    select_only(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.remove_doubles(threshold=0.0015)      # cierra la costura del hombro
    bpy.ops.mesh.dissolve_degenerate(threshold=0.0004)  # sin caras de grosor cero
    bpy.ops.mesh.delete_loose()
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    shade_smooth(obj)
    return obj


def fabric_uv(obj, kind):
    """UV de la tela en metros reales, cortada solo donde la prenda tiene costura:
    - chaleco: alrededor del cuerpo, costura en el centro de la espalda;
    - pantalón: cada mitad alrededor de su pernera, costuras en el centro delantero y
      trasero (x = 0) y en la entrepierna (lado interior)."""
    me = obj.data
    if not me.uv_layers:
        me.uv_layers.new(name="UVMap")
    uvl = me.uv_layers[0]
    co = [v.co for v in me.vertices]
    arc = me.attributes.get("arcv")
    arcv = [d.value for d in arc.data] if arc else None
    sol = me.attributes.get("solapa")
    solapa = [d.value for d in sol.data] if sol else None
    R = 0.19 if kind == "chaleco" else 0.14
    period = 2 * math.pi * R / TILE_W
    for poly in me.polygons:
        if kind == "chaleco":
            cx, start = 0.0, math.pi           # empieza (y corta) en el centro de la espalda
        else:
            side = 1 if poly.center.x >= 0 else -1
            cx = side * 0.124
            start = -side * math.pi / 2         # corta por el lado interior (entrepierna)
        us = []
        for li in poly.loop_indices:
            p = co[me.loops[li].vertex_index]
            phi = math.atan2(p.x - cx, -(p.y - 0.012)) - start
            phi = phi % (2 * math.pi)
            vi = me.loops[li].vertex_index
            vv = arcv[vi] if arcv else p.z
            us.append((phi * R / TILE_W, vv / TILE_H))
        m = max(u for u, _ in us)
        for k, li in enumerate(poly.loop_indices):
            u, v = us[k]
            if m - u > period / 2:
                u += period                     # la cara que cruza el corte no se estira
            off = 0.31 if kind == "pantalon" and poly.center.x < 0 else 0.0
            if solapa and solapa[poly.index]:
                off, v = off + 0.43, v + 0.27      # otra pieza de tela: el estampado no casa
            uvl.data[li].uv = (u + off, v)


def normals_out(obj):
    """Caras hacia fuera (respecto al eje vertical del cuerpo): así el grosor va hacia
    dentro y el forro queda dentro, no al revés."""
    me = obj.data
    me.update()
    acc = 0.0
    for p in me.polygons:
        c = p.center
        acc += p.normal.x * c.x + p.normal.y * c.y
    if acc < 0:
        select_only(obj)
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.mesh.flip_normals()
        bpy.ops.object.mode_set(mode="OBJECT")


def thicken(obj, t):
    normals_out(obj)
    sol = obj.modifiers.new("grosor", "SOLIDIFY")
    sol.thickness = t
    sol.offset = -1.0
    sol.use_rim = True
    sol.use_even_offset = False         # (uniforme dispara puntos en caras finísimas)
    sol.use_quality_normals = True
    sol.material_offset = 1               # material 1 = forro (cara interior)
    apply_all(obj)


def material(obj, name, color, lining=False):
    # Los nombres de material identifican cada pieza en la web (el compresor cambia
    # los nombres de los objetos, pero no los de los materiales).
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    obj.data.materials.append(mat)
    if lining:
        m2 = bpy.data.materials.new(name.replace("Tela", "Forro"))
        m2.diffuse_color = (0.85, 0.82, 0.78, 1)
        obj.data.materials.append(m2)


def bake_ao(objs, samples=48):
    """Sombras de contacto en los vértices (todos los objetos se tapan entre sí)."""
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = samples
    scene.world = bpy.data.worlds.new("mundo")
    scene.world.color = (1, 1, 1)
    for o in objs:
        if not o.data.color_attributes:
            o.data.color_attributes.new("ao", "BYTE_COLOR", "POINT")
        o.data.color_attributes.active_color = o.data.color_attributes["ao"]
        for mat in o.data.materials:
            mat.use_nodes = True
    for o in objs:
        select_only(o)
        scene.render.bake.target = "VERTEX_COLORS"
        bpy.ops.object.bake(type="AO", target="VERTEX_COLORS")
        print("AO", o.name, flush=True)


def preview(path, toile_path):
    """Vistas de control (delante, 3/4, perfil, espalda) con Cycles y la tela de verdad."""
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 420
    scene.render.resolution_y = 760
    scene.world = bpy.data.worlds.get("mundo") or bpy.data.worlds.new("mundo")
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.02, 0.02, 0.022, 1)
    img = bpy.data.images.load(toile_path)
    for mat in bpy.data.materials:
        mat.use_nodes = True
        nt = mat.node_tree
        bsdf = nt.nodes.get("Principled BSDF")
        if mat.name.startswith("Maniqui"):
            bsdf.inputs["Base Color"].default_value = (0.012, 0.012, 0.014, 1)
            bsdf.inputs["Roughness"].default_value = 0.18
            bsdf.inputs["Coat Weight"].default_value = 1.0
        elif "Forro" in mat.name:
            bsdf.inputs["Base Color"].default_value = (0.7, 0.66, 0.6, 1)
            bsdf.inputs["Roughness"].default_value = 0.9
        else:
            tex = nt.nodes.new("ShaderNodeTexImage")
            tex.image = img
            nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
            bsdf.inputs["Roughness"].default_value = 0.8
            bsdf.inputs["Sheen Weight"].default_value = 0.4
    for name, loc, energy, size in [("clave", (1.2, -3.2, 3.4), 900, 2.5), ("relleno", (-3, -2.5, 1.6), 250, 3),
                                    ("perfil", (2.6, 2.4, 2.4), 500, 1.5), ("contra", (-2.4, 2.6, 2.6), 400, 1.5)]:
        ld = bpy.data.lights.new(name, "AREA")
        ld.energy = energy
        ld.size = size
        lo = bpy.data.objects.new(name, ld)
        lo.location = loc
        lo.rotation_euler = (Vector((0, 0, 1.0)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        scene.collection.objects.link(lo)
    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = 85
    cam = bpy.data.objects.new("cam", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    import os
    base, ext = os.path.splitext(path)
    for name, ang, d, zc in [("frente", 0, 6.4, 0.93), ("tres", 35, 6.4, 0.93), ("perfil", 90, 6.4, 0.93),
                             ("espalda", 180, 6.4, 0.93), ("pecho", 12, 2.6, 1.28), ("bajos", -25, 3.2, 0.55)]:
        a = math.radians(ang)
        cam.location = (math.sin(a) * d, -math.cos(a) * d, zc)
        cam.rotation_euler = (math.radians(90), 0, a)
        scene.render.filepath = f"{base}-{name}{ext}"
        bpy.ops.render.render(write_still=True)
        print("vista", name, flush=True)


print('cuerpo', flush=True)
body = build_body()
print('cuerpo:', len(body.data.vertices), 'vértices', flush=True)
pants = build_pants()
simulate(pants, body)
vest = build_vest()
fabric_uv(pants, "pantalon")
fabric_uv(vest, "chaleco")
material(body, "Maniqui", (0.03, 0.03, 0.035))
material(pants, "Tela_pantalon", (0.93, 0.9, 0.85), lining=True)
material(vest, "Tela_chaleco", (0.93, 0.9, 0.85), lining=True)
thicken(pants, 0.0035)
thicken(vest, 0.0045)
if not QUICK:
    bake_ao([body, pants, vest])
if PREVIEW:
    import os
    preview(PREVIEW, os.path.abspath('public/productos/obra-001/toile.webp'))

# Exportar: solo geometría, UV y sombras de contacto (la web pone los materiales).
for o in bpy.context.view_layer.objects:
    o.select_set(o.name in ("Maniqui", "Pantalon", "Chaleco"))
bpy.ops.export_scene.gltf(
    filepath=OUT, export_format="GLB", use_selection=True,
    export_texcoords=True, export_normals=True,
    export_vertex_color="ACTIVE", export_all_vertex_colors=False,
    export_materials="EXPORT", export_yup=True, export_apply=True,
)
print("listo", OUT, flush=True)
