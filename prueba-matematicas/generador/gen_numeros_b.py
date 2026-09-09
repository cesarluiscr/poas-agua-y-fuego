# -*- coding: utf-8 -*-
"""Bloque Números, afirmaciones 4 y 5."""
import math
from fractions import Fraction
from gen_base import *

B = "Números"

PRIMOS = [p for p in range(2, 200)
          if all(p % d for d in range(2, int(p ** 0.5) + 1))]

def es_primo(n):
    return n > 1 and all(n % d for d in range(2, int(n ** 0.5) + 1))

def divisores(n):
    return [d for d in range(1, n + 1) if n % d == 0]

# ============================================================ AFIRMACIÓN 4 (43)
A4 = "4. Resuelve problemas relacionados con los conceptos básicos de la teoría de números."

def a4_multiplos(k):
    for i in range(k):
        b = rng.choice([3, 4, 6, 7, 8, 9, 11, 12, 13, 15])
        mult = b * rng.randrange(6, 30)
        dist = sorted({mult + x for x in (-7, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 7)
                       if mult + x > 0 and (mult + x) % b != 0})
        rng.shuffle(dist)
        add(B, A4, "Múltiplos de un número natural",
            f"¿Cuál de los siguientes números es múltiplo de {b}?",
            mult, dist,
            f"{mult} = {b} × {mult // b}, por lo tanto {mult} es múltiplo de {b}. "
            f"Los demás números no se obtienen al multiplicar {b} por un natural.")

def a4_no_multiplo(k):
    for _ in range(k):
        b = rng.choice([3, 4, 6, 7, 8, 9, 12])
        base = b * rng.randrange(5, 25)
        mults = {base, b * rng.randrange(5, 25), b * rng.randrange(5, 25)}
        while len(mults) < 3:
            mults.add(b * rng.randrange(5, 25))
        no = base + rng.choice([1, 2, -1, -2])
        while no % b == 0:
            no += 1
        add(B, A4, "Múltiplos de un número natural",
            f"¿Cuál de los siguientes números NO es múltiplo de {b}?",
            no, list(mults),
            f"{no} ÷ {b} = {no // b} con residuo {no % b}, así que no es múltiplo de "
            f"{b}. Los otros tres sí son productos exactos de {b}.")

def a4_par_impar(k):
    for i in range(k):
        pares, impares = set(), set()
        while len(pares) < 4:
            pares.add(2 * rng.randrange(50, 500))
        while len(impares) < 4:
            impares.add(2 * rng.randrange(50, 500) + 1)
        pares, impares = sorted(pares), sorted(impares)
        if i % 2 == 0:
            impar = impares[0]
            add(B, A4, "Números pares e impares",
                "¿Cuál de los siguientes números es impar?",
                fnat(impar), [fnat(x) for x in pares],
                f"{fnat(impar)} termina en {impar % 10}, una cifra impar, por lo que "
                f"no es divisible entre 2. Los demás terminan en cifra par.")
        else:
            par = pares[0]
            add(B, A4, "Números pares e impares",
                "¿Cuál de los siguientes números es par?",
                fnat(par), [fnat(x) for x in impares],
                f"{fnat(par)} termina en {par % 10}, cifra par, "
                f"así que es divisible entre 2.")

def a4_divisibilidad(k):
    reglas = {
        2: "termina en cifra par (0, 2, 4, 6 u 8)",
        3: "la suma de sus cifras es múltiplo de 3",
        5: "termina en 0 o en 5",
        10: "termina en 0",
    }
    for i in range(k):
        d = [2, 3, 5, 10][i % 4]
        n = d * rng.randrange(40, 900)
        dist = []
        while len(dist) < 6:
            v = rng.randrange(100, 9000)
            if v % d != 0:
                dist.append(fnat(v))
        if d == 3:
            razon = (f"La suma de las cifras de {fnat(n)} es "
                     f"{sum(int(c) for c in str(n))}, que es múltiplo de 3.")
        else:
            razon = f"{fnat(n)} termina en {n % 10}."
        add(B, A4, f"Regla de divisibilidad entre {d}",
            f"¿Cuál de los siguientes números es divisible entre {d}?",
            fnat(n), dist,
            f"Un número es divisible entre {d} si {reglas[d]}. {razon} "
            f"En efecto, {fnat(n)} ÷ {d} = {fnat(n // d)}.")

