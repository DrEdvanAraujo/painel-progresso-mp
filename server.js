import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import mercadoPagoRoutes from './mercadoPago.js';
import mercadopago from 'mercadopago';

const app = express();
const PORT = process.env.PORT || 3000;

// Configura Mercado Pago com access token da variável de ambiente
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN
});

app.use(cors());
app.use(bodyParser.json());

const EMAILS_FILE = './emails.json';

function getEmails() {
  if (!fs.existsSync(EMAILS_FILE)) return [];
  return JSON.parse(fs.readFileSync(EMAILS_FILE));
}

function saveEmails(emails) {
  fs.writeFileSync(EMAILS_FILE, JSON.stringify(emails, null, 2));
}

app.get('/emails', (req, res) => {
  res.json(getEmails());
});

app.post('/emails', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email é obrigatório' });

  const emails = getEmails();
  if (!emails.includes(email)) {
    emails.push(email);
    saveEmails(emails);
  }

  res.json({ success: true, email });
});

// 🔄 Rota para criar pagamento (usada pelo Brick)
app.post('/create_preference', async (req, res) => {
  try {
    const result = await mercadopago.payment.create({
      body: {
        transaction_amount: 99.99,
        description: "Acesso ao curso PICS",
        payment_method_id: req.body.payment_method_id,
        payer: {
          email: req.body.payer.email
        }
      }
    });

    console.log("✅ Pagamento criado:", result.body.id);
    res.json({ id: result.body.id });
  } catch (error) {
    console.error("❌ Erro ao criar pagamento:", error);
    res.status(500).send("Erro ao criar pagamento");
  }
});

app.use('/webhook', mercadoPagoRoutes(saveEmails, getEmails));

app.listen(PORT, () => {
  console.log(`Servidor online em http://localhost:${PORT}`);
});
