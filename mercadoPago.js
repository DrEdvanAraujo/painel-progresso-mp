import express from 'express';
import mercadopago from 'mercadopago';

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN // Variável de ambiente no Render/Railway
});

export default function(setEmails, getEmails) {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const payment = req.body;

    try {
      if (payment.type === 'payment' && payment.data && payment.data.id) {
        const paymentData = await mercadopago.payment.findById(payment.data.id);

        if (paymentData.body.status === "approved") {
          const payerEmail = paymentData.body.payer.email;
          const emails = getEmails();
          if (!emails.includes(payerEmail)) {
            emails.push(payerEmail);
            setEmails(emails);
            console.log(`Novo e-mail autorizado: ${payerEmail}`);
          }
        }
      }

      res.sendStatus(200);
    } catch (err) {
      console.error('Erro no webhook:', err);
      res.sendStatus(500);
    }
  });

  return router;
}
