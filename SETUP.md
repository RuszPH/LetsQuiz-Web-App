# LetsQuiz Local Setup Guide

This guide sets up LetsQuiz on a local Windows machine using XAMPP, PHP, Composer, Node.js, and either MySQL or SQLite.

## 1. Prerequisites

Install or verify the following:

- PHP 8.2 or newer with the extensions required by Laravel, including `openssl`, `pdo`, `mbstring`, `tokenizer`, `xml`, `ctype`, `json`, and `fileinfo`.
- Composer.
- Node.js and npm.
- Git, if cloning the repository.
- MySQL from XAMPP, or SQLite with a writable database file.

Verify the tools from PowerShell:

```powershell
php -v
composer --version
node --version
npm --version
```

From the project directory:

```powershell
cd C:\xampp\htdocs\LetsQuiz1
```

## 2. Install dependencies

Install PHP packages:

```powershell
composer install
```

Install frontend packages:

```powershell
npm install
```

## 3. Create the environment file

Create `.env` from the example file:

```powershell
Copy-Item .env.example .env
php artisan key:generate
```

Do not commit `.env`. It contains application secrets and external API credentials.

## 4. Configure the database

### Option A: MySQL with XAMPP

1. Start Apache and MySQL in the XAMPP Control Panel.
2. Create a database, for example `letsquiz1`, in phpMyAdmin.
3. Update `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=letsquiz1
DB_USERNAME=root
DB_PASSWORD=
```

Use the actual XAMPP MySQL port and password if they differ. The application must connect to the same database that receives the migrations.

### Option B: SQLite

Create the database file and configure `.env`:

```powershell
New-Item -ItemType File database\database.sqlite -Force
```

```env
DB_CONNECTION=sqlite
DB_DATABASE=C:/xampp/htdocs/LetsQuiz1/database/database.sqlite
```

## 5. Configure sessions, cache, and queues

The project is configured to use database-backed sessions, cache, and queues:

```env
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
```

The included migrations create the required tables. Run them with:

```powershell
php artisan migrate
```

For a local installation, Laravel's default database queue is sufficient. Run a queue worker if queued jobs are added:

```powershell
php artisan queue:listen --tries=1 --timeout=0
```

## 6. Configure the intended APIs

### Cloudinary image API

The application uses Cloudinary's signed upload API for quiz-deck and flash-card images. It does not currently use Cloudflare.

Create or obtain a Cloudinary cloud name, API key, and API secret from the Cloudinary console, then add them to `.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_SECURE=true
```

The application sends signed multipart requests to:

```text
https://api.cloudinary.com/v1_1/{cloud_name}/image/upload
```

The upload code signs the `folder` and `timestamp` parameters using the API secret. No upload preset is required by the current controller. If all three Cloudinary credentials are absent, uploads fall back to the local `public` filesystem.

### Brevo contacts API

Registration optionally syncs the new account to Brevo. Add the API key and, optionally, a contact-list ID:

```env
BREVO_API_KEY=your_brevo_api_key
BREVO_LIST_ID=123
```

The application calls:

```text
POST https://api.brevo.com/v3/contacts
```

The request uses the `api-key` header and sends the user's email and first name. A `409` response is treated as an already-existing contact. If `BREVO_API_KEY` is empty, registration still works and the Brevo step is skipped.

### Local mail

The default mail configuration writes emails to the Laravel log:

```env
MAIL_MAILER=log
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"
```

After registration, inspect `storage/logs/laravel.log` to confirm the account-created email was generated. To use a real SMTP provider, replace the mail variables with that provider's settings.

## 7. Clear configuration and verify the environment

After changing `.env`, clear cached configuration:

```powershell
php artisan config:clear
php artisan cache:clear
php artisan about
```

If configuration was cached previously, `config:clear` is essential because Laravel will otherwise continue using old API and database values.

## 8. Build and run the application

For a production-style local build:

```powershell
npm run build
php artisan serve
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000).

For development with hot module replacement, use two terminals:

Terminal 1:

```powershell
php artisan serve
```

Terminal 2:

```powershell
npm run dev
```

Alternatively, the project provides a combined development script through Composer:

```powershell
composer run dev
```

That script starts Laravel, the queue listener, the Laravel log viewer, and Vite concurrently.

## 9. First-use checklist

1. Open the application landing page.
2. Register a test account.
3. Confirm the user is redirected to the dashboard.
4. Check `storage/logs/laravel.log` for the local account-created email.
5. Create a quiz deck.
6. Upload a deck image and confirm a Cloudinary URL is stored, or confirm local fallback storage when Cloudinary is not configured.
7. Add flash cards and test their images.
8. Enable one or more quiz modes.
9. Publish the deck and take the quiz.
10. Confirm the attempt and score appear in the application.

## 10. Troubleshooting

### `Vite manifest not found`

Build the frontend:

```powershell
npm run build
```

### Database connection or missing-table errors

Check the `DB_*` values and run:

```powershell
php artisan migrate
```

### Cloudinary upload errors

Check that `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are correct, then run:

```powershell
php artisan config:clear
```

Review the Cloudinary warning or connection error in `storage/logs/laravel.log`. An `Upload preset not found` message generally indicates that another upload flow is using an invalid preset; the current signed controller does not require a preset.

### Brevo errors

Confirm the API key and list ID. Brevo failures are logged as warnings and do not prevent the local user account from being created.

### Port already in use

Start Laravel on another port:

```powershell
php artisan serve --port=8001
```

If Vite's default port is occupied, configure the port in `vite.config.js` or stop the process using that port.

## 11. Test and code quality commands

Run the test suite:

```powershell
php artisan test
```

Run the TypeScript check and production frontend build:

```powershell
npm run build
```

Format PHP code with Laravel Pint when needed:

```powershell
vendor\bin\pint
```