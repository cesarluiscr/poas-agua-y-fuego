# -*- coding: utf-8 -*-
"""Bloque Números, afirmaciones 1, 2 y 3."""
from fractions import Fraction
from gen_base import *

B = "Números"

# ============================================================ AFIRMACIÓN 1 (28)
A1 = "1. Reconoce las distintas representaciones de números naturales o decimales."

def _vecino(n):
    """Número parecido a n cambiando un dígito (para distractores)."""
    s = list(str(n))
    for _ in range(60):
        i = rng.randrange(len(s))
        d = str(rng.randrange(10))
        if d != s[i] and not (i == 0 and d == "0"):
            t = s[:]; t[i] = d
            return int("".join(t))
    return n + 1

def a1_natural_a_palabras(k):
    usados = set()
    for _ in range(k):
        while True:
            n = rng.randrange(100_000, 1_000_000)
            if n not in usados and n % 10 != 1 and (n // 1000) % 10 != 1:
                usados.add(n); break
        dist = [num_palabras(v) for v in vecinos(n, 6, minimo=100_000,
                                                 mismo_largo=True)]
        add(B, A1, "Representación literal de un natural ≥ 100 000",
            f"¿Cómo se lee el número {fnat(n)}?",
            num_palabras(n), dist,
            f"{fnat(n)} se descompone en {fnat(n//1000)} millares y {fnat(n%1000)} unidades, "
            f"por lo que se lee «{num_palabras(n)}».")

def a1_palabras_a_natural(k):
    usados = set()
    for _ in range(k):
        while True:
            n = rng.randrange(100_000, 1_000_000)
            if n not in usados and n % 10 != 1 and (n // 1000) % 10 != 1:
                usados.add(n); break
        dist = [fnat(v) for v in vecinos(n, 6, minimo=100_000, mismo_largo=True)]
        add(B, A1, "De la representación literal a la simbólica",
            f"¿Cuál es la representación simbólica de «{num_palabras(n)}»?",
            fnat(n), dist,
            f"«{num_palabras(n)}» corresponde a {fnat(n)}.")

def a1_valor_posicional(k):
    usados = set()
    for _ in range(k):
        while True:
            n = rng.randrange(100_000, 1_000_000)
            s = str(n)
            if n in usados or len(set(s)) < 6:
                continue
            usados.add(n); break
        pos = rng.randrange(0, 6)                 # 0 = unidades
        d = int(s[len(s) - 1 - pos])
        if d == 0:
            pos = next(i for i in range(6) if int(s[len(s)-1-i]) != 0)
            d = int(s[len(s) - 1 - pos])
        if rng.random() < 0.5:
            correcta = POSICIONES[pos]
            dist = [POSICIONES[i] for i in (pos+1, pos-1, pos+2, pos-2, pos+3)
                    if 0 <= i < 7]
            add(B, A1, "Valor posicional",
                f"En el número {fnat(n)}, ¿qué posición ocupa el dígito {d}?",
                correcta, dist,
                f"Contando de derecha a izquierda, el dígito {d} de {fnat(n)} "
                f"ocupa el lugar de las {correcta}.")
        else:
            correcta = fnat(d * 10 ** pos)
            dist = [fnat(d * 10 ** e) for e in (pos + 1, pos - 1, pos + 2, pos - 2,
                                                pos + 3)
                    if 0 <= e <= 8 and e != pos]
            dist.append(fnat(10 ** pos))
            add(B, A1, "Valor posicional",
                f"En el número {fnat(n)}, ¿cuál es el valor posicional del dígito {d}?",
                correcta, dist,
                f"El dígito {d} está en las {POSICIONES[pos]}, así que su valor "
                f"posicional es {d} × {fnat(10**pos)} = {correcta}.")

def a1_decimales(k):
    usados = set()
    for i in range(k):
        while True:
            nd = rng.choice([2, 3, 4, 4])
            ent = rng.randrange(0, 60)
            parte = rng.randrange(10 ** (nd - 1), 10 ** nd)
            if parte % 10 == 1 or (ent, parte, nd) in usados:
                continue
            usados.add((ent, parte, nd)); break
        texto = f"{ent},{str(parte).zfill(nd)}"
        pal = dec_palabras(ent, parte, nd)
        if i % 2 == 0:
            dist = [dec_palabras(ent, p2, nd)
                    for p2 in vecinos(parte, 4, mismo_largo=True) if p2 % 10 != 1]
            dist += [dec_palabras(e2, parte, nd)
                     for e2 in (ent + 1, ent + 2) if e2 >= 0]
            add(B, A1, "Representación literal de un decimal",
                f"¿Cómo se lee el número {texto}?", pal, dist,
                f"La parte entera es {ent} y la parte decimal tiene {nd} cifras, "
                f"por lo que se lee «{pal}».")
        else:
            dist = [f"{ent},{str(p2).zfill(nd)}"
                    for p2 in vecinos(parte, 4, mismo_largo=True)]
            # truncar la parte decimal (siempre a menos cifras que el original)
            dist += [f"{ent},{str(parte).zfill(nd)[:c]}" for c in range(1, nd)]
            dist += [f"{ent + 1},{str(parte).zfill(nd)}",
                     f"{ent},{str(parte).zfill(nd)}0"]
            add(B, A1, "De la representación literal a la simbólica (decimal)",
                f"¿Cuál es la representación simbólica de «{pal}»?", texto, dist,
                f"«{pal}» se escribe {texto}: {ent} en la parte entera y "
                f"{parte} en las {ORDEN_DEC[nd]}.")

def construir():
    a1_natural_a_palabras(7)
    a1_palabras_a_natural(7)
    a1_valor_posicional(7)
    a1_decimales(7)

    # ============================================================ AFIRMACIÓN 2 (28)
    A2 = "2. Compara números naturales, decimales o fraccionarios."

    def a2_naturales(k):
        for _ in range(k):
            a = rng.randrange(100_000, 1_000_000)
            b = rng.randrange(100_000, 1_000_000)
            while b == a:
                b = rng.randrange(100_000, 1_000_000)
            c = rng.randrange(100_000, 1_000_000)
            d = rng.randrange(100_000, 1_000_000)
            while d == c:
                d = rng.randrange(100_000, 1_000_000)
            may, men = max(a, b), min(a, b)
            correcta = f"{fnat(men)} < {fnat(may)}"
            dist = [f"{fnat(may)} < {fnat(men)}",
                    f"{fnat(men)} > {fnat(may)}",
                    f"{fnat(men)} = {fnat(may)}",
                    f"{fnat(max(c,d))} < {fnat(min(c,d))}"]
            add(B, A2, "Comparación de naturales con <, > o =",
                "¿Cuál de las siguientes comparaciones es verdadera?",
                correcta, dist,
                f"Al comparar cifra por cifra desde la izquierda, {fnat(men)} es menor "
                f"que {fnat(may)}; por eso {correcta}.")

    def a2_mayor_menor(k):
        for i in range(k):
            nums = muestra(range(100_000, 1_000_000), 4)
            if i % 2 == 0:
                correcta = fnat(max(nums))
                add(B, A2, "Orden de naturales",
                    "¿Cuál de los siguientes números es el mayor?",
                    correcta, [fnat(n) for n in nums if n != max(nums)],
                    f"{correcta} es el mayor porque, comparando desde las centenas de "
                    f"millar, tiene el valor más alto de los cuatro.")
            else:
                correcta = fnat(min(nums))
                add(B, A2, "Orden de naturales",
                    "¿Cuál de los siguientes números es el menor?",
                    correcta, [fnat(n) for n in nums if n != min(nums)],
                    f"Al comparar los cuatro números cifra por cifra desde la "
                f"izquierda, {correcta} resulta el menor.")

    def a2_fracciones(k):
        for _ in range(k):
            while True:
                f1, f2 = frac_no_entera(12, 13), frac_no_entera(12, 13)
                if f1 != f2 and f1.denominator != f2.denominator:
                    break
            men, may = (f1, f2) if f1 < f2 else (f2, f1)
            c, d = frac_no_entera(9, 10), frac_no_entera(9, 10)
            while c == d:
                d = frac_no_entera(9, 10)
            correcta = f"{ffrac(men)} < {ffrac(may)}"
            dist = [f"{ffrac(may)} < {ffrac(men)}",
                    f"{ffrac(men)} = {ffrac(may)}",
                    f"{ffrac(men)} > {ffrac(may)}",
                    f"{ffrac(max(c,d))} < {ffrac(min(c,d))}"]
            com = men.denominator * may.denominator // __import__('math').gcd(
                men.denominator, may.denominator)
            add(B, A2, "Comparación de fracciones",
                "¿Cuál de las siguientes comparaciones es verdadera?",
                correcta, dist,
                f"Con denominador común {com}: {ffrac(men)} = "
                f"{men.numerator * com // men.denominator}/{com} y {ffrac(may)} = "
                f"{may.numerator * com // may.denominator}/{com}. Por lo tanto {correcta}.")

    def a2_decimales(k):
        for _ in range(k):
            vals = set()
            while len(vals) < 2:
                nd = rng.choice([2, 3])
                vals.add(round(rng.randrange(1, 900) / 10 ** nd, nd))
            a, b = sorted(vals)
            otros = set()
            while len(otros) < 2:
                otros.add(round(rng.randrange(1, 900) / 10 ** rng.choice([2, 3]), 3))
            c, d = sorted(otros)
            correcta = f"{fdec(a)} < {fdec(b)}"
            dist = [f"{fdec(b)} < {fdec(a)}", f"{fdec(a)} = {fdec(b)}",
                    f"{fdec(a)} > {fdec(b)}", f"{fdec(d)} < {fdec(c)}"]
            add(B, A2, "Comparación de decimales",
                "¿Cuál de las siguientes comparaciones es verdadera?",
                correcta, dist,
                f"Se comparan las cifras decimales en el mismo orden: {fdec(a)} es "
                f"menor que {fdec(b)}, así que {correcta}.")

    def a2_ordenar(k):
        for i in range(k):
            vals = set()
            while len(vals) < 4:
                nd = rng.choice([1, 2, 3])
                vals.add(round(rng.randrange(1, 990) / 10 ** nd, nd))
            v = sorted(vals)
            asc = "; ".join(fdec(x) for x in v)
            desc = "; ".join(fdec(x) for x in reversed(v))
            m1 = [v[1], v[0], v[2], v[3]]
            m2 = [v[0], v[2], v[1], v[3]]
            m3 = [v[3], v[1], v[2], v[0]]
            if i % 2 == 0:
                add(B, A2, "Ordenamiento de decimales",
                    "Ordene los siguientes números de menor a mayor: "
                    + "; ".join(fdec(x) for x in muestra(v, 4)),
                    asc, [desc] + ["; ".join(fdec(x) for x in m) for m in (m1, m2, m3)],
                    f"Comparando la parte entera y luego las décimas, centésimas y "
                    f"milésimas, el orden creciente es {asc}.")
            else:
                add(B, A2, "Ordenamiento de decimales",
                    "Ordene los siguientes números de mayor a menor: "
                    + "; ".join(fdec(x) for x in muestra(v, 4)),
                    desc, [asc] + ["; ".join(fdec(x) for x in m) for m in (m1, m2, m3)],
                    f"El orden decreciente es {desc}.")

    a2_naturales(6)
    a2_mayor_menor(6)
    a2_fracciones(6)
    a2_decimales(6)
    a2_ordenar(4)

    # ============================================================ AFIRMACIÓN 3 (28)
    A3 = "3. Reconoce la notación desarrollada de un número natural o decimal."

    def _desarrollo_nat(n, con_potencias=False):
        s = str(n)
        partes = []
        for i, ch in enumerate(s):
            d = int(ch)
            if d == 0:
                continue
            e = len(s) - 1 - i
            partes.append(f"{d} × {pot(10, e)}" if con_potencias
                          else fnat(d * 10 ** e))
        return " + ".join(partes)

    def _desarrollo_dec(ent, parte, nd, con_potencias=False):
        partes = []
        if ent:
            se = str(ent)
            for i, ch in enumerate(se):
                d = int(ch)
                if d == 0:
                    continue
                e = len(se) - 1 - i
                partes.append(f"{d} × {pot(10, e)}" if con_potencias else fnat(d * 10 ** e))
        sd = str(parte).zfill(nd)
        for i, ch in enumerate(sd):
            d = int(ch)
            if d == 0:
                continue
            e = i + 1
            if con_potencias:
                partes.append(f"{d} × 1/{pot(10, e)}")
            else:
                partes.append(fdec(d / 10 ** e, e))
        return " + ".join(partes)

    def a3_natural(k, con_potencias):
        usados = set()
        for _ in range(k):
            while True:
                n = rng.randrange(100_000, 1_000_000)
                if n in usados:
                    continue
                usados.add(n); break
            correcta = _desarrollo_nat(n, con_potencias)
            # nunca se usa la otra notación del mismo número: también sería
            # una respuesta correcta
            dist = [_desarrollo_nat(v, con_potencias)
                    for v in vecinos(n, 8, minimo=100_000, mismo_largo=True)]
            etiqueta = ("Notación desarrollada con potencias de base diez"
                        if con_potencias else "Notación desarrollada de un natural")
            add(B, A3, etiqueta,
                f"¿Cuál es la notación desarrollada de {fnat(n)}?",
                correcta, dist,
                f"Cada cifra se multiplica por el valor de la posición que ocupa: "
                f"{fnat(n)} = {correcta}.")

    def a3_decimal(k, con_potencias):
        usados = set()
        for _ in range(k):
            while True:
                nd = rng.choice([2, 3, 4])
                ent = rng.randrange(1, 900)
                parte = rng.randrange(10 ** (nd - 1), 10 ** nd)
                if (ent, parte, nd) in usados:
                    continue
                usados.add((ent, parte, nd)); break
            texto = f"{fnat(ent)},{str(parte).zfill(nd)}"
            correcta = _desarrollo_dec(ent, parte, nd, con_potencias)
            dist = [_desarrollo_dec(ent, p2, nd, con_potencias)
                    for p2 in vecinos(parte, 5, mismo_largo=True)]
            dist += [_desarrollo_dec(e2, parte, nd, con_potencias)
                     for e2 in vecinos(ent, 3, minimo=1, mismo_largo=True)]
            etiqueta = ("Notación desarrollada de un decimal con potencias de diez"
                        if con_potencias else "Notación desarrollada de un decimal")
            add(B, A3, etiqueta,
                f"¿Cuál es la notación desarrollada de {texto}?",
                correcta, dist,
                f"Se suma el valor posicional de cada cifra: {texto} = {correcta}.")

    def a3_inversa(k):
        usados = set()
        for _ in range(k):
            while True:
                n = rng.randrange(100_000, 1_000_000)
                if n not in usados:
                    usados.add(n); break
            desarrollo = _desarrollo_nat(n, rng.random() < 0.5)
            dist = [fnat(v) for v in vecinos(n, 6, minimo=100_000,
                                             mismo_largo=True)]
            add(B, A3, "De la notación desarrollada al número",
                f"¿Cuál número corresponde a la notación desarrollada "
                f"{desarrollo}?", fnat(n), dist,
                f"Al sumar los valores posicionales se obtiene {fnat(n)}.")

    a3_natural(6, False)
    a3_natural(5, True)
    a3_decimal(6, False)
    a3_decimal(5, True)
    a3_inversa(6)
