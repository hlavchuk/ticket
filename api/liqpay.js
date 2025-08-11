import crypto from 'crypto';

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { amountUAH, trip, passenger } = req.body || {};

  const public_key = process.env.LIQPAY_PUBLIC_KEY;
  const private_key = process.env.LIQPAY_PRIVATE_KEY;
  if(!public_key || !private_key){
    return res.status(500).json({ error: 'Server not configured with LiqPay keys' });
  }

  const payload = {
    public_key,
    version: 3,
    action: "pay",
    amount: Number(amountUAH || 1),
    currency: "UAH",
    description: `Квиток: ${trip?.title || 'Trip'} ${trip?.date || ''}`,
    order_id: `order_${Date.now()}`,
    result_url: `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/success.html`,
    server_url: `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/liqpay-callback`
  };

  const data = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = crypto.createHash('sha1').update(private_key + data + private_key).digest('base64');
  res.status(200).json({ action: 'https://www.liqpay.ua/api/3/checkout', data, signature });
}
