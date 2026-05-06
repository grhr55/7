const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const BOT_TOKEN = '8685099869:AAFt96aUAMtjZk-Ga1KReroDmpPpTd9y5hI';
const CHAT_ID = '@zakazhyh';

// =========================
// 🤖 TELEGRAM
// =========================
async function sendToTelegram(text) {
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text,
                parse_mode: "HTML"
            })
        });
    } catch (e) {
        console.error('Telegram error:', e);
    }
}

// =========================
// 📌 API
// =========================
app.post('/track', (req, res) => {

    const {
        order_id,
        name,
        phone,
        email,
        total,
        items
    } = req.body;

    // 🔐 простая защита
    if (!phone && !email) {
        return res.status(400).json({ error: 'Invalid data' });
    }

    const created_at = new Date();

    const itemsText = Array.isArray(items)
        ? items.map(i => `${i.name} x${i.qty}`).join(', ')
        : '';

    // =========================
    // 🗂️ ЛОГ В ФАЙЛ (ВМЕСТО БАЗЫ)
    // =========================
    const log = {
        order_id,
        name,
        phone,
        email,
        total,
        items: itemsText,
        created_at
    };

    fs.appendFileSync(
        'orders.log',
        JSON.stringify(log) + '\n'
    );

    // =========================
    // 🤖 TELEGRAM
    // =========================
    sendToTelegram(`
  <b>Новый заказ 🤑</b>

👤 <b>Имя:</b> ${name || '-'}
📞 <b>Телефон:</b> ${phone || '-'}
📧 <b>Email:</b> ${email || '-'}
💰 <b>Сумма:</b> ${total || '-'}
🛒 <b>Товары:</b> ${itemsText || '-'}

🕒 ${created_at}
    `);

    console.log('ORDER RECEIVED:', log);

    res.json({ status: 'ok' });
});

// =========================
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
