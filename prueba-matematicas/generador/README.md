# Generador del banco de preguntas

Estos guiones producen `../preguntas.js`, el banco de **300 preguntas de selección
múltiple** que usa la prueba de práctica. El archivo generado **no se edita a mano**:
si hay que corregir o ampliar algo, se modifica el generador y se vuelve a construir.

## Por qué se genera y no se escribe a mano

Cada respuesta correcta y cada explicación se **calculan**: la división, el redondeo, la
suma de fracciones, la notación desarrollada, etc. se resuelven en Python y de ahí sale
tanto la clave como el texto de la explicación. Así se evita el error humano de escribir
300 respuestas a mano. Los ítems de Geometría, que son conceptuales, sí están redactados
uno a uno en `gen_geometria.py`.

## Uso

```bash
cd prueba-matematicas/generador
python3 build.py ../preguntas.js     # genera el banco
python3 verificar.py ../preguntas.js   # primera comprobación independiente
python3 verificar2.py ../preguntas.js  # segunda comprobación independiente
```

`build.py` no escribe nada si el banco no pasa las validaciones.

## Archivos

| Archivo | Contenido |
|---|---|
| `gen_base.py` | Utilidades comunes: formato costarricense de números (coma decimal, espacio de millares), números en palabras, armado y barajado de opciones. |
| `gen_numeros_a.py` | Bloque Números, afirmaciones 1 a 3 (representaciones, comparación, notación desarrollada). |
| `gen_numeros_b.py` | Bloque Números, afirmaciones 4 y 5 (teoría de números, operaciones). |
| `gen_numeros_c.py` | Bloque Números, afirmaciones 6 y 7 (fracciones, propiedades). |
| `gen_geometria.py` | Bloque Geometría, afirmación 1 (figuras planas, elementos y propiedades). |
| `build.py` | Ensambla los cuatro módulos, valida y exporta `preguntas.js`. |
| `verificar.py` | Reevalúa aritméticamente comparaciones, ordenamientos, operaciones combinadas, potencias y redondeos. |
| `verificar2.py` | Reevalúa teoría de números, fracciones, notación desarrollada y lectura de numerales, con lógica escrita desde cero (incluye un lector de números en palabras independiente del generador). |

## Controles de calidad que aplica `build.py`

- Exactamente 300 preguntas, con la distribución prevista por afirmación.
- Cuatro opciones por pregunta, todas distintas y ninguna vacía.
- **Ningún distractor puede tener el mismo valor numérico que la respuesta correcta**
  (por ejemplo, `2/4` no puede acompañar a `1/2`, ni `29,400` a `29,4`).
- Ninguna pregunta repetida (mismo enunciado con el mismo juego de opciones).
- La posición de la respuesta correcta queda repartida entre las cuatro letras.

Si una semilla aleatoria produce una colisión que no se puede resolver, `build.py`
descarta esa semilla y prueba la siguiente, de modo que la construcción es reproducible
y determinista.

## Sobre la fuente

La distribución de preguntas sigue la tabla de especificaciones de la Prueba Nacional
Estandarizada de Matemática, primaria 2026. El documento de origen es un extracto de dos
páginas que cubre las siete afirmaciones del bloque **Números** y la primera afirmación
del bloque **Geometría**; el banco cubre esas ocho afirmaciones y sus evidencias.
