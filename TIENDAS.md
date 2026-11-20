# Publicación en Google Play y App Store · TU CÓDIGO

Cotización COT-261116-TC v2, «Publicación en tiendas»:

> Configuración de las cuentas de Google Play y Apple, compilación de las apps, íconos y pantallas de inicio, fichas de tienda (textos y capturas), política de privacidad, beta abierta (TestFlight y prueba de Google Play), envío a revisión y atención de las observaciones hasta la publicación.

| Pieza | Estado |
|---|---|
| Íconos (iOS, Android adaptativo y temático, notificaciones) y pantalla de inicio | ✔ `assets/` (símbolo oficial; antes había íconos de plantilla de Expo) |
| Compilación (EAS): perfiles de pruebas, producción y APK directo | ✔ `eas.json` |
| Actualizaciones al instante sin pasar por las tiendas (expo-updates) | ✔ instalado; se activa con `eas update:configure` (paso 1) |
| Gráficos de Google Play: ícono 512 y gráfico destacado 1024×500 | ✔ `tienda/` |
| Textos de las fichas | ✔ esta guía (sección 4) |
| Capturas | ⏳ el Día 6, con las marcas y productos reales cargados (sección 5) |
| Política de privacidad | ✔ borrador en `api/despliegue/web/privacidad.html`, para aprobación legal de PROCURA |
| Acceso para los revisores | ✔ teléfono de revisión con código fijo (sección 6) |

## 1. Cuentas (una sola vez)

Todas las cuentas van a nombre de PROCURA SIGLO 21, C.A., con ERTWeb como administrador invitado.

- **Expo (EAS):**
  1. Crea la organización «procura-siglo-21» en expo.dev e invita a ertwebdev@gmail.com como *Admin*.
  2. En esta carpeta, ejecuta:

     ```bash
     eas login
     eas init
     eas update:configure
     ```

     Esto agrega a `app.json` el `projectId` (lo necesitan las notificaciones push) y la URL de actualizaciones.
- **Apple Developer Program:**
  1. Se necesita el D-U-N-S de PROCURA para inscribirla como empresa (USD 99 al año).
  2. Ya inscrita, invita a ertwebdev@gmail.com como *Admin* en App Store Connect.
  3. Crea la app con el *bundle ID* `com.procurasiglo21.tucodigo`.
- **Google Play Console:**
  1. Abre la cuenta de organización (USD 25, también con D-U-N-S) e invita a ertwebdev@gmail.com como administrador.
  2. Crea la app con el paquete `com.procurasiglo21.tucodigo`.
  3. Para enviar desde EAS hace falta una cuenta de servicio de Google Cloud con acceso a Play: se guarda su JSON con `eas credentials`, nunca en el repositorio.

## 2. Compilar

Antes de compilar, reemplaza `DOMINIO` en `eas.json` por el dominio real (por ejemplo `https://api.tucodigo.app`).

| Perfil | Apunta a | Para qué |
|---|---|---|
| `pruebas` | `api-pruebas.DOMINIO` | TestFlight y prueba interna de Google Play, para la Junta y el equipo (Día 5) |
| `pruebas-apk` | `api-pruebas.DOMINIO` | APK que se instala directo en Android, sin Play |
| `produccion` | `api.DOMINIO` | Lo que se envía a revisión y se publica (Día 6) |
| `produccion-apk` | `api.DOMINIO` | Contingencia: APK para descarga directa si una tienda no ha aprobado el 24 |

Ejemplos:

```bash
eas build --profile pruebas --platform all
eas submit --profile pruebas --platform ios          # sube el build a TestFlight
eas build --profile produccion --platform all
eas submit --profile produccion --platform all       # Play: pista «beta» (beta abierta) · Apple: App Store Connect
```

El número de versión de cada compilación lo lleva EAS (`appVersionSource: remote`).

Si una corrección no toca código nativo, llega a los teléfonos sin una revisión nueva de las tiendas: `eas update --channel produccion --message "qué cambió"`. Los teléfonos la descargan al abrir la app y la aplican al volver a abrirla.

