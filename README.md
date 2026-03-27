# Cubo Pago SDK Web

SDK JavaScript para procesar pagos con dispositivos POS vía Web Bluetooth.

## ¿Tienes dudas sobre la integración?

| Herramienta | Cómo usarla |
|-------------|-------------|
| **Claude Code** | Invoca `/cubo-sdk-help` en tu terminal — la skill tiene contexto completo del SDK |
| **Cualquier otra IA** | Adjunta el archivo [`llms.txt`](./llms.txt) a tu chat y pregunta lo que necesites |

| Navegador  | Desktop | Android | iOS |
| ---------- | ------- | ------- | --- |
| Chrome 56+ | ✅      | ✅      | ❌  |
| Edge 79+   | ✅      | —       | ❌  |
| Opera 43+  | ✅      | ✅      | ❌  |
| Safari     | ❌      | —       | ❌  |
| Firefox    | ❌      | ❌      | ❌  |

---

## Tabla de Contenidos

- [1. Prerrequisitos Técnicos](#1-prerrequisitos-técnicos)
- [2. Instalación](#2-instalación)
- [3. Quick Start](#3-quick-start)
- [4. Inicialización del SDK](#4-inicialización-del-sdk)
- [5. Propiedades Públicas](#5-propiedades-públicas)
- [6. Métodos Disponibles](#6-métodos-disponibles)
  - [6.1. connect()](#61-connect)
  - [6.2. disconnect()](#62-disconnect)
  - [6.3. startPayment(params)](#63-startpaymentparams)
  - [6.4. cancelCurrentTransaction()](#64-cancelcurrenttransaction)
  - [6.5. getDeviceInfo()](#65-getdeviceinfo)
  - [6.6. getPosId()](#66-getposid)
  - [6.7. getInstallments()](#67-getinstallments)
  - [6.8. getInstallmentCalculation(amountInCents)](#68-getinstallmentcalculationamountincents)
  - [6.9. on(event, callback)](#69-onevent-callback)
  - [6.10. off(event, callback?)](#610-offevent-callback)
  - [6.11. removeAllListeners()](#611-removealllisteners)
- [7. Eventos del SDK](#7-eventos-del-sdk)
  - [7.1. connected](#71-connected)
  - [7.2. disconnected](#72-disconnected)
  - [7.3. status](#73-status)
  - [7.4. loading](#74-loading)
  - [7.5. transactionResult](#75-transactionresult)
  - [7.6. error](#76-error)
  - [7.7. installmentsLoaded](#77-installmentsloaded)
- [8. Meses Sin Intereses (MSI)](#8-meses-sin-intereses-msi)
- [9. Recuperación Automática de Pagos](#9-recuperación-automática-de-pagos)
- [10. Ejemplo de Integración Completa](#10-ejemplo-de-integración-completa)
- [11. Ejemplo de Integración con React](#11-ejemplo-de-integración-con-react)
- [12. Integración con Asistentes de IA](#12-integración-con-asistentes-de-ia)
- [13. Solución de Problemas](#13-solución-de-problemas)

---

## 1. Prerrequisitos Técnicos

Antes de integrar el SDK, asegúrate de cumplir con los siguientes requisitos, ya que son indispensables para el funcionamiento de la **Web Bluetooth API**.

- **Contexto Seguro (HTTPS):** La Web Bluetooth API solo funciona en páginas servidas a través de un contexto seguro. Esto significa que tu sitio debe usar `https` en producción. Para el desarrollo local, `http://localhost` es considerado un contexto seguro.

- **Compatibilidad de Navegadores:** La Web Bluetooth API no es universalmente compatible. Consulta la tabla de compatibilidad al inicio de este documento.

---

## 2. Instalación

Incluye el script del SDK en tu archivo HTML:

```html
<script src="https://sdk.cubopago.com/pos/v1.10.0/cubo-pos-sdk-web.js"></script>
```

---

## 3. Quick Start

Copia y pega este ejemplo mínimo para procesar tu primer cobro:

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Mi Primer Cobro</title>
  </head>
  <body>
    <button id="connect">Conectar Lector</button>
    <button id="pay" disabled>Cobrar $10.00</button>
    <p id="status">Desconectado</p>

    <script src="https://sdk.cubopago.com/pos/v1.10.0/cubo-pos-sdk-web.js"></script>
    <script>
      const pos = new CuboPagoSDK({
        apiKey: 'TU_API_KEY_AQUI',
        environment: 'SANDBOX',
      });

      // Conectar al lector
      document.getElementById('connect').addEventListener('click', () => {
        pos.isConnected ? pos.disconnect() : pos.connect();
      });

      // Cobrar $10.00 (1000 centavos)
      document.getElementById('pay').addEventListener('click', () => {
        pos.startPayment({
          amount: '1000',
          currencyCode: '0840',
          currencySymbol: '$',
        });
      });

      // Escuchar eventos
      pos.on('connected', data => {
        document.getElementById('status').textContent =
          `Conectado: ${data.deviceName}`;
        document.getElementById('pay').disabled = false;
      });

      pos.on('disconnected', () => {
        document.getElementById('status').textContent = 'Desconectado';
        document.getElementById('pay').disabled = true;
      });

      pos.on('transactionResult', result => {
        if (result.success) {
          alert('¡Pago exitoso!');
        } else if (result.pending) {
          alert(result.message);
        } else {
          alert('Error: ' + result.error.message);
        }
      });

      pos.on('error', error => {
        alert('Error: ' + error.message);
      });
    </script>
  </body>
</html>
```

> **Nota de Seguridad:** Tu `apiKey` es una credencial sensible. En producción, nunca la expongas directamente en el código del lado del cliente. La forma más segura es que tu backend la provea a la aplicación web después de que el usuario se haya autenticado.

---

## 4. Inicialización del SDK

Crea una instancia de `CuboPagoSDK` proporcionando un objeto de configuración:

```javascript
const pos = new CuboPagoSDK({
  apiKey: 'TU_API_KEY_AQUI',
  environment: 'SANDBOX',
  enableMsi: true,
  // msiModal: false,
  // hasPrinter: true,
});
```

**Opciones de configuración:**

| Opción        | Tipo      | Requerido | Default | Descripción                                                                                                                                                                                           |
| ------------- | --------- | --------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apiKey`      | `string`  | Sí        | —       | Tu clave de API, obtenida desde [Cubo Admin](https://admin.cubopago.com/developers/api-key).                                                                                                          |
| `environment` | `string`  | Sí        | —       | `'SANDBOX'` para pruebas o `'PRODUCTION'` para transacciones reales.                                                                                                                                  |
| `enableMsi`   | `boolean` | No        | `false` | Activa el soporte de Meses Sin Intereses (MSI).                                                                                                                                                       |
| `msiModal`    | `boolean` | No        | `true`  | Cuando `enableMsi: true`, indica si el SDK renderiza automáticamente el modal de selección de tipo de pago. Pasa `false` para construir tu propia UI (ver [sección MSI](#8-meses-sin-intereses-msi)). |
| `hasPrinter`  | `boolean` | No        | `false` | Indica si el comercio cuenta con impresora de recibos. Cuando es `true`, el SDK omite la captura digital de firma ya que el cliente firmará el voucher impreso.                                       |

---

## 5. Propiedades Públicas

| Propiedad     | Tipo                      | Descripción                                                                 |
| ------------- | ------------------------- | --------------------------------------------------------------------------- |
| `isConnected` | `boolean`                 | Indica si hay un dispositivo POS conectado actualmente.                     |
| `device`      | `BluetoothDevice \| null` | Referencia al dispositivo Bluetooth conectado, o `null` si no hay conexión. |

```javascript
if (pos.isConnected) {
  console.log('Dispositivo conectado:', pos.device.name);
}
```

---

## 6. Métodos Disponibles

### 6.1. `connect()`

Abre el diálogo de selección de dispositivos Bluetooth del navegador e inicia la conexión con el lector POS.

- **Retorna:** `Promise<string>` — Nombre del dispositivo conectado.
- **Requiere:** Interacción del usuario (el navegador muestra un diálogo de selección).

```javascript
pos
  .connect()
  .then(deviceName => console.log('Conectado a:', deviceName))
  .catch(err => console.error('Error al conectar:', err));
```

### 6.2. `disconnect()`

Desconecta el dispositivo POS actual.

- **Retorna:** `void`

```javascript
pos.disconnect();
```

### 6.3. `startPayment(params)`

Inicia una transacción de pago. Si `enableMsi: true`, el SDK mostrará primero el modal de selección de tipo de pago.

- **Retorna:** `Promise<void>`
- **Requiere:** Dispositivo conectado.

**Parámetros:**

| Parámetro              | Tipo     | Requerido | Default  | Descripción                                                                                                                    |
| ---------------------- | -------- | --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `amount`               | `string` | Sí        | —        | Monto en centavos (ej: `"1250"` = $12.50).                                                                                     |
| `currencyCode`         | `string` | No        | `"0840"` | Código numérico ISO 4217. `"0840"` = USD, `"0320"` = Quetzales.                                                                |
| `currencySymbol`       | `string` | No        | `"$"`    | Símbolo de la moneda para mostrar en el dispositivo.                                                                           |
| `monthlyInstallmentId` | `number` | No        | —        | ID de la opción MSI seleccionada. Obtén el ID con [`getInstallmentCalculation()`](#68-getinstallmentcalculationamountincents). |

```javascript
// Pago de contado
pos.startPayment({ amount: '1250', currencyCode: '0840', currencySymbol: '$' });

// Pago con MSI
pos.startPayment({
  amount: '275000',
  currencyCode: '0840',
  currencySymbol: '$',
  monthlyInstallmentId: 7,
});
```

### 6.4. `cancelCurrentTransaction()`

Cancela la transacción HTTP en curso. Útil para implementar un botón de "Cancelar" o un timeout personalizado.

- **Retorna:** `boolean` — `true` si se canceló una transacción, `false` si no había ninguna en curso.

```javascript
const cancelBtn = document.getElementById('cancelButton');

cancelBtn.addEventListener('click', () => {
  const cancelled = pos.cancelCurrentTransaction();
  if (cancelled) {
    console.log('Transacción cancelada');
  } else {
    console.log('No hay transacción en curso');
  }
});
```

### 6.5. `getDeviceInfo()`

Obtiene información del hardware del dispositivo POS conectado.

- **Retorna:** `Promise<ITerminalDeviceInfo>` — Objeto con información del hardware (modelo, firmware, etc.).
- **Requiere:** Dispositivo conectado.

```javascript
const info = await pos.getDeviceInfo();
console.log('Modelo:', info.modelName);
console.log('Firmware:', info.firmwareVersion);
```

### 6.6. `getPosId()`

Obtiene los identificadores únicos del dispositivo POS conectado.

- **Retorna:** `Promise<IDeviceIdInfo>` — Objeto con los identificadores del dispositivo.
- **Requiere:** Dispositivo conectado.

```javascript
const ids = await pos.getPosId();
console.log('POS ID:', ids.posId);
```

### 6.7. `getInstallments()`

Obtiene las opciones de MSI disponibles para tu empresa. No requiere dispositivo conectado.

- **Retorna:** `Promise<IInstallmentOption[]>`
- **Requiere:** `enableMsi: true` en la configuración.

| Campo              | Tipo     | Descripción                                  |
| ------------------ | -------- | -------------------------------------------- |
| `id`               | `number` | Identificador de la opción.                  |
| `numberOfPayments` | `number` | Número de meses.                             |
| `minimumAmount`    | `string` | Monto mínimo requerido para aplicar el plan. |
| `description`      | `string` | Términos y comisiones del plan.              |

```javascript
const installments = await pos.getInstallments();
installments.forEach(option => {
  console.log(
    `${option.numberOfPayments} meses — mín. $${option.minimumAmount}`,
  );
});
```

### 6.8. `getInstallmentCalculation(amountInCents)`

Calcula la cuota mensual para un monto específico según las opciones de MSI disponibles. No requiere dispositivo conectado.

- **Retorna:** `Promise<IInstallmentCalculation[]>`
- **Requiere:** `enableMsi: true` en la configuración.

**Parámetros:**

- `amountInCents` (`number`): Monto en centavos (ej: `275000` = $2,750.00).

| Campo              | Tipo      | Descripción                                                                     |
| ------------------ | --------- | ------------------------------------------------------------------------------- |
| `id`               | `number`  | Identificador del plan — pásalo a `startPayment()` como `monthlyInstallmentId`. |
| `numberOfPayments` | `number`  | Número de meses.                                                                |
| `monthlyFee`       | `string`  | Cuota mensual calculada.                                                        |
| `minimumAmount`    | `string`  | Monto mínimo requerido.                                                         |
| `enabled`          | `boolean` | Indica si el plan está activo.                                                  |
| `description`      | `string`  | Términos y comisiones del plan.                                                 |

```javascript
const calculations = await pos.getInstallmentCalculation(275000);
calculations.forEach(calc => {
  console.log(`${calc.numberOfPayments} meses — $${calc.monthlyFee}/mes`);
});
```

### 6.9. `on(event, callback)`

Registra un listener para un evento del SDK. Ver [sección de Eventos](#7-eventos-del-sdk) para la lista completa.

- **Retorna:** `void`

```javascript
pos.on('status', newStatus => {
  console.log('Estado:', newStatus);
});
```

### 6.10. `off(event, callback?)`

Remueve un listener previamente registrado. Si no se pasa `callback`, remueve todos los listeners de ese evento.

- **Retorna:** `void`

```javascript
// Remover un listener específico
const handleStatus = status => console.log(status);
pos.on('status', handleStatus);
pos.off('status', handleStatus);

// Remover todos los listeners de un evento
pos.off('status');
```

### 6.11. `removeAllListeners()`

Remueve todos los listeners de todos los eventos. Útil al destruir la instancia del SDK o al desmontar un componente.

- **Retorna:** `void`

```javascript
window.addEventListener('beforeunload', () => {
  pos.removeAllListeners();
  pos.disconnect();
});
```

---

## 7. Eventos del SDK

El SDK emite eventos para mantener tu aplicación informada sobre el estado del proceso. Escúchalos con [`on()`](#69-onevent-callback).

### 7.1. `connected`

Se dispara cuando la conexión con el lector es exitosa.

**Datos:** `{ deviceName: string }`

```javascript
pos.on('connected', data => {
  console.log(`Conectado a: ${data.deviceName}`);
});
```

### 7.2. `disconnected`

Se dispara cuando el lector se desconecta.

**Datos:** ninguno

```javascript
pos.on('disconnected', () => {
  console.log('Desconectado del lector');
});
```

### 7.3. `status`

Informa sobre cambios de estado en el flujo de conexión y pago. Útil para mostrar mensajes al usuario.

**Datos:** `string` — uno de los siguientes valores:

**Estados de Conexión:**

| Estado         | Descripción                                 |
| -------------- | ------------------------------------------- |
| `searching`    | Buscando dispositivos Bluetooth.            |
| `connecting`   | Conectando con el dispositivo seleccionado. |
| `connected`    | Conexión establecida.                       |
| `disconnected` | Sin conexión.                               |

**Estados de Verificación y Configuración:**

| Estado                        | Descripción                                         |
| ----------------------------- | --------------------------------------------------- |
| `verifying_pos`               | Verificando el dispositivo con el servidor.         |
| `preparing_pos_configuration` | El POS requiere actualización de configuración EMV. |
| `configuring_pos`             | Descargando y aplicando configuración EMV.          |
| `verification_failed`         | La verificación del dispositivo falló.              |
| `configuring_failed`          | La configuración EMV falló.                         |

**Estados de Pago:**

| Estado                   | Descripción                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `waiting_for_card`       | Lector esperando que se presente una tarjeta.                                                                                                                |
| `processing_payment`     | Procesando la información de la tarjeta.                                                                                                                     |
| `payment_success`        | La transacción se completó con éxito.                                                                                                                        |
| `payment_failed`         | La transacción falló.                                                                                                                                        |
| `payment_pending`        | No se pudo confirmar el estado del pago tras los intentos de recuperación. El pago podría haberse procesado — verificar en el historial antes de reintentar. |
| `transaction_terminated` | La transacción fue cancelada antes de completarse.                                                                                                           |

**Mensajes de Recuperación:**

Si ocurre un error ambiguo durante el cobro (timeout, error de red o error de gateway), el SDK intenta recuperar el estado automáticamente. Durante este proceso se emiten mensajes progresivos:

| Mensaje                                       |
| --------------------------------------------- |
| `Estamos confirmando tu pago con el banco...` |
| `Seguimos verificando con el banco...`        |
| `Ya casi, la confirmación está tardando...`   |

```javascript
pos.on('status', newStatus => {
  document.getElementById('status').textContent = newStatus;
});
```

### 7.4. `loading`

Indica que el SDK está realizando una operación asíncrona. Útil para bloquear la UI.

**Datos:** `boolean` — `true` al iniciar, `false` al terminar.

```javascript
pos.on('loading', isLoading => {
  payButton.disabled = isLoading;
  spinner.style.display = isLoading ? 'block' : 'none';
});
```

### 7.5. `transactionResult`

Resultado final de la transacción después de ser procesada por el servidor.

**Datos:** `object` con la siguiente estructura:

| Campo     | Tipo      | Descripción                                                                          |
| --------- | --------- | ------------------------------------------------------------------------------------ |
| `success` | `boolean` | `true` si el pago fue exitoso.                                                       |
| `data`    | `object`  | Presente si `success: true`. Contiene la respuesta de la API.                        |
| `pending` | `boolean` | Si `true`, el pago no pudo confirmarse pero podría haberse procesado.                |
| `message` | `string`  | Presente si `pending: true`. Mensaje descriptivo para mostrar al usuario.            |
| `error`   | `object`  | Presente si `success: false` y `pending` no es `true`. Contiene `{ type, message }`. |

```javascript
pos.on('transactionResult', result => {
  if (result.success) {
    console.log('Pago exitoso:', result.data);
  } else if (result.pending) {
    // El pago podría haberse procesado — no reintentar sin verificar
    console.warn(result.message);
  } else {
    console.error('Error:', result.error.message);
  }
});
```

### 7.6. `error`

Se emite cuando ocurre un error en el SDK o en el proceso de comunicación.

**Datos:** `{ type: string, message: string }`

| Tipo de Error             | Descripción                                                              |
| ------------------------- | ------------------------------------------------------------------------ |
| `connection_failed`       | Error al conectar con el dispositivo.                                    |
| `not_connected`           | Se intentó una operación sin estar conectado.                            |
| `sdk_error`               | Error general del SDK.                                                   |
| `invalid_amount`          | Monto inválido en `startPayment()`.                                      |
| `invalid_currency_code`   | Código de moneda inválido.                                               |
| `invalid_currency_symbol` | Símbolo de moneda inválido.                                              |
| `transaction_declined`    | Transacción rechazada por el banco. El `message` contiene la razón.      |
| `transaction_not_found`   | No se encontró registro del pago tras los intentos de recuperación.      |
| `recovery_in_progress`    | Se intentó iniciar un nuevo pago mientras hay una recuperación en curso. |

```javascript
pos.on('error', error => {
  console.error(`Error (${error.type}): ${error.message}`);
});
```

### 7.7. `installmentsLoaded`

Se emite al conectar cuando `enableMsi: true` y `msiModal: false`. Proporciona las opciones de MSI para construir tu propia UI.

**Datos:** `IInstallmentOption[]`

```javascript
pos.on('installmentsLoaded', installments => {
  installments.forEach(option => {
    console.log(
      `${option.numberOfPayments} meses — mín. $${option.minimumAmount}`,
    );
  });
});
```

---

## 8. Meses Sin Intereses (MSI)

### Flujo automático con modales del SDK

Cuando inicializas el SDK con `enableMsi: true`, el flujo de MSI es completamente automático. Al llamar a `startPayment()`, el SDK muestra un modal de selección:

- **Un solo pago** — procede directamente con la transacción de contado.
- **Cuotas sin intereses** — muestra un segundo modal con las opciones disponibles y el cálculo de cuota mensual.
- **Cancelar** — cancela el flujo sin iniciar el pago.

```javascript
const pos = new CuboPagoSDK({
  apiKey: 'TU_API_KEY_AQUI',
  environment: 'SANDBOX',
  enableMsi: true, // El SDK renderiza los modales automáticamente
});

payBtn.addEventListener('click', () => {
  const amountInCents = Math.round(
    parseFloat(amountInput.value) * 100,
  ).toString();
  pos.startPayment({
    amount: amountInCents,
    currencyCode: '0840',
    currencySymbol: '$',
  });
});
```

### Flujo manual con UI personalizada

Si prefieres construir tu propia interfaz para MSI, usa `msiModal: false`. El SDK cargará las opciones al conectar y las enviará vía el evento [`installmentsLoaded`](#77-installmentsloaded).

```javascript
const pos = new CuboPagoSDK({
  apiKey: 'TU_API_KEY_AQUI',
  environment: 'SANDBOX',
  enableMsi: true,
  msiModal: false, // El SDK NO renderiza modales
});

pos.on('installmentsLoaded', installments => {
  installments.forEach(option => {
    console.log(
      `${option.numberOfPayments} meses — mín. $${option.minimumAmount}`,
    );
  });
});
```

### Flujo completo de MSI (manual)

```javascript
let selectedInstallment = null;

// 1. Al conectar, cargar las opciones disponibles
pos.on('connected', async () => {
  const installments = await pos.getInstallments();
  // Poblar un <select> con las opciones...
});

// 2. Al seleccionar una opción, calcular la cuota para el monto actual
installmentsSelect.addEventListener('change', async () => {
  if (!installmentsSelect.value) {
    selectedInstallment = null;
    return;
  }
  const amountInCents = Math.round(parseFloat(amountInput.value) * 100);
  const calculations = await pos.getInstallmentCalculation(amountInCents);
  selectedInstallment = calculations.find(
    c => c.id === parseInt(installmentsSelect.value),
  );
});

// 3. Al pagar, pasar el id si hay MSI seleccionado
payBtn.addEventListener('click', () => {
  const amountInCents = Math.round(
    parseFloat(amountInput.value) * 100,
  ).toString();

  pos.startPayment({
    amount: amountInCents,
    currencyCode: '0840',
    currencySymbol: '$',
    ...(selectedInstallment && {
      monthlyInstallmentId: selectedInstallment.id,
    }),
  });
});
```

---

## 9. Recuperación Automática de Pagos

El SDK incluye un mecanismo de recuperación automática que protege contra cobros duplicados y pagos perdidos. Funciona de forma transparente — no necesitas configurar nada.

### ¿Cuándo se activa?

Si durante el procesamiento del pago ocurre un error ambiguo (donde no se sabe si el cobro se procesó o no):

- **Timeout**: El servidor no respondió a tiempo (3 minutos).
- **Error de red**: La conexión se perdió durante el cobro.
- **Error de gateway (502/503/504)**: El servidor respondió con un error intermedio.

### ¿Cómo funciona?

1. Cada pago genera automáticamente un **Idempotency Key** (UUID único) que se envía como header. Esto garantiza que si el cobro se reintenta, el servidor no lo procese dos veces.
2. Tras un error ambiguo, el SDK consulta el estado de la transacción al servidor de forma progresiva, mostrando mensajes al usuario vía el evento [`status`](#73-status).
3. Según la respuesta del servidor, el SDK resuelve automáticamente:

| Resultado          | Comportamiento del SDK                                                       |
| ------------------ | ---------------------------------------------------------------------------- |
| Pago aprobado      | Emite `transactionResult` con `success: true` como un pago normal.           |
| Pago rechazado     | Emite `error` con la razón del rechazo y `status: 'payment_failed'`.         |
| Pago no encontrado | Emite `error` indicando que es seguro reintentar.                            |
| Sigue procesándose | Emite `transactionResult` con `pending: true` y `status: 'payment_pending'`. |

---

## 10. Ejemplo de Integración Completa

### HTML

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Demo de Cubo Pago SDK</title>
  </head>
  <body>
    <h1>Demo de Cubo Pago SDK</h1>

    <button id="connectButton">Conectar a Lector</button>
    <hr />

    <h2>Realizar un Pago</h2>
    <label for="amountInput">Monto:</label>
    <input type="number" id="amountInput" placeholder="12.50" step="0.01" />

    <label for="currencySelect">Moneda:</label>
    <select id="currencySelect">
      <option value="0320" data-symbol="Q">Q (Quetzal)</option>
      <option value="0840" data-symbol="$" selected>USD (Dólar)</option>
    </select>

    <button id="payButton">Pagar ahora</button>

    <div id="loadingIndicator" style="display: none;">
      Procesando pago, por favor espera...
    </div>

    <div id="status">Estado: Desconectado</div>
    <pre id="result"></pre>

    <script src="https://sdk.cubopago.com/pos/v1.10.0/cubo-pos-sdk-web.js"></script>
    <script src="src/app.js"></script>
  </body>
</html>
```

### JavaScript (`src/app.js`)

```javascript
const connectBtn = document.getElementById('connectButton');
const payBtn = document.getElementById('payButton');
const statusDiv = document.getElementById('status');
const resultDiv = document.getElementById('result');
const loadingIndicator = document.getElementById('loadingIndicator');
const amountInput = document.getElementById('amountInput');
const currencySelect = document.getElementById('currencySelect');

// 1. Inicializa el SDK
const pos = new CuboPagoSDK({
  apiKey: 'TU_API_KEY_AQUI',
  environment: 'SANDBOX',
  enableMsi: true,
});

// 2. Escucha los eventos del SDK
pos.on('status', newStatus => {
  statusDiv.textContent = `Estado: ${newStatus}`;
});

pos.on('connected', data => {
  statusDiv.textContent = `Conectado a: ${data.deviceName}`;
  connectBtn.textContent = 'Desconectar';
});

pos.on('disconnected', () => {
  statusDiv.textContent = 'Estado: Desconectado';
  connectBtn.textContent = 'Conectar a Lector';
});

pos.on('loading', isLoading => {
  loadingIndicator.style.display = isLoading ? 'block' : 'none';
  payBtn.disabled = isLoading;
});

pos.on('transactionResult', result => {
  if (result.success) {
    resultDiv.textContent = `¡Pago procesado con éxito!\n${JSON.stringify(result.data, null, 2)}`;
  } else if (result.pending) {
    resultDiv.textContent = result.message;
  } else {
    resultDiv.textContent = `Error al procesar el pago: ${result.error.message}`;
  }
});

pos.on('error', error => {
  resultDiv.textContent = `Error: ${error.message}`;
});

// 3. Botones de acción
connectBtn.addEventListener('click', () => {
  if (pos.isConnected) {
    pos.disconnect();
  } else {
    pos.connect();
  }
});

payBtn.addEventListener('click', () => {
  resultDiv.textContent = '';
  statusDiv.textContent = 'Estado: Procesando...';

  const amountValue = amountInput.value;
  if (!amountValue || parseFloat(amountValue) <= 0) {
    alert('Por favor, ingresa un monto válido.');
    return;
  }

  const selectedOption = currencySelect.options[currencySelect.selectedIndex];
  const currencyCode = currencySelect.value;
  const currencySymbol = selectedOption.getAttribute('data-symbol');
  const amountInCents = Math.round(parseFloat(amountValue) * 100).toString();

  pos
    .startPayment({ amount: amountInCents, currencyCode, currencySymbol })
    .catch(err => console.error('No se pudo iniciar el pago:', err));
});
```

---

## 11. Ejemplo de Integración con React

Si trabajas con React, puedes integrar el SDK siguiendo estos pasos. Este ejemplo incluye soporte completo para MSI.

### Paso 1: Incluir el SDK en `index.html`

```html
<!-- public/index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>React App con Cubo Pago SDK</title>
  </head>
  <body>
    <div id="root"></div>
    <script src="https://sdk.cubopago.com/pos/v1.10.0/cubo-pos-sdk-web.js"></script>
  </body>
</html>
```

### Paso 2: Declaración de Tipos Global (TypeScript, opcional)

```typescript
// src/types/global.d.ts
declare global {
  interface Window {
    CuboPagoSDK: any;
  }
}

export {};
```

### Paso 3: Componente de React

```jsx
// src/components/CuboPayDemo.jsx
import React, { useState, useEffect, useRef } from 'react';

const API_KEY = import.meta.env.VITE_CUBO_API_KEY || 'TU_API_KEY_AQUI';
const ENVIRONMENT = import.meta.env.VITE_CUBO_ENVIRONMENT || 'SANDBOX';

function CuboPayDemo() {
  const posSDK = useRef(null);
  const [status, setStatus] = useState('Desconectado');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [amount, setAmount] = useState('10.00');
  const [currencyCode, setCurrencyCode] = useState('0840');

  const currencySymbols = { '0840': '$', '0320': 'Q', '0484': 'MXN' };

  useEffect(() => {
    if (window.CuboPagoSDK && !posSDK.current) {
      posSDK.current = new window.CuboPagoSDK({
        apiKey: API_KEY,
        environment: ENVIRONMENT,
        enableMsi: true,
      });

      const statusMessages = {
        searching: 'Buscando dispositivos...',
        connecting: 'Conectando...',
        verifying_pos: 'Verificando dispositivo...',
        preparing_pos_configuration: 'Preparando configuración...',
        configuring_pos: 'Configurando dispositivo...',
        waiting_for_card: 'Esperando tarjeta...',
        processing_payment: 'Procesando pago...',
        payment_success: '¡Pago exitoso!',
        payment_failed: 'Pago fallido',
        payment_pending: 'Pago pendiente de confirmación',
        verification_failed: 'Error: Verificación fallida',
        configuring_failed: 'Error: Configuración fallida',
      };

      posSDK.current.on('status', s => setStatus(statusMessages[s] || s));
      posSDK.current.on('connected', data => {
        setIsConnected(true);
        setStatus(`Conectado a: ${data.deviceName}`);
      });
      posSDK.current.on('disconnected', () => {
        setIsConnected(false);
        setStatus('Desconectado');
      });
      posSDK.current.on('loading', setIsLoading);
      posSDK.current.on('transactionResult', r => {
        if (r.success) {
          setResult(`¡Pago exitoso!\n${JSON.stringify(r.data, null, 2)}`);
        } else if (r.pending) {
          setResult(r.message);
        } else {
          setResult(`Error: ${r.error?.message || 'Error desconocido'}`);
        }
      });
      posSDK.current.on('error', e => setResult(`Error: ${e.message}`));
    }

    return () => {
      if (posSDK.current) {
        posSDK.current.removeAllListeners();
        if (posSDK.current.isConnected) posSDK.current.disconnect();
      }
    };
  }, []);

  const handleConnect = () => {
    if (!posSDK.current) return;
    isConnected
      ? posSDK.current.disconnect()
      : posSDK.current
          .connect()
          .catch(err => setResult(`Error: ${err.message}`));
  };

  const handlePay = () => {
    if (!posSDK.current || !isConnected)
      return alert('Conecta el lector primero.');
    if (!amount || parseFloat(amount) <= 0)
      return alert('Ingresa un monto válido.');

    setResult('');
    const amountInCents = Math.round(parseFloat(amount) * 100).toString();
    const currencySymbol = currencySymbols[currencyCode] || '$';

    posSDK.current
      .startPayment({ amount: amountInCents, currencyCode, currencySymbol })
      .catch(err => setResult(`Error: ${err.message}`));
  };

  return (
    <div
      style={{
        maxWidth: '500px',
        margin: 'auto',
        padding: '2rem',
        textAlign: 'center',
      }}>
      <h1>Cubo Pago SDK</h1>

      <button
        onClick={handleConnect}
        disabled={isLoading}
        style={{ width: '100%', padding: '1rem', margin: '1rem 0' }}>
        {isConnected ? 'Desconectar Lector' : 'Conectar Lector'}
      </button>

      <hr />
      <h2>Realizar un Pago</h2>

      <div style={{ margin: '1rem 0', textAlign: 'left' }}>
        <label>Monto:</label>
        <input
          type='number'
          value={amount}
          onChange={e => setAmount(e.target.value)}
          step='0.01'
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </div>

      <div style={{ margin: '1rem 0', textAlign: 'left' }}>
        <label>Moneda:</label>
        <select
          value={currencyCode}
          onChange={e => setCurrencyCode(e.target.value)}
          style={{ width: '100%', padding: '0.5rem' }}>
          <option value='0840'>USD (Dólar)</option>
          <option value='0320'>Q (Quetzal)</option>
          <option value='0484'>MXN (Peso mexicano)</option>
        </select>
      </div>

      <button
        onClick={handlePay}
        disabled={isLoading || !isConnected}
        style={{ width: '100%', padding: '1rem', margin: '1rem 0' }}>
        Pagar ahora
      </button>

      {isLoading && <p>Procesando, por favor espera...</p>}
      <p style={{ fontWeight: 'bold' }}>{status}</p>

      <pre
        style={{
          background: '#f0f0f0',
          padding: '1rem',
          borderRadius: '8px',
          textAlign: 'left',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}>
        <code>
          {result || 'El resultado de la transacción aparecerá aquí.'}
        </code>
      </pre>
    </div>
  );
}

export default CuboPayDemo;
```

---

## 12. Integración con Asistentes de IA

¿Usas un asistente de IA para programar? Este repo incluye archivos que le dan contexto sobre el SDK para que te ayude mejor — ya sea respondiendo preguntas, generando código de integración o explicando eventos y errores.

### Claude Code

Si usas [Claude Code](https://claude.ai/code), copia el skill incluido a tu proyecto:

```bash
cp -r .claude/skills/cubo-sdk-help [TU-PROYECTO]/.claude/skills/
```

Luego, desde cualquier conversación en tu proyecto, escribe `/cubo-sdk-help` y Claude tendrá contexto completo del SDK para ayudarte.

### Cursor, Copilot y otros LLMs

Copia el archivo `llms.txt` a la raíz de tu proyecto:

```bash
cp llms.txt [TU-PROYECTO]/llms.txt
```

Este archivo contiene la documentación del SDK en un formato optimizado para LLMs. Tu asistente lo usará como referencia cuando trabajes con el SDK.

---

## 13. Solución de Problemas

### La conexión falla después de seleccionar el dispositivo

**Síntoma:** Seleccionas el dispositivo POS en la ventana de Bluetooth del navegador, pero la conexión falla inmediatamente con un error como `bluetooth_connection_error` o "Connection attempt failed".

**Causa:** Este es un problema de entorno común con la API Web Bluetooth. Generalmente se debe a un conflicto con los drivers o el hardware Bluetooth de la computadora.

**Soluciones (en orden de probabilidad):**

#### 1. Quitar el dispositivo de la configuración de Windows

Esta es la solución más frecuente.

1. Ve a **Configuración > Bluetooth y dispositivos** en Windows.
2. Busca tu lector de tarjetas en la lista.
3. Haz clic en los tres puntos (`...`) y selecciona **"Quitar dispositivo"**.
4. Intenta conectar de nuevo desde tu aplicación web. No lo vincules manualmente desde Windows.

#### 2. Reiniciar el servicio de Bluetooth de Windows

1. Presiona `Win + R`.
2. Escribe `services.msc` y presiona Enter.
3. Busca el **"Servicio de compatibilidad con Bluetooth"**.
4. Haz clic derecho y selecciona **"Reiniciar"**.
5. Intenta conectar de nuevo.

#### 3. Usar un adaptador Bluetooth externo (Dongle USB)

Si el problema persiste en una máquina específica, es una señal muy fuerte de que el adaptador de Bluetooth interno o sus drivers son el problema.

- **La solución definitiva:** Usar un adaptador Bluetooth USB económico (conocido como "dongle"). Al conectarlo, Windows usará un conjunto de drivers diferente y limpio para el dongle, evitando el conflicto con el hardware interno. Esta prueba confirma al 100% si el problema es el hardware de la computadora.
