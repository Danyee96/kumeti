# Kumeti — smart committee (ROSCA) app

React (Vite + Tailwind) frontend + PHP API + MySQL. Runs on **any Hostinger web hosting plan** (Premium / Business / Cloud) — **no VPS, no Node server needed**. Node is only used on your computer / GitHub to build.

## Roles
| Role | Login (demo) | Can do |
|---|---|---|
| Super admin | admin@kumeti.pk / admin123 | Dashboard, users, all kametis, **landing page editor**, settings |
| Organizer | organizer@kumeti.pk / organizer123 | Create & run kametis, members, qurandazi, payments, payouts |
| Member | member@kumeti.pk / member123 | See own turn, dues, payments, schedule |

## Kameti types
Fixed order (muqarrar tarteeb) · Lucky draw (qurandazi — all at once or every round) · Auction (boli — bid discount shared) · Need based (zaroorat).

## Numbers (slots)
- One person can hold several numbers (e.g. Ali has #1 and #6).
- Any number can be split between 2–4 people (½ + ½, ⅓ × 3, ¾ + ¼).
- Numbers move up/down; numbers already paid out are locked.
- **Share tab**: full chart image for the group + a branded card per member (their numbers, month, amount, start/end month, monthly qist, join link) — shares straight to WhatsApp from the phone, or downloads as PNG.

Simple flow: **Start a new kameti → type → name + start/end month → amount per number (total auto) → people + how many numbers each → arrange numbers → create → share.**

---

## 1. Run locally (VS Code)
Needs **Node 18+** and **PHP 8+** (XAMPP / Laragon / Homebrew PHP all fine).

```bash
npm install
npm run api      # terminal 1 — PHP API on :8000 (auto-creates a local SQLite DB with demo data)
npm run dev      # terminal 2 — open the URL it prints
```

## 2. Push to GitHub
```bash
git init
git add .
git commit -m "Kumeti"
git branch -M main
git remote add origin https://github.com/<you>/kumeti.git
git push -u origin main
```
The GitHub Action (`.github/workflows/deploy-hostinger.yml`) builds the app and pushes the ready files to a branch called **`hostinger`** (check the *Actions* tab — first run takes ~1 min).

## 3. Deploy on Hostinger (no VPS)
1. **hPanel → Databases → MySQL Databases**: create a database + user. Note name, user, password.
2. **hPanel → File Manager**: empty `public_html` (delete `default.php`).
3. **hPanel → Advanced → Git**: connect GitHub, pick the repo, **branch `hostinger`**, directory `public_html`, turn **Auto-deployment** on, Deploy.
4. Open `https://your-domain.com/api/install.php`, enter the MySQL details → Install.
5. Open your domain → login with the demo buttons. Then:
   - change the super admin password (Profile)
   - Settings → turn off "Show demo account buttons" before going public.

From now on every `git push` to `main` rebuilds and Hostinger redeploys automatically.

**Without Git:** run `npm run build` and upload the contents of `dist/` into `public_html` with File Manager, then step 4.

The database config is saved as `kumeti-config.php` **one folder above public_html**, so redeploys never wipe it. To reinstall, delete that file.

## Structure
```
public/api/        PHP API (index.php router, lib.php, install.php) — copied into the build
src/lib/           i18n (EN/UR), auth, API client, kameti calculations, landing defaults
src/pages/         Landing, Login, Register, Profile, admin/*, org/*, member/*
```

Note: Kumeti keeps the record only — money stays with the organizer.
