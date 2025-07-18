# Cubo Pago SDK Web - Guía de Usuario

Este documento proporciona una guía completa para integrar y utilizar el Cubo Pago SDK Web en tu aplicación.

## 1. Introducción

El **Cubo Pago SDK Web** permite a las aplicaciones web interactuar directamente con los lectores de tarjetas de Cubo Pago a través de una conexión Bluetooth. Con este SDK, puedes iniciar y gestionar transacciones de pago de forma sencilla y segura.

## 2. Prerrequisitos Técnicos

Antes de integrar el SDK, asegúrate de cumplir con los siguientes requisitos, ya que son indispensables para el funcionamiento de la **Web Bluetooth API**.

- **Contexto Seguro (HTTPS):** La Web Bluetooth API solo funciona en páginas servidas a través de un contexto seguro. Esto significa que tu sitio debe usar `https` en producción. Para el desarrollo local, `http://localhost` es considerado un contexto seguro.

- **Compatibilidad de Navegadores:** La Web Bluetooth API no es universalmente compatible. Funciona en:
  - **Chrome** (Desktop y Android)
  - **Edge** (Desktop)
  - **Opera** (Desktop y Android)
- No es compatible con Safari (macOS/iOS) ni con Firefox en ninguna plataforma.

## 3. Instalación

Para comenzar, incluye el script del SDK en tu archivo HTML. Asegúrate de que apunte a la ruta correcta donde has alojado el archivo `cubo-pos-sdk-web.js`.

```html
<script src="https://d7i6s3judz27s.cloudfront.net/pos/v1.1.1/cubo-pos-sdk-web.js"></script>
```

## 4. Inicialización del SDK

Para usar el SDK, primero debes crear una instancia de `CuboPagoSDK`, proporcionando tu `apiKey`.

> **Nota de Seguridad:** Tu `apiKey` es una credencial sensible. Debes obtenerla desde tu panel de control de Cubo Pago. En un entorno de producción, nunca expongas la `apiKey` directamente en el código del lado del cliente. La forma más segura es que tu backend la provea a la aplicación web después de que el usuario se haya autenticado.

```javascript
const pos = new CuboPagoSDK({
  apiKey: 'TU_API_KEY_AQUI', // ¡Reemplázala con tu clave real!
});
```

## 5. Funcionalidades Principales

### 5.1. Conexión con el Lector

La conexión con el lector de tarjetas se gestiona con los métodos `connect()` y `disconnect()`.

```javascript
const connectBtn = document.getElementById('connectButton');

connectBtn.addEventListener('click', () => {
  if (pos.isConnected) {
    pos.disconnect();
  } else {
    pos.connect(); // Abre el diálogo del navegador para seleccionar un dispositivo Bluetooth.
  }
});
```

### 5.2. Realizar un Pago

Para iniciar una transacción, utiliza el método `startPayment()`. Este método recibe un objeto con los detalles de la transacción.

**Parámetros de `startPayment`:**

- `amount` (string): El monto a cobrar, expresado en los centavos más pequeños de la moneda (ej., "1250" para $12.50).
- `currencyCode` (string): El código numérico ISO 4217 de la moneda (ej., "0840" para USD).
- `currencySymbol` (string): El símbolo de la moneda (ej., "$").

```javascript
const payBtn = document.getElementById('payButton');

payBtn.addEventListener('click', () => {
  const amountInCents = '1250'; // Representa $12.50
  const currencyCode = '0840'; // USD
  const currencySymbol = '$';

  pos
    .startPayment({ amount: amountInCents, currencyCode, currencySymbol })
    .catch(err => console.error('No se pudo iniciar el pago:', err));
});
```

### 5.3. Escuchar Eventos del SDK

El SDK emite eventos para mantener tu aplicación informada sobre el estado del proceso. Puedes escucharlos usando el método `on()`.

A continuación se detallan los eventos y los datos que emiten:

- **`connected`**: Se dispara cuando la conexión con el lector de tarjetas es exitosa.

  - **Datos emitidos**: `(data: { deviceName: string })` - Un objeto que contiene el nombre del dispositivo conectado.

  ###

  ```javascript
  pos.on('connected', data => {
    console.log(`Conectado a: ${data.deviceName}`);
  });
  ```

- **`disconnected`**: Se dispara cuando el lector se desconecta, ya sea de forma intencionada o por pérdida de señal.

  - **Datos emitidos**: `void` - No se emiten datos con este evento.

  ###

  ```javascript
  pos.on('disconnected', () => {
    console.log('Desconectado del lector.');
  });
  ```

