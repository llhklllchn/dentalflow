# دليل الإطلاق الإنتاجي لـ DentFlow

## 1. الهدف

هذا الدليل يحول المشروع من وضع التطوير المحلي إلى إطلاق ويب منظم وقابل للمراقبة.

---

## 2. الملفات المطلوبة

- انسخ `.env.production.example` إلى `.env.production`
- املأ جميع القيم الحقيقية قبل أي نشر خارجي

---

## 3. الحد الأدنى المطلوب قبل الإطلاق

- قاعدة بيانات PostgreSQL إنتاجية
- دومين عام مع `HTTPS`
- بريد SMTP صالح
- سر قوي لـ `NEXTAUTH_SECRET`
- سر قوي لـ `DENTFLOW_JOBS_SECRET`
- Webhook إذا كنت ستفعّل `WhatsApp` أو `SMS`

---

## 4. التحقق قبل النشر

نفّذ:

```bash
npm run prepare:production
npm install
npm run check
npm run validate:launch -- .env.production
```

إذا فشل الأمر الأخير، لا تنشر حتى تصلحه.

ملاحظة:
- أمر `npm run prepare:production` ينشئ `.env.production` مع أسرار عشوائية قوية.
- سيبقى عليك استبدال قيم الدومين وقاعدة البيانات وSMTP بالقيم الحقيقية.
- أصبح `validate:launch` يرفض القيم الوهمية مثل `example.com` أو `replace-with-*`.

---

## 5. خطوات النشر

1. ارفع المشروع إلى مزود الاستضافة الذي ستعتمد عليه.
2. أضف جميع متغيرات البيئة من `.env.production`.
3. نفّذ `npm install`.
4. نفّذ `npx prisma generate`.
5. طبّق قاعدة البيانات عبر:

```bash
npx prisma db push
```

6. ازرع بيانات أولية فقط إذا كنت تحتاج ديمو أو بيئة اختبار.
7. شغّل التطبيق:

```bash
npm run build
npm run start
```

---

## 5.1 الإطلاق على Vercel

1. اربط المستودع مع Vercel.
2. أضف جميع متغيرات البيئة الموجودة في `.env.production`.
3. تأكد أن `NEXTAUTH_URL` يساوي رابط المشروع الحقيقي.
4. بعد أول نشر نفّذ:

```bash
npm run smoke:check -- https://your-domain.com
```

5. استخدم مجدولًا خارجيًا أو وظيفة منصة لاستدعاء:

- `/api/jobs/appointment-reminders`
- `/api/jobs/deliver-notifications`

---

## 5.2 الإطلاق على VPS

### المسار الأول: PM2 + Nginx

1. انسخ المشروع إلى `/var/www/dentflow`
2. ضع ملف البيئة `.env.production`
3. نفّذ:

```bash
npm install
npx prisma generate
npx prisma db push
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

4. ضع ملف Nginx الموجود في `deploy/nginx/dentflow.conf`
5. فعّل SSL عبر `certbot`

### المسار الثاني: Docker

1. ضع `.env.production`
2. نفّذ:

```bash
docker compose -f docker-compose.production.yml up -d --build
```

3. اربط الحاوية مع Nginx أو Load Balancer وSSL خارجي

---

## 6. التحقق بعد النشر

تحقق من هذه المسارات والتدفقات:

- `GET /api/health`
- فتح `/login`
- تسجيل الدخول بحساب صالح
- إنشاء مريض
- إنشاء موعد
- تجهيز تذكير من صفحة الإشعارات
- تسليم الإشعارات المعلقة
- دعوة موظف والتأكد من وصول البريد
- استعادة كلمة المرور والتأكد من وصول البريد

---

## 7. جدولة الوظائف الخلفية

يجب جدولة استدعاءين خارجيين على الأقل:

- تجهيز التذكيرات:

```text
POST /api/jobs/appointment-reminders?hoursAhead=24
Authorization: Bearer <DENTFLOW_JOBS_SECRET>
```

- تسليم الإشعارات المعلقة:

```text
POST /api/jobs/deliver-notifications?limit=50
Authorization: Bearer <DENTFLOW_JOBS_SECRET>
```

يفضل تشغيل التسليم كل 5 دقائق أو 10 دقائق، وتجهيز التذكيرات كل ساعة أو حسب سياسة العيادة.

---

## 8. المراقبة والنسخ الاحتياطي

- راقب `/api/health`
- نفّذ `npm run smoke:check -- https://your-domain.com` بعد كل نشر مهم
- فعّل تنبيهات عند فشل `5xx`
- راقب سجلات الإرسال الفاشلة من صفحة الإشعارات
- فعّل نسخًا احتياطيًا يوميًا لقاعدة البيانات
- اختبر الاستعادة من النسخة الاحتياطية مرة واحدة على الأقل

---

## 9. ملاحظات تشغيلية

- إذا أردت البريد فقط، يكفي SMTP.
- إذا أردت `WhatsApp` أو `SMS` فعليًا، فعّل `NOTIFICATION_WEBHOOK_URL` و`NOTIFICATION_WEBHOOK_SECRET`.
- لا تطلق النظام و`DENTFLOW_DEMO_MODE` يساوي `true`.
- لا تستخدم `localhost` في `NEXTAUTH_URL` خارجيًا.