## 3. Beta abierta y pre-registro VIP (Día 6)

- **iPhone:** TestFlight con enlace público (hasta 10.000 personas). Revisa la primera versión de la beta (Beta App Review, normalmente menos de 1 día).
- **Android:** pista de prueba abierta (beta) de Google Play.
- Los enlaces de las dos betas y el APK de contingencia se publican en la página de pre-registro VIP y de descarga del sitio de PROCURA. Al terminar el registro, la app muestra el número de fundador de cada persona, hasta los primeros 35.000 (parámetro `vip.meta`). El avance hacia esa meta se ve en el Tablero de la Torre.

## 4. Textos de las fichas

Las palabras «ahorro», «inversión», «rendimiento» e «interés» no se usan en ningún texto de TU CÓDIGO.

| Campo | Texto | Límite |
|---|---|---|
| Nombre en la tienda | TU CÓDIGO: Compra programada | 30 |
| Subtítulo (Apple) | De la fábrica a tu mano | 30 |
| Descripción corta (Google) | Compra programada directo de fábrica: elige tu producto, arma tu plan y firma. | 80 |
| Texto promocional (Apple) | Regístrate en menos de 3 minutos, elige tu producto en el catálogo de fábrica y firma tu contrato desde el teléfono. Recíbelo al completar el 50 %. | 170 |
| Palabras clave (Apple) | compra programada,fábrica,catálogo,colchones,neveras,teléfonos,cuotas,plan,Cumaná,PROCURA,QR | 100 |
| Categoría | Compras (Apple: Compras · secundaria: Estilo de vida) | |
| Sitio de soporte | La página de TU CÓDIGO en el sitio de PROCURA | |
| Política de privacidad | https://DOMINIO/privacidad | |
| Derechos | © 2026 PROCURA SIGLO 21, C.A. | |

**Descripción completa** (Google y Apple, hasta 4.000 caracteres):

> TU CÓDIGO es el programa de compra programada directo de fábrica de PROCURA SIGLO 21, C.A. Eliges tu producto, armas tu plan en cuotas y firmas tu contrato desde el teléfono. Al completar el 50 % del precio, recibes tu producto.
>
> CÓMO FUNCIONA
> 1. Elige, firma y recibe de fábrica: escoge tu producto, arma tu plan y firma tu contrato desde el teléfono. Precio de fábrica, sin sobreprecios.
> 2. Completa el 50 % y recíbelo: pagas la Etapa 1 en 6 a 36 meses. Al completar el 50 % del precio recibes tu producto; el resto lo pagas en la Etapa 2.
> 3. Tu Código te identifica: con tu Código QR te atienden en la taquilla y tienes tu contrato y tus planes siempre a mano.
>
> LO QUE PUEDES HACER
> • Registrarte en menos de 3 minutos con tu cédula o pasaporte, tu teléfono, una foto de tu cédula y una selfie.
> • Ver el catálogo directo de fábrica por marca, fábrica de origen y categoría, con fotos, ficha técnica, precio en USD y fecha estimada de entrega.
> • Simular tu plan: Etapa 1 en 6, 12, 18, 24 o 36 meses y Etapa 2 en 6, 12, 24 o 36 meses, con cada cuota en USD y su equivalente en bolívares a tasa BCV.
> • Firmar tu Contrato de Compraventa Programada con Reserva de Dominio con tu dedo y un código, y recibirlo en PDF.
> • Mostrar tu Código QR, que cambia cada 60 segundos, y vincular tu tarjeta TU CÓDIGO.
> • Revisar en Mis Planes tus productos, el estado de tu contrato y tus cuotas.
> • Contactar la Asistencia Jurídica 24/7.
> • Entrar con tu huella o Face ID y recibir avisos de tu registro y de tu contrato.
>
> Tus fotos y tus datos viajan y se guardan cifrados, y solo los ve el equipo autorizado de PROCURA.
>
> TU CÓDIGO es para personas mayores de 18 años. Atención presencial en las taquillas del Centro Empresarial 8 de Mayo, Av. Gran Mariscal, Cumaná, estado Sucre.
>
> TU CÓDIGO. De la fábrica a tu mano.