- **`status`**: Informa sobre los cambios de estado en el flujo de conexión y pago. Es útil para mostrar mensajes al usuario.

  - **Datos emitidos**: `(status: string)` - Una cadena de texto que puede tener los siguientes valores:
    - `'searching'`: Buscando dispositivos Bluetooth.
    - `'connecting'`: Conectando con el dispositivo seleccionado.
    - `'connected'`: Conexión establecida.
    - `'disconnected'`: Sin conexión.
    - `'waiting_for_card'`: Lector listo y esperando que se presente una tarjeta.
    - `'processing_payment'`: Procesando la información de la tarjeta.
    - `'payment_success'`: La transacción se completó con éxito.
    - `'payment_failed'`: La transacción falló.
    ###

  ```javascript
  pos.on('status', newStatus => {
    console.log('Nuevo estado:', newStatus);
  });
  ```

- **`loading`**: Se activa para indicar que el SDK está realizando una operación asíncrona (como procesar un pago) y la UI debería bloquearse.

  - **Datos emitidos**: `(isLoading: boolean)` - `true` cuando comienza una operación, `false` cuando termina.

  ###

  ```javascript
  pos.on('loading', isLoading => {
    if (isLoading) {
      // Muestra un indicador de carga y deshabilita botones.
    } else {
      // Oculta el indicador de carga.
    }
  });
  ```

- **`transactionResult`**: Devuelve el resultado final de la transacción después de ser procesada por el servidor de Cubo Pago.

  - **Datos emitidos**: `(result: { success: boolean, data?: any, error?: any })` - Un objeto con el resultado.
    - `success`: `true` si el pago fue exitoso, `false` si no lo fue.
    - `data`: Si `success` es `true`, contiene el objeto de respuesta de la API de Cubo Pago.
    - `error`: Si `success` es `false`, contiene el objeto de error.
    ###

  ```javascript
  pos.on('transactionResult', result => {
    if (result.success) {
      console.log('Pago exitoso:', result.data);
    } else {
      console.error('Error en el pago:', result.error.message);
    }
  });
  ```

- **`error`**: Se emite cuando ocurre un error general en el SDK o en el proceso de comunicación.

  - **Datos emitidos**: `(error: { type: string, message: string })` - Un objeto que describe el error.
    - `type`: Una cadena que categoriza el error (ej: `'connection_failed'`, `'not_connected'`, `'sdk_error'`).
    - `message`: Una descripción del error.
    ###

  ```javascript
  pos.on('error', error => {
    console.error(`Error del SDK (${error.type}):`, error.message);
  });
  ```

## 6. Ejemplo de Integración Completa

Aquí tienes un ejemplo básico que puedes usar como punto de partida para tu integración. Las rutas de los scripts están corregidas para que coincidan con la estructura del proyecto.

### HTML (`demo.html`)

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
    <input
      type="number"
      id="amountInput"
      placeholder="12.50"
      step="0.01"
      value="12.50" />

    <label for="currencySelect">Moneda:</label>
    <select id="currencySelect">
      <option value="0484" data-symbol="MXN">MXN</option>
      <option value="0840" data-symbol="$" selected>USD</option>
      <option value="0978" data-symbol="€">EUR</option>
    </select>

    <button id="payButton">Pagar</button>

    <div id="loadingIndicator" style="display: none;">Procesando...</div>

    <h3>Estado del Lector</h3>
    <div id="status">Desconectado</div>

    <h3>Resultado de la Transacción</h3>
    <pre id="result"></pre>

    <!-- Rutas corregidas para apuntar a la carpeta src -->
    <script src="https://d7i6s3judz27s.cloudfront.net/pos/v1.1.1/cubo-pos-sdk-web.js"></script>
    <script src="src/app.js"></script>
  </body>
