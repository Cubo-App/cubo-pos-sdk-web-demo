# Integration Guide Reference

## Minimum Required Setup

```javascript
const pos = new CuboPagoSDK({
  apiKey: 'YOUR_API_KEY',
  environment: 'SANDBOX', // 'PRODUCTION' | 'SANDBOX' | 'STG' | 'DEV'
});

// These three are the minimum event handlers
pos.on('transactionResult', result => {
  if (result.success) { /* approved */ }
  else if (result.pending) {
    // DO NOT retry — payment may have been processed
    // Show user: result.message
  } else {
    // result.error.type tells you what happened
  }
});

pos.on('error', error => {
  console.error(error.type, error.message);
});

pos.on('disconnected', () => {
  // Update UI — reset to disconnected state
});
```

## Full Event Handler Reference

```javascript
pos.on('status', status => {
  // status is a string — either a StatusEventTypesEnum value or a recovery message
  // Use to drive UI state machine
});

pos.on('connected', ({ deviceName }) => {
  // Safe to call startPayment() after this
});

pos.on('disconnected', () => {
  // Clear UI, disable pay button
});

pos.on('loading', isLoading => {
  // Disable/enable pay button and other interactive elements
});

pos.on('transactionResult', result => {
  if (result.success) {
    // result.data = full API response
  } else if (result.pending) {
    // result.message = user-facing message
    // Do NOT retry — check transaction history first
  } else {
    // result.error = { type, message }
  }
});

pos.on('error', ({ type, message }) => {
  // type values: 'not_connected' | 'connection_failed' | 'invalid_amount' |
  //   'invalid_currency_code' | 'invalid_currency_symbol' | 'sdk_error' |
  //   'transaction_declined' | 'transaction_not_found' | 'recovery_in_progress'
});
```

## Connection Flow

```javascript
// Requires user gesture (button click)
connectBtn.addEventListener('click', async () => {
  if (pos.isConnected) {
    pos.disconnect();
  } else {
    try {
      await pos.connect();
    } catch (e) {
      // Browser doesn't support Bluetooth, or user cancelled dialog
    }
  }
});
```

## Payment Flow

```javascript
payBtn.addEventListener('click', () => {
  if (!pos.isConnected) return;

  // amount is in smallest currency unit (centavos)
  // $12.50 = "1250"
  const amountInCents = Math.round(parseFloat(amountInput.value) * 100).toString();

  pos.startPayment({
    amount: amountInCents,
    currencyCode: '0840', // ISO 4217: 0840=USD, 0320=GTQ, 0484=MXN
    currencySymbol: '$',
  }).catch(err => {
    // Sync validation errors (not connected, invalid amount, etc.)
    console.error(err.message);
  });
  // Async result comes via 'transactionResult' event
});
```

## MSI Integration

### Automatic (recommended)
```javascript
const pos = new CuboPagoSDK({
  apiKey: '...',
  environment: 'SANDBOX',
  enableMsi: true, // SDK shows modal automatically
});
// No extra code needed — modal appears on startPayment()
```

### Manual UI
```javascript
const pos = new CuboPagoSDK({
  apiKey: '...',
  environment: 'SANDBOX',
  enableMsi: true,
  msiModal: false, // SDK does NOT show modal
});

pos.on('installmentsLoaded', installments => {
  // installments = [{ id, numberOfPayments, minimumAmount, description }]
  // Populate your own UI
});

// When user selects a plan and clicks pay:
pos.startPayment({
  amount: amountInCents,
  currencyCode: '0840',
  currencySymbol: '$',
  monthlyInstallmentId: selectedInstallment.id,
});
```

## Cancellation

```javascript
cancelBtn.addEventListener('click', () => {
  const cancelled = pos.cancelCurrentTransaction();
  // cancelled = true if a payment or recovery was in progress
});
```

## Cleanup (React / SPA)

Always clean up on unmount to avoid memory leaks:

```javascript
// React
useEffect(() => {
  return () => {
    pos.removeAllListeners();
    if (pos.isConnected) pos.disconnect();
  };
}, []);

// Vanilla JS
window.addEventListener('beforeunload', () => {
  pos.removeAllListeners();
  pos.disconnect();
});
```

## Common Mistakes

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Not handling `pending` | User retries → potential double charge | Always check `result.pending` before retry |
| Not calling `removeAllListeners()` | Memory leak, duplicate events | Call on component destroy |
| Not handling `disconnected` | UI stuck in loading state | Reset UI state on disconnect |
| Using `amount` in dollars | Validation error or wrong charge | Always convert to centavos first |
| Calling `startPayment()` without user gesture for connect | Browser blocks Bluetooth | Always connect via button click |
| Not handling `recovery_in_progress` error | Confusing UX | Show "please wait" message, disable pay button |

## TypeScript Integration

```typescript
// global.d.ts
declare global {
  interface Window {
    CuboPagoSDK: typeof import('cubo-pos-sdk-web').CuboPagoSDK;
  }
}

// Usage with types
import type { CuboPagoSDK } from 'cubo-pos-sdk-web';
const pos: CuboPagoSDK = new window.CuboPagoSDK({ ... });
```
