# -*- coding: utf-8 -*-
"""Ensambla, valida y exporta el banco de 300 preguntas."""
import json, sys, collections
import gen_base
from gen_base import BANCO, rng
import gen_numeros_a, gen_numeros_b, gen_numeros_c, gen_geometria

MODULOS = [gen_numeros_a, gen_numeros_b, gen_numeros_c, gen_geometria]

def validar(banco):
    errs = []
    if len(banco) != 300:
        errs.append(f"Se generaron {len(banco)} preguntas, se esperaban 300.")
    vistos = collections.Counter()
    for q in banco:
        ops = [o.strip() for o in q["opciones"]]
        if len(ops) != 4 or len(set(ops)) != 4 or any(not o for o in ops):
            errs.append(f"[{q.get('id')}] opciones inválidas: {q['opciones']}")
        if not (0 <= q["correcta"] < 4):
            errs.append(f"[{q.get('id')}] índice de respuesta inválido")
        for campo in ("pregunta", "explicacion", "habilidad", "bloque", "afirmacion"):
            if not q[campo].strip():
                errs.append(f"[{q.get('id')}] campo vacío: {campo}")
        vistos[q["pregunta"] + "||" + "|".join(sorted(ops))] += 1
    for clave, n in vistos.items():
        if n > 1:
            errs.append(f"Duplicada ×{n}: {clave.split('||')[0][:70]}…")
    return errs

semilla_ok = None
for semilla in range(20260909, 20260909 + 400):
    rng.seed(semilla)
    BANCO.clear()
    try:
        for m in MODULOS:
            m.construir()
    except ValueError as exc:      # opciones insuficientes: se prueba otra semilla
        print(f"  (semilla {semilla} descartada: {exc})")
        continue
    if not validar(BANCO):
        semilla_ok = semilla
        break

if semilla_ok is None:
    print("No se encontró una semilla sin colisiones.")
    for e in validar(BANCO)[:20]:
        print(" -", e)
    sys.exit(1)

BANCO.sort(key=lambda q: (q["bloque"] != "Números", q["afirmacion"], q["habilidad"]))
for i, q in enumerate(BANCO, 1):
    q["id"] = i

errs = validar(BANCO)
if errs:
    print("ERRORES tras ordenar:")
    for e in errs[:20]:
        print(" -", e)
    sys.exit(1)

print(f"Semilla utilizada: {semilla_ok}")
print("Posición de la respuesta correcta:",
      dict(sorted(collections.Counter(q["correcta"] for q in BANCO).items())))
print("Preguntas por bloque:", dict(collections.Counter(q["bloque"] for q in BANCO)))
for af, n in sorted(collections.Counter(q["afirmacion"] for q in BANCO).items()):
    print(f"  {n:>3}  {af}")
print("Habilidades distintas:", len({q["habilidad"] for q in BANCO}))

destino = sys.argv[1]
with open(destino, "w", encoding="utf-8") as f:
    f.write("/* Banco de 300 preguntas de Matematica - Prueba Nacional "
            "Estandarizada, primaria.\n"
            "   Generado automaticamente por herramientas/generador (build.py):\n"
            "   cada respuesta correcta y cada explicacion se calculan de forma "
            "programatica.\n"
            "   No editar a mano. */\n")
    f.write("const PREGUNTAS = ")
    f.write(json.dumps(BANCO, ensure_ascii=False, indent=1))
    f.write(";\n")
print("Escrito:", destino)
