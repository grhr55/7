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
// 🤖 TELEGRAM TEXT
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
// 📸 TELEGRAM PHOTO
// =========================
async function sendPhoto(url, caption = '') {
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                photo: url,
                caption,
                parse_mode: "HTML"
            })
        });
    } catch (e) {
        console.error('Photo error:', e);
    }
}

// =========================
// 🚀 TRACK ENDPOINT
// =========================
app.post('/track', async (req, res) => {

    const {
        event,
        product_id,
        name,
        price,
        image,
        time
    } = req.body;

    // =========================
    // 🗂 LOG FILE
    // =========================
    const log = {
        event,
        product_id,
        name,
        price,
        image,
        time: time || new Date().toISOString()
    };

    fs.appendFileSync('events.log', JSON.stringify(log) + '\n');

    // =========================
    // 🤖 TELEGRAM MESSAGE
    // =========================
    let text = `
<b>🛒 Событие: ${event || 'unknown'}</b>

🆔 ID: ${product_id || '-'}
📦 Название: ${name || '-'}
💰 Цена: ${price || '-'}
🕒 ${log.time}
`;

    await sendToTelegram(text);

    // =========================
    // 📸 IMAGE (если есть)
    // =========================
    if (image) {
        await sendPhoto(image, `${name || 'Товар'} x1`);
    }

    console.log('EVENT:', log);

    res.json({ status: 'ok' });
});

// =========================
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
