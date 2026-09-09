# -*- coding: utf-8 -*-
"""Verificación independiente: reevalúa las preguntas calculables."""
import json, re, sys, math
from fractions import Fraction

NBSP = "\u00a0"
SUPINV = {v: k for k, v in
          zip("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹")}

def val(s):
    """Convierte una opción numérica en Fraction; None si no es un número puro."""
    s = s.replace(NBSP, "").replace(" ", "").replace("₡", "").strip()
    if re.fullmatch(r"-?\d+", s):
        return Fraction(int(s))
    if re.fullmatch(r"-?\d+,\d+", s):
        neg = s.startswith("-"); s = s.lstrip("-")
        e, d = s.split(",")
        return (-1 if neg else 1) * Fraction(int(e + d), 10 ** len(d))
    if re.fullmatch(r"-?\d+/\d+", s):
        return Fraction(s)
    return None

def evaluar(expr):
    """Evalúa una expresión aritmética del enunciado (división entera exacta)."""
    e = (expr.replace(NBSP, "").replace(" ", "")
         .replace("×", "*").replace("÷", "//").replace("−", "-").replace(",", "."))
    return eval(e, {"__builtins__": {}})

data = json.load(open(sys.argv[1], encoding="utf-8")) if sys.argv[1].endswith(".json") \
    else None
if data is None:
    txt = open(sys.argv[1], encoding="utf-8").read()
    data = json.loads(txt[txt.index("["):txt.rindex(";")])

fallos, revisadas = [], 0

for q in data:
    p, ops, k = q["pregunta"], q["opciones"], q["correcta"]
    esperado = None

    # 1) comparaciones: exactamente una opción debe ser verdadera
    if "comparaciones es verdadera" in p:
        ciertas = []
        for i, o in enumerate(ops):
            m = re.fullmatch(r"(.+?)\s*([<>=])\s*(.+)", o)
            a, s, b = val(m.group(1)), m.group(2), val(m.group(3))
            ok = (a < b) if s == "<" else (a > b) if s == ">" else (a == b)
            if ok:
                ciertas.append(i)
        revisadas += 1
        if ciertas != [k]:
            fallos.append((q["id"], f"comparación: verdaderas={ciertas}, marcada={k}"))
        continue

    # 2) ordenamientos
    m = re.match(r"Ordene los siguientes números de (menor a mayor|mayor a menor): (.+)", p)
    if m:
        nums = [val(x) for x in m.group(2).split(";")]
        objetivo = sorted(nums, reverse=(m.group(1) == "mayor a menor"))
        buenas = [i for i, o in enumerate(ops)
                  if [val(x) for x in o.split(";")] == objetivo]
        revisadas += 1
        if buenas != [k]:
            fallos.append((q["id"], f"orden: correctas={buenas}, marcada={k}"))
        continue

    # 3) expresiones aritméticas explícitas
    m = re.match(r"Calcule: (.+)", p)
    if m:
        esperado = Fraction(evaluar(m.group(1)))
    if esperado is None:
        m = re.match(r"¿Cuál es el resultado de (.+?)\?$", p)
        if m and re.fullmatch(r"[\d\s,/×÷+− ]+", m.group(1)):
            e = m.group(1).replace(NBSP, "").strip()
            m2 = re.fullmatch(r"(\d+/\d+|\d+(?:,\d+)?)\s*([×÷+−])\s*(\d+/\d+|\d+(?:,\d+)?)", e)
            if m2:
                a, b = val(m2.group(1)), val(m2.group(3))
                op = m2.group(2)
                esperado = (a * b if op == "×" else a / b if op == "÷"
                            else a + b if op == "+" else a - b)
    if esperado is None:
        m = re.match(r"¿Cuál es el valor de (\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)\?", p)
        if m:
            exp = int("".join(SUPINV[c] for c in m.group(2)))
            esperado = Fraction(int(m.group(1)) ** exp)
    if esperado is None:
        m = re.match(r"¿Cuál es el resultado de redondear ([\d ,]+) a la (unidad|décima|centésima)\?", p)
        if m:
            x = val(m.group(1))
            d = {"unidad": 0, "décima": 1, "centésima": 2}[m.group(2)]
            f = 10 ** d
            esperado = Fraction(math.floor(x * f + Fraction(1, 2)), f)

    if esperado is not None:
        revisadas += 1
        buenas = [i for i, o in enumerate(ops) if val(o) == esperado]
        if buenas != [k]:
            fallos.append((q["id"], f"«{p[:60]}» esperado={esperado} "
                                    f"correctas={buenas} marcada={k} ops={ops}"))

print(f"Preguntas reevaluadas de forma independiente: {revisadas}")
if fallos:
    print(f"FALLOS: {len(fallos)}")
    for i, msg in fallos[:25]:
        print(f"  [{i}] {msg}")
    sys.exit(1)
print("Sin discrepancias.")
