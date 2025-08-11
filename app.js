// ===== CONFIG you can edit each time =====
const TRIP = {
  title: "Київ → Кишинів",
  fromCity: "Київ (Центральний автовокзал)",
  toCity: "Chișinău (Rompetrol)",
  fromTime: "06:00",
  toTime: "18:30",
  date: "пн, 11 серп.",
  duration: "12 год 30 хв",
  direct: true,
  priceUAH: 1399,
  feeUAH: 50
};

// Insert your real PayPal Client ID (Sandbox or Live)
const PAYPAL_CLIENT_ID = "AXBhi778J5Oz6Ewi9WbshxZWKfUCy62x_YigowpO8dLWJ2SPZ0-vB80zJNFAuzMVpuWmsR7bzqeZgWZD"; // <- change to your own
const CURRENCY = "USD"; // PayPal currency, e.g., USD/EUR
const EXCHANGE_RATE_UAH_TO_USD = 0.025; // demo rate; replace via API/server if needed

function formatUAH(v){ return new Intl.NumberFormat('uk-UA',{style:'currency',currency:'UAH'}).format(v); }

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tripTitle').textContent = TRIP.title;
  document.getElementById('fromCity').textContent = TRIP.fromCity;
  document.getElementById('toCity').textContent = TRIP.toCity;
  document.getElementById('fromTime').textContent = TRIP.fromTime;
  document.getElementById('toTime').textContent = TRIP.toTime;
  document.getElementById('tripDate').textContent = TRIP.date;
  document.getElementById('tripDuration').textContent = TRIP.duration;
  document.getElementById('tripDirect').style.display = TRIP.direct ? 'inline-block' : 'none';

  document.getElementById('fareBase').textContent = formatUAH(TRIP.priceUAH);
  document.getElementById('fareFee').textContent = formatUAH(TRIP.feeUAH);
  document.getElementById('fareTotal').textContent = formatUAH(TRIP.priceUAH + TRIP.feeUAH);

  // Lazy-load PayPal SDK using provided client id
  const s = document.createElement('script');
  s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(PAYPAL_CLIENT_ID)}&currency=${encodeURIComponent(CURRENCY)}`;
  s.onload = renderPayPal;
  document.body.appendChild(s);

  document.getElementById('liqpayBtn').addEventListener('click', startLiqPay);
  document.getElementById('saveDraft').addEventListener('click', () => window.print());
});

function renderPayPal(){
  if (!window.paypal){ 
    console.error('PayPal SDK failed to load');
    return;
  }
  const totalUSD = ((TRIP.priceUAH + TRIP.feeUAH) * 0.025).toFixed(2);

  paypal.Buttons({
    style: { layout: 'vertical', shape: 'rect' },
    createOrder: (data, actions) => {
      return actions.order.create({
        purchase_units: [{
          description: `Квиток: ${TRIP.title} (${TRIP.date})`,
          amount: { currency_code: "USD", value: totalUSD }
        }]
      });
    },
    onApprove: async (data, actions) => {
      const details = await actions.order.capture();
      const params = new URLSearchParams({ orderId: details.id, payer: details.payer?.email_address || '' });
      window.location.href = `success.html?${params.toString()}`;
    },
    onError: (err) => {
      alert('Сталася помилка оплати PayPal. Спробуйте ще раз.');
      console.error(err);
    }
  }).render('#paypal-button-container');
}

async function startLiqPay(){
  try{
    const passenger = {
      firstName: document.getElementById('firstName').value || 'Passenger',
      lastName: document.getElementById('lastName').value || 'Name',
      email: document.getElementById('email').value || 'test@example.com'
    };
    const res = await fetch('/api/liqpay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountUAH: TRIP.priceUAH + TRIP.feeUAH, trip: TRIP, passenger })
    });
    const { data, signature, action } = await res.json();
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = action;
    form.innerHTML = `
      <input type="hidden" name="data" value="${data}">
      <input type="hidden" name="signature" value="${signature}">
    `;
    document.body.appendChild(form);
    form.submit();
  }catch(e){
    alert('Не вдалося ініціювати оплату через LiqPay (потрібні ключі на сервері).');
    console.error(e);
  }
}
