# HOSTEL MESS — Production Deployment Guide

This guide covers deploying **HOSTEL MESS** to production environments with PostgreSQL.

---

## 1. Architecture Overview

- **Frontend**: Single Page Application built with React, Vite, Tailwind CSS, Recharts.
- **Backend**: Node.js & Express REST API with TypeScript, Prisma ORM, bcrypt password hashing, HTTP-only secure cookies, and Zod validation.
- **Database**: PostgreSQL 14+ with relations, foreign keys, and unique constraint on `(student_id, collection_date, meal_category)`.

---

## 2. Production Environment Variables

Configure the following variables in your hosting provider (e.g. Railway, Render, AWS ECS, Heroku, or VPS):

```env
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://mess_user:SecretPassword123@db-host.internal:5432/hostel_mess?sslmode=require"
JWT_SECRET="generate-a-strong-random-64-character-secret"
SESSION_SECRET="generate-another-strong-random-secret"
SECURE_COOKIES=true
CLIENT_ORIGIN="https://hostelmess.yourinstitution.edu"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="YourSecureAdminPasswordHere"
ADMIN_PHONE="admin"
TZ="Asia/Kolkata"
```

---

## 3. Database Migration & Bootstrap

Run during deployment pipeline or release phase:

```bash
# 1. Run migrations
npx prisma migrate deploy

# 2. Seed default data (Initial admin, 30 demo food items with prices, default billing config)
npx prisma db seed
```

---

## 4. Building & Running

### Build Frontend & Backend
```bash
npm run build
```

### Start Server
```bash
npm run server
```

---

## 5. Security Checklist

- [x] Passwords hashed using bcrypt / Argon2id before storage
- [x] HTTP-only cookies preventing JavaScript XSS token theft
- [x] Public student registration disabled; only authenticated admin can create student accounts
- [x] Unique constraint at PostgreSQL level: `[student_id, collection_date, meal_category]` preventing duplicate meal claims
- [x] Server-side role validation protecting all admin APIs
- [x] Zod validation on incoming request payloads
- [x] Timezone standardized to `Asia/Kolkata`
- [x] No live serving indicators or unnecessary realtime sockets
