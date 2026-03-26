# Troubleshooting & FAQ

## El botón conectar no abre el selector Bluetooth

**Causa 1: No estás en HTTPS ni localhost**
```bash
npx serve . -l 3000
# Abrir: http://localhost:3000/demo.html
```

**Causa 2:** Bluetooth deshabilitado en el sistema operativo.

**Causa 3:** Navegador incompatible (Firefox/Safari no soportan Web Bluetooth).

**Causa 4:** El constructor del SDK lanzó un error — los listeners nunca se registraron. Revisar la consola del navegador.

---

## `transactionResult` nunca llega

- Verifica que registraste el listener **antes** de llamar `startPayment()`
- El resultado siempre llega de forma asíncrona

---

## El pago quedó en `pending: true`

El SDK no pudo confirmar si el pago se procesó. **No reintentar automáticamente.**

```javascript
pos.on('transactionResult', result => {
  if (result.pending) {
    showMessage(result.message); // Mostrar al usuario
    // Consultar historial en el backend antes de decidir
  }
});
```

---

## Eventos duplicados / memory leaks

```javascript
// ❌ En React — registra listeners en cada render
pos.on('status', handler);

// ✅
useEffect(() => {
  pos.on('status', handler);
  return () => pos.removeAllListeners();
}, []); // [] = solo al montar/desmontar
```

---

## Error `recovery_in_progress`

Intentaste iniciar un pago mientras el SDK verifica una transacción anterior.

```javascript
pos.on('error', ({ type }) => {
  if (type === 'recovery_in_progress') {
    payBtn.disabled = true; // esperar resultado
  }
});
```

---

## Modal MSI no aparece

Verifica que pasaste `enableMsi: true`:
```javascript
new CuboPagoSDK({ apiKey: '...', environment: 'SANDBOX', enableMsi: true });
```

---

## Integración React — patrón correcto

```javascript
const posRef = useRef(new window.CuboPagoSDK({ apiKey: '...', environment: 'SANDBOX' }));

useEffect(() => {
  const pos = posRef.current;
  pos.on('transactionResult', handleResult);
  pos.on('error', handleError);
  pos.on('disconnected', handleDisconnect);
  return () => pos.removeAllListeners();
}, []);
```

---

## Tabla de problemas rápidos

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Botón no abre Bluetooth | No HTTPS / constructor falló | Usar localhost, revisar consola |
| `transactionResult` no llega | Listener tardío | Registrar antes de `startPayment()` |
| Eventos duplicados | Múltiples `pos.on()` | `removeAllListeners()` al desmontar |
| `pending: true` | Error de red | No reintentar, consultar backend |
| Modal MSI no aparece | `enableMsi: false` | Pasar `enableMsi: true` |
| `recovery_in_progress` | Pago durante recovery | Deshabilitar botón hasta `transactionResult` |
| Navegador no compatible | Firefox / Safari | Solo Chrome 56+ / Edge 79+ |