</html>
```

### JavaScript (`src/app.js`)

```javascript
document.addEventListener('DOMContentLoaded', () => {
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
  });

  // 2. Gestiona la conexión
  connectBtn.addEventListener('click', () => {
    if (pos.isConnected) {
      pos.disconnect();
    } else {
      pos.connect();
    }
  });

  // 3. Realiza el pago
  payBtn.addEventListener('click', () => {
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
      .catch(err => {
        resultDiv.textContent = `Error al iniciar pago: ${err.message}`;
      });
  });

  // 4. Escucha los eventos del SDK
  pos.on('connected', data => {
    statusDiv.textContent = `Conectado a: ${data.deviceName}`;
    connectBtn.textContent = 'Desconectar';
  });

  pos.on('disconnected', () => {
    statusDiv.textContent = 'Desconectado';
    connectBtn.textContent = 'Conectar a Lector';
  });

  pos.on('status', newStatus => {
    statusDiv.textContent = `Estado: ${newStatus}`;
  });

  pos.on('loading', isLoading => {
    loadingIndicator.style.display = isLoading ? 'block' : 'none';
    payBtn.disabled = isLoading;
    connectBtn.disabled = isLoading;
  });

  pos.on('transactionResult', result => {
    if (result.success) {
      resultDiv.textContent = `Pago exitoso!\n${JSON.stringify(
        result.data,
        null,
        2
      )}`;
    } else {
      resultDiv.textContent = `Error en la transacción: ${result.error.message}`;
    }
  });

  pos.on('error', error => {
    resultDiv.textContent = `Error del SDK: ${error.message}`;
  });
});
```

## 7. Ejemplo de Integración con React

Si trabajas con React, puedes integrar el SDK siguiendo estos pasos. Este ejemplo asume que tienes un proyecto de React funcional (creado con Vite o Create React App).

### Paso 1: Incluir el SDK en `index.html`

Añade la etiqueta `<script>` a tu archivo `public/index.html` para que el SDK esté disponible globalmente en tu aplicación.

```html
<!-- public/index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    ...
    <title>React App con Cubo Pago SDK</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>

    <!-- Carga el SDK de Cubo Pago -->
    <script src="https://d7i6s3judz27s.cloudfront.net/pos/v1.1.1/cubo-pos-sdk-web.js"></script>
  </body>
</html>
```

### Paso 2: Declaración de Tipos Global (Opcional, para TypeScript)

Si tu proyecto utiliza TypeScript, es una buena práctica crear un archivo de definición de tipos (ej: `src/types/global.d.ts`) para informar a TypeScript sobre la existencia de `CuboPagoSDK` en el objeto `window`.

```typescript
// src/types/global.d.ts
declare global {
  interface Window {
    // La clase del SDK se adjunta al objeto window
    CuboPagoSDK: any;
  }
}

// Es necesario exportar algo para que el archivo sea tratado como un módulo
export {};
```

### Paso 3: Crear un Componente de React

Ahora, crea un componente que encapsule toda la lógica para interactuar con el SDK. Este componente manejará el estado, los eventos y las acciones del usuario. Para facilitar la visualización, este ejemplo incluye estilos en línea.

```jsx
// src/components/CuboPayDemo.jsx
import React, { useState, useEffect, useRef } from 'react';

// ¡IMPORTANTE! Guarda tu API Key de forma segura, por ejemplo, en variables de entorno.
// No la expongas directamente en el código del cliente en un entorno de producción.
const API_KEY = 'TU_API_KEY_AQUI';

