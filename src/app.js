const amountInput = document.getElementById('amountInput');
const currencySelect = document.getElementById('currencySelect');

const connectBtn = document.getElementById('connectButton');
const payBtn = document.getElementById('payButton');
const statusDiv = document.getElementById('status');
const resultDiv = document.getElementById('result');

const apiKey = 'YOUR_API_KEY';
const environment = 'SANDBOX'; // Puede ser SANDBOX o PRODUCTION

const pos = new CuboPagoSDK({
  apiKey,
  environment,
});

// Listeners de eventos del SDK

// Estado del flujo de pago con POS
pos.on('status', newStatus => {
  console.log('Nuevo estado:', newStatus);
  statusDiv.textContent = `Estado: ${newStatus}`;
});

// Estado al conectar con el POS
pos.on('connected', data => {
  statusDiv.textContent = `Conectado a: ${data.deviceName}`;
  connectBtn.textContent = 'Desconectar';
});

// Estado al desconectar con el POS
pos.on('disconnected', () => {
  statusDiv.textContent = 'Estado: Desconectado';
  connectBtn.textContent = 'Conectar a Lector';
});

// Estado al recibir un error
pos.on('error', error => {
  console.error('Error en el POS:', error);
  resultDiv.textContent = `Error: ${error.message}`;
});

// Estado al cargar proceso de pago
pos.on('loading', isLoading => {
  console.log('Estado de carga:', isLoading);

  loadingIndicator.style.display = isLoading ? 'block' : 'none';

  payBtn.disabled = isLoading;
});

// Estado al recibir resultado de la transacción
pos.on('transactionResult', result => {
  if (result.success) {
    resultDiv.textContent = `¡Pago procesado con éxito!\n${JSON.stringify(
      result.data,
      null,
      2
    )}`;
  } else {
    resultDiv.textContent = `Error al procesar el pago en el servidor: ${result.error.message}`;
  }
});

// Conectar los botones a los métodos del SDK
connectBtn.addEventListener('click', () => {
  if (pos.isConnected) {
    pos.disconnect();
  } else {
    pos.connect();
  }
});

payBtn.addEventListener('click', () => {
  //  Lee los valores del formulario
  const amountValue = amountInput.value;
  const currencyCode = currencySelect.value;

  // Valida la entrada del usuario (¡muy importante!)
  if (!amountValue || parseFloat(amountValue) <= 0) {
    alert('Por favor, ingresa un monto válido.');
    return; // Detiene la ejecución si el monto es inválido
  }

  // Convierte el monto al formato correcto (centavos, sin decimales)
  // Ej: El usuario escribe "12.50" -> lo convertimos a "1250"
  const amountInCents = Math.round(parseFloat(amountValue) * 100).toString();

  // Define el símbolo de la moneda
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
    `Iniciando pago por ${amountInCents} centavos en moneda ${currencyCode}`
  );

  // Realiza el pago con los valores dinámicos con el SDK
  pos
    .startPayment({ amount: amountInCents, currencyCode, currencySymbol })
    .catch(err => console.error('No se pudo iniciar el pago:', err));
});
