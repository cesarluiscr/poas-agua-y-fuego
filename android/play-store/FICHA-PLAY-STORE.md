# Ficha de Google Play — Observatorio del Agua-Poás

Todo lo necesario para completar **Play Console → Crecimiento → Presencia en la tienda → Ficha principal de Play Store**
y **Política → Contenido de la app**. Copiá cada bloque tal cual.

## 1. Detalles de la app

### Nombre de la app (26/30)
```
Observatorio del Agua-Poás
```

### Descripción breve (74/80)
```
Lluvia, mapa, histórico y reportes ciudadanos del agua del cantón de Poás.
```

### Descripción completa (2733/4000)
```
El Observatorio del Agua-Poás es una herramienta abierta de la iniciativa Gobernanza del Agua para conocer, proteger y gestionar de forma participativa el agua del cantón de Poás, en Alajuela, Costa Rica.

ESTADO DEL AGUA EN TU ZONA
• Lluvia de hoy, de los últimos 7 y 30 días, y pronóstico para los próximos 7 días en las zonas alta, media y baja del cantón.
• Balance climático simplificado (lluvia menos evapotranspiración) y lluvia comparada con su promedio histórico, para detectar periodos secos o lluviosos.
• Humedad del suelo, temperatura y caudal estimado del río.

DATOS TRANSPARENTES
Cada indicador muestra qué tipo de dato es (estimación, pronóstico o reanálisis) y su ficha con la fórmula, la unidad, el periodo, la fuente, la fecha de actualización y sus limitaciones. Los indicadores climáticos no se presentan como mediciones de la recarga del acuífero.

MAPA HÍDRICO
Consultá la lluvia y el balance climático de cualquier punto del cantón tocando el mapa. Capas de áreas protegidas, cráteres y lagunas, puntos de cálculo y comunidades, cada una con su fuente y nivel de confianza.

DATOS HISTÓRICOS
Diez años de lluvia mensual y anual, comparación entre las zonas alta, media y baja, y exportación a CSV (Excel) y PDF.

REPORTES CIUDADANOS CON SEGUIMIENTO
Reportá fugas, falta de agua, contaminación de ríos y nacientes, residuos, erosión, inundaciones o tala en zonas de recarga. Cada reporte recibe un código único, puede incluir una fotografía y un punto en el mapa, y solo se marca como recibido cuando el servidor lo confirma. Sin conexión, queda guardado y se envía después.

GOBERNANZA DEL AGUA
Directorio de actores (Municipalidad, ASADAS, AyA, MINAE, SINAC, SENARA, CNE y organizaciones), proyectos, acuerdos con sus responsables y plazos, e indicadores de gestión.

CALIDAD DEL AGUA Y EDUCACIÓN
Parámetros de calidad y sus requisitos de registro, temas sobre microcuencas, nacientes, acuíferos, riberas, contaminación y cambio climático, y calendario de actividades.

CALCULADORA DE CONSUMO
Estimá cuánta agua usa tu hogar, comparala con tu recibo y descubrí cuánto podés ahorrar en litros y colones.

PRIVACIDAD
No necesitás cuenta. La app no usa el GPS ni pide permisos de ubicación, cámara o contactos, y no muestra publicidad. Solo se envían los datos que escribís en un reporte.

FUENTES Y AVISO
Datos de clima: Open-Meteo (modelos de pronóstico y reanálisis ERA5, Copernicus/ECMWF) y GloFAS para el caudal. Mapas © colaboradores de OpenStreetMap. Esta app es informativa: no es una aplicación oficial del Gobierno de Costa Rica ni de la Municipalidad de Poás, AyA, MINAE, SINAC, SENARA, IMN o CNE, y no sustituye sus avisos oficiales. En emergencias llamá al 9-1-1.

Desarrollado por Tech Center CR.
```

## 2. Gráficos

| Recurso | Archivo | Requisito de Play |
|---|---|---|
| Ícono de la app | `icono-512.png` | 512 × 512 PNG |
| Gráfico destacado | `grafico-destacado-1024x500.png` (o `.jpg`) | 1024 × 500, sin transparencia |
| Capturas de teléfono (8) | `capturas/01-inicio.png` … `capturas/08-consumo.png` | 9:16, 1080 × 1920 |

