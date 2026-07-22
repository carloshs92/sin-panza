#!/usr/bin/env python3
"""Genera los iconos y las pantallas de arranque (splash) de la PWA.

Sin dependencias: escribe los PNG a mano (zlib + struct). El logo es una
mancuerna; los splash son fondo oscuro con la mancuerna centrada.

iOS solo usa una imagen de arranque si su tamaño coincide EXACTAMENTE con el
del dispositivo, de ahí la lista de resoluciones.

Uso:  python3 scripts/generar-graficos.py
"""
import struct
import zlib
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ICONOS = RAIZ / 'public' / 'icons'
SPLASH = RAIZ / 'public' / 'splash'

FONDO = (12, 14, 20)       # --bg
NARANJA = (255, 92, 56)    # --accent
BLANCO = (255, 255, 255)

# (ancho_css, alto_css, dpr) de los iPhone más comunes
DISPOSITIVOS = [
    (440, 956, 3), (430, 932, 3), (402, 874, 3), (393, 852, 3),
    (390, 844, 3), (414, 896, 3), (414, 896, 2), (375, 812, 3),
    (414, 736, 3), (375, 667, 2),
]


def escribir_png(ancho, alto, filas, destino):
    """filas: lista de bytearrays RGBA (una por fila, sin el byte de filtro)."""
    cruda = bytearray()
    for fila in filas:
        cruda.append(0)  # filtro "none"
        cruda += fila

    def trozo(tipo, datos):
        return (struct.pack('>I', len(datos)) + tipo + datos +
                struct.pack('>I', zlib.crc32(tipo + datos)))

    png = (b'\x89PNG\r\n\x1a\n' +
           trozo(b'IHDR', struct.pack('>IIBBBBB', ancho, alto, 8, 6, 0, 0, 0)) +
           trozo(b'IDAT', zlib.compress(bytes(cruda), 9)) +
           trozo(b'IEND', b''))
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_bytes(png)


def en_mancuerna(x, y, cx, cy, lado):
    """True si (x, y) cae dentro del dibujo de la mancuerna."""
    u = (x - cx) / lado + 0.5   # coordenadas 0..1 dentro del logo
    v = (y - cy) / lado + 0.5
    if not (0 <= u <= 1 and 0 <= v <= 1):
        return False
    partes = (
        (.26, .74, .46, .54),   # barra
        (.20, .30, .34, .66),   # disco interior izq
        (.70, .80, .34, .66),   # disco interior der
        (.12, .19, .40, .60),   # disco exterior izq
        (.81, .88, .40, .60),   # disco exterior der
    )
    return any(x0 <= u <= x1 and y0 <= v <= y1 for x0, x1, y0, y1 in partes)


def generar(ancho, alto, fondo, tinta, proporcion, destino, fondo_redondeado=False):
    lado = min(ancho, alto) * proporcion
    cx, cy = ancho / 2, alto / 2
    y0, y1 = int(cy - lado), int(cy + lado)  # banda donde puede haber logo

    fila_lisa = bytearray()
    for _ in range(ancho):
        fila_lisa += bytes(fondo) + b'\xff'

    filas = []
    for y in range(alto):
        if y < y0 or y > y1:
            filas.append(fila_lisa)   # se reutiliza el mismo objeto: rapidísimo
            continue
        fila = bytearray()
        for x in range(ancho):
            color = tinta if en_mancuerna(x, y, cx, cy, lado) else fondo
            fila += bytes(color) + b'\xff'
        filas.append(fila)
    escribir_png(ancho, alto, filas, destino)
    return destino


def main():
    # Iconos: mancuerna blanca sobre naranja
    for s in (192, 512):
        p = generar(s, s, NARANJA, BLANCO, 0.76, ICONOS / f'icon-{s}.png')
        print(f'{p.name}: {p.stat().st_size // 1024} KB')

    # Splash: mancuerna naranja sobre el fondo de la app
    for w, h, dpr in DISPOSITIVOS:
        px_w, px_h = w * dpr, h * dpr
        p = generar(px_w, px_h, FONDO, NARANJA, 0.30,
                    SPLASH / f'splash-{px_w}x{px_h}.png')
        print(f'{p.name}: {p.stat().st_size // 1024} KB')

    # Etiquetas <link> listas para pegar en el layout
    print('\n--- para Base.astro ---')
    for w, h, dpr in DISPOSITIVOS:
        print(f'<link rel="apple-touch-startup-image" '
              f'media="(device-width: {w}px) and (device-height: {h}px) and '
              f'(-webkit-device-pixel-ratio: {dpr}) and (orientation: portrait)" '
              f'href="/splash/splash-{w * dpr}x{h * dpr}.png" />')


if __name__ == '__main__':
    main()
