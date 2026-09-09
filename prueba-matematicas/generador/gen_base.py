# -*- coding: utf-8 -*-
"""Utilidades base para generar el banco de preguntas."""
import random
from fractions import Fraction

rng = random.Random(20260909)

NBSP = "\u00a0"

# ---------------------------------------------------------------- formateo
def fnat(n):
    """348725 -> '348 725' (con espacio duro como separador de millares)."""
    s = f"{abs(int(n)):,}".replace(",", NBSP)
    return ("-" if n < 0 else "") + s

def fdec(x, d=None):
    """Formato decimal costarricense: coma decimal, espacio de millares."""
    if isinstance(x, Fraction):
        x = float(x)
    if d is None:
        s = repr(float(x))
        if s.endswith(".0"):
            s = s[:-2]
    else:
        s = f"{float(x):.{d}f}"
    if "." in s:
        ent, dec = s.split(".")
    else:
        ent, dec = s, ""
    neg = ent.startswith("-")
    ent = ent.lstrip("-")
    ent = f"{int(ent):,}".replace(",", NBSP)
    out = ent + ("," + dec if dec else "")
    return ("-" if neg else "") + out

def fcol(x):
    """Importe en colones, siempre con dos decimales."""
    return fdec(x, 2)

def ffrac(fr):
    fr = Fraction(fr)
    return f"{fr.numerator}/{fr.denominator}"

def fnum(fr):
    """Como ffrac, pero muestra un entero cuando el denominador es 1."""
    fr = Fraction(fr)
    return str(fr.numerator) if fr.denominator == 1 else ffrac(fr)

def fmix(entero, fr):
    return f"{entero}{NBSP}{ffrac(fr)}"

SUP = {"0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
       "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹"}

def pot(base, exp):
    return f"{base}{''.join(SUP[c] for c in str(exp))}"

# ---------------------------------------------------- números en palabras
_UNI = ['cero','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez',
        'once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho',
        'diecinueve','veinte','veintiuno','veintidós','veintitrés','veinticuatro',
        'veinticinco','veintiséis','veintisiete','veintiocho','veintinueve']
_DEC = {30:'treinta',40:'cuarenta',50:'cincuenta',60:'sesenta',70:'setenta',80:'ochenta',90:'noventa'}
_CEN = {1:'ciento',2:'doscientos',3:'trescientos',4:'cuatrocientos',5:'quinientos',
        6:'seiscientos',7:'setecientos',8:'ochocientos',9:'novecientos'}

def _cientos(n):
    if n == 0:
        return ''
    if n == 100:
        return 'cien'
    partes = []
    c, r = divmod(n, 100)
    if c:
        partes.append(_CEN[c])
    if r:
        if r < 30:
            partes.append(_UNI[r])
        else:
            d, u = divmod(r, 10)
            partes.append(_DEC[d * 10] + (' y ' + _UNI[u] if u else ''))
    return ' '.join(partes)

def _apocope(txt):
    if txt.endswith('veintiuno'):
        return txt[:-9] + 'veintiún'
    if txt.endswith(' uno'):
        return txt[:-4] + ' un'
    if txt == 'uno':
        return 'un'
    return txt

def num_palabras(n):
    n = int(n)
    if n == 0:
        return 'cero'
    partes = []
    millones, resto = divmod(n, 1_000_000)
    if millones:
        partes.append('un millón' if millones == 1
                      else _apocope(_cientos(millones)) + ' millones')
    miles, r = divmod(resto, 1000)
    if miles:
        partes.append('mil' if miles == 1 else _apocope(_cientos(miles)) + ' mil')
    if r:
        partes.append(_cientos(r))
    return ' '.join(partes)

ORDEN_DEC = {1: 'décimas', 2: 'centésimas', 3: 'milésimas', 4: 'diezmilésimas'}
ORDEN_DEC_S = {1: 'décima', 2: 'centésima', 3: 'milésima', 4: 'diezmilésima'}
POSICIONES = ['unidades', 'decenas', 'centenas', 'unidades de millar',
              'decenas de millar', 'centenas de millar', 'unidades de millón',
              'decenas de millón', 'centenas de millón']

def dec_palabras(ent, parte, nd):
    """ent enteros, 'parte' es el número formado por los nd dígitos decimales."""
    cola = f"{num_palabras(parte)} {ORDEN_DEC[nd]}"
    if ent == 0:
        return cola
    pal_ent = ('un entero' if ent == 1
               else _apocope(num_palabras(ent)) + ' enteros')
    return f"{pal_ent} {cola}"

