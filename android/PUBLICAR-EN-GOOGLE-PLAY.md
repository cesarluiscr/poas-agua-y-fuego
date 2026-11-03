# Publicar el Observatorio del Agua-Poás en Google Play

GitHub Actions genera en cada cambio:

- `observatorio-agua-poas-apk`: APK de prueba (firma de depuración), para instalar directamente.
- `observatorio-agua-poas-aab`: **AAB para Google Play**, firmado con la clave de subida
  (o `observatorio-agua-poas-aab-sin-firmar` si todavía no hay clave configurada).

## 1. Crear la clave de subida (una sola vez, en tu computadora)

```bash
keytool -genkeypair -v -keystore subida-observatorio.jks -alias subida -keyalg RSA -keysize 4096 -validity 10000
```

Guardá el archivo `.jks` y sus contraseñas en un lugar seguro y con respaldo. **Nunca** lo subas al repositorio.
Con "Firma de apps de Google Play" (obligatoria para apps nuevas), Google guarda la clave final;
si perdés la clave de subida, se puede restablecer desde Play Console.

## 2. Opción A — Firmar automáticamente en GitHub Actions

En el repositorio: **Settings → Secrets and variables → Actions → New repository secret**:

| Secreto | Valor |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | el resultado de `base64 -w0 subida-observatorio.jks` (en macOS: `base64 -i subida-observatorio.jks`) |
| `ANDROID_KEYSTORE_PASSWORD` | contraseña del almacén |
| `ANDROID_KEY_ALIAS` | `subida` |
| `ANDROID_KEY_PASSWORD` | contraseña de la clave |

Luego ejecutá el workflow (**Actions → Android → Run workflow**) y descargá `observatorio-agua-poas-aab`.

## 2. Opción B — Firmar el AAB en tu computadora

Descargá `observatorio-agua-poas-aab-sin-firmar` y firmalo:

```bash
jarsigner -keystore subida-observatorio.jks -signedjar observatorio-agua-poas.aab observatorio-agua-poas-sin-firmar.aab subida
```

```bash
jarsigner -verify observatorio-agua-poas.aab
```

## 3. Antes de subir la primera versión

- **Identificador de la app:** `agua.poas.com` (en `android/app/build.gradle`). Aparece en el enlace
  de Google Play (`play.google.com/store/apps/details?id=agua.poas.com`) y **no se puede cambiar
  después de publicar**. (El paquete interno del código sigue siendo `cr.poas.aquapoas`; no es visible.)
- **Número de versión:** GitHub Actions asigna `versionCode = 1000 + número de compilación`, así cada AAB tiene
  un código nuevo y mayor que el anterior. El valor aparece en el resumen de cada ejecución.
- **Política de privacidad:** Play exige una URL pública. Se puede publicar el texto de la sección
  *Más → Privacidad* en el sitio web.
- **Seguridad de los datos (formulario de Play Console):** la app recopila, solo si la persona los escribe al
  reportar: nombre, teléfono o correo, fotos, ubicación elegida en el mapa y la descripción del reporte.
  Uso: funcionalidad de la app (atender reportes). No se comparten con terceros para publicidad.
  Se transmiten cifrados (HTTPS). La persona puede borrar sus datos locales desde la app.
- **Clasificación de contenido y público objetivo:** completar los cuestionarios en Play Console.