## 5. Capturas (Día 6, con el catálogo real)

- **Apple:** iPhone de 6,9" (1320×2868), de 3 a 10 capturas. La app no está habilitada para iPad (`supportsTablet: false`).
- **Google:** de 2 a 8 capturas de teléfono (1080×1920 o más), más el ícono y el gráfico destacado de `tienda/`.
- **Pantallas, en este orden:**
  1. Bienvenida (01)
  2. Catálogo (09)
  3. Producto (10)
  4. Simulador (11)
  5. Contrato (13)
  6. Mi Código QR (16)
  7. Mis Planes (18)
  8. Registro: foto de la cédula (05)
- Con el simulador abierto en la pantalla, la captura sale a la resolución del teléfono: `xcrun simctl io booted screenshot tienda/captura-01.png`. Para la medida de 6,9", usa el simulador «iPhone 17 Pro Max».

## 6. Acceso para los revisores (App Review y Google Play «Acceso a la app»)

Los revisores no pueden recibir el código por WhatsApp ni SMS. Por eso la API acepta un único teléfono de revisión con un código fijo, solo mientras dure la revisión:

1. En `/etc/tucodigo/produccion.env` agrega:
   - `REVISION_TELEFONO=+58…`: un número de PROCURA, nunca de un cliente;
   - `REVISION_CODIGO=…`: 6 dígitos que no sean fáciles de adivinar.

   Luego reinicia el servicio.
2. Con ese teléfono, registra un suscriptor de demostración, apruébalo en la Torre y déjale un plan firmado, para que el revisor vea todo.
3. Datos para el revisor:

   > Inicia sesión con «Ya tengo mi código» → cédula V-XXXXXXXX. El código de verificación es NNNNNN.
   >
   > TU CÓDIGO es un programa de compra programada de PROCURA SIGLO 21, C.A. (Cumaná, Venezuela). La identidad de cada suscriptor la valida el equipo de PROCURA desde su Torre de Control; la cuenta de demostración ya está validada. La app no procesa pagos. La sección «Soy promotor» es solo para el personal de las taquillas de PROCURA (cuentas emitidas por la empresa con verificación en dos pasos).
4. Cuando las dos tiendas aprueben, borra `REVISION_TELEFONO` y `REVISION_CODIGO` y reinicia el servicio.

## 7. Formularios de privacidad de las tiendas

**Datos que recoge la app.** Todos están vinculados a la persona, no se usan para rastreo publicitario y no se venden:
- Nombre, teléfono, correo (opcional), número de documento y fecha de nacimiento: para el registro, la verificación de identidad y el contrato.
- Fotos (cédula y selfie): para la verificación de identidad, que hace una persona del equipo de PROCURA.
- Identificador del dispositivo para notificaciones: para los avisos.

**Lo que no recoge:** ubicación, contactos, datos financieros (la app no procesa pagos en la Fase 1), datos de salud ni historial de navegación. No hay herramientas de analítica ni de publicidad.

**Seguridad:**
- Todo viaja cifrado.
- La persona puede pedir que se borre su cuenta por el canal de soporte (está en la política de privacidad).

**Google Play:**
- Clasificación de contenido IARC: sin contenido sensible.
- Público objetivo: mayores de 18 años.
- Declaración de funciones financieras: la app no otorga préstamos ni procesa pagos; muestra planes de compra programada. El área legal de PROCURA confirma esta respuesta.

Apple y Google exigen que una app que permite crear cuentas también permita pedir que se eliminen desde la app. Si alguna de las dos lo pide en la revisión, se atiende como observación.

Si en la Fase 3 se activa el sorteo «La Entrega de La Llave», hay que actualizar la clasificación y cumplir las normas de concursos de cada tienda.
