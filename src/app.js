// =================================================================
// CUBO PAGO SDK - EJEMPLO DE IMPLEMENTACIÓN
// =================================================================
// Flujo: Inicializar SDK → Conectar POS → Iniciar pago → Escuchar resultado
// Requisitos: Navegador con Web Bluetooth (Chrome 56+), HTTPS, API Key
// =================================================================

const amountInput = document.getElementById('amountInput');
const currencySelect = document.getElementById('currencySelect');
const connectBtn = document.getElementById('connectButton');
const payBtn = document.getElementById('payButton');
const statusDiv = document.getElementById('status');
const resultDiv = document.getElementById('result');
const loadingIndicator = document.getElementById('loadingIndicator');

// 2. CONFIGURACIÓN DEL SDK
// ⚠️ En producción, NUNCA expongas tu API Key en el frontend
const apiKey = 'TU_API_KEY_AQUI'; // ⚠️ En producción, nunca expongas tu API Key en el frontend
const environment = 'SANDBOX'; // 'DEV', 'STG', 'SANDBOX' o 'PRODUCTION'

// Advertencia visible si el SDK no está bien configurado
const missingApiKey = !apiKey || apiKey === 'TU_API_KEY_AQUI';
const missingEnvironment = !environment;
if (missingApiKey || missingEnvironment) {
  let msg = '⚠️ ';
  if (missingApiKey && missingEnvironment) {
    msg += 'Falta configurar apiKey y environment en src/app.js';
  } else if (missingApiKey) {
    msg += 'Falta configurar apiKey en src/app.js';
  } else {
    msg += 'Falta configurar environment en src/app.js';
  }
  const banner = document.createElement('div');
  banner.textContent = msg;
  banner.style.cssText =
    'position:fixed;top:0;left:0;right:0;background:#b45309;color:#fff;text-align:center;padding:0.7rem 1rem;font-size:0.85rem;font-family:sans-serif;z-index:99999;';
  document.body.prepend(banner);
}

let pos;
try {
  pos = new CuboPagoSDK({
    apiKey,
    environment,
    enableMsi: true,
    // msiModal: false, // Descomenta para manejar el modal de MSI con tu propia UI
    // hasPrinter: true, // Descomenta si el merchant tiene impresora (desactiva captura digital de firma)
  });
} catch (e) {
  statusDiv.textContent = `Error al inicializar SDK: ${e.message}`;
  throw e;
}

// 3. EVENT LISTENERS DEL SDK
// El SDK emite eventos durante el flujo de pago. Registra listeners para actualizar la UI.

// 'status': Cambios de estado (searching, connecting, connected, waiting_for_card, etc.)
pos.on('status', newStatus => {
  console.log('Nuevo estado:', newStatus);
  statusDiv.textContent = `Estado: ${newStatus}`;
});

// 'connected': Conexión exitosa con el dispositivo
pos.on('connected', data => {
  statusDiv.textContent = `Conectado a: ${data.deviceName}`;
  connectBtn.textContent = 'Desconectar';
});

// 'disconnected': Dispositivo desconectado
pos.on('disconnected', () => {
  statusDiv.textContent = 'Estado: Desconectado';
  connectBtn.textContent = 'Conectar a Lector';
});

// 'error': Errores durante la operación. Recibe: { type, message }
pos.on('error', error => {
  console.error('Error en el POS:', error);
  resultDiv.textContent = `Error: ${error.message}`;
});

// 'loading': Indicador de procesamiento (true/false)
pos.on('loading', isLoading => {
  loadingIndicator.style.display = isLoading ? 'block' : 'none';
  payBtn.disabled = isLoading;
});

// 'transactionResult': Resultado final. Recibe: { success, data?, error?, pending?, message? }
pos.on('transactionResult', result => {
  if (result.success) {
    resultDiv.textContent = `¡Pago procesado con éxito!\n${JSON.stringify(
      result.data,
      null,
      2,
    )}`;
  } else if (result.pending) {
    resultDiv.textContent = result.message;
  } else {
    resultDiv.textContent = `Error al procesar el pago: ${result.error.message}`;
  }
});

// 4. BOTONES DE ACCIÓN

// Conectar/Desconectar POS vía Bluetooth
connectBtn.addEventListener('click', () => {
  if (pos.isConnected) {
    pos.disconnect();
  } else {
    pos.connect().catch(err => {
      statusDiv.textContent = `Error: ${err.message}`;
    });
  }
});

