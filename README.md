# 🍲 Greenfield Mess — Hostel Mess Management System

A complete, production-quality, responsive single-project web application for hostels to manage students, daily food menus, food orders, monthly food consumption, and monthly billing.

Built with a modern, minimal SaaS aesthetic inspired by **Linear**, **Stripe Dashboard**, and **Notion**.

---

## ⚡ Unified Single-Project Architecture

The application has been **merged into a single standalone project**. There are **no separate frontend and backend directories** to manage.

- **Everything runs from the root folder** with a single command: `npm run dev`.
- **Integrated In-Browser Relational Database**: Built-in persistent relational database engine (`src/services/db.ts`) with full ACID transactions, historical pricing preservation, multi-student isolation, and initial seed data.
- **Zero external database setup or server daemons required**: Runs immediately out-of-the-box in any modern browser!

---

## 🚀 Live Application URL

- **Web Application**: **[http://localhost:5173](http://localhost:5173)**

---

## 🔑 Default Credentials

### Administrator Portal
- **Location**: Click **"Admin Portal"** on the top right of the student login screen
- **Username**: `admin`
- **Password**: `Admin@123`
- *Quick Login*: A **"admin / Admin@123"** one-click auto-fill pill is provided on the Admin Login screen.

### Pre-Registered Resident Students
Pre-seeded with realistic profiles and historical orders:
1. **Rahul Nair** — Phone: `+919876543210` | Email: `rahul.nair@example.com` (Room 104, South Block)
2. **Ananya Menon** — Phone: `+919876543211` | Email: `ananya.menon@example.com` (Room 208, North Block)
3. **Siddharth Varma** — Phone: `+919876543212` | Email: `siddharth.v@example.com` (Room 312, East Block)

> **OTP Verification**: Enter any student phone/email and click **"Verify & Continue"**. The 6-digit verification code is displayed on screen with an **"Auto-Fill"** button for instantaneous testing.

---

## 🌟 Modules & Features

### 1. Student Portal
- **Resident Authentication**:
  - Full Name, Phone Number, and Email Address validation.
  - Multi-factor OTP verification with 10-minute expiry windows.
  - Persistent authentication via 30-day JWT sessions stored securely in `localStorage`.
  - Returning students automatically enter their dashboard without re-logging in.
- **Personalized Dashboard**:
  - Welcome greeting with room number, hostel block, today's date, and mess kitchen live status.
  - Quick summary cards for monthly expenditure and total orders placed.
- **Categorized Food Catalog**:
  - **Today's Special**: Curated chef signature dish of the day.
  - **Hostel Special**: Regular crowd favorites and signature dishes.
  - **Kerala Special**: Authentic regional dishes:
    - *Puttu and Kadala Curry*
    - *Appam and Vegetable Stew*
    - *Malabar Chicken Biriyani*
    - *Kerala Meals (Traditional Sadya with Matta Rice)*
    - *Fish Curry Meals (Kudampuli style)*
    - *Pathiri and Chicken Curry*
    - *Idiyappam with Egg Roast*
    - *Porotta and Beef Curry*
    - *Porotta and Paneer Butter Masala*
  - **Daily Food Menu**: Organized into **Breakfast**, **Lunch**, **Evening Snacks**, and **Dinner**.
- **Mess Tray & Food Ordering**:
  - Item increment/decrement, Veg/Non-Veg indicators, descriptions, and price in Indian Rupees (₹).
  - Generated order tokens (`ORD-YYYYMMDD-XXXX`) recorded with historical price snapshots.
- **Order Cancellation Grace Period**:
  - Live countdown timer displaying remaining cancellation minutes (e.g. 30-minute grace window).
  - Cancellation button active strictly within grace window.
- **Monthly Consumption Statement**:
  - Detailed food consumption breakdown and calculated monthly bill, strictly excluding cancelled items.

### 2. Admin Executive Dashboard & Operations
- **Dashboard Overview**:
  - Key Metric Cards: Total Registered Students, Today's Orders, Today's Revenue (₹), Monthly Revenue (₹), Total Food Items, and Pending Orders.
  - **Interactive Charts (Recharts)**:
    1. *Daily Order Statistics*: 14-day Area Chart tracking daily meal order volume.
    2. *Monthly Revenue Trend*: 6-month Bar Chart of reconciled mess collections.
    3. *Most Ordered Food Items*: Ranked horizontal Bar Chart of top dishes.
    4. *Food Category Distribution*: Donut Chart showing consumption by meal category.
  - Live recent orders feed with one-click **Confirm** and **Complete** actions.
- **Student Management**:
  - Paginated student directory table with instant search by name, phone, email, or room number.
  - Filter by Active or Deactivated status.
  - View full profile modal with past order records and monthly bills.
  - Edit student details, room numbers, and hostel blocks.
  - One-click account activation / deactivation.
- **Food Menu Management**:
  - Complete CRUD: Add new dishes, edit existing items, toggle availability (In Stock / Sold Out), and delete.
  - Categorize dishes into Today's Special, Hostel Special, Kerala Special, Breakfast, Lunch, Snacks, or Dinner.
  - **Date-based Menu Scheduling**: Interactive calendar allowing admins to select any upcoming date, configure which dishes are served on that specific day, and post chef notices.
- **Order Management**:
  - Live order register with search and multi-parameter filters (Date, Status, Category).
  - Status progression: `PENDING` ➔ `CONFIRMED` ➔ `COMPLETED` / `CANCELLED`.
  - Record cancellation reasons directly into the order record.
- **Monthly Food Reports & Billing**:
  - Month and year selector with student filter (All Students or Individual Student).
  - **Billing Formula**:
    $$\text{Total Monthly Bill} = \sum (\text{Completed \& Confirmed Order Amounts in Month})$$
    *Cancelled orders are strictly excluded (₹0).*
  - **Historical Price Protection**: Uses the captured unit price snapshot at order time rather than current menu prices, preserving accounting integrity.
  - **Itemized Bill Statement**: Detailed dish-by-dish consumption breakdown showing historical unit prices, quantities consumed, and total charges.
  - **Export to Excel (`.xlsx`)**: One-click download of the complete monthly mess billing register.
  - **Print / PDF Billing Statement**: Formal formatted hostel invoice with student signature and warden sign-off lines.
- **Hostel Settings**:
  - Configure hostel name, logo, phone, email, and campus address.
  - Configure currency symbol (`₹`), order cancellation window (minutes), meal cutoff times, and academic billing start day.

---

## 🏃 Quick Start Commands

```bash
# 1. Install dependencies (one-time)
npm install

# 2. Start the unified application
npm run dev

# 3. Build production bundle (optional)
npm run build
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser!
