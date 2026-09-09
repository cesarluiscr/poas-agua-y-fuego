# -*- coding: utf-8 -*-
"""Segunda verificación independiente: teoría de números, fracciones y lectura
de numerales. Reimplementa la lógica desde cero para no repetir los errores
que pudiera tener el generador."""
import json, re, sys, math
from fractions import Fraction

NBSP = "\u00a0"
SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹"

def val(s):
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

def entero(s):
    s = s.replace(NBSP, "").replace(" ", "")
    return int(s) if re.fullmatch(r"\d+", s) else None

# ---------------------------------------------------- palabras -> número (independiente)
PAL = {'cero':0,'uno':1,'un':1,'dos':2,'tres':3,'cuatro':4,'cinco':5,'seis':6,
 'siete':7,'ocho':8,'nueve':9,'diez':10,'once':11,'doce':12,'trece':13,'catorce':14,
 'quince':15,'dieciséis':16,'diecisiete':17,'dieciocho':18,'diecinueve':19,'veinte':20,
 'veintiuno':21,'veintiún':21,'veintidós':22,'veintitrés':23,'veinticuatro':24,
 'veinticinco':25,'veintiséis':26,'veintisiete':27,'veintiocho':28,'veintinueve':29,
 'treinta':30,'cuarenta':40,'cincuenta':50,'sesenta':60,'setenta':70,'ochenta':80,
 'noventa':90,'cien':100,'ciento':100,'doscientos':200,'trescientos':300,
 'cuatrocientos':400,'quinientos':500,'seiscientos':600,'setecientos':700,
 'ochocientos':800,'novecientos':900}

def palabras_a_numero(texto):
    total, actual = 0, 0
    for w in texto.replace("  ", " ").split():
        if w == "y":
            continue
        if w == "mil":
            actual = (actual or 1) * 1000
            total += actual
            actual = 0
        elif w in ("millón", "millones"):
            actual = (actual or 1) * 1_000_000
            total += actual
            actual = 0
        elif w in PAL:
            actual += PAL[w]
        else:
            return None
    return total + actual

def es_primo(n):
    return n > 1 and all(n % d for d in range(2, int(n ** 0.5) + 1))

txt = open(sys.argv[1], encoding="utf-8").read()
data = json.loads(txt[txt.index("["):txt.rindex(";")])

fallos, revisadas = [], 0

def chequear(q, pred, etiqueta):
    """pred(opcion) -> True si la opción cumple la propiedad buscada."""
    global revisadas
    revisadas += 1
    buenas = [i for i, o in enumerate(q["opciones"]) if pred(o)]
    if buenas != [q["correcta"]]:
        fallos.append((q["id"], f"{etiqueta}: cumplen={buenas} marcada={q['correcta']} "
                                f"ops={q['opciones']}"))

