export type MealType = 'BREAKFAST' | 'LUNCH' | 'SNACKS' | 'DINNER';
export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'DEACTIVATED';
export type PaymentStatus = 'PAID' | 'PARTIALLY_PAID' | 'PENDING';
export type BillingMode = 'FIXED' | 'PER_MEAL';
export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD';

export interface Student {
  id: string;
  full_name: string;
  phone_number: string;
  password_hash: string;
  room_number?: string;
  status: StudentStatus;
  created_at: string;
  updated_at: string;
}

export interface Admin {
  id: string;
  username: string;
  password_hash: string;
  full_name: string;
  email?: string;
  role: 'SUPER_ADMIN' | 'WARDEN' | 'MESS_MANAGER';
  created_at: string;
}

export interface Meal {
  id: string;
  meal_type: MealType;
  name: string;
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  display_order: number;
}

export interface FoodItem {
  id: string;
  meal_id: string;
  meal_type: MealType;
  name: string;
  description?: string;
  price: number;
  category: 'VEG' | 'NON_VEG' | 'BEVERAGE' | 'DESSERT' | 'STAPLE';
  image_url: string;
  is_available: boolean;
  serving_date?: string; // YYYY-MM-DD
  created_at: string;
}

export interface FoodCollection {
  id: string;
  student_id: string;
  student_name: string;
  student_phone: string;
  meal_id: string;
  meal_type: MealType;
  food_item_id?: string;
  food_item_name?: string;
  collection_date: string; // YYYY-MM-DD
  collected_at: string;    // ISO timestamp
  food_items_snapshot: string[];
}

export interface BillingSettings {
  id: string;
  mode: BillingMode;
  fixed_monthly_rate: number;
  breakfast_rate: number;
  lunch_rate: number;
  snacks_rate: number;
  dinner_rate: number;
  late_fee_grace_days: number;
  late_fee_amount: number;
  currency: string;
  updated_at: string;
}

export interface MonthlyBill {
  id: string;
  student_id: string;
  student_name: string;
  student_phone: string;
  month: number; // 1-12
  year: number;  // YYYY
  breakfast_count: number;
  lunch_count: number;
  snacks_count: number;
  dinner_count: number;
  total_meals: number;
  billing_mode: BillingMode;
  base_amount: number;
  late_fee: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_status: PaymentStatus;
  generated_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  bill_id: string;
  student_id: string;
  student_name: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_id?: string;
  notes?: string;
  received_by: string;
  paid_at: string;
}

export interface HostelSettings {
  hostel_name: string;
  mess_name: string;
  address: string;
  contact_phone: string;
  contact_email: string;
  qr_code_url?: string;
  notice?: string;
}

export interface RealtimeEvent {
  type: 'COLLECTION_MARKED' | 'MENU_UPDATED' | 'BILL_UPDATED';
  timestamp: string;
  data: any;
}
