# -*- coding: utf-8 -*-
"""Bloque Números, afirmaciones 6 y 7."""
import math
from fractions import Fraction
from gen_base import *

B = "Números"

# ============================================================ AFIRMACIÓN 6 (43)
A6 = "6. Resuelve problemas relacionados con el concepto, los tipos o representaciones de fracciones."

FIGURAS = ["un rectángulo", "una barra de chocolate", "un pastel", "una cinta",
           "un cuadrado", "una pizza"]

def a6_parte_unidad(k):
    for _ in range(k):
        fig = rng.choice(FIGURAS)
        den = rng.choice([4, 5, 6, 8, 9, 10, 12])
        num = rng.randrange(1, den)
        add(B, A6, "La fracción como parte de la unidad",
            f"Se dividió {fig} en {den} partes iguales y se sombrearon {num} de "
            f"ellas. ¿Qué fracción representa la parte sombreada?",
            f"{num}/{den}",
            [f"{den}/{num}", f"{num}/{den - num}", f"{den - num}/{den}",
             f"{num}/{den + 1}"],
            f"El denominador indica en cuántas partes iguales se dividió la unidad "
            f"({den}) y el numerador cuántas se tomaron ({num}): {num}/{den}.")

def a6_parte_coleccion(k):
    ctx = [("estudiantes", "usan lentes"), ("bolas", "son rojas"),
           ("libros", "son de poesía"), ("frutas", "son manzanas"),
           ("carros", "son blancos"), ("figuras", "son triángulos")]
    for _ in range(k):
        obj, prop = rng.choice(ctx)
        f = Fraction(rng.randrange(1, 8), rng.choice([3, 4, 5, 6, 8, 10, 12]))
        while f >= 1:
            f = Fraction(rng.randrange(1, 8), rng.choice([3, 4, 5, 6, 8, 10, 12]))
        m = rng.randrange(2, 7)
        total = f.denominator * m
        parte = f.numerator * m
        add(B, A6, "La fracción como parte de una colección",
            f"En un grupo de {total} {obj}, {parte} {prop}. ¿Qué fracción del grupo, "
            f"en su mínima expresión, {prop}?",
            ffrac(f),
            [f"{total}/{parte}", f"{f.denominator}/{f.numerator}",
             ffrac(Fraction(total - parte, total))] + cerca_frac(f),
            f"La fracción es {parte}/{total}; al dividir numerador y denominador "
            f"entre {math.gcd(parte, total)} se obtiene {ffrac(f)}.")

def a6_propia_impropia(k):
    for i in range(k):
        # valores distintos entre sí, para que ninguna opción se repita
        propias, vistos_p = [], set()
        while len(propias) < 5:
            d = rng.randrange(3, 13)
            n = rng.randrange(1, d)
            if Fraction(n, d) not in vistos_p:
                vistos_p.add(Fraction(n, d))
                propias.append(f"{n}/{d}")
        impropias, vistos_i = [], set()
        while len(impropias) < 5:
            d = rng.randrange(2, 10)
            n = rng.randrange(d + 1, d + 12)
            if Fraction(n, d) not in vistos_i:
                vistos_i.add(Fraction(n, d))
                impropias.append(f"{n}/{d}")
        if i % 2 == 0:
            add(B, A6, "Fracciones propias",
                "¿Cuál de las siguientes es una fracción propia?",
                propias[0], impropias,
                f"En {propias[0]} el numerador es menor que el denominador, por lo "
                f"que representa una cantidad menor que la unidad. Las demás son "
                f"fracciones impropias.")
        else:
            add(B, A6, "Fracciones impropias",
                "¿Cuál de las siguientes es una fracción impropia?",
                impropias[0], propias,
                f"En {impropias[0]} el numerador es mayor que el denominador, así "
                f"que representa una cantidad mayor que la unidad.")

def a6_impropia_suma(k):
    for _ in range(k):
        d = rng.randrange(3, 10)
        ent = rng.randrange(1, 6)
        num_res = rng.randrange(1, d)
        n = ent * d + num_res
        add(B, A6, "Fracción impropia como suma de un natural y una fracción propia",
            f"¿Cuál expresión equivale a la fracción {n}/{d}?",
            f"{ent} + {num_res}/{d}",
            [f"{ent} + {d}/{num_res}", f"{num_res} + {ent}/{d}",
             f"{ent + 1} + {num_res}/{d}", f"{ent} + {num_res + 1}/{d}"],
            f"{n} ÷ {d} = {ent} con residuo {num_res}, por lo que "
            f"{n}/{d} = {ent} + {num_res}/{d}.")