def a4_regla_cual(k):
    for _ in range(k):
        d = rng.choice([2, 3, 5, 10])
        n = rng.randrange(1000, 9999)
        divs = [x for x in (2, 3, 5, 10) if n % x == 0]
        while len(divs) != 1:
            n = rng.randrange(1000, 9999)
            divs = [x for x in (2, 3, 5, 10) if n % x == 0]
        d = divs[0]
        add(B, A4, "Aplicación de las reglas de divisibilidad",
            f"El número {fnat(n)} es divisible únicamente entre uno de los "
            f"siguientes. ¿Cuál es?",
            str(d), [str(x) for x in (2, 3, 5, 10) if x != d],
            f"{fnat(n)} ÷ {d} = {fnat(n // d)} es exacta. Con los otros valores "
            f"la división deja residuo.")

def a4_divisores(k):
    for i in range(k):
        n = rng.choice([12, 18, 20, 24, 28, 30, 36, 40, 42, 45, 48, 50, 54, 56, 60, 72])
        divs = divisores(n)
        nodivs = [x for x in range(2, n) if n % x != 0]
        if i % 3 == 0:
            candidatos_d = [d for d in divs if 2 < d < n] or [d for d in divs if 1 < d < n]
            correcta = rng.choice(candidatos_d)
            add(B, A4, "Divisores o factores de un número natural",
                f"¿Cuál de los siguientes números es un divisor de {n}?",
                correcta, muestra(nodivs, 6),
                f"{n} ÷ {correcta} = {n // correcta} es una división exacta, "
                f"por eso {correcta} es divisor (o factor) de {n}.")
        elif i % 3 == 1:
            correcta = rng.choice(nodivs)
            add(B, A4, "Divisores o factores de un número natural",
                f"¿Cuál de los siguientes números NO es divisor de {n}?",
                correcta, muestra([d for d in divs if 2 < d < n]
                                  or [d for d in divs if 1 < d < n], 6),
                f"{n} ÷ {correcta} no es exacta (deja residuo {n % correcta}), "
                f"mientras que los otros tres dividen a {n} exactamente.")
        else:
            c = len(divs)
            add(B, A4, "Cantidad de divisores",
                f"¿Cuántos divisores naturales tiene el número {n}?",
                str(c), [str(c + 1), str(c - 1), str(c + 2), str(max(c - 2, 1))],
                f"Los divisores de {n} son {', '.join(map(str, divs))}: "
                f"en total {c}.")

def a4_primos(k):
    for i in range(k):
        if i % 3 == 0:
            p = rng.choice([x for x in PRIMOS if x > 10])
            comp = [x for x in range(11, 200) if not es_primo(x)]
            add(B, A4, "Números primos y compuestos",
                "¿Cuál de los siguientes números es primo?",
                str(p), [str(x) for x in muestra(comp, 6)],
                f"{p} solo es divisible entre 1 y {p}, por lo que es primo. "
                f"Los demás tienen más de dos divisores.")
        elif i % 3 == 1:
            comp = rng.choice([x for x in range(11, 200) if not es_primo(x)])
            d = next(x for x in range(2, comp) if comp % x == 0)
            add(B, A4, "Números primos y compuestos",
                "¿Cuál de los siguientes números es compuesto?",
                str(comp), [str(x) for x in muestra([p for p in PRIMOS if p > 10], 6)],
                f"{comp} = {d} × {comp // d}, así que además de 1 y {comp} tiene "
                f"otros divisores: es compuesto. Los demás son primos.")
        else:
            n = rng.choice([x for x in range(20, 120)])
            correcta = "compuesto" if not es_primo(n) else "primo"
            just = (f"solo tiene dos divisores: 1 y {n}" if es_primo(n)
                    else f"tiene más de dos divisores, por ejemplo "
                         f"{next(x for x in range(2, n) if n % x == 0)}")
            add(B, A4, "Números primos y compuestos",
                f"El número {n} es:",
                correcta,
                ["primo" if correcta == "compuesto" else "compuesto",
                 "primo y compuesto a la vez", "ni primo ni compuesto"],
                f"{n} {just}, por lo tanto es {correcta}.")

