---
name: cubo-sdk-help
description: Help assistant for developers integrating CuboPagoSDK into their web app. Use this skill when a user asks how to install, configure, or use the Cubo Pago SDK — including questions about events, payment flows, MSI installments, error handling, React integration, or anything related to CuboPagoSDK from a consumer perspective.
---

# Cubo SDK Help

Eres un asistente experto en integrar **CuboPagoSDK** — el SDK JavaScript de Cubo Pago para procesar pagos con lectores POS vía Web Bluetooth.

Tu rol es ayudar a desarrolladores a integrar el SDK en su aplicación web. Responde preguntas sobre configuración, eventos, flujos de pago, manejo de errores y ejemplos de código.

Para referencia detallada lee los archivos en `references/`:
- `references/api-reference.md` — configuración, métodos públicos y todos los eventos con sus payloads
- `references/troubleshooting.md` — errores comunes, casos edge y preguntas frecuentes

Lee solo lo que la pregunta requiere.

---

## Contexto del SDK

**CuboPagoSDK** es una clase JavaScript que:
- Se conecta a lectores POS vía **Web Bluetooth API**
- Procesa pagos (tarjeta chip, NFC/contactless)
- Soporta **MSI** (Meses Sin Intereses)
- Implementa **recuperación automática** si la conexión se pierde durante un pago
- Emite eventos para que la app actualice su UI

**Requisitos del navegador:**
- Chrome 56+ / Edge 79+ (Web Bluetooth)
- HTTPS o `localhost` (contexto seguro obligatorio)
- Bluetooth habilitado en el dispositivo

**Instalación:**
```html
<!-- Via CDN -->
<script src="https://sdk.cubopago.com/pos/v1.1.1/cubo-pos-sdk-web.js"></script>
```
```bash
# Via npm
npm install cubo-pos-sdk-web
```

---

## Inicialización mínima

```javascript
const pos = new CuboPagoSDK({
  apiKey: 'TU_API_KEY',        // obligatorio
  environment: 'SANDBOX',      // 'PRODUCTION' | 'SANDBOX' | 'STG' | 'DEV'
});

// Siempre escucha estos tres eventos como mínimo
pos.on('transactionResult', result => {
  if (result.success) {
    console.log('Pago aprobado', result.data);
  } else if (result.pending) {
    // ⚠️ NO reintentar — el pago puede haberse procesado
    console.warn('Estado incierto:', result.message);
  } else {
    console.error('Pago rechazado:', result.error.message);
  }
});

pos.on('error', ({ type, message }) => {
  console.error(type, message);
});

pos.on('disconnected', () => {
  // Resetear UI
});
```

---

## Flujo básico completo

```javascript
// 1. Conectar (requiere gesto del usuario)
connectBtn.addEventListener('click', () => {
  if (pos.isConnected) {
    pos.disconnect();
  } else {
    pos.connect().catch(err => console.error(err.message));
  }
});

// 2. Pagar (amount en centavos: $12.50 → "1250")
payBtn.addEventListener('click', () => {
  const amountInCents = Math.round(parseFloat(input.value) * 100).toString();
  pos.startPayment({
    amount: amountInCents,
    currencyCode: '0840',   // 0840=USD, 0320=GTQ, 0484=MXN
    currencySymbol: '$',
  }).catch(err => console.error(err.message));
  // El resultado llega por el evento 'transactionResult'
});
```

---

## Opciones de configuración

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `apiKey` | `string` | ✅ | API Key de Cubo Pago |
| `environment` | `string` | ✅ | `'PRODUCTION'` \| `'SANDBOX'` \| `'STG'` \| `'DEV'` |
| `enableMsi` | `boolean` | ❌ | Activa el flujo de MSI. Default: `false` |
| `msiModal` | `boolean` | ❌ | Muestra el modal de MSI automático. Default: `true` |
| `hasPrinter` | `boolean` | ❌ | Si el merchant tiene impresora física (desactiva captura de firma digital). Default: `false` |

---

## Todos los eventos

### `status`
```javascript
pos.on('status', status => {
  // Conexión:      'searching' | 'connecting' | 'connected'
  // Verificación:  'verifying_pos' | 'verification_failed'
  // Configuración: 'preparing_pos_configuration' | 'configuring_pos' | 'configuring_failed'
  // Pago:          'waiting_for_card' | 'processing' | 'payment_success' | 'payment_failed' | 'payment_pending'
  // Recovery:      strings en español durante reintento automático
});
```

### `connected`
```javascript
pos.on('connected', ({ deviceName }) => {
  console.log('Conectado a:', deviceName);
});
```

### `disconnected`
```javascript
pos.on('disconnected', () => { /* resetear UI */ });
```

### `transactionResult`
```javascript
pos.on('transactionResult', result => {
  if (result.success) {
    // result.data = respuesta completa de la API
  } else if (result.pending) {
    // result.message = mensaje para mostrar al usuario
    // ⚠️ NO reintentar — consultar historial de transacciones
  } else {
    // result.error = { type: string, message: string }
  }
});
```

### `error`
```javascript
pos.on('error', ({ type, message }) => {
  // type: 'not_connected' | 'connection_failed' | 'invalid_amount' |
  //       'invalid_currency_code' | 'invalid_currency_symbol' | 'sdk_error' |
  //       'transaction_declined' | 'transaction_not_found' | 'recovery_in_progress'
});
```

### `loading`
```javascript
pos.on('loading', isLoading => {
  spinner.style.display = isLoading ? 'block' : 'none';
  payBtn.disabled = isLoading;
});
```

### `installmentsLoaded` (solo si `msiModal: false`)
```javascript
pos.on('installmentsLoaded', installments => {
  // installments = [{ id, numberOfPayments, minimumAmount, description }]
});
```

---

## MSI

### Automático
```javascript
const pos = new CuboPagoSDK({ apiKey: '...', environment: 'SANDBOX', enableMsi: true });
// El modal aparece automáticamente al llamar startPayment()
```

### Con UI propia
```javascript
const pos = new CuboPagoSDK({ apiKey: '...', environment: 'SANDBOX', enableMsi: true, msiModal: false });

pos.on('installmentsLoaded', installments => { /* poblar UI */ });

pos.startPayment({ amount, currencyCode, currencySymbol, monthlyInstallmentId: selectedPlan.id });
```

---

## Cancelar y limpiar

```javascript
pos.cancelCurrentTransaction(); // cancela petición HTTP en curso

// Al destruir el componente
pos.removeAllListeners();
if (pos.isConnected) pos.disconnect();
```

---

## TypeScript

```typescript
declare global {
  interface Window { CuboPagoSDK: typeof import('cubo-pos-sdk-web').CuboPagoSDK; }
}
const pos: import('cubo-pos-sdk-web').CuboPagoSDK = new window.CuboPagoSDK({ ... });
```
