# -*- coding: utf-8 -*-
"""Bloque Geometría, afirmación 1 (45 ítems)."""
from gen_base import *

B = "Geometría"
A1 = "1. Reconoce figuras geométricas planas, sus elementos o propiedades."

ITEMS = [
    # ---------------------------------------------------- elementos del triángulo
    ("Elementos del triángulo",
     "¿Cómo se llama el punto en el que se unen dos lados de un triángulo?",
     "Vértice", ["Base", "Altura", "Diagonal"],
     "El vértice es el punto de encuentro de dos lados. Un triángulo tiene tres vértices."),
    ("Elementos del triángulo",
     "En un triángulo, ¿cómo se llama el segmento perpendicular trazado desde un "
     "vértice hasta el lado opuesto (o su prolongación)?",
     "Altura", ["Base", "Cuerda", "Radio"],
     "La altura es el segmento perpendicular que va de un vértice al lado opuesto; "
     "ese lado se llama base."),
    ("Elementos del triángulo",
     "En un triángulo, el lado sobre el cual se traza una altura recibe el nombre de:",
     "Base", ["Vértice", "Diagonal", "Ángulo central"],
     "Cada altura se traza sobre un lado llamado base; por eso un triángulo tiene "
     "tres pares base-altura."),
    ("Elementos del triángulo",
     "¿Cuántas alturas se pueden trazar en un triángulo?",
     "3", ["1", "2", "4"],
     "Se puede trazar una altura desde cada uno de los tres vértices, así que "
     "un triángulo tiene tres alturas."),
    ("Elementos del triángulo",
     "¿Cuántos lados y cuántos vértices tiene un triángulo?",
     "3 lados y 3 vértices", ["3 lados y 2 vértices", "4 lados y 4 vértices",
                              "3 lados y 4 vértices"],
     "El triángulo es un polígono de tres lados, y en cada unión de dos lados hay "
     "un vértice: tres en total."),
    ("Elementos del triángulo",
     "¿Cuántos ángulos internos tiene un triángulo?",
     "3", ["2", "4", "6"],
     "En cada vértice del triángulo se forma un ángulo interno, por lo que hay tres."),
    ("Propiedades del triángulo",
     "¿Cuánto suman las medidas de los ángulos internos de cualquier triángulo?",
     "180°", ["90°", "270°", "360°"],
     "La suma de los ángulos internos de todo triángulo es siempre 180°."),
    ("Propiedades del triángulo",
     "En un triángulo, dos de sus ángulos internos miden 50° y 60°. "
     "¿Cuánto mide el tercer ángulo?",
     "70°", ["80°", "110°", "70,5°"],
     "Como los ángulos suman 180°: 180° − (50° + 60°) = 180° − 110° = 70°."),
    ("Propiedades del triángulo",
     "En un triángulo rectángulo, uno de los ángulos agudos mide 35°. "
     "¿Cuánto mide el otro ángulo agudo?",
     "55°", ["45°", "65°", "145°"],
     "El ángulo recto mide 90°, así que 180° − 90° − 35° = 55°."),
    ("Clasificación de triángulos",
     "¿Cómo se llama el triángulo que tiene sus tres lados de igual medida?",
     "Equilátero", ["Isósceles", "Escaleno", "Rectángulo"],
     "Equilátero significa «lados iguales»: sus tres lados miden lo mismo y sus "
     "tres ángulos miden 60°."),
    ("Clasificación de triángulos",
     "¿Cómo se llama el triángulo que tiene exactamente dos lados de igual medida?",
     "Isósceles", ["Equilátero", "Escaleno", "Obtusángulo"],
     "El triángulo isósceles tiene dos lados congruentes y, por lo tanto, dos "
     "ángulos de igual medida."),
    ("Clasificación de triángulos",
     "¿Cómo se llama el triángulo cuyos tres lados tienen medidas diferentes?",
     "Escaleno", ["Equilátero", "Isósceles", "Acutángulo"],
     "En el triángulo escaleno los tres lados —y también los tres ángulos— tienen "
     "medidas distintas."),
    ("Clasificación de triángulos",
     "Un triángulo que tiene un ángulo interno de 90° se clasifica como:",
     "Rectángulo", ["Acutángulo", "Obtusángulo", "Equilátero"],
     "El triángulo rectángulo se caracteriza por tener un ángulo recto (90°)."),
    ("Clasificación de triángulos",
     "Un triángulo cuyos tres ángulos internos miden menos de 90° se clasifica como:",
     "Acutángulo", ["Rectángulo", "Obtusángulo", "Escaleno"],
     "Si los tres ángulos son agudos (menores que 90°), el triángulo es acutángulo."),
    # ------------------------------------------------------------ cuadriláteros
    ("Elementos del cuadrilátero",
     "¿Cuántos lados, vértices y ángulos internos tiene un cuadrilátero?",
     "4 lados, 4 vértices y 4 ángulos", ["4 lados, 3 vértices y 4 ángulos",
                                         "3 lados, 3 vértices y 3 ángulos",
                                         "4 lados, 4 vértices y 2 ángulos"],
     "Todo cuadrilátero tiene cuatro lados; en cada unión de dos lados hay un "
     "vértice y un ángulo interno."),
    ("Elementos del cuadrilátero",
     "En un cuadrilátero, ¿cómo se llama el segmento que une dos vértices no "
     "consecutivos?",
     "Diagonal", ["Altura", "Base", "Radio"],
     "La diagonal une dos vértices que no son consecutivos, es decir, que no "
     "pertenecen al mismo lado."),
    ("Elementos del cuadrilátero",
     "¿Cuántas diagonales se pueden trazar en un cuadrilátero?",
     "2", ["1", "3", "4"],
     "Desde cada vértice sale una sola diagonal y cada una se cuenta una vez, "
     "de modo que un cuadrilátero tiene dos diagonales."),
    ("Propiedades de cuadriláteros",
     "¿Cuánto suman las medidas de los ángulos internos de un cuadrilátero?",
     "360°", ["180°", "270°", "540°"],
     "Un cuadrilátero se puede dividir en dos triángulos mediante una diagonal, "
     "y 2 × 180° = 360°."),
    ("Propiedades de cuadriláteros",
     "¿Cuál cuadrilátero tiene sus cuatro lados de igual medida y sus cuatro "
     "ángulos rectos?",
     "El cuadrado", ["El rectángulo", "El rombo", "El trapecio"],
     "El cuadrado reúne ambas condiciones: lados congruentes y ángulos de 90°."),
    ("Propiedades de cuadriláteros",
     "¿Cuál cuadrilátero tiene los lados opuestos de igual medida y sus cuatro "
     "ángulos rectos, pero no necesariamente los cuatro lados iguales?",
     "El rectángulo", ["El rombo", "El trapecio", "El romboide"],
     "En el rectángulo los lados opuestos son congruentes y los cuatro ángulos "
     "miden 90°."),
    ("Propiedades de cuadriláteros",
     "¿Cuál cuadrilátero tiene sus cuatro lados de igual medida y sus diagonales "
     "perpendiculares, pero sus ángulos no son rectos?",
     "El rombo", ["El cuadrado", "El rectángulo", "El trapecio"],
     "El rombo tiene los cuatro lados congruentes y sus diagonales se cortan "
     "perpendicularmente; sus ángulos son dos agudos y dos obtusos."),
    ("Propiedades de cuadriláteros",
     "¿Cuál cuadrilátero tiene únicamente un par de lados paralelos?",
     "El trapecio", ["El cuadrado", "El rombo", "El romboide"],
     "El trapecio se define por tener solo un par de lados paralelos, llamados bases."),
    ("Propiedades de cuadriláteros",
     "En un paralelogramo, los lados opuestos son:",
     "Paralelos y de igual medida", ["Perpendiculares entre sí",
                                     "De distinta medida",
                                     "Siempre perpendiculares y desiguales"],
     "Por definición, en un paralelogramo los lados opuestos son paralelos y "
     "además resultan congruentes."),
    ("Propiedades de cuadriláteros",
     "En un paralelogramo, los ángulos opuestos:",
     "Tienen la misma medida", ["Suman 90°", "Siempre miden 90°",
                                "Siempre son agudos"],
     "En todo paralelogramo los ángulos opuestos son congruentes y los "
     "consecutivos suman 180°."),
    ("Propiedades de cuadriláteros",
     "Con respecto a las diagonales de un rectángulo, es correcto afirmar que:",
     "Tienen la misma medida", ["Son perpendiculares entre sí",
                                "Miden lo mismo que un lado",
                                "No se cortan"],
     "Las diagonales de un rectángulo son congruentes y se cortan en su punto medio, "
     "aunque no son perpendiculares."),
    ("Propiedades de cuadriláteros",
     "¿En cuál cuadrilátero las diagonales son a la vez congruentes y "
     "perpendiculares?",
     "En el cuadrado", ["En el rombo", "En el rectángulo", "En el trapecio"],
     "El cuadrado es rombo y rectángulo a la vez, por eso sus diagonales miden lo "
     "mismo y se cortan formando ángulos rectos."),
    ("Propiedades de cuadriláteros",
     "Las diagonales de un rombo se cortan formando ángulos de:",
     "90°", ["45°", "60°", "180°"],
     "En el rombo las diagonales son perpendiculares, es decir, forman ángulos "
     "rectos de 90°."),
    ("Propiedades de cuadriláteros",
     "En un cuadrilátero, tres de sus ángulos internos miden 80°, 100° y 95°. "
     "¿Cuánto mide el cuarto ángulo?",
     "85°", ["75°", "95°", "105°"],
     "Los ángulos internos suman 360°: 360° − (80° + 100° + 95°) = 360° − 275° = 85°."),
    ("Propiedades de cuadriláteros",
     "¿Cuál de las siguientes afirmaciones es VERDADERA?",
     "Todo cuadrado es un rectángulo", ["Todo rectángulo es un cuadrado",
                                        "Todo trapecio es un paralelogramo",
                                        "Todo rombo tiene ángulos rectos"],
     "El cuadrado cumple la definición de rectángulo (cuatro ángulos rectos), pero "
     "no todo rectángulo tiene los cuatro lados iguales."),
    # ---------------------------------------------------------------- polígonos
    ("Polígonos regulares e irregulares",
     "¿Cómo se llama el polígono que tiene todos sus lados y todos sus ángulos de "
     "igual medida?",
     "Polígono regular", ["Polígono irregular", "Polígono cóncavo",
                          "Polígono abierto"],
     "Un polígono es regular cuando es equilátero (lados iguales) y equiángulo "
     "(ángulos iguales)."),
    ("Polígonos regulares e irregulares",
     "¿Cuál de las siguientes figuras es un polígono regular?",
     "Un hexágono con sus seis lados y seis ángulos iguales",
     ["Un rectángulo cuyos lados miden 8 cm y 3 cm",
      "Un triángulo de lados 3 cm, 4 cm y 5 cm",
      "Un trapecio con un par de lados paralelos"],
     "Solo el hexágono descrito tiene todos sus lados y todos sus ángulos "
     "congruentes; las demás figuras son polígonos irregulares."),
    ("Polígonos regulares e irregulares",
     "Un polígono de 5 lados se llama:",
     "Pentágono", ["Hexágono", "Octágono", "Cuadrilátero"],
     "El prefijo «penta» significa cinco: el pentágono tiene 5 lados y 5 vértices."),
    ("Polígonos regulares e irregulares",
     "Un polígono de 6 lados se llama:",
     "Hexágono", ["Pentágono", "Heptágono", "Octágono"],
     "«Hexa» significa seis, por lo que el hexágono tiene 6 lados y 6 vértices."),
    ("Polígonos regulares e irregulares",
     "¿Cuántos vértices tiene un octágono?",
     "8", ["6", "7", "10"],
     "El octágono tiene 8 lados y, por lo tanto, 8 vértices."),
    ("Polígonos regulares e irregulares",
     "¿Cuál de las siguientes figuras NO es un polígono?",
     "La circunferencia", ["El pentágono", "El triángulo", "El trapecio"],
     "Los polígonos están formados por segmentos rectos; la circunferencia es una "
     "línea curva cerrada, así que no es un polígono."),
    # -------------------------------------- figuras simples dentro de una compleja
    ("Figuras simples dentro de una figura compleja",
     "Si a un cuadrado se le traza una de sus diagonales, ¿en cuáles figuras queda "
     "dividido?",
     "En 2 triángulos", ["En 2 rectángulos", "En 4 triángulos", "En 3 triángulos"],
     "La diagonal separa el cuadrado en dos triángulos rectángulos congruentes."),
    ("Figuras simples dentro de una figura compleja",
     "Si a un rectángulo se le trazan sus dos diagonales, ¿cuántos triángulos se "
     "forman en su interior (sin superponerlos)?",
     "4", ["2", "6", "8"],
     "Las dos diagonales se cortan en el centro y determinan cuatro triángulos que "
     "no se superponen."),
    ("Figuras simples dentro de una figura compleja",
     "Un dibujo de una casita está formado por un cuadrado y, sobre él, un techo. "
     "Si el techo es una figura de tres lados, ¿por cuáles figuras simples está "
     "formada la casita?",
     "Un cuadrado y un triángulo", ["Dos triángulos", "Un rectángulo y un trapecio",
                                    "Un cuadrado y un rombo"],
     "El cuerpo es un cuadrado (4 lados) y el techo, al tener tres lados, es un "
     "triángulo."),
    ("Figuras simples dentro de una figura compleja",
     "Si en un hexágono regular se trazan segmentos desde el centro hasta cada "
     "vértice, ¿cuántos triángulos se forman?",
     "6", ["3", "4", "8"],
     "Se obtiene un triángulo por cada lado del hexágono, es decir, 6 triángulos "
     "iguales."),
    ("Figuras simples dentro de una figura compleja",
     "Si a un cuadrado se le traza un segmento paralelo a uno de sus lados, que va "
     "de un lado al lado opuesto, ¿en cuáles figuras queda dividido?",
     "En 2 rectángulos", ["En 2 triángulos", "En 2 rombos", "En 4 cuadrados"],
     "El segmento paralelo produce dos figuras de cuatro ángulos rectos con lados "
     "opuestos iguales, es decir, dos rectángulos."),
    # ------------------------------------------------------------ circunferencia
    ("Elementos de la circunferencia",
     "¿Cómo se llama el segmento que une el centro de una circunferencia con "
     "cualquier punto de ella?",
     "Radio", ["Diámetro", "Cuerda", "Arco"],
     "El radio va del centro a un punto de la circunferencia; todos los radios de "
     "una misma circunferencia miden lo mismo."),
    ("Elementos de la circunferencia",
     "¿Cómo se llama la cuerda que pasa por el centro de la circunferencia?",
     "Diámetro", ["Radio", "Ángulo central", "Cuadrante"],
     "El diámetro es la cuerda que contiene al centro y equivale a dos radios."),
    ("Elementos de la circunferencia",
     "¿Cómo se llama el segmento que une dos puntos cualesquiera de una "
     "circunferencia?",
     "Cuerda", ["Radio", "Centro", "Cuadrante"],
     "Toda cuerda une dos puntos de la circunferencia; si además pasa por el "
     "centro, se llama diámetro."),
    ("Elementos de la circunferencia",
     "En una circunferencia, la cuerda de mayor longitud es:",
     "El diámetro", ["El radio", "El arco", "El ángulo central"],
     "Ninguna cuerda puede ser más larga que la que pasa por el centro; por eso el "
     "diámetro es la cuerda máxima."),
    ("Elementos de la circunferencia",
     "El diámetro de una circunferencia mide:",
     "El doble del radio", ["La mitad del radio", "Lo mismo que el radio",
                            "El triple del radio"],
     "El diámetro está formado por dos radios alineados: d = 2 × r."),
    ("Elementos de la circunferencia",
     "Si el radio de una circunferencia mide 7 cm, ¿cuánto mide su diámetro?",
     "14 cm", ["3,5 cm", "7 cm", "21 cm"],
     "El diámetro es el doble del radio: 2 × 7 cm = 14 cm."),
    ("Elementos de la circunferencia",
     "Si el diámetro de una circunferencia mide 18 cm, ¿cuánto mide su radio?",
     "9 cm", ["36 cm", "18 cm", "6 cm"],
     "El radio es la mitad del diámetro: 18 cm ÷ 2 = 9 cm."),
    ("Elementos de la circunferencia",
     "¿Cómo se llama el ángulo cuyo vértice está en el centro de la circunferencia "
     "y cuyos lados son dos radios?",
     "Ángulo central", ["Ángulo recto", "Cuadrante", "Ángulo inscrito"],
     "El ángulo central tiene su vértice en el centro y sus lados son radios de la "
     "circunferencia."),
    ("Elementos de la circunferencia",
     "¿Cómo se llama cada una de las cuatro partes iguales en que dos diámetros "
     "perpendiculares dividen a una circunferencia?",
     "Cuadrante", ["Cuerda", "Radio", "Sector recto"],
     "Cada una de esas cuatro partes iguales se llama cuadrante y corresponde a un "
     "ángulo central de 90°."),
    ("Elementos de la circunferencia",
     "¿Cuántos grados mide el ángulo central correspondiente a un cuadrante?",
     "90°", ["45°", "180°", "360°"],
     "La circunferencia completa mide 360° y un cuadrante es su cuarta parte: "
     "360° ÷ 4 = 90°."),
    ("Elementos de la circunferencia",
     "¿Cuántos grados mide una circunferencia completa?",
     "360°", ["180°", "90°", "270°"],
     "Una vuelta completa corresponde a un ángulo de 360°."),
    ("Elementos de la circunferencia",
     "El punto que está a la misma distancia de todos los puntos de una "
     "circunferencia se llama:",
     "Centro", ["Vértice", "Radio", "Diámetro"],
     "El centro equidista de todos los puntos de la circunferencia; esa distancia "
     "común es el radio."),
    ("Identificación de circunferencias en el entorno",
     "¿Cuál de los siguientes objetos del entorno tiene forma de circunferencia?",
     "El borde de un aro de baloncesto", ["El borde de una hoja de cuaderno",
                                          "La cara de un dado",
                                          "La superficie de una puerta"],
     "El aro es una línea curva cerrada cuyos puntos están todos a la misma "
     "distancia del centro; los otros objetos tienen bordes rectos."),
]

def construir():
    for habilidad, preg, cor, dist, expl in ITEMS:
        add(B, A1, habilidad, preg, cor, dist, expl)
