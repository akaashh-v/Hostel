# HOSTEL MESS — Setup & Installation Guide

This document describes how to configure, run, and develop the **HOSTEL MESS** management platform.

---

## 1. Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14+ (for production and Prisma ORM migrations)

---

## 2. Installation Steps

### Step 1: Clone or navigate to the project directory
```bash
cd "C:\Users\User\Desktop\01"
```

### Step 2: Install dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` is set to your PostgreSQL database:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/hostel_mess?schema=public"
```

### Step 4: Run Prisma Migrations and Seed
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

This will automatically create:
1. Administrator account (`admin` / `Admin@123`)
2. Default billing configuration (Pay-per-meal & fixed rates)
3. 30 realistic demo Indian hostel mess dishes with prices and images across Breakfast, Lunch, Evening Snacks, and Dinner.
4. Sample enrolled student accounts.

### Step 5: Start the Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 3. Account Credentials & Security

### Admin Portal
- **Login URL**: `http://localhost:5173/` (switch to Admin Portal or `/admin`)
- **Username**: `admin`
- **Password**: `Admin@123`
- *Note*: Admin registration is disabled for security. Only existing admins or the server-side bootstrap seed can provision admin access.

### Student Portal
- **Login URL**: `http://localhost:5173/`
- **Phone Number**: `9876543210`
- **Password**: `Student@123`
- *Note*: **Public student self-registration is strictly disabled.** Student accounts can only be created by an authenticated administrator via the Student Directory in the Admin Portal.

---

## 4. Key Architectural Guarantees

1. **Unique Meal Collection Constraint**:
   Enforced at the database level (`studentId + collectionDate + mealCategory`). A student cannot collect the same meal session twice in a single calendar day (Indian Standard Time: `Asia/Kolkata`).
2. **No Live Serving Indicators**:
   Operates strictly on a scheduled daily menu with no live indicators or serving controls.
3. **Billing Integration**:
   Supports both **Fixed Monthly Fee** and **Pay-Per-Meal** calculations. Bills are calculated from verified collection records, and snapshots are archived upon finalization.
