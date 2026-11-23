-- =========================================================================
-- HOSTEL MESS MANAGEMENT SYSTEM - DATABASE SCHEMA (POSTGRESQL / SUPABASE)
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. STUDENTS TABLE
-- Strictly requires ONLY: full_name, phone_number, password_hash
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    room_number VARCHAR(50),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'DEACTIVATED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone_number);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

-- -------------------------------------------------------------------------
-- 2. ADMINS TABLE
-- Dedicated administrators with hashed credentials
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(80) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    role VARCHAR(30) DEFAULT 'SUPER_ADMIN' CHECK (role IN ('SUPER_ADMIN', 'WARDEN', 'MESS_MANAGER')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------
-- 3. MEALS TABLE
-- 4 Daily meals: BREAKFAST, LUNCH, SNACKS, DINNER
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_type VARCHAR(20) NOT NULL UNIQUE CHECK (meal_type IN ('BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER')),
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'SERVING', 'FINISHED')),
    display_order INT DEFAULT 1
);

-- -------------------------------------------------------------------------
-- 4. FOOD ITEMS TABLE
-- Individual items mapped to meals with live serving status
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS food_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
    meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER')),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(30) DEFAULT 'VEG' CHECK (category IN ('VEG', 'NON_VEG', 'BEVERAGE', 'DESSERT', 'STAPLE')),
    status VARCHAR(20) DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'SERVING', 'FINISHED')),
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    serving_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_food_items_meal_date ON food_items(meal_id, serving_date);
CREATE INDEX IF NOT EXISTS idx_food_items_status ON food_items(status);

-- -------------------------------------------------------------------------
-- 5. FOOD COLLECTIONS TABLE
-- QR-based food collection tracking with strict duplicate prevention
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS food_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    student_name VARCHAR(150) NOT NULL,
    student_phone VARCHAR(20) NOT NULL,
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE RESTRICT,
    meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER')),
    collection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    food_items_snapshot JSONB DEFAULT '[]'::jsonb,
    
    -- PREVENT DUPLICATE COLLECTION FOR SAME MEAL AND DATE
    CONSTRAINT unique_student_meal_per_day UNIQUE (student_id, meal_id, collection_date)
);

CREATE INDEX IF NOT EXISTS idx_collections_student ON food_collections(student_id);
CREATE INDEX IF NOT EXISTS idx_collections_date ON food_collections(collection_date);
CREATE INDEX IF NOT EXISTS idx_collections_meal_date ON food_collections(meal_id, collection_date);

-- -------------------------------------------------------------------------
-- 6. BILLING SETTINGS TABLE
-- Configuration for Fixed Monthly Fee or Pay-Per-Meal
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS billing_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mode VARCHAR(20) DEFAULT 'PER_MEAL' CHECK (mode IN ('FIXED', 'PER_MEAL')),
    fixed_monthly_rate NUMERIC(10, 2) DEFAULT 3500.00,
    breakfast_rate NUMERIC(10, 2) DEFAULT 40.00,
    lunch_rate NUMERIC(10, 2) DEFAULT 80.00,
    snacks_rate NUMERIC(10, 2) DEFAULT 30.00,
    dinner_rate NUMERIC(10, 2) DEFAULT 80.00,
    late_fee_grace_days INT DEFAULT 5,
    late_fee_amount NUMERIC(10, 2) DEFAULT 100.00,
    currency VARCHAR(10) DEFAULT '₹',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------
-- 7. MONTHLY BILLS TABLE
-- Monthly statements calculated for each student
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS monthly_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    student_name VARCHAR(150) NOT NULL,
    student_phone VARCHAR(20) NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL,
    breakfast_count INT DEFAULT 0,
    lunch_count INT DEFAULT 0,
    snacks_count INT DEFAULT 0,
    dinner_count INT DEFAULT 0,
    total_meals INT DEFAULT 0,
    billing_mode VARCHAR(20) NOT NULL CHECK (billing_mode IN ('FIXED', 'PER_MEAL')),
    base_amount NUMERIC(10, 2) DEFAULT 0.00,
    late_fee NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) DEFAULT 0.00,
    paid_amount NUMERIC(10, 2) DEFAULT 0.00,
    balance_amount NUMERIC(10, 2) DEFAULT 0.00,
    payment_status VARCHAR(20) DEFAULT 'PENDING' CHECK (payment_status IN ('PAID', 'PARTIALLY_PAID', 'PENDING')),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_student_bill_month_year UNIQUE (student_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_bills_student ON monthly_bills(student_id);
CREATE INDEX IF NOT EXISTS idx_bills_month_year ON monthly_bills(month, year);
CREATE INDEX IF NOT EXISTS idx_bills_status ON monthly_bills(payment_status);

-- -------------------------------------------------------------------------
-- 8. PAYMENTS TABLE
-- Ledger of payments made by students
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID NOT NULL REFERENCES monthly_bills(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    student_name VARCHAR(150) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(30) DEFAULT 'UPI' CHECK (payment_method IN ('CASH', 'UPI', 'BANK_TRANSFER', 'CARD')),
    reference_id VARCHAR(100),
    notes TEXT,
    received_by VARCHAR(100) DEFAULT 'Warden / Mess Admin',
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_bill ON payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);

-- -------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------------
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_settings ENABLE ROW LEVEL SECURITY;

-- Meals and food items are readable by anyone authenticated or anonymous (for QR view)
CREATE POLICY "Public read meals" ON meals FOR SELECT USING (true);
CREATE POLICY "Public read food items" ON food_items FOR SELECT USING (true);

-- Students can read their own collections and bills
CREATE POLICY "Students read own collections" ON food_collections
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students insert own collections" ON food_collections
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students read own bills" ON monthly_bills
    FOR SELECT USING (auth.uid() = student_id);

-- -------------------------------------------------------------------------
-- INITIAL SEED DATA
-- -------------------------------------------------------------------------
-- Insert default admin (Password: Admin@123 -> SHA-256 hash: a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3)
INSERT INTO admins (username, password_hash, full_name, email, role)
VALUES ('admin', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'Chief Mess Warden', 'warden@hostel.edu', 'SUPER_ADMIN')
ON CONFLICT (username) DO NOTHING;

-- Insert 4 Daily Meals
INSERT INTO meals (meal_type, name, start_time, end_time, status, display_order) VALUES
('BREAKFAST', 'Morning Breakfast', '07:30:00', '09:30:00', 'UPCOMING', 1),
('LUNCH', 'Afternoon Lunch', '12:30:00', '14:30:00', 'SERVING', 2),
('SNACKS', 'Evening Snacks & Tea', '17:00:00', '18:15:00', 'UPCOMING', 3),
('DINNER', 'Night Dinner', '19:45:00', '21:45:00', 'UPCOMING', 4)
ON CONFLICT (meal_type) DO NOTHING;

-- Insert Default Billing Settings
INSERT INTO billing_settings (mode, fixed_monthly_rate, breakfast_rate, lunch_rate, snacks_rate, dinner_rate, late_fee_grace_days, late_fee_amount, currency)
VALUES ('PER_MEAL', 3600.00, 45.00, 85.00, 35.00, 85.00, 5, 100.00, '₹')
ON CONFLICT DO NOTHING;