Las capturas muestran **datos reales** de Open-Meteo y mapas de OpenStreetMap del 5 de noviembre de 2026
(zona media). En `capturas-originales/` están las mismas pantallas sin marco ni título, por si preferís subirlas así.

## 3. Categoría y contacto

| Campo | Valor sugerido |
|---|---|
| Tipo de app | Aplicación |
| Categoría | **Educación** (alternativa: Clima) |
| Etiquetas | Clima · Medio ambiente · Educación · Comunidad |
| Correo electrónico | el correo de contacto de tu cuenta de desarrollador |
| Sitio web | `https://cesarluiscr.github.io/poas-agua-y-fuego/observatorio-agua.html` |
| Política de privacidad | `https://cesarluiscr.github.io/poas-agua-y-fuego/observatorio-agua-privacidad.html` |

> La página de privacidad y la página web se publican en GitHub Pages **cuando la rama se fusiona a `main`/`master`**.
> Antes de ese paso, esas direcciones devuelven error 404 y Play Console no las acepta.

## 4. Contenido de la app (Política)

**Política de privacidad:** la URL de arriba.

**Anuncios:** No, la app no contiene anuncios.

**Acceso a la app:** Toda la funcionalidad está disponible sin restricciones (no hay inicio de sesión).

**Clasificación de contenido:** completar el cuestionario respondiendo *No* a violencia, contenido sexual, lenguaje
soez, drogas, apuestas y compras. En "¿Los usuarios pueden interactuar o intercambiar contenido?" responder **Sí**
(los reportes ciudadanos se envían al equipo; no son visibles para otros usuarios). Resultado esperado: *Para todos / PEGI 3*.

**Público objetivo:** 13 años o más (13–15, 16–17 y 18+). No elegir edades menores de 13, porque activa la política de Familias.

**Apps de noticias:** No. **Apps gubernamentales:** No (la app no está desarrollada por ni en nombre de un gobierno).
**Apps de salud / financieras / COVID:** No.

### Seguridad de los datos

| Pregunta | Respuesta |
|---|---|
| ¿La app recopila o comparte datos de usuario? | **Sí** (solo al enviar un reporte) |
| ¿Los datos se cifran en tránsito? | **Sí** (HTTPS) |
| ¿Se puede solicitar la eliminación de datos? | **Sí** (formulario de contacto, indicando el código del reporte) |
| ¿Se comparten datos con terceros? | **No** (Google Apps Script/Sheets actúa como proveedor de servicio) |

Datos recopilados (todos **opcionales** salvo la descripción, **no compartidos**, propósito: **Funcionalidad de la app**):

| Categoría de Play | Tipo | Obligatorio |
|---|---|---|
| Información personal | Nombre | Opcional |
| Información personal | Dirección de correo electrónico | Opcional |
| Información personal | Número de teléfono | Opcional |
| Ubicación | Ubicación precisa (punto elegido por la persona en el mapa) | Opcional |
| Fotos y videos | Fotos | Opcional |
| Mensajes / contenido de la app | Otro contenido generado por el usuario (descripción del reporte) | Obligatorio para enviar |

No se recopilan: identificadores del dispositivo, contactos, actividad en la app, historial web ni datos financieros.

## 5. Notas de la versión (Novedades)
```
• Identificador definitivo y compatibilidad con Android 16.
• Histórico de 10 años con ERA5 y nuevo indicador de lluvia vs. su promedio.
• Reportes con código, foto opcional y seguimiento del estado.
• Mejoras de accesibilidad, pantallas pequeñas y modo oscuro.
```

## 6. Antes de enviar a revisión
- [ ] Fusionar la rama a `main` para que la política de privacidad esté en línea, y revisarla (la redacté en tu nombre; ajustá lo que quieras).
- [ ] Subir el AAB firmado (`observatorio-agua-poas.aab`).
- [ ] Completar todas las secciones de *Contenido de la app*.
- [ ] Revisar que el correo de contacto de la ficha sea el que querés mostrar públicamente.