def a6_mixta(k):
    for i in range(k):
        d = rng.randrange(3, 11)
        ent = rng.randrange(1, 7)
        nr = rng.randrange(1, d)
        n = ent * d + nr
        if i % 2 == 0:
            add(B, A6, "De notación impropia a notación mixta",
                f"¿Cuál es la notación mixta de {n}/{d}?",
                fmix(ent, Fraction(nr, d)) if Fraction(nr, d).denominator == d
                else f"{ent} {nr}/{d}",
                [f"{ent} {d}/{nr}", f"{nr} {ent}/{d}", f"{ent + 1} {nr}/{d}",
                 f"{ent} {nr}/{d + 1}"],
                f"Al dividir {n} entre {d} se obtiene {ent} de cociente y {nr} de "
                f"residuo, así que {n}/{d} = {ent} {nr}/{d}.")
        else:
            add(B, A6, "De notación mixta a notación impropia",
                f"¿Cuál es la notación impropia (fraccionaria) de {ent} {nr}/{d}?",
                f"{n}/{d}",
                [f"{ent * d}/{d}", f"{ent + nr}/{d}", f"{n + 1}/{d}",
                 f"{n}/{d + ent}"],
                f"Se multiplica el entero por el denominador y se suma el "
                f"numerador: ({ent} × {d}) + {nr} = {n}, sobre el mismo "
                f"denominador: {n}/{d}.")

def _par_homogeneo(d=None):
    """Dos fracciones distintas con el mismo denominador."""
    d = d or rng.randrange(4, 12)
    n1, n2 = rng.sample(range(1, d), 2)
    return f"{n1}/{d} y {n2}/{d}", d

def _par_heterogeneo():
    """Dos fracciones con denominadores distintos."""
    d1, d2 = rng.sample(range(3, 12), 2)
    return f"{rng.randrange(1, d1)}/{d1} y {rng.randrange(1, d2)}/{d2}"

def a6_homogeneas(k):
    for i in range(k):
        h, d = _par_homogeneo()
        heteros = []
        while len(heteros) < 5:
            par = _par_heterogeneo()
            if par not in heteros:
                heteros.append(par)
        if i % 2 == 0:
            add(B, A6, "Fracciones homogéneas y heterogéneas",
                "¿Cuál par corresponde a fracciones homogéneas?",
                h, heteros,
                f"Las fracciones homogéneas tienen el mismo denominador. En "
                f"«{h}» ambas tienen denominador {d}.")
        else:
            homogeneos = []
            while len(homogeneos) < 5:
                par, _ = _par_homogeneo()
                if par != h and par not in homogeneos:
                    homogeneos.append(par)
            add(B, A6, "Fracciones homogéneas y heterogéneas",
                "¿Cuál par corresponde a fracciones heterogéneas?",
                heteros[0], [h] + homogeneos,
                f"Las fracciones heterogéneas tienen distinto denominador, como "
                f"ocurre en «{heteros[0]}»; en los demás pares el denominador se "
                f"repite.")

def a6_recta(k):
    for i in range(k):
        d = rng.choice([4, 5, 6, 8, 10])
        n = rng.randrange(1, d)
        if i % 2 == 0:
            add(B, A6, "Ubicación de fracciones en la recta numérica",
                f"En una recta numérica, el segmento de 0 a 1 se dividió en {d} "
                f"partes iguales. ¿Qué fracción corresponde al punto que está a "
                f"{n} {'división' if n == 1 else 'divisiones'} del 0?",
                f"{n}/{d}",
                [f"{d}/{n}", f"{n}/{d + 1}", f"{d - n}/{d}", f"{n + 1}/{d}"],
                f"Cada división vale 1/{d}, por lo que {n} "
                f"{'división equivale' if n == 1 else 'divisiones equivalen'} "
                f"a {n}/{d}.")
        else:
            ent = rng.randrange(1, 5)
            total = ent * d + n
            add(B, A6, "Ubicación de fracciones en la recta numérica",
                f"En la recta numérica, ¿entre cuáles números naturales "
                f"consecutivos se ubica la fracción {total}/{d}?",
                f"entre {ent} y {ent + 1}",
                [f"entre {ent + 1} y {ent + 2}", f"entre {ent - 1} y {ent}",
                 f"entre 0 y 1", f"entre {d} y {d + 1}"],
                f"{total} ÷ {d} = {ent} con residuo {n}, así que {total}/{d} es "
                f"mayor que {ent} y menor que {ent + 1}.")

