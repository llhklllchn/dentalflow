# المعمارية التنفيذية العربية لمشروع DentFlow

## 1. الهدف من هذه الوثيقة

هذه الوثيقة تترجم تصور **DentFlow** إلى معمارية تنفيذية عملية يمكن البدء بالبناء عليها مباشرة.  
الهدف ليس فقط وصف التقنية، بل تحديد:

- كيف سنقسم المشروع
- كيف سننظم الملفات
- كيف سنتعامل مع العيادات المتعددة `multi-tenant`
- كيف سنبني الوحدات الأساسية للـ MVP
- كيف سيتدفق العمل بين الواجهة، السيرفر، قاعدة البيانات، والصلاحيات

---

## 2. التوجه التقني المعتمد

## 2.1 نوع التطبيق

- تطبيق ويب SaaS
- متعدد العيادات `multi-tenant`
- مبني ليخدم طاقم العيادة الداخلي
- واجهة عربية RTL من البداية

## 2.2 الـ Stack المقترح

### الواجهة والتطبيق

- Next.js `App Router`
- TypeScript
- Tailwind CSS
- shadcn/ui

### البيانات والمنطق

- PostgreSQL
- Prisma ORM
- Zod للتحقق من المدخلات

### المصادقة والصلاحيات

- Auth.js أو طبقة مصادقة مخصصة
- جلسات آمنة
- Role-Based Access Control

### المهام الخلفية

- Cron بسيط في البداية
- لاحقًا Queue مثل BullMQ

### النشر

- Vercel أو منصة مماثلة للواجهة
- PostgreSQL مستضاف
- تخزين ملفات لاحقًا على S3-compatible storage

---

## 3. مبادئ المعمارية

### 3.1 مبادئ أساسية

- كل شيء في النظام مرتبط بعيادة محددة عبر `clinic_id`.
- لا يجوز لأي استعلام أو تعديل أن يعمل خارج سياق العيادة الحالية.
- الصلاحيات لا تكون على مستوى الصفحة فقط، بل على مستوى العملية أيضًا.
- المريض هو المحور المركزي للربط بين المواعيد والسجل الطبي وخطة العلاج والفاتورة.
- نبني طبقات واضحة حتى لا تختلط الواجهة بمنطق الأعمال.
- الـ MVP يجب أن يكون قابلاً للبيع والاستخدام قبل التوسع في الميزات الطبية المعقدة.

### 3.2 قواعد غير قابلة للتنازل

- جميع الجداول التشغيلية تتضمن `clinic_id`.
- لا يتم جلب أي بيانات بدون فلترة واضحة على `clinic_id`.
- كل عملية حساسة تسجل في `audit_logs`.
- الحذف يكون `soft delete` عند الحاجة وليس حذفًا نهائيًا مباشرًا.

---

## 4. الصورة العامة للنظام

يتكوّن النظام من أربع طبقات رئيسية:

## 4.1 طبقة العرض UI

تشمل:

- الصفحات
- الجداول
- النماذج
- الحوارات
- التبويبات
- المكونات المشتركة

## 4.2 طبقة التطبيق Application Layer

تشمل:

- Server Actions أو Route Handlers
- تنفيذ حالات الاستخدام
- التحقق من الصلاحيات
- تنسيق الاستجابات

## 4.3 طبقة المجال Domain Layer

تشمل:

- قواعد العمل
- حالات الكيانات
- الانتقالات المسموحة
- التحقق من منطق الأعمال

أمثلة:

- منع تعارض المواعيد
- تحديث حالة الفاتورة بناءً على المدفوعات
- منع الوصول لبيانات عيادة أخرى

## 4.4 طبقة البيانات Data Layer

تشمل:

- Prisma
- الاستعلامات
- التعامل مع قاعدة البيانات
- المعاملات `transactions`

---

## 5. الوحدات الرئيسية Modules

## 5.1 Auth Module

مسؤول عن:

- تسجيل الدخول
- إنشاء العيادة الأولى
- إدارة الجلسة
- استرجاع كلمة المرور
- قبول الدعوات

## 5.2 Tenant Module

مسؤول عن:

- تحديد العيادة الحالية
- فرض العزل بين بيانات العيادات
- تحميل إعدادات العيادة الأساسية

## 5.3 Users & Roles Module

مسؤول عن:

- المستخدمين
- الأدوار
- الدعوات
- التفعيل والتعطيل

## 5.4 Clinic Module

مسؤول عن:

- بيانات العيادة
- ساعات العمل
- العملة واللغة
- الإعدادات العامة

## 5.5 Patients Module

مسؤول عن:

- CRUD المرضى
- الأرشفة
- الملف العام للمريض

## 5.6 Medical History Module

مسؤول عن:

- التاريخ الطبي العام
- تحديثات الحساسية والأدوية والأمراض المزمنة

## 5.7 Dentists Module

مسؤول عن:

- بيانات الأطباء
- ألوانهم
- أوقات عملهم
- ربطهم بالمواعيد

## 5.8 Services Module

مسؤول عن:

- الخدمات
- المدة الافتراضية
- التسعير

## 5.9 Appointments Module

مسؤول عن:

- التقويم
- الحجز
- إعادة الجدولة
- الإلغاء
- سجل الحالات

## 5.10 Dental Records Module

مسؤول عن:

- سجلات الزيارة
- التشخيص
- الإجراءات
- الوصفات

## 5.11 Tooth Records Module

مسؤول عن:

- حالة الأسنان
- خريطة الأسنان
- تحديثات كل سن

## 5.12 Treatment Plans Module

مسؤول عن:

- الخطط
- العناصر
- تقدم التنفيذ
- الربط بالمواعيد والفواتير

## 5.13 Billing Module

مسؤول عن:

- الفواتير
- بنود الفاتورة
- الخصومات
- الضرائب

## 5.14 Payments Module

مسؤول عن:

- تسجيل المدفوعات
- تحديث أرصدة الفواتير
- سجل طرق الدفع

## 5.15 Notifications Module

مسؤول عن:

- قوالب الرسائل
- جدولة التذكيرات
- سجل الإرسال

## 5.16 Reports Module

مسؤول عن:

- التقارير التشغيلية
- التقارير المالية
- مؤشرات الأداء

## 5.17 Audit Module

مسؤول عن:

- تسجيل التغييرات
- ربط الحدث بالمستخدم والكيان

---

## 6. الهيكل المقترح للمجلدات

نفترض أن المشروع مبني على Next.js App Router.

```text
src/
  app/
    (marketing)/
      page.tsx
      features/page.tsx
      contact/page.tsx
    (auth)/
      login/page.tsx
      register-clinic/page.tsx
      forgot-password/page.tsx
      reset-password/[token]/page.tsx
      accept-invitation/[token]/page.tsx
    (dashboard)/
      layout.tsx
      dashboard/page.tsx
      appointments/page.tsx
      patients/page.tsx
      patients/[patientId]/page.tsx
      dentists/page.tsx
      staff/page.tsx
      services/page.tsx
      treatment-plans/page.tsx
      treatment-plans/[planId]/page.tsx
      dental-records/page.tsx
      invoices/page.tsx
      invoices/[invoiceId]/page.tsx
      payments/page.tsx
      notifications/page.tsx
      reports/page.tsx
      settings/page.tsx
    api/
      auth/
      cron/
      webhooks/

  components/
    layout/
    shared/
    data-table/
    forms/
    dashboard/
    appointments/
    patients/
    dentists/
    staff/
    services/
    treatment-plans/
    dental-records/
    invoices/
    payments/
    notifications/
    reports/
    settings/

  features/
    auth/
      actions/
      queries/
      schemas/
      services/
      utils/
    clinics/
      actions/
      queries/
      schemas/
      services/
      utils/
    users/
      actions/
      queries/
      schemas/
      services/
      permissions/
    patients/
      actions/
      queries/
      schemas/
      services/
      utils/
    dentists/
      actions/
      queries/
      schemas/
      services/
    services-catalog/
      actions/
      queries/
      schemas/
      services/
    appointments/
      actions/
      queries/
      schemas/
      services/
      utils/
    medical-history/
    dental-records/
    tooth-records/
    treatment-plans/
    invoices/
    payments/
    notifications/
    reports/
    audit/

  lib/
    auth/
    db/
    permissions/
    tenant/
    validations/
    dates/
    currency/
    constants/
    logger/

  hooks/

  types/

  prisma/
    schema.prisma
    migrations/

  styles/
```