// Realizar Pago
payBtn.addEventListener('click', () => {
  // Limpiar estado anterior
  resultDiv.textContent = '';
  statusDiv.textContent = 'Estado: Procesando...';

  const amountValue = amountInput.value;
  const currencyCode = currencySelect.value;

  // Validar entrada
  if (!amountValue || parseFloat(amountValue) <= 0) {
    alert('Por favor, ingresa un monto válido.');
    return;
  }

  // Convertir a centavos (ej: "12.50" -> "1250")
  const amountInCents = Math.round(parseFloat(amountValue) * 100).toString();

  // Determinar símbolo de moneda
  let currencySymbol = '$';
  switch (currencyCode) {
    case '0320': // Quetzal
      currencySymbol = 'Q';
      break;
    case '0840': // Dolar
      currencySymbol = '$';
      break;
    default:
      currencySymbol = '$';
      break;
  }

  console.log(
    `Iniciando pago por ${amountInCents} centavos en moneda ${currencyCode}`,
  );

  // Iniciar pago con el SDK (si enableMsi: true, el SDK mostrará el modal de tipo de pago)
  pos
    .startPayment({ amount: amountInCents, currencyCode, currencySymbol })
    .catch(err => console.error('No se pudo iniciar el pago:', err));
});

// =================================================================
// 5. EJEMPLOS AVANZADOS (COMENTADOS)
// =================================================================
// Descomenta estos ejemplos según tus necesidades

// --- MANEJAR ESTADOS DE VERIFICACIÓN Y CONFIGURACIÓN DEL POS ---
// Durante la conexión, el SDK verifica el dispositivo y puede requerir configuración EMV
/*
pos.on('status', (status) => {
  switch(status) {
    case 'verifying_pos':
      console.log('Verificando dispositivo con el servidor...');
      statusDiv.textContent = 'Verificando dispositivo...';
      break;
    case 'preparing_pos_configuration':
      console.log('Se detectó actualización de configuración EMV requerida');
      statusDiv.textContent = 'Preparando configuración del dispositivo...';
      break;
    case 'configuring_pos':
      console.log('Descargando y aplicando configuración EMV...');
      statusDiv.textContent = 'Configurando dispositivo...';
      break;
    case 'verification_failed':
      console.error('Falló la verificación del dispositivo');
      statusDiv.textContent = 'Error: Verificación fallida';
      break;
    case 'configuring_failed':
      console.error('Falló la configuración EMV');
      statusDiv.textContent = 'Error: Configuración fallida';
      break;
    case 'connected':
      console.log('Dispositivo listo para procesar pagos');
      statusDiv.textContent = 'Conectado y listo';
      break;
  }
});
*/

// --- CANCELAR TRANSACCIÓN EN CURSO ---
// Útil para implementar un botón de "Cancelar" o timeout personalizado
/*
const cancelBtn = document.getElementById('cancelButton');
cancelBtn.addEventListener('click', () => {
  const cancelled = pos.cancelCurrentTransaction();
  if (cancelled) {
    console.log('Transacción cancelada por el usuario');
    statusDiv.textContent = 'Estado: Transacción cancelada';
  } else {
    console.log('No hay transacción en curso para cancelar');
  }
});

// Timeout automático después de 30 segundos
let timeoutId;
pos.on('status', (status) => {
  if (status === 'waiting_for_card') {
    timeoutId = setTimeout(() => {
      pos.cancelCurrentTransaction();
      alert('Tiempo agotado. Por favor intenta de nuevo.');
    }, 30000);
  }
  if (status === 'payment_success' || status === 'payment_failed') {
    clearTimeout(timeoutId);
  }
});
*/

// --- REMOVER EVENT LISTENERS ---
// Previene memory leaks al destruir componentes
/*
// Guardar referencia al callback
const handleStatus = (status) => {
  console.log('Estado:', status);
};

// Agregar listener
pos.on('status', handleStatus);

// Remover listener específico
pos.off('status', handleStatus);

// Remover todos los listeners de un evento
pos.off('status');

// Remover TODOS los listeners de TODOS los eventos
// Úsalo al destruir la instancia del SDK o cerrar la app
window.addEventListener('beforeunload', () => {
  pos.removeAllListeners();
  pos.disconnect();
});
*/
