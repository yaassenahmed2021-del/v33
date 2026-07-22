import { kv } from '@vercel/kv';

// ضع هنا سر قوي وخزّنه في متغيرات البيئة باسم ADMIN_SECRET
// مثال قيمة: أي سلسلة عشوائية طويلة لا يعرفها أحد غيرك
const ADMIN_SECRET = process.env.ADMIN_SECRET;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(404).json({ success: false, message: 'Not Found' });
    }

    const { secret, prefixes, dryRun } = req.body || {};

    // حماية: لازم السر يتبعت صح وإلا الطلب يترفض
    if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // البادئات (prefixes) اللي عايز تمسحها من الذاكرة القديمة
    const targetPrefixes = Array.isArray(prefixes) && prefixes.length
        ? prefixes
        : ['device:', 'license:', 'trial:'];

    let deletedCount = 0;
    const deletedKeys = [];

    for (const prefix of targetPrefixes) {
        let cursor = 0;
        do {
            // scan بيمشي على كل الـ keys من غير ما يحمّل الداتا بيز كلها مرة واحدة في الذاكرة
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
        deletedKeys // ممكن تشيلها من الرد لو العدد كبير جدًا
    });
}