---

## 7. لماذا هذا الهيكل؟

هذا الهيكل يوازن بين:

- سهولة البدء
- وضوح التوسع
- الفصل بين الشاشة ومنطق العمل

### القاعدة الأساسية

- `app/` للصفحات والمسارات
- `components/` للمكونات المرئية القابلة لإعادة الاستخدام
- `features/` لكل وحدة أعمال كاملة
- `lib/` للأدوات والبنية المشتركة
- `prisma/` لقاعدة البيانات

### لماذا `features/`؟

لأن المشروع ليس صغيرًا، وسيتضخم بسرعة.  
تقسيم الكود حسب المجال أفضل من تقسيمه فقط حسب النوع.

مثال صحيح:

- `features/patients/actions/create-patient.ts`
- `features/patients/queries/get-patient-details.ts`
- `features/patients/schemas/patient-form.schema.ts`

بدل وضع كل الاستعلامات في مجلد عام وكل النماذج في مجلد عام.

---

## 8. هيكل الوحدة الواحدة

كل Module يفضّل أن يحتوي على:

```text
feature-name/
  actions/
  queries/
  schemas/
  services/
  utils/
```

### 8.1 `actions/`

تحتوي على:

- Server Actions
- أو دوال إدخال تنفذ حالة استخدام واضحة

مثال:

- `create-patient.ts`
- `update-appointment-status.ts`
- `record-payment.ts`

### 8.2 `queries/`

تحتوي على:

- استعلامات القراءة
- جلب بيانات الجداول والتفاصيل

### 8.3 `schemas/`

تحتوي على:

- مخططات Zod
- التحقق من النماذج

### 8.4 `services/`

تحتوي على:

- منطق الأعمال
- التجميع بين عدة استعلامات أو معاملات

### 8.5 `utils/`

تحتوي على:

- دوال مساعدة تخص الوحدة فقط

---

## 9. المسارات الرئيسية للتطبيق

## 9.1 مسارات عامة

- `/`
- `/features`
- `/contact`

## 9.2 مسارات المصادقة

- `/login`
- `/register-clinic`
- `/forgot-password`
- `/reset-password/[token]`
- `/accept-invitation/[token]`

## 9.3 مسارات داخلية

- `/dashboard`
- `/appointments`
- `/patients`
- `/patients/[patientId]`
- `/dentists`
- `/staff`
- `/services`
- `/treatment-plans`
- `/treatment-plans/[planId]`
- `/dental-records`
- `/invoices`
- `/invoices/[invoiceId]`
- `/payments`
- `/notifications`
- `/reports`
- `/settings`

---

## 10. معمارية المصادقة والعزل بين العيادات

## 10.1 المفهوم الأساسي

كل مستخدم ينتمي إلى عيادة واحدة في الـ MVP.  
عند تسجيل الدخول:

1. يتم التعرف على المستخدم.
2. يتم تحميل `clinic_id`.
3. يتم تحميل الدور `role`.
4. تصبح كل العمليات اللاحقة مرتبطة بهذه العيادة.

## 10.2 ما الذي يجب أن يكون داخل الجلسة؟

- `userId`
- `clinicId`
- `role`
- `firstName`
- `lastName`
- `email`

## 10.3 الحماية المطلوبة

- Middleware يتحقق من وجود جلسة للمسارات الداخلية
- Redirect تلقائي إلى `/login` عند غياب الجلسة
- Guard للصلاحيات على مستوى الصفحة
- Guard إضافي على مستوى الـ Action أو الـ API

## 10.4 قاعدة ذهبية

حتى لو أُخفي زر في الواجهة، يجب أن يبقى التحقق موجودًا في السيرفر.

---

## 11. نظام الصلاحيات

## 11.1 الأدوار الأساسية

- `owner`
- `admin`
- `dentist`
- `receptionist`
- `accountant`
- `assistant`