function CuboPayDemo() {
  const posSDK = useRef(null);
  const amountInputRef = useRef(null);
  const currencySelectRef = useRef(null);

  const [status, setStatus] = useState('Estado: Desconectado');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // useEffect para inicializar y limpiar el SDK
  useEffect(() => {
    // Comprueba que el SDK se haya cargado en window y que no se haya inicializado ya
    if (window.CuboPagoSDK && !posSDK.current) {
      console.log('Inicializando CuboPagoSDK...');
      posSDK.current = new window.CuboPagoSDK({ apiKey: API_KEY });

      // --- Configuración de Listeners del SDK ---
      posSDK.current.on('status', newStatus => {
        setStatus(`Estado: ${newStatus}`);
      });

      posSDK.current.on('connected', data => {
        setIsConnected(true);
        setStatus(`Conectado a: ${data.deviceName}`);
      });

      posSDK.current.on('disconnected', () => {
        setIsConnected(false);
        setStatus('Estado: Desconectado');
      });

      posSDK.current.on('loading', loading => {
        setIsLoading(loading);
      });

      posSDK.current.on('transactionResult', txResult => {
        if (txResult.success) {
          setResult(
            `¡Pago exitoso!\n${JSON.stringify(txResult.data, null, 2)}`
          );
        } else {
          setResult(
            `Error en pago: ${txResult.error?.message || 'Error desconocido'}`
          );
        }
      });

      posSDK.current.on('error', error => {
        setResult(`Error del SDK: ${error.message}`);
      });
    }

    // --- Función de Limpieza ---
    // Se ejecuta cuando el componente se desmonta para desconectar el lector
    // y evitar conexiones activas si el usuario navega a otra página.
    return () => {
      if (posSDK.current?.isConnected) {
        console.log('Desconectando lector al salir...');
        posSDK.current.disconnect();
      }
    };
  }, []); // El array vacío [] asegura que este efecto se ejecute solo una vez (al montar/desmontar)

  const handleConnect = () => {
    if (!posSDK.current) return;
    if (isConnected) {
      posSDK.current.disconnect();
    } else {
      posSDK.current.connect().catch(err => {
        setResult(`Error al conectar: ${err.message}`);
      });
    }
  };

  const handlePay = () => {
    if (!posSDK.current || !isConnected) {
      alert('Por favor, conecta el lector primero.');
      return;
    }

    const amount = amountInputRef.current.value;
    const selectedOption =
      currencySelectRef.current.options[
        currencySelectRef.current.selectedIndex
      ];
    const currencyCode = selectedOption.value;
    const currencySymbol = selectedOption.getAttribute('data-symbol') || '$';

    if (!amount || parseFloat(amount) <= 0) {
      alert('Por favor, ingresa un monto válido.');
      return;
    }

    const amountInCents = Math.round(parseFloat(amount) * 100).toString();

    posSDK.current
      .startPayment({
        amount: amountInCents,
        currencyCode,
        currencySymbol,
      })
      .catch(err => {
        setResult(`Error al iniciar pago: ${err.message}`);
      });
  };

  return (
    <div
      className='container'
      style={{
        maxWidth: '500px',
        margin: 'auto',
        padding: '2rem',
        textAlign: 'center',
      }}>
      <h1>Demo de Cubo Pago SDK (React)</h1>
      <p>Conecta tu lector de tarjetas y realiza un pago de prueba.</p>

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
          ref={amountInputRef}
          defaultValue='10.00'
          step='0.01'
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </div>
      <div style={{ margin: '1rem 0', textAlign: 'left' }}>
        <label>Moneda:</label>
        <select
          ref={currencySelectRef}
          defaultValue='0840'
          style={{ width: '100%', padding: '0.5rem' }}>
          <option value='0484' data-symbol='MXN'>
            MXN (Peso mexicano)
          </option>
          <option value='0840' data-symbol='$'>
            USD (Dólar estadounidense)
          </option>
          <option value='0978' data-symbol='€'>
            EUR (Euro)
          </option>
        </select>
      </div>
      <button
        onClick={handlePay}
        disabled={isLoading || !isConnected}
        style={{ width: '100%', padding: '1rem', margin: '1rem 0' }}>
        Pagar ahora
      </button>

      {isLoading && <p>Procesando, por favor espera...</p>}

      <div style={{ marginTop: '2rem', fontWeight: 'bold' }}>
        <p>{status}</p>
      </div>

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

## Solución de Problemas (Troubleshooting)

### Error: La conexión falla después de seleccionar el dispositivo

**Síntoma:**

Seleccionas el dispositivo POS en la ventana de Bluetooth del navegador, pero la conexión falla inmediatamente y recibes un error como `bluetooth_connection_error` o "Connection attempt failed". Este problema suele ocurrir en computadoras con Windows específicas, mientras que en otras máquinas funciona sin problemas.

**Causa:**

Este es un problema de entorno común con la API Web Bluetooth y casi nunca es un error en tu código. Generalmente, se debe a un conflicto con los drivers o el hardware de Bluetooth de la computadora, o a una conexión anterior que se quedó "atascada" en el sistema operativo.

**Soluciones (en orden de probabilidad):**

#### 1. Quitar el Dispositivo de la Configuración de Windows (Solución Más Común)

Esta es la solución más frecuente y sencilla.

1.  Ve a **Configuración > Bluetooth y dispositivos** en Windows.
2.  Busca tu lector de tarjetas en la lista de dispositivos.
3.  Haz clic en los tres puntos (`...`) y selecciona **"Quitar dispositivo"**.
4.  Intenta conectar de nuevo desde tu aplicación web. No intentes vincularlo manualmente desde Windows.

#### 2. Reiniciar el Servicio de Bluetooth de Windows

Si lo anterior no funciona, reiniciar el servicio de Bluetooth puede resolver el conflicto.

1.  Presiona las teclas `Win + R`.
2.  Escribe `services.msc` y presiona Enter.
3.  Busca en la lista el **"Servicio de compatibilidad con Bluetooth"** (o similar).
4.  Haz clic derecho sobre él y selecciona **"Reiniciar"**.
5.  Intenta conectar de nuevo.

#### 3. Probar con un Adaptador Bluetooth Externo (Dongle USB)

Si el problema persiste en una máquina específica, es una señal muy fuerte de que el adaptador de Bluetooth interno o sus drivers son el problema.

- **La solución definitiva:** Usar un adaptador Bluetooth USB económico (conocido como "dongle"). Al conectarlo, Windows usará un conjunto de drivers diferente y limpio para el dongle, evitando el conflicto con el hardware interno. Esta prueba confirma al 100% si el problema es el hardware de la computadora.
