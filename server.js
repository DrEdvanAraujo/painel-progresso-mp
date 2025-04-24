import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import mercadoPagoRoutes from './mercadoPago.js';

const app = express();
const PORT = process.env.PORT || 3000;

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

app.use('/webhook', mercadoPagoRoutes(saveEmails, getEmails));

app.listen(PORT, () => {
  console.log(`Servidor online em http://localhost:${PORT}`);
});