# --------------------------------------------------------------- opciones
def _norm(s):
    return " ".join(str(s).split()).replace(NBSP, " ")

_RE_FRAC = __import__("re").compile(r"^\s*(\d+)\s*/\s*(\d+)\s*$")
_RE_ENT = __import__("re").compile(r"^\s*\d+\s*$")
_RE_DEC = __import__("re").compile(r"^\s*\d+,\d+\s*$")

def _valor(s):
    """Valor numérico de una opción, si la opción es un número puro."""
    s = str(s).replace(NBSP, "").strip()
    m = _RE_FRAC.match(s)
    if m and int(m.group(2)) != 0:
        return Fraction(int(m.group(1)), int(m.group(2)))
    if _RE_ENT.match(s):
        return Fraction(int(s))
    if _RE_DEC.match(s):
        ent, dec = s.split(",")
        return Fraction(int(ent + dec), 10 ** len(dec))
    return None

def armar(correcta, candidatos):
    """Devuelve (opciones_barajadas, indice_correcta) con 4 opciones distintas."""
    correcta = str(correcta)
    vistos = {_norm(correcta)}
    val_ok = _valor(correcta)
    dist = []
    for c in candidatos:
        c = str(c)
        if _norm(c) in vistos:
            continue
        # un distractor nunca puede valer lo mismo que la respuesta correcta
        if val_ok is not None and _valor(c) == val_ok:
            continue
        vistos.add(_norm(c))
        dist.append(c)
        if len(dist) == 3:
            break
    if len(dist) != 3:
        raise ValueError(f"Distractores insuficientes para {correcta!r}: {candidatos!r}")
    ops = [correcta] + dist
    rng.shuffle(ops)
    return ops, ops.index(correcta)

def frac_no_entera(nmax, dmax):
    """Fracción cuyo denominador nunca queda en 1 al simplificar."""
    while True:
        fr = Fraction(rng.randrange(1, nmax), rng.randrange(2, dmax))
        if fr.denominator > 1:
            return fr


def cerca_frac(fr):
    """Fracciones vecinas para usar como distractores de respaldo."""
    fr = Fraction(fr)
    n, d = fr.numerator, fr.denominator
    out = []
    for dn, dd in ((1, 0), (-1, 0), (0, 1), (0, -1), (2, 0), (0, 2), (1, 1), (-1, 1),
                   (3, 0), (0, 3), (2, 1), (1, 2)):
        nn, ndd = n + dn, d + dd
        if nn > 0 and ndd > 1 and Fraction(nn, ndd) != fr:
            out.append(f"{nn}/{ndd}")
    return out


def vecinos(n, cantidad, minimo=None, mismo_largo=False):
    """Números distintos parecidos a n, cambiando un dígito."""
    s = str(n)
    fuera = {n}
    out = []
    for _ in range(600):
        if len(out) >= cantidad:
            break
        i = rng.randrange(len(s))
        d = str(rng.randrange(10))
        if d == s[i] or (i == 0 and d == "0"):
            continue
        t = list(s); t[i] = d
        v = int("".join(t))
        if v in fuera:
            continue
        if minimo is not None and v < minimo:
            continue
        if mismo_largo and len(str(v)) != len(s):
            continue
        fuera.add(v)
        out.append(v)
    i = 1
    while len(out) < cantidad:      # respaldo determinista
        for v in (n + i, n - i):
            if v > 0 and v not in fuera and (minimo is None or v >= minimo) \
                    and (not mismo_largo or len(str(v)) == len(s)):
                fuera.add(v); out.append(v)
        i += 1
    return out[:cantidad]


BANCO = []

def add(bloque, afirmacion, habilidad, pregunta, correcta, candidatos, explicacion):
    try:
        ops, idx = armar(correcta, candidatos)
    except ValueError as exc:
        raise ValueError(f"{habilidad} — «{pregunta}» → {exc}") from None
    BANCO.append({
        "bloque": bloque,
        "afirmacion": afirmacion,
        "habilidad": habilidad,
        "pregunta": pregunta,
        "opciones": ops,
        "correcta": idx,
        "explicacion": explicacion,
    })

def muestra(poblacion, k):
    p = list(poblacion)
    return rng.sample(p, min(k, len(p)))
