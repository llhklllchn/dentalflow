# DentFlow

منصة ويب لإدارة عيادات الأسنان بنمط SaaS، تركّز على:

- المرضى
- المواعيد
- السجلات الطبية
- خطط العلاج
- الفواتير والمدفوعات
- الموظفين والأطباء
- الإشعارات والتذكير
- التقارير

## الوضع الحالي

المشروع أصبح يملك:

- واجهات تشغيلية رئيسية للنسخة الويب
- جلسات ومصادقة داخلية
- عزل بيانات على مستوى `clinic_id`
- Prisma schema واسع
- Seed لعيادة ديمو
- تدفقات أساسية للمرضى والمواعيد والفواتير والمدفوعات

## متطلبات التشغيل

- Node.js 20+
- PostgreSQL
- npm

## الإعداد المحلي

1. انسخ ملف البيئة:

```bash
cp .env.example .env
```

للإطلاق الخارجي استخدم أيضًا:

```bash
cp .env.production.example .env.production
```

2. عدّل القيم داخل `.env`

أهم القيم:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `DENTFLOW_DEMO_MODE`
- `DENTFLOW_JOBS_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM_EMAIL`

3. ثبّت الحزم:

```bash
npm install
```

4. أنشئ Prisma client:

```bash
npm run prisma:generate
```

5. طبّق الـ schema على قاعدة البيانات:

```bash
npx prisma db push
```

6. ازرع بيانات الديمو:

```bash
npm run prisma:seed
```

7. شغّل المشروع:

```bash
npm run dev
```

## بيانات الديمو

بعد تشغيل:

```bash
npm run prisma:seed
```

سيتم إنشاء عيادة ديمو مع حساب مالك:

- البريد: `owner@dentflow.local`
- كلمة المرور: `DemoPass123!`

## أوضاع التشغيل

### Demo Mode

إذا كانت:

```env
DENTFLOW_DEMO_MODE="true"
```

فالنظام يعمل ببيانات ديمو وبدائل داخلية حتى لو لم تكن قاعدة البيانات موصولة.

### Live Mode

للتشغيل الحقيقي:

```env
DENTFLOW_DEMO_MODE="false"
```

مع قاعدة بيانات صالحة في `DATABASE_URL`.

## أوامر مفيدة

```bash
npm run dev
npm run build
npm run start
npm run test
npm run check
npm run prepare:production
npm run validate:launch
npm run generate:secrets
npm run smoke:check -- https://your-domain.com
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
npm run prisma:seed
```

## حالة التحقق الحالية

تم التحقق فعليًا من:

- `npm install`
- `npm run prisma:generate`
- `npx prisma db push`
- `npm run prisma:seed`
- `npm run lint`
- `npm run build`
- `npm run start`
- تسجيل الدخول الحقيقي عبر `POST /login` مع إنشاء جلسة وتحويل إلى `/dashboard`

كما تم التأكد من استجابة الصفحات الأساسية محليًا على البيانات الحية.

## التشغيل المحلي الجاهز الآن

- الرابط: `http://127.0.0.1:3000`
- البريد: `owner@dentflow.local`
- كلمة المرور: `DemoPass123!`
- وضع `.env` المحلي قد يكون ديمو أثناء المعاينة المحلية
- عند الإطلاق الخارجي يجب أن يكون `DENTFLOW_DEMO_MODE="false"`

## ملاحظات قبل الإطلاق الخارجي

- تم تثبيت الإصدارات في `package.json` بدل `latest`.
- تم نقل إعداد Prisma إلى `prisma.config.ts`.
- تم إصلاح إعداد الكوكي بحيث لا تُفرض `Secure` على البيئة المحلية غير المشفرة.
- توجد الآن اختبارات `unit` أساسية، وما زالت اختبارات `integration / e2e` غير موجودة بعد.
- تمت إضافة مسار `CI` بسيط لتشغيل `lint`, `test`, `prisma validate`, و`build`.
- تمت إضافة إرسال بريد SMTP لدعوات الموظفين واستعادة كلمة المرور.
- تمت إضافة مسار لتسليم الإشعارات المعلقة مع دعم البريد مباشرة و`webhook` قابل للتهيئة لقنوات `WhatsApp/SMS`.

## فحص الجاهزية قبل الإطلاق

قبل أي إطلاق خارجي نفّذ:

```bash
npm run prepare:production
npm run check
npm run validate:launch -- .env.production
```

سيقوم `npm run prepare:production` بإنشاء ملف `.env.production` محليًا مع أسرار مولدة
تلقائيًا، لكنه سيترك لك القيم الخارجية الحقيقية مثل الدومين وقاعدة البيانات وSMTP لتعبئتها يدويًا.

يفحص الأمر الأول:

- `lint`
- اختبارات الوحدات
- `prisma validate`
- `build`

ويفحص الأمر الثاني ما إذا كانت متغيرات البيئة مناسبة للإطلاق الخارجي، مثل:

- وجود `DATABASE_URL`
- وجود `NEXTAUTH_SECRET`
- وجود `DENTFLOW_JOBS_SECRET`
- وجود إعدادات SMTP الأساسية
- أن يكون `NEXTAUTH_URL` رابطًا عامًا آمنًا `HTTPS`
- أن يكون `DENTFLOW_DEMO_MODE="false"`
- وأن تكون القيم حقيقية وليست أمثلة مثل `example.com` أو `replace-with-*`

إذا أردت تشغيل `WhatsApp` أو `SMS` فعليًا، اضبط أيضًا:

- `NOTIFICATION_WEBHOOK_URL`
- `NOTIFICATION_WEBHOOK_SECRET`

## مراقبة الصحة

أضف فحصًا دوريًا للمسار:

```text
GET /api/health
```

يعيد حالة التطبيق وقاعدة البيانات بشكل مبسط.

بعد كل نشر خارجي يمكنك تنفيذ:

```bash
npm run smoke:check -- https://your-domain.com
```

لفحص `health`, `login`, وسلوك الوصول إلى `dashboard`.

ولتوليد أسرار قوية للإنتاج:

```bash
npm run generate:secrets
```
