import { kv } from '@vercel/kv';

// ============================================================================
// أداة إدارية لمسح كل بيانات التفعيل والتجارب المجانية من قاعدة البيانات.
// ============================================================================
// الاستخدام:
//   POST /api/admin-reset
//   Body: { "adminSecret": "..." }
//
// لازم تضيف Environment Variable اسمه ADMIN_SECRET في إعدادات المشروع على
// Vercel (Settings -> Environment Variables) بقيمة سرّية من عندك، وبعد
// الإضافة لازم تعمل Redeploy عشان القيمة تتفعّل.
//
// ⚠️ تحذير: الأداة دي بتمسح كل سجلات التفعيل (license:*) وكل السجلات
// العكسية للأجهزة (device:*) وكل التجارب المجانية (trial:*) — يعني كل
// الأجهزة اللي فعّلت البرنامج أو بدأت تجربة هتتمسح بياناتها، وهيحتاجوا
// يفعّلوا/يبدأوا تجربة من جديد.
// ============================================================================

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(404).json({ status: 'error', message: 'Not Found' });
    }

    const { adminSecret } = req.body || {};

    if (!process.env.ADMIN_SECRET) {
        return res.status(500).json({
            status: 'error',
            message: 'ADMIN_SECRET غير مضبوط في إعدادات المشروع على Vercel. أضِفه من Settings -> Environment Variables ثم اعمل Redeploy.'
        });
    }

    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
        return res.status(401).json({ status: 'error', message: 'غير مصرّح' });
    }

    try {
        const prefixes = ['license:', 'device:', 'trial:'];
        let totalDeleted = 0;
        const deletedByPrefix = {};

        for (const prefix of prefixes) {
            const keys = await kv.keys(`${prefix}*`);
            if (keys.length > 0) {
                await kv.del(...keys);
            }
            deletedByPrefix[prefix] = keys.length;
            totalDeleted += keys.length;
        }

        return res.status(200).json({
            status: 'success',
            message: `تم مسح ${totalDeleted} سجل بنجاح`,
            details: deletedByPrefix
        });
    } catch (err) {
        return res.status(500).json({
            status: 'error',
            message: 'حدث خطأ أثناء المسح: ' + err.message
        });
    }
}