def a6_entre_naturales(k):
    for _ in range(k):
        ent = rng.randrange(1, 6)
        d = rng.choice([3, 4, 5, 6, 8])
        n = ent * d + rng.randrange(1, d)
        malas = []
        for delta in (-1, 1, 2, -2):
            e2 = ent + delta
            if e2 >= 0:
                malas.append(f"{e2 * d + rng.randrange(1, d)}/{d}")
        add(B, A6, "Fracciones entre dos naturales consecutivos",
            f"¿Cuál de las siguientes fracciones está entre {ent} y {ent + 1}?",
            f"{n}/{d}", malas,
            f"{n}/{d} = {n} ÷ {d} = {fdec(round(n / d, 4))}, valor que se encuentra "
            f"entre {ent} y {ent + 1}.")

def a6_equivalentes(k):
    for i in range(k):
        f = Fraction(rng.randrange(1, 9), rng.randrange(2, 12))
        while f >= 1 or f.denominator < 2:
            f = Fraction(rng.randrange(1, 9), rng.randrange(2, 12))
        m = rng.randrange(2, 8)
        equiv = f"{f.numerator * m}/{f.denominator * m}"
        malas = [f"{f.numerator * m}/{f.denominator * (m + 1)}",
                 f"{f.numerator * (m + 1)}/{f.denominator * m}",
                 f"{f.numerator + m}/{f.denominator + m}",
                 f"{f.denominator * m}/{f.numerator * m}"]
        if i % 2 == 0:
            add(B, A6, "Fracciones equivalentes",
                f"¿Cuál de las siguientes fracciones es equivalente a {ffrac(f)}?",
                equiv, malas,
                f"{ffrac(f)} = ({f.numerator} × {m})/({f.denominator} × {m}) = "
                f"{equiv}; ambas representan la misma cantidad.")
        else:
            add(B, A6, "Fracciones equivalentes",
                f"¿Cuál de las siguientes fracciones NO es equivalente a "
                f"{ffrac(f)}?",
                malas[0],
                [equiv, f"{f.numerator * (m + 2)}/{f.denominator * (m + 2)}",
                 ffrac(f), f"{f.numerator * 2}/{f.denominator * 2}"],
                f"Al simplificar, {malas[0]} no equivale a {ffrac(f)}; las otras "
                f"opciones sí se obtienen amplificando {ffrac(f)}.")

