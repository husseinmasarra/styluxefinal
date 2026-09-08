# STYLUXE - Laravel 11 REST API Backend

مشروع الخلفية البرمجية المتكامل لمتجر **STYLUXE Luxury Fashion & POS** مبني بواسطة **Laravel 11** وقواعد بيانات **MySQL**.

---

## 🚀 متطلبات التشغيل السريع (Requirements)

1. **PHP 8.2 أو أحدث** (مع إضافات `pdo_mysql`, `mbstring`, `openssl`, `curl`).
2. **Composer** (مدير حزم PHP).
3. **قاعدة بيانات MySQL** (عبر Laragon أو XAMPP أو WAMP أو خدمة MySQL مستقلة).

---

## ⚙️ خطوات التشغيل (Setup & Run)

### 1. تثبيت الحزم (Install Composer Dependencies)
افتح موجه الأوامر (Terminal) داخل مجلد `backend`:
```bash
composer install
```

### 2. إعداد ملف البيئة (.env)
```bash
cp .env.example .env
php artisan key:generate
```
تأكد من تعديل بيانات قاعدة البيانات في ملف `.env`:
```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=styluxe_db
DB_USERNAME=root
DB_PASSWORD=
```

### 3. إنشاء الجداول وتوليد البيانات الأولية (Migrate & Seed)
```bash
php artisan migrate:fresh --seed
```

### 4. تشغيل خادم الـ API (Start Laravel Server)
```bash
php artisan serve --port=8000
```
سيعمل الـ API على الرابط: `http://localhost:8000/api`

---

## 📡 نقاط النهاية المتاحة (REST API Endpoints)

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/products` | `GET`, `POST` | جلب المنتجات (مع الفلاتر والبحث) / إضافة منتج |
| `/api/products/{id}` | `GET`, `PUT`, `DELETE` | تفاصيل / تعديل / حذف منتج |
| `/api/categories` | `GET`, `POST` | جلب التصنيفات (نساء / رجال) / إضافة تصنيف |
| `/api/brands` | `GET`, `POST` | جلب الماركات الفاخرة / إضافة ماركة |
| `/api/orders` | `GET`, `POST` | جلب الطلبات / إنشاء طلب شراء جديد من الـ Checkout |
| `/api/orders/{id}/status` | `PATCH` | تحديث حالة الطلب من لوحة التحكم |
| `/api/settings` | `GET`, `POST` | إعدادات المتجر (الهواتف، العملات، الواتساب، الباركود) |
| `/api/auth/login` | `POST` | تسجيل الدخول السري للأدمن وموظفي الكاشير |
