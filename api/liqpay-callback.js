export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  console.log('LiqPay callback body:', req.body);
  return res.status(200).send('ok');
}