def construir():
    a6_parte_unidad(5)
    a6_parte_coleccion(5)
    a6_propia_impropia(6)
    a6_impropia_suma(4)
    a6_mixta(6)
    a6_homogeneas(4)
    a6_recta(5)
    a6_entre_naturales(3)
    a6_equivalentes(3)

    # ============================================================ AFIRMACIÓN 7 (28)
    A7 = "7. Reconoce propiedades o representaciones de números naturales, decimales o fraccionarios."

    def a7_entre_naturales(k):
        for _ in range(k):
            ent = rng.randrange(1, 40)
            nd = rng.choice([1, 2, 3])
            parte = rng.randrange(1, 10 ** nd)
            texto = f"{ent},{str(parte).zfill(nd)}"
            add(B, A7, "Naturales consecutivos entre los que se ubica un decimal",
                f"Al localizarlo en la recta numérica, ¿entre cuáles números naturales "
                f"consecutivos se encuentra {texto}?",
                f"entre {ent} y {ent + 1}",
                [f"entre {ent - 1} y {ent}", f"entre {ent + 1} y {ent + 2}",
                 f"entre {ent} y {ent + 2}", f"entre 0 y {ent}"],
                f"La parte entera de {texto} es {ent} y la parte decimal es mayor que "
                f"cero, por lo que el número está entre {ent} y {ent + 1}.")

    def a7_fraccion_decimal(k):
        for i in range(k):
            nd = rng.choice([1, 2, 3])
            den = 10 ** nd
            num = rng.randrange(1, den)
            while num % 10 == 0 and nd > 1:
                num = rng.randrange(1, den)
            texto = f"0,{str(num).zfill(nd)}"
            if i % 2 == 0:
                add(B, A7, "De fracción decimal a número decimal",
                    f"¿Cuál número decimal corresponde a la fracción {num}/{den}?",
                    texto,
                    [f"0,{str(num).zfill(nd + 1)}", f"0,{str(num).zfill(nd)[:-1] or '0'}",
                     f"{num},{den}", f"0,{str(num + 1).zfill(nd)}"],
                    f"El denominador {fnat(den)} indica {ORDEN_DEC[nd]}: {num}/{den} = "
                    f"{texto}.")
            else:
                add(B, A7, "De número decimal a fracción decimal",
                    f"¿Cuál fracción decimal corresponde a {texto}?",
                    f"{num}/{den}",
                    [f"{num}/{den * 10}", f"{num}/{den // 10 if den > 10 else 1}",
                     f"{den}/{num}", f"{num + 1}/{den}"],
                    f"{texto} tiene {nd} cifra(s) decimal(es), por lo que se escribe "
                    f"con denominador {fnat(den)}: {num}/{den}.")

    def a7_decimal_fraccion(k):
        pares = [(0.5, "1/2"), (0.25, "1/4"), (0.75, "3/4"), (0.2, "1/5"),
                 (0.4, "2/5"), (0.6, "3/5"), (0.8, "4/5"), (0.125, "1/8"),
                 (0.375, "3/8"), (0.625, "5/8"), (0.875, "7/8"), (0.05, "1/20"),
                 (0.15, "3/20"), (0.35, "7/20"), (0.16, "4/25"), (0.24, "6/25")]
        usados = set()
        for _ in range(k):
            dec, fr = rng.choice([p for p in pares if p not in usados] or pares)
            usados.add((dec, fr))
            f = Fraction(fr)
            add(B, A7, "Decimal finito expresado como fracción",
                f"¿Cuál es la fracción, en su mínima expresión, equivalente a "
                f"{fdec(dec)}?",
                fr,
                [f"{f.denominator}/{f.numerator}", f"{f.numerator}/{f.denominator * 2}",
                 f"{f.numerator * 2}/{f.denominator}"] + cerca_frac(f),
                f"{fdec(dec)} = {int(round(dec * 10 ** len(str(dec).split('.')[1])))}/"
                f"{10 ** len(str(dec).split('.')[1])}, que simplificado es {fr}.")

    def a7_redondeo(k):
        ordenes = [("la unidad", 0), ("la décima", 1), ("la centésima", 2)]
        for i in range(k):
            nombre, d = ordenes[i % 3]
            nd = d + 2
            ent = rng.randrange(1, 90)
            parte = rng.randrange(10 ** (nd - 1), 10 ** nd)
            x = ent + parte / 10 ** nd
            r = round(x + 1e-9, d) if d else float(math.floor(x + 0.5))
            correcta = fdec(r, d) if d else fnat(int(r))
            paso = 10 ** -d if d else 1
            malas = []
            for salto in (1, -1, 2, -2, 3, -3):
                y = r + salto * paso
                if y > 0:
                    malas.append(fdec(y, d) if d else fnat(int(round(y))))
            # truncar en lugar de redondear
            malas.append(fdec(math.floor(x * 10 ** d) / 10 ** d, d) if d
                         else fnat(math.floor(x)))
            cifra = str(parte).zfill(nd)[d]
            regla = ("mayor o igual que 5, se aumenta en una unidad la cifra anterior"
                     if int(cifra) >= 5
                     else "menor que 5, la cifra anterior se mantiene")
            add(B, A7, "Redondeo de números decimales",
                f"¿Cuál es el resultado de redondear {fdec(x, nd)} a {nombre}?",
                correcta, malas,
                f"La cifra siguiente a {nombre} es {cifra}; como es {regla}. "
                f"El resultado es {correcta}.")

    a7_entre_naturales(7)
    a7_fraccion_decimal(7)
    a7_decimal_fraccion(7)
    a7_redondeo(7)
