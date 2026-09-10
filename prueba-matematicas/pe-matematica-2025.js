/* Prueba Nacional Estandarizada Sumativa 2025 (D01) — Matemática, primaria.
   Transcripción de los 35 ítems del documento de la Dirección de Gestión y
   Evaluación de la Calidad (DGEC), Ministerio de Educación Pública.

   Las respuestas correctas NO vienen en el documento original: se determinaron
   resolviendo cada ítem y se verificaron contra el PDF publicado. Conviene
   contrastarlas con la clave oficial del MEP. */

const PE_MATEMATICA_2025 = {
  id: "pe-matematica-2025",
  nombre: "Prueba Nacional Estandarizada 2025 — Matemática",
  descripcion: "Los 35 ítems de la prueba ordinaria de primaria (D01), tal como " +
               "fueron aplicados. Tres opciones por ítem.",
  fuente: "Dirección de Gestión y Evaluación de la Calidad, MEP. Primaria-2025.",
  letras: ["A", "B", "C"],
  preguntas: [
    {
      n: 1,
      habilidad: "Representación literal de decimales",
      pregunta: "La siguiente tabla muestra la cantidad de lluvia acumulada, en milímetros, que se registró, durante un día, en cada una de tres regiones de Costa Rica:",
      tabla: [["Región", "Cantidad de lluvia (en milímetros)"],
              ["Valle Central", "29,7"], ["Huetar Norte", "29,07"], ["Pacífico Norte", "29,007"]],
      cierre: "De acuerdo con la información anterior, ¿cuál región muestra una cantidad de lluvia acumulada, en milímetros, cuya representación literal es veintinueve unidades con siete milésimas?",
      opciones: ["Valle Central", "Huetar Norte", "Pacífico Norte"],
      correcta: 2,
      explicacion: "Siete milésimas se escriben en la tercera cifra decimal: 29,007. Ese valor corresponde al Pacífico Norte. En 29,7 el 7 ocupa las décimas y en 29,07 las centésimas."
    },
    {
      n: 2,
      habilidad: "Comparación de decimales",
      pregunta: "En una competencia de natación se otorga una medalla de oro a la persona que obtenga el menor tiempo. La siguiente tabla muestra el tiempo, en segundos, que obtuvo cada una de las tres personas que participaron en esa competencia:",
      tabla: [["Persona", "Tiempo en segundos"],
              ["Ana", "35,15"], ["Silvia", "35,05"], ["Margarita", "35,5"]],
      cierre: "De acuerdo con la información anterior, ¿a cuál persona se le otorgó la medalla de oro?",
      opciones: ["Ana", "Silvia", "Margarita"],
      correcta: 1,
      explicacion: "Con la misma parte entera se comparan las décimas: 35,05 tiene 0 décimas, 35,15 tiene 1 y 35,5 tiene 5. El menor tiempo es 35,05, de Silvia."
    },
    {
      n: 3,
      habilidad: "Notación desarrollada",
      pregunta: "Costa Rica es uno de los países con mayor diversidad de especies de animales marinos en el mundo. En un año determinado se reportaron 4745 de esas especies de animales.",
      cierre: "De acuerdo con la información anterior, la notación desarrollada del número de especies de animales que se reportaron en ese año corresponde a",
      opciones: ["4 + 7 × 10¹ + 4 × 10² + 5 × 10³",
                 "4 × 10³ + 7 × 10² + 4 × 10¹ + 5",
                 "4 × 10⁴ + 7 × 10³ + 4 × 10² + 5 × 10¹"],
      correcta: 1,
      explicacion: "4745 = 4000 + 700 + 40 + 5 = 4 × 10³ + 7 × 10² + 4 × 10¹ + 5. La opción A invierte el orden de las potencias y la C multiplica todo por diez."
    },
    {
      n: 4,
      habilidad: "Múltiplos y divisibilidad",
      pregunta: "La siguiente tabla muestra la cantidad de vehículos que pasaron por un peaje, durante cada uno de tres días:",
      tabla: [["Día", "Cantidad de vehículos"],
              ["Lunes", "2344"], ["Martes", "1535"], ["Miércoles", "4722"]],
      cierre: "De acuerdo con la información anterior, ¿en cuál día la cantidad de vehículos que pasaron por el peaje corresponde a un número múltiplo de seis?",
      opciones: ["Lunes", "Martes", "Miércoles"],
      correcta: 2,
      explicacion: "Un múltiplo de 6 debe ser divisible entre 2 y entre 3. En 4722: termina en cifra par y sus cifras suman 4+7+2+2 = 15, múltiplo de 3. En 2344 la suma es 13, y 1535 es impar."
    },
    {
      n: 5,
      habilidad: "Números pares e impares",
      pregunta: "La siguiente tabla muestra la cantidad de estudiantes que tiene cada grupo de música en una escuela:",
      tabla: [["Grupo de música", "Cantidad de estudiantes"],
              ["Piano", "35"], ["Guitarra", "34"], ["Trompeta", "31"]],
      lista: ["Cada subgrupo tiene la misma cantidad de estudiantes.",
              "Cada estudiante queda ubicado en solo uno de los subgrupos."],
      listaIntro: "Además, el director de la escuela requiere elegir uno de esos grupos para formar, con la cantidad de estudiantes del grupo elegido, dos subgrupos que cumplan con las siguientes condiciones:",
      cierre: "De acuerdo con la información anterior, ¿cuál grupo cumple con las condiciones establecidas por el director de la escuela?",
      opciones: ["Piano", "Guitarra", "Trompeta"],
      correcta: 1,
      explicacion: "Para repartir a todos en dos subgrupos iguales, la cantidad debe ser par. De 35, 34 y 31, solo 34 es par: 34 ÷ 2 = 17 estudiantes por subgrupo."
    },
    {
      n: 6,
      habilidad: "Suma de decimales",
      pregunta: "Para una carrera de atletismo, María José entrenó dos días por semana. En la siguiente tabla se muestra la cantidad de kilómetros que recorrió María José, por día, en una semana de entrenamiento:",
      tabla: [["Día", "Cantidad de kilómetros"], ["Martes", "6,5"], ["Jueves", "5,6"]],
      cierre: "De acuerdo con la información anterior, ¿cuántos kilómetros en total recorrió María José, en esa semana, como parte del entrenamiento?",
      opciones: ["0,9", "11,1", "12,1"],
      correcta: 2,
      explicacion: "Se suman los dos días: 6,5 + 5,6 = 12,1 kilómetros. La opción A corresponde a la resta y la B olvida llevar una unidad."
    },
    {
      n: 7,
      habilidad: "Planteamiento de operaciones combinadas",
      pregunta: "Francisco fue a la feria de su comunidad y compró 10 naranjas y 12 guayabas. El precio de cada naranja era ₡120 y el de cada guayaba ₡280.",
      cierre: "De acuerdo con la información anterior, ¿cuál de los siguientes procedimientos permite conocer el monto total que pagó Francisco por esa compra?",
      opciones: ["10 × (120 + 12) × 280", "(10 + 12) × (120 + 280)", "(10 × 120) + (12 × 280)"],
      correcta: 2,
      explicacion: "Se calcula por separado lo pagado por cada fruta y luego se suma: 10 × 120 = 1200 por las naranjas y 12 × 280 = 3360 por las guayabas."
    },
    {
      n: 8,
      habilidad: "Fracción de una cantidad",
      pregunta: "Durante una campaña de reforestación, se plantaron 48 árboles en una zona protegida. De esos árboles, se espera que sobreviva 3/4 del total durante la estación seca.",
      cierre: "De acuerdo con la información anterior, ¿cuántos árboles se espera que sobrevivan durante la estación seca?",
      opciones: ["12", "36", "64"],
      correcta: 1,
      explicacion: "48 ÷ 4 = 12 es la cuarta parte, y 12 × 3 = 36. La opción A es solo 1/4 del total y la C resulta de dividir entre 3 y multiplicar por 4."
    },
    {
      n: 9,
      habilidad: "Notación mixta",
      pregunta: "Para un proyecto de costura Mariana compró una tela cuya medida es 22/7 m. Para facilitar la medición al realizar el proyecto, ella decide escribir esa cantidad de tela en notación mixta.",
      cierre: "De acuerdo con la información anterior, ¿cuál es la notación mixta, de la fracción correspondiente a la medida de la tela que compró Mariana?",
      opciones: ["3 1/7 m", "7 1/3 m", "1 3/7 m"],
      correcta: 0,
      explicacion: "22 ÷ 7 = 3 con residuo 1, así que 22/7 = 3 + 1/7 = 3 1/7. El cociente va como entero y el residuo como numerador, sobre el mismo denominador."
    },
    {
      n: 10,
      habilidad: "Fracciones como parte de un todo",
      pregunta: "Durante una caminata en un parque nacional, un grupo de estudiantes recorrió un sendero que estaba dividido en ocho tramos de igual longitud. Al completar el quinto tramo de ese sendero observaron un letrero. Posteriormente, al completar el segundo tramo, después del letrero, observaron un baño.",
      cierre: "De acuerdo con la información anterior, ¿qué fracción de la longitud total del sendero había completado ese grupo cuando observaron el baño?",
      opciones: ["1/8", "2/8", "7/8"],
      correcta: 2,
      explicacion: "El letrero está al terminar el tramo 5 y el baño dos tramos después, o sea al terminar el tramo 7. De los 8 tramos llevaban 7 recorridos: 7/8."
    },
    {
      n: 11,
      habilidad: "De decimal a fracción",
      pregunta: "Durante una clase de ciencias, Karina midió el volumen de agua que tenía un recipiente y obtuvo como resultado 0,75 L. Luego, la maestra le pidió que representara esa cantidad como una fracción.",
      cierre: "De acuerdo con la información anterior, ¿cuál opción corresponde a la fracción que representa el volumen de agua que tenía el recipiente?",
      opciones: ["1/4 L", "3/4 L", "4/3 L"],
      correcta: 1,
      explicacion: "0,75 = 75/100, y al simplificar entre 25 se obtiene 3/4. La opción A corresponde a 0,25 y la C es mayor que 1."
    },
    {
      n: 12,
      habilidad: "Perímetro y lados de un trapecio",
      pregunta: "La siguiente figura muestra un trapecio que representa el parque de una ciudad. Además, se muestra la ubicación de la escuela (E), el banco (B), la tienda (T) y el restaurante (R):",
      figura: "figuras/item12.jpg",
      figuraAlt: "Trapecio con vértices B y T arriba, E y R abajo. Los lados BE y TR miden 150 m cada uno.",
      lista: ["Javier recorrió la distancia del banco a la escuela y luego de la escuela al restaurante.",
              "Marcos recorrió la distancia de la tienda al banco y luego del banco a la escuela.",
              "Gilberto recorrió la distancia del restaurante a la tienda y luego de la tienda al banco."],
      listaIntro: "Asimismo, Javier, Marcos y Gilberto recorrieron distancias por el borde del parque, de la siguiente forma:",
      cierre: "De acuerdo con la información anterior, ¿quién recorrió la mayor distancia?",
      opciones: ["Javier", "Marcos", "Gilberto"],
      correcta: 0,
      explicacion: "Javier recorre BE + ER = 150 m + ER. Marcos recorre TB + BE = TB + 150 m y Gilberto recorre RT + TB = 150 m + TB, o sea lo mismo que Marcos. Como ER es la base mayor del trapecio, es más larga que TB y gana Javier."
    },
    {
      n: 13,
      habilidad: "Polígonos regulares",
      pregunta: "La siguiente tabla muestra tres figuras geométricas. Cada una de ellas representa la forma que tiene un parque. Además, estas figuras se identifican con I, II y III:",
      figura: "figuras/item13.jpg",
      figuraAlt: "I: pentágono irregular con lados de 3 cm y 2,8 cm. II: rectángulo de 2,5 cm por 4 cm. III: cuadrado de 4 cm por 4 cm con los cuatro ángulos rectos marcados.",
      cierre: "De acuerdo con la información anterior, ¿cuál figura corresponde a un polígono regular?",
      opciones: ["I", "II", "III"],
      correcta: 2,
      explicacion: "Un polígono regular tiene todos los lados y todos los ángulos iguales. El cuadrado III cumple ambas condiciones. El pentágono I tiene lados desiguales y el rectángulo II, aunque tiene los ángulos rectos, tiene lados de distinta medida."
    },
    {
      n: 14,
      habilidad: "Clasificación de triángulos",
      pregunta: "La siguiente tabla muestra tres triángulos y cada uno de ellos representa la forma que tiene la superficie de un terreno. Además, estos triángulos se identifican con I, II y III:",
      figura: "figuras/item14.jpg",
      figuraAlt: "I: triángulo de 30 m, 40 m y 50 m. II: triángulo de 40 m, 40 m y 40 m. III: triángulo de 60 m, 50 m y 50 m.",
      cierre: "De acuerdo con la información anterior, ¿cuál triángulo se clasifica como escaleno?",
      opciones: ["I", "II", "III"],
      correcta: 0,
      explicacion: "Escaleno significa que los tres lados tienen medidas distintas: el I mide 30 m, 40 m y 50 m. El II es equilátero (40, 40, 40) y el III es isósceles (60, 50, 50)."
    },
    {
      n: 15,
      habilidad: "Caras de un prisma",
      pregunta: "La siguiente figura corresponde a un prisma que representa una caja de plástico:",
      figura: "figuras/item15.jpg",
      figuraAlt: "Prisma recto cuyas bases son pentágonos.",
      cierre: "De acuerdo con la información anterior, ¿cuántas caras de ese prisma corresponden a rectángulos?",
      opciones: ["3", "5", "7"],
      correcta: 1,
      explicacion: "Las bases del prisma son pentágonos y no son rectángulos. Cada lado del pentágono genera una cara lateral rectangular, y como el pentágono tiene 5 lados, hay 5 caras rectangulares."
    },
    {
      n: 16,
      habilidad: "Área de cuadriláteros en cuadrícula",
      pregunta: "La siguiente imagen muestra dos cuadriláteros y cada uno de estos representa la superficie de un terreno. Además, estos cuadriláteros se identifican con las letras M y P. La medida del lado de cada cuadrado de la cuadrícula es 10 m.",
      figura: "figuras/item16.jpg",
      figuraAlt: "Sobre una cuadrícula, M es un paralelogramo y P es un rombo.",
      cierre: "De acuerdo con la información anterior, si se requiere colocar zacate a la totalidad de la superficie de cada uno de esos terrenos, entonces la cantidad de zacate, en metros cuadrados, que requiere M es",
      opciones: ["igual que la que requiere P.", "menor que la que requiere P.", "mayor que la que requiere P."],
      correcta: 2,
      explicacion: "M es un paralelogramo de base 3 cuadrículas (30 m) y altura 2 cuadrículas (20 m): 30 × 20 = 600 m². P es un rombo de diagonales 4 y 2 cuadrículas (40 m y 20 m): (40 × 20) ÷ 2 = 400 m². Por eso M requiere más zacate."
    },
    {
      n: 17,
      habilidad: "Longitud de la circunferencia",
      pregunta: "La superficie de una mesa de cemento tiene forma de círculo, cuyo radio mide 55 cm. Si se requiere colocar una cinta adhesiva sobre la totalidad del borde de esa superficie, entonces la menor longitud de esa cinta que se requiere colocar es aproximadamente igual a",
      opciones: ["110,0 cm.", "345,4 cm.", "9498,5 cm."],
      correcta: 1,
      explicacion: "El borde es la circunferencia: 2 × π × r = 2 × 3,14 × 55 ≈ 345,4 cm. La opción A es solo el diámetro y la C es el área del círculo."
    },
    {
      n: 18,
      habilidad: "Perímetro y área del cuadrado",
      pregunta: "La superficie de una mesa tiene forma de cuadrado, cuyo perímetro es 12 m. Si se requiere cubrir la totalidad de la superficie de la mesa con plástico adhesivo, entonces, ¿cuál es la cantidad de ese plástico que se requiere, como mínimo, para cubrir la superficie de la mesa?",
      opciones: ["12 m²", "9 m²", "6 m²"],
      correcta: 1,
      explicacion: "Si el perímetro es 12 m, cada lado mide 12 ÷ 4 = 3 m. El área es 3 × 3 = 9 m². La opción A repite el perímetro y la C corresponde a la mitad."
    },
    {
      n: 19,
      habilidad: "Simetría y puntos homólogos",
      pregunta: "La siguiente imagen muestra una figura simétrica que representa el dibujo de una casa. Además, se muestran ocho puntos de esa figura, los cuales se identifican con letras. La medida del lado de cada cuadrado de la cuadrícula es 1 cm.",
      figura: "figuras/item19.jpg",
      figuraAlt: "Dibujo de una casa sobre cuadrícula con los puntos M, N, E, F, P, G, H y D.",
      cierre: "De acuerdo con la información anterior, dos puntos que son homólogos entre sí, con respecto al eje de simetría de esa figura, se identifican con las letras",
      opciones: ["F y H.", "P y G.", "M y N."],
      correcta: 2,
      explicacion: "El eje de simetría es vertical y pasa por la cumbre del techo. M y N están a la misma altura y a la misma distancia del eje, uno a cada lado, así que son homólogos. F y H están del mismo lado y a distinta altura; P y G están a distancias diferentes del eje."
    },
    {
      n: 20,
      habilidad: "Traslaciones en el plano",
      pregunta: "El siguiente sistema de coordenadas muestra la ubicación actual de una alfombra en la sala de una casa. Además, se muestran tres esquinas de esa alfombra (identificadas con las letras F, G y H) y una marca en el piso de esa sala (identificada con la letra Z). La medida del lado de cada cuadrado de la cuadrícula es 40 cm.",
      figura: "figuras/item20.jpg",
      figuraAlt: "Cuadrícula con la marca Z arriba a la izquierda y la alfombra abajo a la derecha, con las esquinas F, G y H.",
      lista: ["La alfombra se traslada desde la ubicación actual hacia una nueva ubicación.",
              "La nueva ubicación de la alfombra corresponde a 120 cm al oeste y 160 cm al norte."],
      listaIntro: "Posteriormente:",
      cierre: "De acuerdo con la información anterior, ¿cuál esquina de la alfombra coincide con la marca del piso de la sala?",
      opciones: ["F", "G", "H"],
      correcta: 2,
      explicacion: "Cada cuadrícula mide 40 cm, así que 120 cm son 3 cuadrículas al oeste y 160 cm son 4 al norte. Al mover la esquina H tres lugares a la izquierda y cuatro hacia arriba, cae exactamente sobre Z; F quedaría una cuadrícula más arriba y G, además, una a la derecha."
    },
    {
      n: 21,
      habilidad: "Conversión de unidades de masa",
      pregunta: "Cada saco de arroz que hay en un almacén pesa 49,75 kg. ¿Cuál es el peso total, en decagramos, de cinco de esos sacos?",
      opciones: ["24 875", "2487,5", "2,4875"],
      correcta: 0,
      explicacion: "Primero el total: 49,75 × 5 = 248,75 kg. Un kilogramo son 100 decagramos, así que 248,75 × 100 = 24 875 dag."
    },
    {
      n: 22,
      habilidad: "Problemas con unidades de capacidad",
      pregunta: "Cuatro personas realizaron juntas una caminata por un sendero y con el fin de mantenerse hidratadas bebían agua durante la caminata. A partir del inicio de esa caminata, cada persona bebió 100 mL de agua cada 24 min. Además, esa caminata duró 130 min en total.",
      cierre: "De acuerdo con la información anterior, ¿cuál fue la cantidad total de agua que bebieron las cuatro personas al finalizar la caminata?",
      opciones: ["1,2 L", "2,0 L", "2,5 L"],
      correcta: 1,
      explicacion: "En 130 minutos se cumplen los 24 min en los minutos 24, 48, 72, 96 y 120: cinco veces. Cada persona bebe 5 × 100 = 500 mL, y entre las cuatro 2000 mL, es decir 2,0 L."
    },
    {
      n: 23,
      habilidad: "Conversión de unidades de capacidad",
      pregunta: "Javier compró un tanque para almacenar agua, cuya capacidad máxima es 2570 dL. ¿Cuál es la capacidad máxima, en litros, de ese tanque?",
      opciones: ["257", "2570", "25 700"],
      correcta: 0,
      explicacion: "Un litro tiene 10 decilitros, así que se divide entre 10: 2570 ÷ 10 = 257 L."
    },
    {
      n: 24,
      habilidad: "Problemas con dinero",
      pregunta: "Randall fue al banco para cambiar un billete de ₡10 000 en billetes de ₡2000 y monedas de ₡500. Si él recibió la misma cantidad de billetes que de monedas, entonces, ¿cuántas monedas de ₡500 recibió Randall?",
      opciones: ["4", "5", "10"],
      correcta: 0,
      explicacion: "Cada pareja de un billete y una moneda vale 2000 + 500 = 2500 colones. Como 10 000 ÷ 2500 = 4, recibió 4 billetes y 4 monedas."
    },
    {
      n: 25,
      habilidad: "Problemas con fracciones y dinero",
      pregunta: "Para preparar cierta cantidad de refresco natural, se requieren los siguientes ingredientes: 3/4 kg de sandía, 500 g de azúcar y 2 limones.",
      tabla: [["Ingrediente", "Precio"],
              ["Sandía", "₡600 por cada kilogramo"],
              ["Azúcar", "₡800 por cada kilogramo"],
              ["Limón", "₡100 la unidad"]],
      cierre: "De acuerdo con la información anterior, si para preparar esa cantidad de refresco se compraron los ingredientes en el supermercado, entonces, ¿cuál fue el monto total pagado por los ingredientes?",
      opciones: ["₡750", "₡1050", "₡1450"],
      correcta: 1,
      explicacion: "Sandía: 3/4 de 600 = 450. Azúcar: 500 g es medio kilo, la mitad de 800 = 400. Limones: 2 × 100 = 200. En total 450 + 400 + 200 = ₡1050."
    },
    {
      n: 26,
      habilidad: "Sucesiones",
      pregunta: "Durante una exposición de arte callejero, un grupo de personas colocó 20 figuras en una pared y cada figura estaba formada por uno o varios círculos. La siguiente tabla muestra la posición de las primeras cuatro figuras colocadas en esa pared:",
      figura: "figuras/item26.jpg",
      figuraAlt: "Posición 1: 1 círculo. Posición 2: 4 círculos. Posición 3: 7 círculos. Posición 4: 10 círculos.",
      cierre: "De acuerdo con la información anterior, si se mantuvo el patrón en la colocación de esas figuras, entonces, ¿cuántos círculos tenía la figura colocada en la posición 18?",
      opciones: ["49", "52", "55"],
      correcta: 1,
      explicacion: "Las figuras tienen 1, 4, 7 y 10 círculos: cada una agrega 3. La regla es 3n − 2, así que en la posición 18 hay 3 × 18 − 2 = 52 círculos."
    },
    {
      n: 27,
      habilidad: "Sucesiones",
      pregunta: "En una escuela, un grupo de estudiantes decoró, con trozos de cinta, pizarras rectangulares colocadas una junto a la otra y lograron formar una fila en la pared. La siguiente tabla muestra la cantidad de trozos de cinta utilizada, según la cantidad de pizarras que forman esa fila:",
      tabla: [["Cantidad de pizarras", "1", "2", "3", "4"],
              ["Cantidad de trozos de cinta", "4", "9", "16", "25"]],
      cierre: "De acuerdo con la información anterior, si se mantiene el patrón en la cantidad de trozos de cinta, según la cantidad de pizarras que forman la fila, entonces, ¿cuántos trozos de cinta se requieren si se forma una fila con cinco pizarras juntas?",
      opciones: ["25", "36", "49"],
      correcta: 1,
      explicacion: "Los valores son 2², 3², 4² y 5², es decir el cuadrado de la cantidad de pizarras más uno. Para 5 pizarras: (5 + 1)² = 36 trozos."
    },
    {
      n: 28,
      habilidad: "Cantidades constantes y variables",
      pregunta: "Juan conduce un taxi cuya ocupación máxima es de cinco pasajeros y diariamente él lo utiliza para realizar distinta cantidad de viajes. La rapidez del taxi en cada viaje varía entre 0 km/h y 80 km/h.",
      cierre: "De acuerdo con la información anterior, una cantidad constante corresponde a la",
      opciones: ["ocupación máxima del taxi.", "rapidez del taxi en cada viaje.",
                 "cantidad de viajes realizados en los distintos días."],
      correcta: 0,
      explicacion: "La ocupación máxima es siempre cinco pasajeros: no cambia. En cambio el texto dice que la rapidez varía y que la cantidad de viajes es distinta cada día."
    },
    {
      n: 29,
      habilidad: "Porcentajes y comparación de precios",
      pregunta: "En una feria del agricultor, se vende envases con piña picada y cada envase contiene la misma cantidad de piña. Además, estos envases se venden en cada uno de tres puestos identificados con las letras R, S y T:",
      lista: ["En R se vende cada envase en ₡950.",
              "En S se vende cada envase en ₡1000, pero se aplica un descuento del 10 % en el precio de cada envase que se compre.",
              "En T se vende cada envase en ₡1200, pero si se compran dos o más envases entonces se aplica un descuento del 20 % con respecto al precio total de la compra."],
      cierre: "De acuerdo con la información anterior, si Elena quiere comprar seis envases con piña picada, entonces, ¿en cuál puesto ella pagaría la menor cantidad de dinero por esa compra?",
      opciones: ["R", "S", "T"],
      correcta: 1,
      explicacion: "En R: 6 × 950 = ₡5700. En S cada envase queda en 1000 − 10 % = 900, así que 6 × 900 = ₡5400. En T: 6 × 1200 = 7200 y con el 20 % de descuento queda 7200 × 0,8 = ₡5760. El menor monto es el de S."
    },
    {
      n: 30,
      habilidad: "Proporcionalidad",
      pregunta: "En una actividad cultural, Fernando trabajó vendiendo entradas. Por cada 4 h de trabajo recibió un pago de ₡8800. Si se mantuvieron esas condiciones y al finalizar la actividad él recibió un pago total ₡35 200 por todo ese trabajo, entonces, ¿cuántas horas trabajó en total?",
      opciones: ["12", "16", "20"],
      correcta: 1,
      explicacion: "35 200 ÷ 8800 = 4, o sea que se repitió cuatro veces el bloque de 4 horas: 4 × 4 = 16 horas."
    },
    {
      n: 31,
      habilidad: "Ecuaciones sencillas",
      pregunta: "Una biblioteca tiene varios estantes y en cada estante hay igual cantidad de libros. En la siguiente expresión, cada ▲ representa la cantidad de libros que hay en cada estante: ▲ + ▲ + 18 = 60",
      cierre: "De acuerdo con la información anterior, ¿cuántos libros hay en cada estante de esa biblioteca?",
      opciones: ["18", "21", "42"],
      correcta: 1,
      explicacion: "Se restan 18 en ambos lados: ▲ + ▲ = 42. Como son dos triángulos iguales, cada uno vale 42 ÷ 2 = 21. La opción C es el valor de la suma, no el de cada estante."
    },
    {
      n: 32,
      habilidad: "Ecuaciones sencillas",
      pregunta: "Una caja contiene varias bolsas y cada una de estas bolsas contiene la misma cantidad de bolitas de plástico. En la siguiente ecuación, «c» representa la cantidad de bolitas que hay en cada bolsa: 48 ÷ c = 6",
      cierre: "De acuerdo con la información anterior, ¿cuántas bolitas hay en cada bolsa?",
      opciones: ["8", "42", "288"],
      correcta: 0,
      explicacion: "Si 48 ÷ c = 6, entonces c = 48 ÷ 6 = 8. La opción B corresponde a la resta 48 − 6 y la C a la multiplicación 48 × 6."
    },
    {
      n: 33,
      habilidad: "Recorrido de un conjunto de datos",
      pregunta: "La siguiente tabla muestra el tiempo, en minutos, que duraron en llegar desde su casa hasta la escuela cada una de seis personas estudiantes:",
      tabla: [["Persona estudiante", "Tiempo (en minutos)"],
              ["Ileana", "34"], ["Liseth", "80"], ["Gabriela", "55"],
              ["Joaquín", "76"], ["Rodolfo", "25"], ["Alejandro", "68"]],
      cierre: "De acuerdo con la información anterior, ¿cuál opción corresponde a la operación que permite calcular la mayor diferencia, en minutos, de esos tiempos?",
      opciones: ["68 − 34", "76 − 55", "80 − 25"],
      correcta: 2,
      explicacion: "La mayor diferencia se obtiene restando el menor tiempo al mayor: el máximo es 80 (Liseth) y el mínimo 25 (Rodolfo), así que la operación es 80 − 25."
    },
    {
      n: 34,
      habilidad: "Población y muestra",
      pregunta: "Una empresa quiere conocer cuál es la opinión que tienen los clientes de una cafetería sobre la calidad del servicio brindado. Para ello, se seleccionan al azar a 200 clientes de esa cafetería y se les aplica una encuesta.",
      cierre: "De acuerdo con la información anterior, la muestra de ese estudio corresponde a",
      opciones: ["todos los clientes de la cafetería.",
                 "los clientes de la cafetería que fueron seleccionados al azar.",
                 "la opinión que tienen los clientes de la cafetería sobre la calidad de ese servicio."],
      correcta: 1,
      explicacion: "La muestra es la parte de la población que efectivamente se estudia: los 200 clientes elegidos al azar. La opción A es la población y la C es la variable que se investiga."
    },
    {
      n: 35,
      habilidad: "Probabilidad: eventos igualmente probables",
      pregunta: "En una caja hay 28 lápices, los cuales se diferencian solo por su color. Seis de esos lápices son azules, siete son rojos, ocho son verdes y el resto amarillos.",
      cierre: "De acuerdo con la información anterior, si se escoge al azar un lápiz de esa caja, entonces el evento denominado obtener un lápiz amarillo es igualmente probable que el evento denominado obtener un lápiz",
      opciones: ["verde.", "azul.", "rojo."],
      correcta: 2,
      explicacion: "Los amarillos son 28 − 6 − 7 − 8 = 7. Como también hay 7 lápices rojos, ambos eventos tienen la misma probabilidad."
    }
  ]
};