## 11.2 الصلاحيات تكون حسب المورد

مثال:

- المرضى: عرض / إنشاء / تعديل / أرشفة
- المواعيد: عرض / إنشاء / تعديل / إلغاء / تغيير حالة
- الفواتير: عرض / إنشاء / إصدار / إلغاء
- المدفوعات: عرض / تسجيل
- التقارير: عرض
- الإعدادات: عرض / تعديل

## 11.3 أسلوب التنفيذ

يفضّل تعريف مصفوفة صلاحيات مركزية:

```ts
rolePermissions = {
  owner: ["*"],
  admin: [...],
  dentist: [...],
  receptionist: [...],
  accountant: [...],
  assistant: [...],
}
```

ثم استعمال دوال مثل:

- `hasPermission(role, permission)`
- `assertPermission(session, permission)`

---

## 12. معمارية البيانات

## 12.1 قواعد الجداول

- كل جدول تشغيلي يحتوي `id`
- كل جدول خاص بعيادة يحتوي `clinic_id`
- جميع الجداول تتضمن `created_at` و`updated_at`
- الحقول المرجعية تستخدم مفاتيح خارجية واضحة

## 12.2 الجداول الأساسية للـ MVP

- clinics
- users
- dentists
- patients
- patient_medical_histories
- services
- appointments
- appointment_status_logs
- invoices
- invoice_items
- payments
- staff_invitations
- notification_templates
- notifications
- audit_logs

## 12.3 جداول المرحلة الثانية

- dental_records
- tooth_records
- treatment_plans
- treatment_plan_items

---

## 13. العلاقات الأساسية في التطبيق

### Clinic

ترتبط بـ:

- المستخدمين
- الأطباء
- المرضى
- الخدمات
- المواعيد
- الفواتير
- المدفوعات
- الإشعارات

### Patient

يرتبط بـ:

- التاريخ الطبي
- المواعيد
- السجلات الطبية
- خطط العلاج
- الفواتير
- المدفوعات

### Appointment

يرتبط بـ:

- المريض
- الطبيب
- الخدمة
- سجل تغييرات الحالة

### Invoice

يرتبط بـ:

- المريض
- البنود
- المدفوعات

---

## 14. طبقة الـ Queries والـ Actions

## 14.1 مبدأ مهم

القراءة تختلف عن الكتابة.

### القراءة `queries`

تُستخدم من أجل:

- عرض الجداول
- تفاصيل الصفحات
- الإحصاءات

### الكتابة `actions`

تُستخدم من أجل:

- الإنشاء
- التعديل
- تغيير الحالة
- الأرشفة

## 14.2 أمثلة عملية

### Patients

Queries:

- `getPatientsList`
- `getPatientById`
- `getPatientOverview`

Actions:

- `createPatient`
- `updatePatient`
- `archivePatient`

### Appointments

Queries:

- `getAppointmentsCalendar`
- `getTodaysAppointments`
- `getAppointmentDetails`

Actions:

- `createAppointment`
- `rescheduleAppointment`
- `cancelAppointment`
- `updateAppointmentStatus`

### Billing

Queries:

- `getInvoicesList`
- `getInvoiceDetails`

Actions:

- `createInvoice`
- `issueInvoice`
- `cancelInvoice`
- `recordPayment`

---

## 15. منطق الأعمال المهم

## 15.1 المواعيد

قواعد أساسية:

- لا يُنشأ موعد دون مريض
- لا يُنشأ موعد دون طبيب
- يجب تحديد بداية ونهاية
- لا يُسمح بتعارض غير مقبول حسب سياسة العيادة
- لا يُسمح بالحجز خارج ساعات العمل إلا بصلاحية خاصة إن وجدت

## 15.2 الفواتير

قواعد أساسية:

- كل فاتورة تخص مريضًا واحدًا
- إجمالي الفاتورة يحسب آليًا
- المدفوع لا يتجاوز الإجمالي
- الرصيد يحدّث مباشرة
- الحالة تتغير تلقائيًا عند الدفع

## 15.3 المدفوعات

قواعد أساسية:

