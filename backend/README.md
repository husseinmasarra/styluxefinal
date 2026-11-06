# STYLUXE - Laravel 11 REST API Backend

Full-featured backend service for **STYLUXE Luxury Fashion & POS**, engineered with **Laravel 11** and **MySQL**.

---

## 🚀 Requirements

1. **PHP 8.2 or higher** (with extensions: `pdo_mysql`, `mbstring`, `openssl`, `curl`).
2. **Composer** (PHP dependency manager).
3. **MySQL Database** (via Laragon, XAMPP, WAMP, or standalone MySQL).

---

## ⚙️ Setup & Run

### 1. Install Composer Dependencies
Open your terminal in the `backend` folder:
```bash
composer install
```

### 2. Configure Environment File (.env)
```bash
cp .env.example .env
php artisan key:generate
```
Configure your database credentials in `.env`:
```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=styluxe_db
DB_USERNAME=root
DB_PASSWORD=
```

### 3. Run Migrations & Database Seeding
```bash
php artisan migrate:fresh --seed
```

### 4. Start Laravel API Server
```bash
php artisan serve --port=8000
```
The API will be operational at: `http://localhost:8000/api`

---

## 📡 REST API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/products` | `GET`, `POST` | Fetch products (with search & filters) / Create product |
| `/api/products/{id}` | `GET`, `PUT`, `DELETE` | Product details / Update / Delete |
| `/api/categories` | `GET`, `POST` | Fetch categories (Women / Men) / Create category |
| `/api/brands` | `GET`, `POST` | Fetch luxury fashion houses / Create brand |
| `/api/orders` | `GET`, `POST` | Fetch orders / Create new order from Checkout |
| `/api/orders/{id}/status` | `PATCH` | Update order status from admin control panel |
| `/api/settings` | `GET`, `POST` | Store settings (Contact, Currencies, WhatsApp, Barcode) |
| `/api/auth/login` | `POST` | Administrative & cashier secure authentication |
