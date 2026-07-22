#!/usr/bin/env python3
"""Genera public/data/exercises.<idioma>.json desde el dataset original.

Recorta el exercises.json de 17 MB a ~1 MB por idioma y marca con `req` los
ejercicios de peso corporal que necesitan estructura (barra de dominadas o
banco/apoyo), para que el filtro de equipamiento de la app sea fino.

Uso:  python3 scripts/generar-datos.py
"""
import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DATASET = RAIZ.parent / 'exercises-dataset-main' / 'data' / 'exercises.json'
SALIDA = RAIZ / 'public' / 'data'
IDIOMAS = ['es', 'en', 'fr', 'it', 'pl', 'tr', 'ru', 'zh', 'hi', 'ko']

RE_BARRA = re.compile(r'pull[\s-]?up|\bchin\b|chin[\s-]?up|muscle[\s-]?up|hanging|(front|back) lever|toes to bar|suspend|skin the cat', re.I)
RE_BANCO = re.compile(r'\bdips?\b|bench|\bbox\b|chair|step[\s-]?up|elevated|incline|decline|bulgarian|\brings?\b|parallel bar|rope climb|slide|swing|hyperextension|platform|inverted row|self assisted', re.I)
RE_SUELO = re.compile(r'floor|boxing', re.I)  # excepciones que sí van al suelo
RE_PASOS_BARRA = re.compile(r'hang(ing)? from|pull[\s-]?up bar|chin[\s-]?up bar|horizontal bar|suspension trainer|gymnastic rings', re.I)
RE_PASOS_BANCO = re.compile(r'(a|the|an?) (flat )?bench|sturdy chair|elevated (surface|platform)|onto (a|the) box', re.I)


def requiere(e):
    if e['equipment'] != 'body weight':
        return None
    n = e['name']
    pasos_en = ' '.join(e.get('instruction_steps', {}).get('en') or [])
    if RE_BARRA.search(n) or RE_PASOS_BARRA.search(pasos_en):
        return 'barra'
    if re.search(r'\brow\b', n, re.I) and 'towel' not in n.lower():
        return 'banco'
    if RE_SUELO.search(n):
        return None
    if RE_BANCO.search(n) or RE_PASOS_BANCO.search(pasos_en):
        return 'banco'
    return None


def main():
    src = json.loads(DATASET.read_text())
    SALIDA.mkdir(parents=True, exist_ok=True)
    conteo = {'barra': 0, 'banco': 0}
    for lang in IDIOMAS:
        out = []
        for e in src:
            steps = e.get('instruction_steps', {}).get(lang) or e.get('instruction_steps', {}).get('en') or []
            item = {
                'id': e['id'], 'name': e['name'], 'category': e['category'],
                'equipment': e['equipment'], 'target': e.get('target', ''),
                'muscles': [e.get('muscle_group', '')] + (e.get('secondary_muscles') or []),
                'steps': steps, 'image': e['image'], 'gif': e['gif_url'],
            }
            r = requiere(e)
            if r:
                item['req'] = r
                if lang == 'es':
                    conteo[r] += 1
            out.append(item)
        destino = SALIDA / f'exercises.{lang}.json'
        destino.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
        print(f'{destino.name}: {len(out)} ejercicios')
    print('con estructura:', conteo)


if __name__ == '__main__':
    main()