for q in data:
    p, ops, k = q["pregunta"], q["opciones"], q["correcta"]

    m = re.match(r"¿Cuál de los siguientes números (NO )?es múltiplo de (\d+)\?", p)
    if m:
        neg, b = bool(m.group(1)), int(m.group(2))
        chequear(q, lambda o: (entero(o) % b != 0) if neg else (entero(o) % b == 0),
                 "múltiplo"); continue

    m = re.match(r"¿Cuál de los siguientes números es divisible entre (\d+)\?", p)
    if m:
        b = int(m.group(1))
        chequear(q, lambda o: entero(o) % b == 0, "divisible"); continue

    m = re.match(r"El número ([\d\s\u00a0]+) es divisible únicamente entre uno", p)
    if m:
        n = entero(m.group(1))
        chequear(q, lambda o: n % int(o) == 0, "divisible único"); continue

    m = re.match(r"¿Cuál de los siguientes números (NO )?es (?:un )?divisor de (\d+)\?", p)
    if m:
        neg, n = bool(m.group(1)), int(m.group(2))
        chequear(q, lambda o: (n % entero(o) != 0) if neg else (n % entero(o) == 0),
                 "divisor"); continue

    m = re.match(r"¿Cuántos divisores naturales tiene el número (\d+)\?", p)
    if m:
        n = int(m.group(1))
        c = len([d for d in range(1, n + 1) if n % d == 0])
        chequear(q, lambda o: entero(o) == c, "cantidad divisores"); continue

    m = re.match(r"¿Cuál de los siguientes números es (impar|par)\?", p)
    if m:
        imp = m.group(1) == "impar"
        chequear(q, lambda o: (entero(o) % 2 == 1) if imp else (entero(o) % 2 == 0),
                 "paridad"); continue

    m = re.match(r"¿Cuál de los siguientes números es (primo|compuesto)\?", p)
    if m:
        pr = m.group(1) == "primo"
        chequear(q, lambda o: es_primo(entero(o)) if pr
                 else (entero(o) > 1 and not es_primo(entero(o))), "primalidad"); continue

    m = re.match(r"El número (\d+) es:$", p)
    if m:
        n = int(m.group(1))
        esperada = "primo" if es_primo(n) else "compuesto"
        chequear(q, lambda o: o == esperada, "primo/compuesto"); continue

    m = re.match(r"¿Cuál número decimal corresponde a la fracción (\d+)/(\d+)\?", p)
    if m:
        v = Fraction(int(m.group(1)), int(m.group(2)))
        chequear(q, lambda o: val(o) == v, "fracción→decimal"); continue

    m = re.match(r"¿Cuál fracción decimal corresponde a ([\d,]+)\?", p)
    if m:
        v = val(m.group(1))
        chequear(q, lambda o: val(o) == v and int(o.split("/")[1]) % 10 == 0,
                 "decimal→fracción decimal"); continue

    m = re.match(r"¿Cuál es la fracción, en su mínima expresión, equivalente a ([\d,]+)\?", p)
    if m:
        v = val(m.group(1))
        chequear(q, lambda o: val(o) == v, "decimal→fracción"); continue

    m = re.match(r"¿Cuál es la mínima expresión de la fracción (\d+)/(\d+)\?", p)
    if m:
        v = Fraction(int(m.group(1)), int(m.group(2)))
        chequear(q, lambda o: val(o) == v and Fraction(o) == val(o)
                 and math.gcd(*map(int, o.split("/"))) == 1, "simplificación"); continue

    m = re.match(r"¿Cuál fracción se obtiene al amplificar (\d+)/(\d+) por (\d+)\?", p)
    if m:
        a, b, mm = map(int, m.groups())
        chequear(q, lambda o: o.strip() == f"{a*mm}/{b*mm}", "amplificación"); continue

    m = re.match(r"¿Cuál es el inverso multiplicativo de (\d+(?:/\d+)?)\?", p)
    if m:
        v = val(m.group(1))
        chequear(q, lambda o: val(o) is not None and val(o) * v == 1, "inverso"); continue

    m = re.match(r"¿Cuál es la notación mixta de (\d+)/(\d+)\?", p)
    if m:
        n, d = int(m.group(1)), int(m.group(2))
        esperada = f"{n // d} {n % d}/{d}"
        chequear(q, lambda o: o.replace(NBSP, " ").strip() == esperada,
                 "mixta"); continue

    m = re.match(r"¿Cuál es la notación impropia \(fraccionaria\) de (\d+)[\s\u00a0](\d+)/(\d+)\?", p)
    if m:
        e, n, d = map(int, m.groups())
        chequear(q, lambda o: val(o) == Fraction(e * d + n, d)
                 and o.split("/")[1] == str(d), "impropia"); continue

    m = re.match(r"¿Cuál expresión equivale a la fracción (\d+)/(\d+)\?", p)
    if m:
        n, d = int(m.group(1)), int(m.group(2))
        def ok(o, n=n, d=d):
            mm = re.fullmatch(r"(\d+) \+ (\d+)/(\d+)", o.replace(NBSP, " "))
            if not mm:
                return False
            e, a, b = map(int, mm.groups())
            return e + Fraction(a, b) == Fraction(n, d) and a < b
        chequear(q, ok, "impropia=natural+propia"); continue

    m = re.match(r"¿Cuál de las siguientes fracciones (NO )?es equivalente a (\d+)/(\d+)\?", p)
    if m:
        neg = bool(m.group(1)); v = Fraction(int(m.group(2)), int(m.group(3)))
        chequear(q, lambda o: (val(o) != v) if neg else (val(o) == v),
                 "equivalencia"); continue

    m = re.match(r"¿Cuál de las siguientes es una fracción (propia|impropia)\?", p)
    if m:
        propia = m.group(1) == "propia"
        chequear(q, lambda o: (val(o) < 1) if propia else (val(o) > 1),
                 "propia/impropia"); continue

    m = re.match(r"¿Cuál de las siguientes fracciones está entre (\d+) y (\d+)\?", p)
    if m:
        a, b = int(m.group(1)), int(m.group(2))
        chequear(q, lambda o: a < val(o) < b, "entre naturales"); continue

    m = re.match(r"Al localizarlo en la recta numérica, ¿entre cuáles números naturales "
                 r"consecutivos se encuentra ([\d,]+)\?", p)
    if m:
        v = val(m.group(1))
        def ok2(o, v=v):
            mm = re.fullmatch(r"entre (\d+) y (\d+)", o)
            if not mm:
                return False
            a, b = int(mm.group(1)), int(mm.group(2))
            return b == a + 1 and a < v < b
        chequear(q, ok2, "decimal entre naturales"); continue

    m = re.match(r"En la recta numérica, ¿entre cuáles números naturales consecutivos "
                 r"se ubica la fracción (\d+)/(\d+)\?", p)
    if m:
        v = Fraction(int(m.group(1)), int(m.group(2)))
        def ok3(o, v=v):
            mm = re.fullmatch(r"entre (\d+) y (\d+)", o)
            if not mm:
                return False
            a, b = int(mm.group(1)), int(mm.group(2))
            return b == a + 1 and a < v < b
        chequear(q, ok3, "fracción entre naturales"); continue

    m = re.match(r"¿Cómo se expresa ([\d\s\u00a0]+) como potencia de base 10\?", p)
    if m:
        n = entero(m.group(1))
        def ok4(o, n=n):
            mm = re.fullmatch(r"10([⁰¹²³⁴⁵⁶⁷⁸⁹]+)", o.strip())
            if not mm:
                return False
            return 10 ** int("".join(str(SUP.index(c)) for c in mm.group(1))) == n
        chequear(q, ok4, "potencia de 10"); continue

    m = re.match(r"¿Cómo se expresa ((?:\d+ × )+\d+) en forma de potencia\?", p)
    if m:
        factores = [int(x) for x in m.group(1).split(" × ")]
        base, exp = factores[0], len(factores)
        assert all(f == base for f in factores)
        chequear(q, lambda o: o.strip() == f"{base}" + "".join(SUP[int(c)] for c in str(exp)),
                 "producto→potencia"); continue

    m = re.match(r"¿Cuál es la notación desarrollada de ([\d\s\u00a0]+(?:,\d+)?)\?", p)
    if m:
        v = val(m.group(1))
        def ok5(o, v=v):
            e = o.replace(NBSP, "").replace(" ", "").replace(",", ".")
            for c in SUP:
                e = e.replace(c, "**" + str(SUP.index(c)) if False else "")
            # reconstruir potencias: 1×10⁵ -> 1*10**5
            e = o.replace(NBSP, "").replace(" ", "")
            e = re.sub(r"10([⁰¹²³⁴⁵⁶⁷⁸⁹]+)",
                       lambda mm: "10**" + "".join(str(SUP.index(c)) for c in mm.group(1)), e)
            e = e.replace("×", "*").replace(",", ".")
            try:
                return Fraction(str(eval(e, {"__builtins__": {}}))).limit_denominator(10**8) == v
            except Exception:
                return False
        chequear(q, ok5, "notación desarrollada"); continue

    m = re.match(r"¿Cuál número corresponde a la notación desarrollada (.+)\?$", p)
    if m:
        e = re.sub(r"10([⁰¹²³⁴⁵⁶⁷⁸⁹]+)",
                   lambda mm: "10**" + "".join(str(SUP.index(c)) for c in mm.group(1)),
                   m.group(1).replace(NBSP, "").replace(" ", ""))
        objetivo = eval(e.replace("×", "*"), {"__builtins__": {}})
        chequear(q, lambda o: entero(o) == objetivo, "desarrollada→número"); continue

    m = re.match(r"¿Cómo se lee el número ([\d\s\u00a0]+)\?$", p)
    if m:
        n = entero(m.group(1))
        chequear(q, lambda o: palabras_a_numero(o) == n, "número→palabras"); continue

    m = re.match(r"¿Cuál es la representación simbólica de «(.+)»\?$", p)
    if m and "entero" not in m.group(1) and "ésim" not in m.group(1):
        n = palabras_a_numero(m.group(1))
        chequear(q, lambda o: entero(o) == n, "palabras→número"); continue

print(f"Preguntas reevaluadas (segunda pasada): {revisadas}")
if fallos:
    print(f"FALLOS: {len(fallos)}")
    for i, msg in fallos[:30]:
        print(f"  [{i}] {msg}")
    sys.exit(1)
print("Sin discrepancias.")
