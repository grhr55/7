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
// 🤖 TEXT
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
// 📸 PHOTO
// =========================
async function sendAlbum(items) {
    try {

        const media = items
            .filter(i => i.image)
            .map(i => ({
                type: "photo",
                media: i.image,
                caption: `🛒 ${i.name} x${i.qty}`
            }));

        if (media.length === 0) return;

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                media: media
            })
        });

    } catch (e) {
        console.error('Telegram album error:', e);
    }
}

// =========================
// 🚀 API
// =========================
app.post('/track', async (req, res) => {

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
    // 🧠 ITEMS
    // =========================
    let itemsDetailed = [];

    if (Array.isArray(items)) {
        itemsDetailed = items.map(i => ({
            name: i.name,
            qty: i.qty,
            image: i.image || ''
        }));
    }

    // =========================
    // 🗂️ LOG FILE
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

    fs.appendFileSync('orders.log', JSON.stringify(log) + '\n');

    // =========================
    // 🤖 TEXT MESSAGE
    // =========================
    let text = `
<b>Новый заказ 🤑</b>

👤 <b>Имя:</b> ${name || '-'}
📞 <b>Телефон:</b> ${phone || '-'}
📧 <b>Email:</b> ${email || '-'}
💰 <b>Сумма:</b> ${total || '-'}
🕒 ${created_at}
`;

    await sendToTelegram(text);

    // =========================
    // 📸 PHOTOS
    // =========================
    for (const item of itemsDetailed) {

        const caption = `🛒 <b>${item.name}</b>\nКоличество: ${item.qty}`;

        if (item.image) {
            await sendPhoto(item.image, caption);
        } else {
            await sendToTelegram(caption);
        }
    }

    console.log('ORDER RECEIVED:', log);

    res.json({ status: 'ok' });
});

// =========================
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