- الدفع يجب أن يرتبط بفاتورة
- تسجيل الدفعة يتم داخل `transaction`
- بعد إنشاء الدفعة يتم تحديث الفاتورة مباشرة

## 15.4 المرضى

قواعد أساسية:

- الهاتف أو الاسم يجب أن يكونا قابلين للبحث بسرعة
- الأرشفة لا تحذف السجل نهائيًا

---

## 16. معاملات قاعدة البيانات

يجب استخدام `Prisma transaction` في الحالات التالية:

- إنشاء فاتورة مع بنودها
- تسجيل دفعة مع تحديث الفاتورة
- إنشاء عيادة مع المالك الأول
- تغيير حالة موعد مع إضافة سجل الحالة

مثال منطقي:

1. إنشاء دفعة
2. تحديث `paid_amount`
3. تحديث `balance`
4. تحديث `status`
5. تسجيل Audit Log

كل ذلك في معاملة واحدة.

---

## 17. مكونات الواجهة المشتركة

## 17.1 مكونات هيكلية

- `AppShell`
- `Sidebar`
- `Topbar`
- `PageHeader`
- `QuickCreateMenu`

## 17.2 مكونات بيانات

- `DataTable`
- `EmptyState`
- `StatusBadge`
- `StatCard`
- `SearchInput`
- `FilterBar`

## 17.3 مكونات النماذج

- `FormSection`
- `FormField`
- `DateField`
- `PhoneField`
- `CurrencyField`
- `SubmitButton`

## 17.4 مكونات متخصصة

- `AppointmentCalendar`
- `PatientSummaryCard`
- `InvoiceSummary`
- `PaymentForm`
- `Odontogram`

---

## 18. استراتيجية بناء الواجهة

### قاعدة مهمة

لا نبني كل صفحة من الصفر شكليًا.  
نبني Design System صغيرًا أولًا ثم نركب عليه الصفحات.

### الأولويات

1. `AppShell`
2. `PageHeader`
3. `DataTable`
4. `FilterBar`
5. `StatusBadge`
6. نماذج موحدة

بعدها تصبح بقية الصفحات أسرع بكثير.

---

## 19. الإشعارات والمهام الخلفية

## 19.1 في الـ MVP

نحتاج حدًا أدنى:

- تذكير الموعد قبل عدد ساعات محدد
- سجل نجاح أو فشل الإرسال

## 19.2 تدفق التنفيذ

1. Cron يعمل كل فترة.
2. يبحث عن المواعيد القادمة التي تحتاج تذكيرًا.
3. يبني الرسالة من القالب.
4. يرسل عبر القناة المحددة.
5. يسجل النتيجة في `notifications`.

## 19.3 لاحقًا

- Queue
- Retry
- أولويات
- قنوات متعددة

---

## 20. التقارير

## 20.1 في الـ MVP

يكفي:

- عدد المواعيد
- الإيراد اليومي
- `no_show`
- عدد المرضى الجدد
- الفواتير المفتوحة

## 20.2 لاحقًا

- تقارير حسب الطبيب
- اتجاهات الأداء
- أوقات الذروة
- المرضى المتأخرون عن المراجعة

---

## 21. التدقيق والأمان

## 21.1 كلمات المرور

- تخزين مشفر فقط
- لا تخزن نصًا خامًا أبدًا

## 21.2 الجلسات

- Cookie آمنة
- مدة صلاحية معقولة
- تسجيل `last_login_at`

## 21.3 Audit Log

يسجل على الأقل:

- من أنشأ المريض
- من عدل الموعد
- من ألغى الفاتورة
- من سجل دفعة

## 21.4 الحذف

- نستخدم `archived_at` أو `deleted_at` حين يلزم
- لا نحذف بيانات حساسة بسهولة

---

## 22. أسماء الملفات المقترحة في الوحدات الأساسية

## 22.1 Patients

```text
features/patients/
  actions/create-patient.ts
  actions/update-patient.ts
  actions/archive-patient.ts
  queries/get-patients-list.ts
  queries/get-patient-by-id.ts
  queries/get-patient-overview.ts
  schemas/patient-form.schema.ts
  services/patient-service.ts
```