def construir():
    a4_multiplos(6)
    a4_no_multiplo(5)
    a4_par_impar(6)
    a4_divisibilidad(7)
    a4_regla_cual(4)
    a4_divisores(7)
    a4_primos(6)

    # ============================================================ AFIRMACIÓN 5 (57)
    A5 = "5. Resuelve problemas relacionados con las operaciones aritméticas de números en sus distintas representaciones."

    def a5_division(k):
        ctx = [("galletas", "bolsas"), ("lápices", "cajas"), ("libros", "estantes"),
               ("naranjas", "canastas"), ("botellas", "cajas"), ("sillas", "salones")]
        for _ in range(k):
            obj, cont = rng.choice(ctx)
            d = rng.randrange(6, 25)
            c = rng.randrange(12, 60)
            r = rng.randrange(1, d)
            n = d * c + r
            add(B, A5, "Algoritmo de la división de naturales",
                f"Se reparten {fnat(n)} {obj} en {cont} de {d} {obj} cada una. "
                f"¿Cuántas {cont} completas se llenan y cuántas {obj} sobran?",
                f"{c} {cont} y sobran {r}",
                [f"{c + 1} {cont} y sobran {r}", f"{c} {cont} y sobran {d - r}",
                 f"{c - 1} {cont} y sobran {r}", f"{c} {cont} y sobran {r + 1}"],
                f"{fnat(n)} ÷ {d} = {c} con residuo {r}, porque "
                f"{d} × {c} = {fnat(d*c)} y {fnat(d*c)} + {r} = {fnat(n)}.")

    def a5_combinadas(k):
        for i in range(k):
            a, b, c = rng.randrange(5, 40), rng.randrange(2, 12), rng.randrange(2, 12)
            d = rng.randrange(2, 10)
            e = d * rng.randrange(2, 12)
            forma = i % 3
            if forma == 0:
                expr = f"{a} + {b} × {c} − {e} ÷ {d}"
                val = a + b * c - e // d
                mal1 = (a + b) * c - e // d
                mal2 = a + b * (c - e) // d if d else 0
                mal3 = a + b * c - e
            elif forma == 1:
                expr = f"({a} + {b}) × {c} − {d}"
                val = (a + b) * c - d
                mal1 = a + b * c - d
                mal2 = (a + b) * (c - d)
                mal3 = (a + b) * c + d
            else:
                expr = f"{e} ÷ {d} + {b} × {c}"
                val = e // d + b * c
                mal1 = (e // d + b) * c
                mal2 = e // (d + b) * c
                mal3 = e // d + b + c
            add(B, A5, "Combinación de operaciones",
                f"Calcule: {expr}",
                fnat(val),
                [fnat(x) for x in (mal1, mal2, mal3, val + 1, val - 1,
                                   val + 10, val + 2)
                 if x > 0],
                f"Se resuelven primero los paréntesis, luego las multiplicaciones y "
                f"divisiones y por último las sumas y restas: {expr} = {fnat(val)}.")

    def a5_por_potencia(k):
        for i in range(k):
            p = rng.choice([10, 100, 1000, 10000])
            if i % 2 == 0:
                base = round(rng.randrange(105, 9999) / 100, 2)
                val = round(base * p, 6)
                correcta = fdec(val)
                dist = [fdec(round(base * p * 10, 6)), fdec(round(base * p / 10, 6)),
                        fdec(round(base + p, 6)), fdec(round(base * p * 100, 6))]
                expl = (f"Multiplicar por {fnat(p)} corre la coma "
                        f"{len(str(p)) - 1} lugares hacia la derecha: "
                        f"{fdec(base)} × {fnat(p)} = {correcta}.")
                add(B, A5, f"Multiplicación por 10, 100, 1 000 o 10 000",
                    f"¿Cuál es el resultado de {fdec(base)} × {fnat(p)}?",
                    correcta, dist, expl)
            else:
                base = rng.randrange(2, 999) * 10000
                val = base / p
                correcta = fdec(val)
                dist = [fdec(base / (p * 10)), fdec(base / max(p / 10, 1)),
                        fdec(base - p), fdec(base * p)]
                add(B, A5, "División por 10, 100, 1 000 o 10 000",
                    f"¿Cuál es el resultado de {fnat(base)} ÷ {fnat(p)}?",
                    correcta, dist,
                    f"Dividir entre {fnat(p)} corre la coma {len(str(p)) - 1} lugares "
                    f"hacia la izquierda: {fnat(base)} ÷ {fnat(p)} = {correcta}.")

    def a5_efecto(k):
        plantillas = [
            ("Si un número natural mayor que 1 se multiplica por un número mayor que 1, "
             "el producto obtenido es:",
             "mayor que el número original",
             ["menor que el número original", "igual al número original",
              "siempre igual a 1"],
             "Al multiplicar por un factor mayor que 1 el resultado crece; por ejemplo, "
             "8 × 3 = 24, y 24 > 8."),
            ("Si un número mayor que 0 se multiplica por un número decimal menor que 1, "
             "el producto obtenido es:",
             "menor que el número original",
             ["mayor que el número original", "igual al número original",
              "siempre un número natural"],
             "Multiplicar por un factor menor que 1 reduce el valor; por ejemplo, "
             "20 × 0,4 = 8, y 8 < 20."),
            ("Si un número mayor que 0 se divide entre un número mayor que 1, "
             "el cociente obtenido es:",
             "menor que el número original",
             ["mayor que el número original", "igual al número original",
              "siempre igual a cero"],
             "Dividir entre un número mayor que 1 reparte la cantidad; por ejemplo, "
             "50 ÷ 4 = 12,5, y 12,5 < 50."),
            ("Si un número mayor que 0 se divide entre un número decimal menor que 1, "
             "el cociente obtenido es:",
             "mayor que el número original",
             ["menor que el número original", "igual al número original",
              "siempre menor que 1"],
             "Dividir entre un número menor que 1 aumenta el valor; por ejemplo, "
             "6 ÷ 0,5 = 12, y 12 > 6."),
            ("Al multiplicar cualquier número por 1, el resultado es:",
             "el mismo número",
             ["cero", "el doble del número", "siempre 1"],
             "El 1 es el elemento neutro de la multiplicación: n × 1 = n."),
            ("¿Cuál de las siguientes operaciones da un resultado MENOR que 45?",
             "45 × 0,7", ["45 × 1,2", "45 ÷ 0,9", "45 × 1"],
             "45 × 0,7 = 31,5, que es menor que 45, porque el factor 0,7 es menor que 1."),
            ("¿Cuál de las siguientes operaciones da un resultado MAYOR que 30?",
             "30 ÷ 0,6", ["30 × 0,6", "30 ÷ 1,5", "30 × 0,99"],
             "30 ÷ 0,6 = 50, que es mayor que 30, porque se divide entre un número "
             "menor que 1."),
        ]
        for i in range(k):
            preg, cor, dist, expl = plantillas[i % len(plantillas)]
            add(B, A5, "Efecto de multiplicar o dividir por números mayores o menores que uno",
                preg, cor, dist, expl)

    def a5_problemas(k):
        for i in range(k):
            t = i % 4
            if t == 0:
                precio = round(rng.randrange(150, 1200) * 5 / 100, 2)  # múltiplos de ₡0,05
                cant = rng.randrange(3, 15)
                tot = round(precio * cant, 2)
                add(B, A5, "Problemas con decimales",
                    f"Un cuaderno cuesta ₡{fcol(precio)} y se compran {cant} cuadernos. "
                    f"¿Cuánto se paga en total?",
                    f"₡{fcol(tot)}",
                    [f"₡{fcol(tot + precio)}", f"₡{fcol(tot - precio)}",
                     f"₡{fcol(precio + cant)}", f"₡{fcol(tot * 10)}"],
                    f"Se multiplica el precio por la cantidad: "
                    f"{fcol(precio)} × {cant} = {fcol(tot)}.")
            elif t == 1:
                a = rng.randrange(12000, 98000)
                b = rng.randrange(1000, 11000)
                add(B, A5, "Problemas de suma y resta",
                    f"Una finca produjo {fnat(a)} kilogramos de café en el 2024 y "
                    f"{fnat(b)} kilogramos menos en el 2025. ¿Cuántos kilogramos "
                    f"produjo en el 2025?",
                    fnat(a - b),
                    [fnat(a + b), fnat(b - a + 2 * b), fnat(a - b + 1000), fnat(a - 2 * b)],
                    f"Se resta la disminución: {fnat(a)} − {fnat(b)} = {fnat(a - b)}.")
            elif t == 2:
                grupos = rng.randrange(6, 30)
                porgrupo = rng.randrange(8, 40)
                add(B, A5, "Problemas de multiplicación",
                    f"En una escuela hay {grupos} secciones con {porgrupo} estudiantes "
                    f"cada una. ¿Cuántos estudiantes hay en total?",
                    fnat(grupos * porgrupo),
                    [fnat(grupos + porgrupo), fnat(grupos * porgrupo + porgrupo),
                     fnat(grupos * (porgrupo - 1)), fnat(grupos * porgrupo * 2)],
                    f"Se multiplica: {grupos} × {porgrupo} = "
                    f"{fnat(grupos * porgrupo)} estudiantes.")
            else:
                per = rng.randrange(4, 20)
                tot = per * rng.randrange(15, 90)
                add(B, A5, "Problemas de división",
                    f"Se reparten {fnat(tot)} colones en partes iguales entre {per} "
                    f"personas. ¿Cuánto recibe cada una?",
                    f"₡{fnat(tot // per)}",
                    [f"₡{fnat(tot // per + per)}", f"₡{fnat(tot * per)}",
                     f"₡{fnat(tot - per)}", f"₡{fnat(tot // (per + 1))}"],
                    f"Se divide el total entre la cantidad de personas: "
                    f"{fnat(tot)} ÷ {per} = {fnat(tot // per)}.")

    def a5_potencias(k):
        for i in range(k):
            t = i % 4
            if t == 0:
                base = rng.randrange(2, 10)
                exp = rng.randrange(2, 6)
                producto = " × ".join([str(base)] * exp)
                add(B, A5, "Productos de factores iguales como potencia",
                    f"¿Cómo se expresa {producto} en forma de potencia?",
                    pot(base, exp),
                    [pot(exp, base), f"{base} × {exp}", pot(base, exp + 1),
                     pot(base, exp - 1), pot(base + 1, exp), pot(exp + 1, base)],
                    f"El factor {base} se repite {exp} veces, por lo que la base es "
                    f"{base} y el exponente es {exp}: {pot(base, exp)}.")
            elif t == 1:
                base = rng.randrange(2, 10)
                exp = rng.randrange(2, 5)
                val = base ** exp
                add(B, A5, "Cálculo de potencias",
                    f"¿Cuál es el valor de {pot(base, exp)}?",
                    fnat(val),
                    [fnat(x) for x in (base * exp, base ** (exp + 1), exp ** base,
                                       val + base, base ** (exp - 1), val * 2,
                                       val + 1, val + 10)],
                    f"{pot(base, exp)} significa multiplicar {base} por sí mismo {exp} "
                    f"veces: {' × '.join([str(base)] * exp)} = {fnat(val)}.")
            elif t == 2:
                e = rng.randrange(2, 7)
                val = 10 ** e
                add(B, A5, "Múltiplos de 10 como potencias de base 10",
                    f"¿Cómo se expresa {fnat(val)} como potencia de base 10?",
                    pot(10, e),
                    [pot(10, e + 1), pot(10, e - 1), pot(e, 10), f"10 × {e}"],
                    f"{fnat(val)} tiene {e} ceros, por lo que equivale a {pot(10, e)}.")
            else:
                if rng.random() < 0.5:
                    n = rng.randrange(5, 16)
                    val = n * n
                    cuadrados = {x * x for x in range(1, 40)}
                    # distractores cercanos, para que la respuesta no salte a la vista
                    otros = [x for x in range(val - 18, val + 19)
                             if x > 0 and x not in cuadrados]
                    add(B, A5, "Cuadrados perfectos",
                        "¿Cuál de los siguientes es un cuadrado perfecto?",
                        fnat(val), [fnat(x) for x in muestra(otros, 6)],
                        f"{fnat(val)} = {n} × {n} = {pot(n, 2)}, por eso es un cuadrado "
                        f"perfecto. Ninguno de los otros números se obtiene al "
                        f"multiplicar un natural por sí mismo.")
                else:
                    n = rng.randrange(4, 11)
                    val = n ** 3
                    cubos = {x ** 3 for x in range(1, 25)}
                    otros = [x for x in range(max(val - 30, 2), val + 31)
                             if x not in cubos]
                    add(B, A5, "Cubos perfectos",
                        "¿Cuál de los siguientes es un cubo perfecto?",
                        fnat(val), [fnat(x) for x in muestra(otros, 6)],
                        f"{fnat(val)} = {n} × {n} × {n} = {pot(n, 3)}, por eso es un "
                        f"cubo perfecto.")

    def a5_fracciones_op(k):
        for i in range(k):
            t = i % 6
            if t == 0:
                f = frac_no_entera(9, 11)
                m = rng.randrange(2, 7)
                correcta = f"{f.numerator * m}/{f.denominator * m}"
                add(B, A5, "Amplificación de fracciones",
                    f"¿Cuál fracción se obtiene al amplificar {ffrac(f)} por {m}?",
                    correcta,
                    [f"{f.numerator * m}/{f.denominator}",
                     f"{f.numerator}/{f.denominator * m}",
                     f"{f.numerator + m}/{f.denominator + m}",
                     f"{f.numerator * (m+1)}/{f.denominator * (m+1)}"]
                    + cerca_frac(Fraction(f.numerator * m, f.denominator * m)),
                    f"Amplificar es multiplicar numerador y denominador por el mismo "
                    f"número: ({f.numerator} × {m})/({f.denominator} × {m}) = {correcta}.")
            elif t == 1:
                f = frac_no_entera(9, 11)
                m = rng.randrange(2, 7)
                num, den = f.numerator * m, f.denominator * m
                add(B, A5, "Simplificación de fracciones",
                    f"¿Cuál es la mínima expresión de la fracción {num}/{den}?",
                    ffrac(f),
                    [f"{num//2 if num%2==0 else num}/{den//2 if den%2==0 else den}",
                     f"{f.numerator}/{den}", f"{num}/{f.denominator}",
                     f"{f.numerator + 1}/{f.denominator + 1}"] + cerca_frac(f),
                    f"El máximo común divisor de {num} y {den} es {math.gcd(num, den)}; "
                    f"al dividir ambos términos entre él se obtiene {ffrac(f)}.")
            elif t == 2:
                a, b = frac_no_entera(9, 10), frac_no_entera(9, 10)
                r = a * b
                add(B, A5, "Multiplicación de fracciones",
                    f"¿Cuál es el resultado de {ffrac(a)} × {ffrac(b)}?",
                    fnum(r),
                    [ffrac(a + b),
                     f"{a.numerator + b.numerator}/{a.denominator + b.denominator}",
                     ffrac(a / b),
                     f"{a.numerator * b.denominator}/{a.denominator * b.numerator}"]
                    + cerca_frac(r),
                    f"Se multiplican numeradores y denominadores: "
                    f"({a.numerator} × {b.numerator})/({a.denominator} × {b.denominator}) = "
                    f"{a.numerator * b.numerator}/{a.denominator * b.denominator}"
                    + ("." if ffrac(r) == f"{a.numerator * b.numerator}/"
                                          f"{a.denominator * b.denominator}"
                       else f", que simplificado es {fnum(r)}."))
            elif t == 3:
                a, b = frac_no_entera(9, 10), frac_no_entera(9, 10)
                r = a / b
                add(B, A5, "División de fracciones",
                    f"¿Cuál es el resultado de {ffrac(a)} ÷ {ffrac(b)}?",
                    fnum(r),
                    [ffrac(a * b), f"{a.numerator}/{b.denominator}",
                     ffrac(b / a), f"{a.numerator * b.numerator}/"
                                   f"{a.denominator * b.denominator}"]
                    + cerca_frac(r),
                    f"Se multiplica la primera fracción por el inverso de la segunda: "
                    f"{ffrac(a)} × {ffrac(Fraction(b.denominator, b.numerator))} = "
                    f"{fnum(r)}.")
            elif t == 4:
                if rng.random() < 0.5:
                    n = rng.randrange(2, 13)
                    add(B, A5, "Inverso multiplicativo",
                        f"¿Cuál es el inverso multiplicativo de {n}?",
                        f"1/{n}", [f"{n}/1", f"-{n}", f"1/{n + 1}", f"{n}/{n}"],
                        f"El inverso multiplicativo de {n} es 1/{n}, porque "
                        f"{n} × 1/{n} = 1.")
                else:
                    f = frac_no_entera(9, 11)
                    while f.numerator == f.denominator or f.numerator == 1:
                        f = frac_no_entera(9, 11)
                    add(B, A5, "Inverso multiplicativo",
                        f"¿Cuál es el inverso multiplicativo de {ffrac(f)}?",
                        f"{f.denominator}/{f.numerator}",
                        [ffrac(f), f"1/{f.numerator}", f"1/{f.denominator}",
                         f"{f.numerator}/{f.denominator + 1}"]
                        + cerca_frac(Fraction(f.denominator, f.numerator)),
                        f"Se intercambian numerador y denominador: "
                        f"{ffrac(f)} × {f.denominator}/{f.numerator} = 1.")
            else:
                homog = rng.random() < 0.5
                if homog:
                    den = rng.randrange(3, 13)
                    a = Fraction(rng.randrange(1, den), den)
                    b = Fraction(rng.randrange(1, den), den)
                else:
                    a, b = frac_no_entera(9, 11), frac_no_entera(9, 11)
                    while a.denominator == b.denominator:
                        b = frac_no_entera(9, 11)
                if rng.random() < 0.5 or b > a:
                    r = a + b
                    op, nom = "+", "suma"
                else:
                    r = a - b
                    op, nom = "−", "resta"
                if r == 0:
                    r = a + b; op, nom = "+", "suma"
                com = a.denominator * b.denominator // math.gcd(a.denominator, b.denominator)
                add(B, A5, f"{nom.capitalize()} de fracciones "
                           f"{'homogéneas' if a.denominator == b.denominator else 'heterogéneas'}",
                    f"¿Cuál es el resultado de {ffrac(a)} {op} {ffrac(b)}?",
                    fnum(r),
                    [f"{a.numerator + b.numerator}/{a.denominator + b.denominator}",
                     ffrac(a * b), ffrac(abs(a - b)) if op == "+" else ffrac(a + b),
                     f"{a.numerator}/{com}"] + cerca_frac(r),
                    f"Con denominador común {com}: "
                    f"{a.numerator * com // a.denominator}/{com} {op} "
                    f"{b.numerator * com // b.denominator}/{com} = "
                    f"{(a.numerator * com // a.denominator) + (1 if op == '+' else -1) * (b.numerator * com // b.denominator)}/{com}"
                    f"{', que simplificado es ' + fnum(r) + '.' if r.denominator != com else '.'}")

    def a5_problemas_frac(k):
        for i in range(k):
            t = i % 3
            if t == 0:
                den = rng.choice([3, 4, 5, 6, 8, 10])
                num = rng.randrange(1, den)
                total = den * rng.randrange(4, 20)
                parte = total * num // den
                add(B, A5, "Problemas con fracciones",
                    f"En una finca de {fnat(total)} hectáreas, {num}/{den} están "
                    f"sembradas de café. ¿Cuántas hectáreas tienen café?",
                    fnat(parte),
                    [fnat(total // den), fnat(total - parte), fnat(parte + den),
                     fnat(total * num)],
                    f"Se calcula {num}/{den} de {fnat(total)}: "
                    f"{fnat(total)} ÷ {den} = {fnat(total // den)} y "
                    f"{fnat(total // den)} × {num} = {fnat(parte)} hectáreas.")
            elif t == 1:
                a = Fraction(rng.randrange(1, 6), rng.choice([2, 4, 8]))
                b = Fraction(rng.randrange(1, 6), rng.choice([3, 6, 12]))
                while a.denominator == 1 or b.denominator == 1:
                    a = Fraction(rng.randrange(1, 6), rng.choice([2, 4, 8]))
                    b = Fraction(rng.randrange(1, 6), rng.choice([3, 6, 12]))
                r = a + b
                add(B, A5, "Problemas con fracciones",
                    f"María caminó {ffrac(a)} de kilómetro por la mañana y {ffrac(b)} "
                    f"de kilómetro por la tarde. ¿Cuánto caminó en total?",
                    f"{fnum(r)} de kilómetro",
                    [f"{ffrac(a * b)} de kilómetro",
                     f"{a.numerator + b.numerator}/{a.denominator + b.denominator} de kilómetro",
                     f"{ffrac(abs(a - b))} de kilómetro",
                     f"{ffrac(r + 1)} de kilómetro"]
                    + [f"{x} de kilómetro" for x in cerca_frac(r)],
                    f"Se suman las fracciones: {ffrac(a)} + {ffrac(b)} = {ffrac(r)} "
                    f"de kilómetro.")
            else:
                precio = round(rng.randrange(200, 900) * 5 / 100, 2)
                billete = rng.choice([1000, 2000, 5000])
                cant = rng.randrange(2, 6)
                gasto = round(precio * cant, 2)
                vuelto = round(billete - gasto, 2)
                while vuelto <= 0:
                    cant -= 1
                    gasto = round(precio * cant, 2)
                    vuelto = round(billete - gasto, 2)
                add(B, A5, "Problemas con decimales",
                    f"Se compran {cant} artículos de ₡{fcol(precio)} cada uno y se paga "
                    f"con un billete de ₡{fnat(billete)}. ¿Cuánto vuelto se recibe?",
                    f"₡{fcol(vuelto)}",
                    [f"₡{fcol(gasto)}", f"₡{fcol(billete - precio)}",
                     f"₡{fcol(vuelto + precio)}",
                     f"₡{fcol(billete + gasto)}"],
                    f"El gasto es {fcol(precio)} × {cant} = {fcol(gasto)} y el vuelto "
                    f"es {fnat(billete)} − {fcol(gasto)} = {fcol(vuelto)}.")

    a5_division(6)
    a5_combinadas(6)
    a5_por_potencia(7)
    a5_efecto(7)
    a5_problemas(7)
    a5_potencias(8)
    a5_fracciones_op(6)
    a5_problemas_frac(6)
