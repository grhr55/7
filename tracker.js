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

    if (!phone && !email) {
        return res.status(400).json({ error: 'Invalid data' });
    }

    const created_at = new Date();

    // =========================
    // 🧠 ОБРАБОТКА ТОВАРОВ С КАРТИНКАМИ
    // =========================
    let itemsText = '';
    let itemsDetailed = [];

    if (Array.isArray(items)) {
        itemsDetailed = items.map(i => ({
            name: i.name,
            qty: i.qty,
            image: i.image || ''
        }));

        itemsText = itemsDetailed
            .map(i => `${i.name} x${i.qty}`)
            .join(', ');
    }

    // =========================
    // 🗂️ ЛОГ В ФАЙЛ
    // =========================
    const log = {
        order_id,
        name,
        phone,
        email,
        total,
        items: itemsDetailed,
        created_at
    };

    fs.appendFileSync(
        'orders.log',
        JSON.stringify(log) + '\n'
    );

    // =========================
    // 🤖 TELEGRAM (С КАРТИНКАМИ)
    // =========================
    let telegramText = `
<b>Новый заказ 🤑</b>

👤 <b>Имя:</b> ${name || '-'}
📞 <b>Телефон:</b> ${phone || '-'}
📧 <b>Email:</b> ${email || '-'}
💰 <b>Сумма:</b> ${total || '-'}
🛒 <b>Товары:</b>
`;

    itemsDetailed.forEach(item => {
        telegramText += `
• ${item.name} x${item.qty}
${item.image ? item.image : ''}
`;
    });

    telegramText += `\n🕒 ${created_at}`;

    sendToTelegram(telegramText);

    console.log('ORDER RECEIVED:', log);

    res.json({ status: 'ok' });
});

// =========================
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
