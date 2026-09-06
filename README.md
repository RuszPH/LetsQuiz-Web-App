# LetsQuiz System Documentation

## 1. System Overview

LetsQuiz is a web application for creating, managing, publishing, and taking study quizzes. A signed-in user can create quiz decks, add flash cards, configure quiz modes, publish decks for public access, and record quiz attempts.

The application uses a Laravel backend with an Inertia.js React frontend. Laravel provides routing, authentication, validation, database access, sessions, mail, and integrations with external APIs. React provides the interactive pages and quiz experience.

## 2. Languages and Frameworks

### Backend

- PHP 8.2 or newer
- Laravel 12
- Laravel Eloquent ORM
- Laravel Blade for the application shell
- Inertia.js Laravel adapter
- PHPUnit for automated tests

### Frontend

- TypeScript
- React 18
- Inertia.js React adapter
- Vite 7
- Tailwind CSS
- Headless UI React
- Lucide React icons
- Axios

### Data and infrastructure

- MySQL or SQLite through Laravel's database layer
- Database-backed sessions, cache, and queues by default
- Vite for frontend development and production builds
- Composer for PHP dependencies
- npm for JavaScript dependencies

## 3. Main Features

### User accounts

- Register and log in with an email address and password.
- Log out securely and invalidate the session.
- Reset a forgotten password.
- Verify an email address when mail delivery is configured.
- Confirm the current password for protected account actions.

### Quiz deck management

- Create quiz decks with a title and optional image.
- Edit and delete owned decks.
- Publish or unpublish a deck.
- Set a passing percentage.
- Enable multiple-answer, fill-in-the-blank, and swipe quiz modes.
- View the user's decks from the dashboard.

### Flash card management

- Add flash cards to a deck.
- Edit and delete flash cards.
- Store an optional card title, question, answer, and image.
- Open a deck in a play mode for taking the quiz.

### Quiz attempts and results

- Take quizzes from available decks.
- Submit an attempt for a deck.
- Store the score and completion time.
- Use deck settings to determine the available quiz modes and passing threshold.

### Public decks

- Mark a deck as public.
- Display public quiz content through the public quiz experience.

### External services

- Cloudinary stores uploaded deck and flash-card images when its credentials are configured.
- Brevo can add newly registered users to a contact list.
- Laravel mail sends the account-created email. The default local configuration writes mail to the application log instead of sending it externally.

> Cloudflare is not currently used by this application. Configuring Cloudflare API credentials alone will not enable image uploads. The implemented image provider is Cloudinary.

## 4. How the System Works

1. A visitor opens the landing page and can register or log in.
2. Laravel authenticates the user and starts a session.
3. The dashboard loads the user's quiz decks through an Inertia response.
4. Deck and card forms submit to Laravel routes using POST, PATCH, and DELETE requests.
5. Laravel validates the request, checks ownership, writes the data through Eloquent, and redirects back to an Inertia page.
6. Uploaded images are signed and sent to Cloudinary. If Cloudinary credentials are missing, the application stores the file on the local public filesystem instead.
7. A quiz submission creates a `quiz_attempts` record containing the user, deck, score, and timestamp.

## 5. Important Routes

| Area | Routes |
| --- | --- |
| Landing | `/` |
| Authentication | `/register`, `/login`, `/forgot-password`, `/logout` |
| Dashboard | `/dashboard`, `/home` |
| Decks | `/quiz-decks` |
| Deck cards | `/quiz-decks/{quizDeck}/cards` |
| Play quiz | `/quiz-decks/{quizDeck}/play` |
| Attempts | `/quiz-decks/{quizDeck}/attempts` |

Most deck, card, and attempt routes require authentication. Ownership checks prevent a user from changing another user's private content.

## 6. Data Model

- `users`: application accounts and optional Google-related fields retained by the user model.
- `quiz_decks`: deck owner, title, image path, visibility, passing percentage, and enabled quiz modes.
- `flash_cards`: card owner, deck, title, image path, question, and answer.
- `quiz_attempts`: deck, user, score, time taken, and quiz statistics.
- `sessions`, `cache`, and `jobs`: Laravel infrastructure tables when database-backed drivers are enabled.

## 7. Dependencies

### PHP dependencies

The main PHP dependencies are defined in `composer.json`:

- `laravel/framework`
- `inertiajs/inertia-laravel`
- `laravel/sanctum`
- `laravel/socialite`
- `laravel/tinker`
- `tightenco/ziggy`
- `fakerphp/faker` for development data
- `phpunit/phpunit` for tests
- `laravel/breeze` for authentication scaffolding
- `laravel/pint` for code style

### JavaScript dependencies

The frontend dependencies are defined in `package.json`:

- `react`, `react-dom`
- `@inertiajs/react`
- `@headlessui/react`
- `tailwindcss`, `@tailwindcss/forms`
- `lucide-react`
- `axios`
- `vite`, `laravel-vite-plugin`, `@vitejs/plugin-react`
- `typescript`
- `concurrently`

## 8. Operational Notes

- Never commit `.env` or API secrets.
- Run migrations after pulling new migration files.
- Clear Laravel configuration cache after changing environment variables.
- Run the production frontend build before serving the application without a Vite development server.
- Review `storage/logs/laravel.log` when an external API or mail operation fails.