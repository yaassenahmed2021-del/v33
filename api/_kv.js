import { createClient } from '@vercel/kv';

// Vercel KV القديم اتلغى (deprecated)، ومحله دلوقتي تكامل Upstash Redis من
// Vercel Marketplace. أسماء متغيرات البيئة ممكن تختلف حسب طريقة الربط،
// فبنجرب كل الاحتمالات المعروفة بالترتيب، وأول زوج (URL + TOKEN) موجود
// فعلاً في process.env هو اللي هيُستخدم.
const CANDIDATE_ENV_PAIRS = [
    ['KV_REST_API_URL', 'KV_REST_API_TOKEN'],
    ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
    ['REDIS_REST_API_URL', 'REDIS_REST_API_TOKEN'],
];

function resolveCredentials() {
    for (const [urlKey, tokenKey] of CANDIDATE_ENV_PAIRS) {
        const url = process.env[urlKey];
        const token = process.env[tokenKey];
        if (url && token) {
            return { url, token };
        }
    }
    return null;
}

const creds = resolveCredentials();

if (!creds) {
    console.error(
        '[kv] لم يتم العثور على متغيرات بيئة قاعدة بيانات KV/Redis. ' +
        'تأكد من ربط تكامل Redis (Upstash) من Vercel Marketplace بالمشروع، ' +
        'أو أضف اسم المتغيرات الفعلي داخل api/_kv.js'
    );
}

export const kv = creds
    ? createClient({ url: creds.url, token: creds.token })
    : createClient({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