## 22.2 Appointments

```text
features/appointments/
  actions/create-appointment.ts
  actions/reschedule-appointment.ts
  actions/cancel-appointment.ts
  actions/update-appointment-status.ts
  queries/get-appointments-calendar.ts
  queries/get-appointment-details.ts
  schemas/appointment-form.schema.ts
  services/appointment-service.ts
```

## 22.3 Invoices

```text
features/invoices/
  actions/create-invoice.ts
  actions/issue-invoice.ts
  actions/cancel-invoice.ts
  queries/get-invoices-list.ts
  queries/get-invoice-details.ts
  schemas/invoice-form.schema.ts
  services/invoice-service.ts
```

## 22.4 Payments

```text
features/payments/
  actions/record-payment.ts
  queries/get-payments-list.ts
  schemas/payment-form.schema.ts
  services/payment-service.ts
```

---

## 23. تصميم الصفحات من منظور هندسي

## 23.1 الصفحة = تجميع

كل صفحة يجب أن تكون طبقة تجميع وليست مكانًا لمنطق الأعمال الثقيل.

مثال:

- الصفحة تستدعي `query`
- الصفحة تعرض المكونات
- الإجراءات تذهب إلى `actions`
- المنطق الحقيقي يبقى في `services`

## 23.2 لماذا؟

لأن هذا يجعل:

- الاختبار أسهل
- إعادة الاستخدام أفضل
- التطوير أسرع
- الصيانة أوضح

---

## 24. نمط التسمية

### المجلدات

- lower-case
- مفرد أو جمع حسب المجال
- يفضّل الثبات

### الملفات

- `kebab-case`

### المتغيرات والدوال

- `camelCase`

### الأنواع والواجهات

- `PascalCase`

### الثوابت

- `SCREAMING_SNAKE_CASE`

---

## 25. استراتيجية الـ MVP

### المرحلة الأولى

- Auth
- Clinics
- Users
- Dentists
- Patients
- Services
- Appointments
- Dashboard

### المرحلة الثانية

- Patient Details
- Invoices
- Payments
- Settings
- Notifications basic

### المرحلة الثالثة

- Dental Records
- Tooth Records
- Treatment Plans
- Reports

---

## 26. مخاطر معمارية يجب الانتباه لها

## 26.1 الخلط بين منطق الواجهة ومنطق الأعمال

إذا بدأنا بوضع كل المنطق داخل الصفحات، سيتحول المشروع بسرعة إلى فوضى.

## 26.2 نسيان `clinic_id`

هذا أخطر خطأ في مشروع SaaS متعدد العيادات.

## 26.3 توسيع مبكر أكثر من اللازم

مثل:

- فروع متعددة
- صلاحيات مخصصة جدًا
- تكاملات كثيرة
- تقارير ثقيلة جدًا

هذه تؤجل الإطلاق بلا داع.

## 26.4 بناء تقويم معقد جدًا من البداية

ابدأ بشيء عملي وواضح ثم حسنه لاحقًا.

---

## 27. الترتيب العملي المقترح للبناء

1. إعداد المشروع والهيكل الأساسي
2. إعداد Prisma والجداول الأولى
3. المصادقة والجلسات
4. App Shell والـ Layout
5. المرضى
6. الخدمات
7. الأطباء والموظفون
8. المواعيد
9. لوحة التحكم
10. الفواتير
11. المدفوعات
12. الإعدادات
13. التذكيرات
14. السجلات الطبية
15. خطط العلاج
16. التقارير

---

## 28. مخرجات هذه الوثيقة

بعد اعتماد هذه المعمارية يصبح لدينا أساس جاهز لـ:

- إنشاء هيكل الملفات
- بدء بناء المشروع
- توزيع العمل على وحدات
- ضبط قواعد التطوير
- الانتقال من التخطيط إلى التنفيذ

---

## 29. الخطوة التالية المباشرة

بعد هذه الوثيقة، الخطوة التنفيذية الأنسب هي:

- إعداد backlog تفصيلي للـ MVP
- ثم إنشاء هيكل المشروع الفعلي
- ثم البدء بأول وحدتين: Auth وPatients

