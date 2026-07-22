import { kv } from '@vercel/kv';

// حط قيمة سر قوي وطويل في متغيرات البيئة على Vercel باسم ADMIN_SECRET
const ADMIN_SECRET = process.env.ADMIN_SECRET;

export default async function handler(req, res) {
    // نفس إعدادات CORS المستخدمة في باقي ملفاتك
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(404).json({ success: false, message: 'Not Found' });
    }

    const { secret, dryRun } = req.body || {};

    // حماية: لازم السر يتبعت صح وإلا الطلب يترفض
    if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // البادئات المستخدمة فعليًا في سيرفرك: device / license / trial
    const targetPrefixes = ['device:', 'license:', 'trial:'];

    let deletedCount = 0;
    const deletedKeys = [];

    for (const prefix of targetPrefixes) {
        let cursor = 0;
        do {
            const [nextCursor, keys] = await kv.scan(cursor, { match: `${prefix}*`, count: 100 });
            cursor = Number(nextCursor);

            if (keys.length) {
                if (!dryRun) {
                    await kv.del(...keys);
                }
                deletedKeys.push(...keys);
                deletedCount += keys.length;
            }
        } while (cursor !== 0);
    }

    return res.status(200).json({
        success: true,
        dryRun: !!dryRun,
        deletedCount,
        deletedKeys
    });
}
