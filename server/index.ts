import express, { Router, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import {
  Student,
  Admin,
  Meal,
  FoodItem,
  FoodCollection,
  Notification,
  BillingSettings,
  MonthlyBill,
  Payment,
  PaymentMethod,
  HostelSettings,
  MealType,
  BillingMode,
  RealtimeEvent
} from '../src/types.js';

// Load local .env variables into process.env if not already set
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch {
  // Ignore local env read errors
}

// =============================================================================
// 1. REALTIME STREAM EVENT MANAGER
// =============================================================================
class RealtimeManager {
  private clients: Set<Response> = new Set();

  public addClient(res: Response) {
    this.clients.add(res);
    res.on('close', () => {
      this.clients.delete(res);
    });
  }

  public removeClient(res: Response) {
    this.clients.delete(res);
  }

  public broadcast(event: RealtimeEvent) {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of this.clients) {
      try {
        client.write(data);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  public getConnectedCount(): number {
    return this.clients.size;
  }
}

export const realtimeManager = new RealtimeManager();

// =============================================================================
// 2. DATABASE ENGINE, DEMO SEED DATA & MODELS
// =============================================================================

interface DatabaseSchema {
  students: Student[];
  admins: Admin[];
  meals: Meal[];
  food_items: FoodItem[];
  food_collections: FoodCollection[];
  notifications: Notification[];
  billing_settings: BillingSettings;
  monthly_bills: MonthlyBill[];
  payments: Payment[];
  hostel_settings: HostelSettings;
  sessions: { [token: string]: { userId: string; role: 'student' | 'admin'; expiresAt: string } };
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');
const TMP_FILE = path.join(os.tmpdir(), 'hostel_mess_database.json');

export function hashPassword(plainText: string): string {
  return bcrypt.hashSync(plainText, 10);
}

export function verifyPassword(plainText: string, storedHash: string): boolean {
  if (storedHash.startsWith('$2')) {
    return bcrypt.compareSync(plainText, storedHash) || bcrypt.compareSync(plainText.trim(), storedHash);
  }
  // Backward compatibility for existing SHA-256 hashes
  const sha = crypto.createHash('sha256').update(plainText).digest('hex');
  const shaTrim = crypto.createHash('sha256').update(plainText.trim()).digest('hex');
  return sha === storedHash || shaTrim === storedHash;
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function getTodayDateString(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

export const DEMO_FOOD_ITEMS: FoodItem[] = [
  // BREAKFAST (8 items)
  {
    id: 'food-bf-1',
    meal_id: 'meal-breakfast',
    meal_type: 'BREAKFAST',
    name: 'Idli',
    description: 'Steamed soft rice cakes served with traditional coconut chutney and hot drumstick sambar',
    price: 25,
    category: 'VEG',
    image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-bf-2',
    meal_id: 'meal-breakfast',
    meal_type: 'BREAKFAST',
    name: 'Masala Dosa',
    description: 'Crispy golden fermented crepe stuffed with spiced potato masala and served with chutney',
    price: 40,
    category: 'VEG',
    image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-bf-3',
    meal_id: 'meal-breakfast',
    meal_type: 'BREAKFAST',
    name: 'Poori Bhaji',
    description: 'Fluffy deep-fried whole wheat pooris served with mild spiced potato bhaji curry',
    price: 35,
    category: 'VEG',
    image_url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-bf-4',
    meal_id: 'meal-breakfast',
    meal_type: 'BREAKFAST',
    name: 'Appam',
    description: 'Bowl-shaped soft fermented rice and coconut milk hoppers served with sweet coconut milk',
    price: 30,
    category: 'VEG',
    image_url: 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-bf-5',
    meal_id: 'meal-breakfast',
    meal_type: 'BREAKFAST',
    name: 'Upma',
    description: 'Roasted semolina tempered with mustard seeds, curry leaves, ginger and vegetables',
    price: 25,
    category: 'VEG',
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-bf-6',
    meal_id: 'meal-breakfast',
    meal_type: 'BREAKFAST',
    name: 'Puttu & Kadala Curry',
    description: 'Steamed layered ground rice cylinders served with flavorful black chickpea roasted gravy',
    price: 40,
    category: 'VEG',
    image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-bf-7',
    meal_id: 'meal-breakfast',
    meal_type: 'BREAKFAST',
    name: 'Tea',
    description: 'Freshly brewed aromatic Indian milk tea infused with crushed cardamom and ginger',
    price: 10,
    category: 'BEVERAGE',
    image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-bf-8',
    meal_id: 'meal-breakfast',
    meal_type: 'BREAKFAST',
    name: 'Coffee',
    description: 'South Indian filter coffee with organic cow milk and thick aromatic froth',
    price: 15,
    category: 'BEVERAGE',
    image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },

  // LUNCH (8 items)
  {
    id: 'food-ln-1',
    meal_id: 'meal-lunch',
    meal_type: 'LUNCH',
    name: 'Kerala Meals',
    description: 'Traditional thali feast with matta rice, sambar, avial, thoran, rasam, and pickle',
    price: 60,
    category: 'VEG',
    image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-ln-2',
    meal_id: 'meal-lunch',
    meal_type: 'LUNCH',
    name: 'Chicken Biriyani',
    description: 'Fragrant basmati rice dum cooked with juicy marinated chicken pieces, mint and fried onions',
    price: 100,
    category: 'NON_VEG',
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-ln-3',
    meal_id: 'meal-lunch',
    meal_type: 'LUNCH',
    name: 'Veg Biriyani',
    description: 'Aromatic layered basmati rice with farm fresh vegetables, saffron and royal spices',
    price: 70,
    category: 'VEG',
    image_url: 'https://images.unsplash.com/photo-1642821373181-696a54913e9a?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-ln-4',
    meal_id: 'meal-lunch',
    meal_type: 'LUNCH',
    name: 'Chicken Curry',
    description: 'Tender chicken slow-cooked in a robust roasted coconut, onion and garam masala gravy',
    price: 50,
    category: 'NON_VEG',
    image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-ln-5',
    meal_id: 'meal-lunch',
    meal_type: 'LUNCH',
    name: 'Fish Curry',
    description: 'Coastal catch simmered in authentic tangy kokum, red chili and coconut oil gravy',
    price: 50,
    category: 'NON_VEG',
    image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-ln-6',
    meal_id: 'meal-lunch',
    meal_type: 'LUNCH',
    name: 'Rice & Sambar',
    description: 'Hot steamed white rice served with drumstick lentil sambar and dollop of ghee',
    price: 45,
    category: 'STAPLE',
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-ln-7',
    meal_id: 'meal-lunch',
    meal_type: 'LUNCH',
    name: 'Curd',
    description: 'Fresh chilled homemade probiotic curd cup to aid digestion',
    price: 15,
    category: 'BEVERAGE',
    image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-ln-8',
    meal_id: 'meal-lunch',
    meal_type: 'LUNCH',
    name: 'Payasam',
    description: 'Sweet festive pudding cooked with vermicelli, milk, cardamom, cashews and raisins',
    price: 25,
    category: 'DESSERT',
    image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },

  // EVENING SNACKS (7 items)
  {
    id: 'food-sn-1',
    meal_id: 'meal-snacks',
    meal_type: 'SNACKS',
    name: 'Samosa',
    description: 'Crispy fried golden triangle pastry stuffed with seasoned potatoes and green peas',
    price: 15,
    category: 'VEG',
    image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-sn-2',
    meal_id: 'meal-snacks',
    meal_type: 'SNACKS',
    name: 'Parippu Vada',
    description: 'Crunchy tea-time fritter made with chana dal, chopped onions, ginger and curry leaves',
    price: 10,
    category: 'VEG',
    image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-sn-3',
    meal_id: 'meal-snacks',
    meal_type: 'SNACKS',
    name: 'Banana Fry',
    description: 'Ripe sweet plantain slices coated in light batter and deep-fried to golden perfection',
    price: 15,
    category: 'VEG',
    image_url: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-sn-4',
    meal_id: 'meal-snacks',
    meal_type: 'SNACKS',
    name: 'Puffs',
    description: 'Flaky baked golden pastry filled with savory spiced egg or vegetable masala filling',
    price: 20,
    category: 'VEG',
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-sn-5',
    meal_id: 'meal-snacks',
    meal_type: 'SNACKS',
    name: 'Tea',
    description: 'Hot brewed evening milk tea with fresh crushed ginger',
    price: 10,
    category: 'BEVERAGE',
    image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-sn-6',
    meal_id: 'meal-snacks',
    meal_type: 'SNACKS',
    name: 'Coffee',
    description: 'Hot South Indian filter brew with rich crema',
    price: 15,
    category: 'BEVERAGE',
    image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-sn-7',
    meal_id: 'meal-snacks',
    meal_type: 'SNACKS',
    name: 'Sandwich',
    description: 'Toasted vegetable club sandwich layered with mint chutney, cucumber, tomato and butter',
    price: 35,
    category: 'VEG',
    image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },

  // DINNER (7 items)
  {
    id: 'food-dn-1',
    meal_id: 'meal-dinner',
    meal_type: 'DINNER',
    name: 'Chapati',
    description: 'Freshly tossed whole wheat flatbread roasted on tawa with light butter',
    price: 12,
    category: 'STAPLE',
    image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-dn-2',
    meal_id: 'meal-dinner',
    meal_type: 'DINNER',
    name: 'Porotta',
    description: 'Soft multi-layered Kerala style flaky flatbread made hot on iron skillet',
    price: 15,
    category: 'STAPLE',
    image_url: 'https://images.unsplash.com/photo-1505253758473-96b3015f27eb?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-dn-3',
    meal_id: 'meal-dinner',
    meal_type: 'DINNER',
    name: 'Chicken Curry',
    description: 'Rich homestyle chicken curry simmered with caramelized onions and whole spices',
    price: 50,
    category: 'NON_VEG',
    image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-dn-4',
    meal_id: 'meal-dinner',
    meal_type: 'DINNER',
    name: 'Egg Curry',
    description: 'Boiled country eggs stewed in spicy tomato and onion masala sauce',
    price: 30,
    category: 'NON_VEG',
    image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-dn-5',
    meal_id: 'meal-dinner',
    meal_type: 'DINNER',
    name: 'Vegetable Curry',
    description: 'Assorted seasonal vegetables stewed in mildly spiced coconut milk broth',
    price: 30,
    category: 'VEG',
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-dn-6',
    meal_id: 'meal-dinner',
    meal_type: 'DINNER',
    name: 'Fried Rice',
    description: 'Wok-tossed basmati rice with crisp vegetables, soy seasonings and white pepper',
    price: 70,
    category: 'VEG',
    image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'food-dn-7',
    meal_id: 'meal-dinner',
    meal_type: 'DINNER',
    name: 'Ghee Rice',
    description: 'Fragrant jeerakasala rice sautéed in desi cow ghee with golden onions, cashews and raisins',
    price: 60,
    category: 'STAPLE',
    image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    created_at: new Date().toISOString()
  }
];

const DEFAULT_DB: DatabaseSchema = {
  students: [],
  admins: [
    {
      id: 'admin-1',
      username: 'admin',
      password_hash: hashPassword('Admin@123'),
      full_name: 'Chief Mess Warden',
      email: 'warden@hostel.edu',
      role: 'SUPER_ADMIN',
      created_at: new Date().toISOString()
    }
  ],
  meals: [
    {
      id: 'meal-breakfast',
      meal_type: 'BREAKFAST',
      name: 'Breakfast',
      start_time: '07:30',
      end_time: '09:30',
      display_order: 1
    },
    {
      id: 'meal-lunch',
      meal_type: 'LUNCH',
      name: 'Lunch',
      start_time: '12:30',
      end_time: '14:30',
      display_order: 2
    },
    {
      id: 'meal-snacks',
      meal_type: 'SNACKS',
      name: 'Evening Snacks & Tea',
      start_time: '17:00',
      end_time: '18:15',
      display_order: 3
    },
    {
      id: 'meal-dinner',
      meal_type: 'DINNER',
      name: 'Dinner',
      start_time: '19:45',
      end_time: '21:45',
      display_order: 4
    }
  ],
  food_items: DEMO_FOOD_ITEMS,
  food_collections: [],
  billing_settings: {
    id: 'billing-setting-1',
    mode: 'PER_MEAL',
    fixed_monthly_rate: 3600.0,
    breakfast_rate: 45.0,
    lunch_rate: 85.0,
    snacks_rate: 35.0,
    dinner_rate: 85.0,
    late_fee_grace_days: 5,
    late_fee_amount: 100.0,
    currency: '₹',
    updated_at: new Date().toISOString()
  },
  monthly_bills: [],
  payments: [],
  hostel_settings: {
    hostel_name: 'Grand Royal Heritage Hostel',
    mess_name: 'TASTEBOX MEALS CO. Dining Hall',
    address: 'Campus Block-B, University Road, Bangalore - 560012',
    contact_phone: '+91 98765 00000',
    contact_email: 'mess@hostel.edu',
    qr_code_url: '/payment-qr.jpg',
    upi_id: 'ismailpk153@okicici',
    upi_payee_name: 'Sinsiya Nihala',
    notice: 'Mess dining runs according to daily schedule. Please mark your meal collected at the counter.'
  },
  notifications: [],
  sessions: {}
};

class Database {
  private data: DatabaseSchema;
  private cloudUrl: string;
  private cloudToken: string;
  private lastCloudSyncTime: number = 0;
  private lastLoadedTmpMtime: number = 0;
  private prisma: PrismaClient | null = null;
  private hasSupabase: boolean = false;

  constructor() {
    this.cloudUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
    this.cloudToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';

    const dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl && (dbUrl.includes('supabase') || dbUrl.includes('pooler') || dbUrl.includes('postgresql'))) {
      try {
        this.prisma = new PrismaClient({
          datasources: { db: { url: dbUrl } }
        });
        this.hasSupabase = true;
      } catch (err) {
        console.error('Failed to initialize PrismaClient for Supabase:', err);
      }
    }

    this.ensureDirectory();
    this.data = this.load();
    if (!this.data.food_items || !Array.isArray(this.data.food_items)) {
      this.data.food_items = [...DEMO_FOOD_ITEMS];
    }
    if (!this.data.sessions) {
      this.data.sessions = {};
    }
    if (!this.data.notifications) {
      this.data.notifications = [];
    }
    if (this.hasSupabase) {
      this.syncFromSupabase().catch(console.error);
    } else if (this.hasCloudConfigured()) {
      this.syncFromCloud().catch(console.error);
    }
  }

  public hasSupabaseConfigured(): boolean {
    return Boolean(this.hasSupabase && this.prisma);
  }

  public async syncFromSupabase(): Promise<void> {
    if (!this.prisma) return;
    const now = Date.now();
    if (now - this.lastCloudSyncTime < 1500) return;

    try {
      const rows: any = await this.prisma.$queryRawUnsafe(
        "SELECT data FROM hostel_mess_state WHERE id = 'active_state' LIMIT 1;"
      );
      if (rows && rows.length > 0 && rows[0].data) {
        const parsed = rows[0].data;
        if (parsed && Array.isArray(parsed.students)) {
          if (!parsed.sessions) parsed.sessions = {};
          if (!parsed.notifications) parsed.notifications = [];
          if (!Array.isArray(parsed.food_items)) parsed.food_items = [...DEMO_FOOD_ITEMS];
          this.data = parsed;
          this.lastCloudSyncTime = Date.now();
        }
      }
    } catch (err) {
      console.error('Error syncing state from Supabase:', err);
    }
  }

  public async saveToSupabase(): Promise<void> {
    if (!this.prisma) return;
    try {
      const jsonStr = JSON.stringify(this.data);
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO hostel_mess_state (id, data, updated_at)
         VALUES ('active_state', $1::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE SET data = $1::jsonb, updated_at = NOW();`,
        jsonStr
      );
      this.lastCloudSyncTime = Date.now();

      // Mirror students to students_directory table for direct view in Supabase Table Editor
      if (Array.isArray(this.data.students)) {
        for (const s of this.data.students) {
          await this.prisma.$executeRawUnsafe(
            `INSERT INTO students_directory (id, full_name, phone_number, room_number, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6::timestamptz)
             ON CONFLICT (id) DO UPDATE SET
               full_name = EXCLUDED.full_name,
               phone_number = EXCLUDED.phone_number,
               room_number = EXCLUDED.room_number,
               status = EXCLUDED.status;`,
            s.id,
            s.full_name,
            s.phone_number,
            s.room_number || 'Room 101',
            s.status || 'ACTIVE',
            s.created_at || new Date().toISOString()
          ).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Error saving state to Supabase:', err);
    }
  }

  public hasCloudConfigured(): boolean {
    return Boolean(this.cloudUrl && this.cloudToken);
  }

  public async syncFromCloud(): Promise<void> {
    if (!this.hasCloudConfigured()) return;
    const now = Date.now();
    if (now - this.lastCloudSyncTime < 1500) return;

    try {
      const res = await fetch(this.cloudUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.cloudToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['GET', 'hostel_mess_database'])
      });
      if (res.ok) {
        const json: any = await res.json();
        if (json && json.result) {
          const parsed = typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
          if (parsed && Array.isArray(parsed.students)) {
            if (!parsed.sessions) parsed.sessions = {};
            if (!parsed.notifications) parsed.notifications = [];
            if (!Array.isArray(parsed.food_items)) parsed.food_items = [...DEMO_FOOD_ITEMS];
            this.data = parsed;
            this.lastCloudSyncTime = Date.now();
          }
        }
      }
    } catch (err) {
      console.error('Error fetching data from Cloud KV:', err);
    }
  }

  public async saveToCloud(): Promise<void> {
    if (!this.hasCloudConfigured()) return;
    try {
      await fetch(this.cloudUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.cloudToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['SET', 'hostel_mess_database', JSON.stringify(this.data)])
      });
      this.lastCloudSyncTime = Date.now();
    } catch (err) {
      console.error('Error saving data to Cloud KV:', err);
    }
  }

  public checkAndReloadTmpFile(): void {
    try {
      if (fs.existsSync(TMP_FILE)) {
        const stats = fs.statSync(TMP_FILE);
        if (stats.mtimeMs > this.lastLoadedTmpMtime) {
          const raw = fs.readFileSync(TMP_FILE, 'utf-8');
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.students)) {
            if (!parsed.sessions) parsed.sessions = {};
            if (!parsed.notifications) parsed.notifications = [];
            if (!Array.isArray(parsed.food_items)) parsed.food_items = [...DEMO_FOOD_ITEMS];
            this.data = parsed;
            this.lastLoadedTmpMtime = stats.mtimeMs;
          }
        }
      }
    } catch {
      // Ignore reading race conditions
    }
  }

  private ensureDirectory() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
    } catch {
      // In serverless environments DB_DIR may be read-only
    }
  }

  private load(): DatabaseSchema {
    // 1. Check tmp file (written during serverless runtime)
    try {
      if (fs.existsSync(TMP_FILE)) {
        const stats = fs.statSync(TMP_FILE);
        this.lastLoadedTmpMtime = stats.mtimeMs;
        const raw = fs.readFileSync(TMP_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.students)) {
          if (!parsed.sessions) parsed.sessions = {};
          if (!parsed.notifications) parsed.notifications = [];
          if (!Array.isArray(parsed.food_items)) parsed.food_items = [...DEMO_FOOD_ITEMS];
          return parsed;
        }
      }
    } catch {}

    // 2. Read bundled DB_FILE
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.students)) {
          if (!parsed.sessions) parsed.sessions = {};
          if (!parsed.notifications) parsed.notifications = [];
          if (!Array.isArray(parsed.food_items)) parsed.food_items = [...DEMO_FOOD_ITEMS];
          return parsed;
        }
      }
    } catch (err) {
      console.error('Error reading database file, using defaults', err);
    }

    const fresh = JSON.parse(JSON.stringify(DEFAULT_DB));
    if (!fresh.sessions) fresh.sessions = {};
    return fresh;
  }

  private saveDirect(payload: DatabaseSchema) {
    if (process.env.VERCEL) {
      try {
        fs.writeFileSync(TMP_FILE, JSON.stringify(payload, null, 2), 'utf-8');
        this.lastLoadedTmpMtime = Date.now();
      } catch (tmpErr) {
        console.error('Error saving database to tmp', tmpErr);
      }
      this.saveToSupabase().catch(() => {});
      this.saveToCloud().catch(() => {});
      return;
    }

    try {
      this.ensureDirectory();
      fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (err) {
      try {
        fs.writeFileSync(TMP_FILE, JSON.stringify(payload, null, 2), 'utf-8');
        this.lastLoadedTmpMtime = Date.now();
      } catch (tmpErr) {
        console.error('Error saving database to tmp', tmpErr);
      }
    }
    this.saveToSupabase().catch(() => {});
    this.saveToCloud().catch(() => {});
  }

  public save() {
    this.saveDirect(this.data);
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  public async restoreData(newData: DatabaseSchema): Promise<boolean> {
    try {
      if (!Array.isArray(newData.students) || !Array.isArray(newData.food_collections)) {
        return false;
      }
      this.data = {
        students: newData.students,
        admins: newData.admins || this.data.admins,
        meals: newData.meals || this.data.meals,
        food_items: Array.isArray(newData.food_items) && newData.food_items.length > 0 ? newData.food_items : this.data.food_items,
        food_collections: newData.food_collections,
        notifications: newData.notifications || [],
        billing_settings: newData.billing_settings || this.data.billing_settings,
        monthly_bills: newData.monthly_bills || [],
        payments: newData.payments || [],
        hostel_settings: newData.hostel_settings || this.data.hostel_settings,
        sessions: newData.sessions || {}
      };
      this.save();
      await this.saveToSupabase();
      await this.saveToCloud();
      return true;
    } catch (err) {
      console.error('Error restoring database:', err);
      return false;
    }
  }

  public getPersistenceStatus() {
    const isSupabase = this.hasSupabaseConfigured();
    const isCloud = isSupabase || this.hasCloudConfigured();
    const isVercel = Boolean(process.env.VERCEL);
    const storageType = isSupabase
      ? 'SUPABASE_POSTGRES'
      : isCloud
      ? 'CLOUD_KV'
      : isVercel
      ? 'EPHEMERAL_TMP'
      : 'LOCAL_DISK';
    const isPersistent = isCloud || !isVercel;

    return {
      storage_type: storageType,
      is_persistent: isPersistent,
      cloud_configured: isCloud,
      environment: isVercel ? 'vercel' : (process.env.NODE_ENV === 'production' ? 'standalone' : 'local'),
      stats: {
        students: (this.data.students || []).length,
        collections: (this.data.food_collections || []).length,
        bills: (this.data.monthly_bills || []).length,
        payments: (this.data.payments || []).length,
        notifications: (this.data.notifications || []).length
      },
      last_modified: new Date().toISOString()
    };
  }

  // --- Students ---
  public getStudents(): Student[] {
    return this.data.students;
  }

  public findStudentById(id: string): Student | undefined {
    return this.data.students.find(s => s.id === id);
  }

  public findStudentByPhone(phone: string): Student | undefined {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    const last10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

    return this.data.students.find(s => {
      const sClean = s.phone_number.trim().replace(/\s+/g, '');
      const sDigits = sClean.replace(/\D/g, '');
      const sLast10 = sDigits.length >= 10 ? sDigits.slice(-10) : sDigits;
      return sClean === cleanPhone || (last10 && sLast10 === last10);
    });
  }

  public createStudent(fullName: string, phoneNumber: string, passwordHash: string, roomNumber?: string): Student {
    const newStudent: Student = {
      id: 'stu-' + crypto.randomUUID(),
      full_name: fullName.trim(),
      phone_number: phoneNumber.trim().replace(/\s+/g, ''),
      password_hash: passwordHash,
      room_number: roomNumber ? roomNumber.trim() : 'Room 101',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.data.students.push(newStudent);
    this.save();
    return newStudent;
  }

  public updateStudent(id: string, updates: Partial<Student>): Student | null {
    const idx = this.data.students.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.data.students[idx] = {
      ...this.data.students[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.save();
    return this.data.students[idx];
  }

  public deleteStudent(id: string): boolean {
    const idx = this.data.students.findIndex(s => s.id === id);
    if (idx === -1) return false;
    this.data.students.splice(idx, 1);

    // Invalidate active session tokens for deleted student
    if (this.data.sessions) {
      for (const [token, sess] of Object.entries(this.data.sessions)) {
        if (sess.userId === id) {
          delete this.data.sessions[token];
        }
      }
    }

    this.save();
    return true;
  }

  // --- Admins ---
  public getAdmins(): Admin[] {
    return this.data.admins;
  }

  public findAdminByUsername(username: string): Admin | undefined {
    return this.data.admins.find(a => a.username.toLowerCase() === username.trim().toLowerCase());
  }

  public findAdminById(id: string): Admin | undefined {
    return this.data.admins.find(a => a.id === id);
  }

  // --- Meals ---
  public getMeals(): Meal[] {
    return this.data.meals.sort((a, b) => a.display_order - b.display_order);
  }

  public findMealById(id: string): Meal | undefined {
    const clean = id.trim().toLowerCase();
    return this.data.meals.find(m =>
      m.id.toLowerCase() === clean ||
      m.meal_type.toLowerCase() === clean ||
      m.id.toLowerCase() === ('meal-' + clean) ||
      clean === ('meal-' + m.meal_type.toLowerCase())
    );
  }

  // --- Food Items ---
  public getFoodItems(date?: string): FoodItem[] {
    if (!date) return this.data.food_items;
    return this.data.food_items.filter(f => !f.serving_date || f.serving_date === date || f.serving_date === 'ALL');
  }

  public getAllFoodItems(): FoodItem[] {
    return this.data.food_items;
  }

  public findFoodItemById(id: string): FoodItem | undefined {
    return this.data.food_items.find(f => f.id === id);
  }

  public createFoodItem(item: Omit<FoodItem, 'id' | 'created_at'>): FoodItem {
    const newItem: FoodItem = {
      ...item,
      id: 'food-' + crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    this.data.food_items.push(newItem);
    this.save();
    return newItem;
  }

  public updateFoodItem(id: string, updates: Partial<FoodItem>): FoodItem | null {
    const idx = this.data.food_items.findIndex(f => f.id === id);
    if (idx === -1) return null;
    this.data.food_items[idx] = {
      ...this.data.food_items[idx],
      ...updates
    };
    this.save();
    return this.data.food_items[idx];
  }

  public deleteFoodItem(id: string): boolean {
    const lenBefore = this.data.food_items.length;
    this.data.food_items = this.data.food_items.filter(f => f.id !== id);
    if (this.data.food_items.length !== lenBefore) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Notifications ---
  public getNotifications(): Notification[] {
    if (!this.data.notifications) this.data.notifications = [];
    return [...this.data.notifications].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public getUnreadNotificationCount(): number {
    if (!this.data.notifications) this.data.notifications = [];
    return this.data.notifications.filter(n => !n.is_read).length;
  }

  public addNotification(data: Omit<Notification, 'id' | 'is_read' | 'created_at'>): Notification {
    if (!this.data.notifications) this.data.notifications = [];
    const notif: Notification = {
      id: 'notif-' + crypto.randomUUID(),
      student_id: data.student_id,
      student_name: data.student_name,
      meal_category: data.meal_category,
      food_name: data.food_name,
      collection_id: data.collection_id,
      date: data.date,
      timestamp: data.timestamp,
      message: data.message,
      is_read: false,
      created_at: new Date().toISOString()
    };
    this.data.notifications.unshift(notif);
    this.save();
    return notif;
  }

  public markNotificationRead(id: string): boolean {
    if (!this.data.notifications) this.data.notifications = [];
    const notif = this.data.notifications.find(n => n.id === id);
    if (notif) {
      notif.is_read = true;
      this.save();
      return true;
    }
    return false;
  }

  public markAllNotificationsRead(): number {
    if (!this.data.notifications) this.data.notifications = [];
    let count = 0;
    for (const n of this.data.notifications) {
      if (!n.is_read) {
        n.is_read = true;
        count++;
      }
    }
    if (count > 0) this.save();
    return count;
  }

  public getMealRate(mealType: MealType): number {
    const s = this.data.billing_settings;
    if (mealType === 'BREAKFAST') return s.breakfast_rate || 45;
    if (mealType === 'LUNCH') return s.lunch_rate || 85;
    if (mealType === 'SNACKS') return s.snacks_rate || 35;
    if (mealType === 'DINNER') return s.dinner_rate || 85;
    return 60;
  }

  // --- Food Collections ---
  public getCollections(): FoodCollection[] {
    return this.data.food_collections;
  }

  public findCollection(studentId: string, mealId: string, date: string): FoodCollection | undefined {
    return this.data.food_collections.find(
      c => c.student_id === studentId && c.meal_id === mealId && c.collection_date === date
    );
  }

  public markFoodCollected(
    studentId: string,
    studentName: string,
    studentPhone: string,
    mealId: string,
    mealType: MealType,
    date: string,
    foodItemNames: string[],
    foodItemId?: string,
    foodItemName?: string
  ): { success: boolean; collection?: FoodCollection; notification?: Notification; error?: string } {
    const effectiveDishName = foodItemName || (foodItemNames && foodItemNames.length > 0 ? foodItemNames[0] : undefined);

    // Check duplicate collection constraint strictly for this exact dish item on this date
    if (foodItemId || effectiveDishName) {
      const existing = this.data.food_collections.find(
        c => c.student_id === studentId &&
             c.collection_date === date &&
             ((foodItemId && c.food_item_id === foodItemId) ||
              (effectiveDishName && (
                (c.food_item_name && c.food_item_name.toLowerCase() === effectiveDishName.toLowerCase()) ||
                (c.food_items_snapshot && c.food_items_snapshot.length === 1 && c.food_items_snapshot[0].toLowerCase() === effectiveDishName.toLowerCase())
              )))
      );
      if (existing) {
        return {
          success: false,
          error: `${effectiveDishName || 'This dish'} has already been collected today at ${new Date(existing.collected_at).toLocaleTimeString()}`
        };
      }
    }

    const itemObj = (foodItemId && this.data.food_items.find(i => i.id === foodItemId)) ||
                    (effectiveDishName && this.data.food_items.find(i => i.name.toLowerCase() === effectiveDishName.toLowerCase()));
    const amount = itemObj ? itemObj.price : this.getMealRate(mealType);

    const newCollection: FoodCollection = {
      id: 'col-' + crypto.randomUUID(),
      student_id: studentId,
      student_name: studentName,
      student_phone: studentPhone,
      meal_id: mealId,
      meal_type: mealType,
      food_item_id: foodItemId || itemObj?.id,
      food_item_name: effectiveDishName || 'Meal',
      collection_date: date,
      collected_at: new Date().toISOString(),
      food_items_snapshot: effectiveDishName ? [effectiveDishName] : ['Meal'],
      amount,
      payment_status: 'PENDING'
    };

    this.data.food_collections.push(newCollection);

    // Format meal category nicely: Breakfast, Lunch, Evening Snacks, or Dinner
    const mealCategoryDisplay =
      mealType === 'SNACKS' ? 'Evening Snacks' : mealType.charAt(0) + mealType.slice(1).toLowerCase();

    const notif = this.addNotification({
      student_id: studentId,
      student_name: studentName,
      meal_category: mealType,
      food_name: foodItemName || (foodItemNames && foodItemNames.length === 1 ? foodItemNames[0] : mealCategoryDisplay),
      collection_id: newCollection.id,
      date: date,
      timestamp: newCollection.collected_at,
      message: `${studentName} has collected ${mealCategoryDisplay}.`
    });

    this.save();

    // Auto-update student's current bill
    this.syncStudentBillForCollection(studentId, studentName, studentPhone, mealType, date);

    return { success: true, collection: newCollection, notification: notif };
  }

  public recordCollectionPayment(
    collectionId: string,
    paymentMethod: PaymentMethod = 'UPI',
    referenceId?: string
  ): { success: boolean; payment?: Payment; collection?: FoodCollection; error?: string } {
    const collection = this.data.food_collections.find(c => c.id === collectionId);
    if (!collection) {
      return { success: false, error: 'Collection record not found' };
    }

    if (collection.payment_status === 'PAID') {
      return { success: false, error: 'Payment has already been completed for this collection' };
    }

    const amount = collection.amount || this.getMealRate(collection.meal_type);
    const ref = referenceId || `UPI-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPayment: Payment = {
      id: 'pay-' + crypto.randomUUID(),
      bill_id: collectionId,
      student_id: collection.student_id,
      student_name: collection.student_name,
      amount,
      payment_method: paymentMethod || 'UPI',
      reference_id: ref,
      notes: `Payment for ${collection.food_item_name || collection.meal_type} (${collection.collection_date})`,
      received_by: 'Hostel Mess Counter',
      paid_at: new Date().toISOString()
    };

    this.data.payments.push(newPayment);
    collection.payment_status = 'PAID';
    collection.payment_id = newPayment.id;

    // Credit student's monthly bill
    const colDate = new Date(collection.collection_date);
    const month = colDate.getMonth() + 1;
    const year = colDate.getFullYear();
    const bill = this.data.monthly_bills.find(b => b.student_id === collection.student_id && b.month === month && b.year === year);
    if (bill) {
      bill.paid_amount += amount;
      bill.balance_amount = Math.max(0, bill.total_amount - bill.paid_amount);
      if (bill.balance_amount <= 0) {
        bill.payment_status = 'PAID';
        bill.balance_amount = 0;
      } else if (bill.paid_amount > 0) {
        bill.payment_status = 'PARTIALLY_PAID';
      }
      bill.updated_at = new Date().toISOString();
    }

    this.save();
    return { success: true, payment: newPayment, collection };
  }

  private syncStudentBillForCollection(
    studentId: string,
    studentName: string,
    studentPhone: string,
    mealType: MealType,
    collectionDate: string
  ) {
    const colDate = new Date(collectionDate);
    const month = colDate.getMonth() + 1;
    const year = colDate.getFullYear();

    let bill = this.data.monthly_bills.find(b => b.student_id === studentId && b.month === month && b.year === year);
    const settings = this.data.billing_settings;

    if (!bill) {
      bill = {
        id: 'bill-' + crypto.randomUUID(),
        student_id: studentId,
        student_name: studentName,
        student_phone: studentPhone,
        month,
        year,
        breakfast_count: 0,
        lunch_count: 0,
        snacks_count: 0,
        dinner_count: 0,
        total_meals: 0,
        billing_mode: settings.mode,
        base_amount: 0,
        late_fee: 0,
        total_amount: 0,
        paid_amount: 0,
        balance_amount: 0,
        payment_status: 'PENDING',
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.data.monthly_bills.push(bill);
    }

    if (mealType === 'BREAKFAST') bill.breakfast_count += 1;
    else if (mealType === 'LUNCH') bill.lunch_count += 1;
    else if (mealType === 'SNACKS') bill.snacks_count += 1;
    else if (mealType === 'DINNER') bill.dinner_count += 1;

    bill.total_meals = bill.breakfast_count + bill.lunch_count + bill.snacks_count + bill.dinner_count;
    bill.billing_mode = 'PER_MEAL';
    bill.base_amount =
      bill.breakfast_count * settings.breakfast_rate +
      bill.lunch_count * settings.lunch_rate +
      bill.snacks_count * settings.snacks_rate +
      bill.dinner_count * settings.dinner_rate;

    bill.total_amount = bill.base_amount + bill.late_fee;
    bill.balance_amount = Math.max(0, bill.total_amount - bill.paid_amount);

    if (bill.balance_amount === 0 && bill.total_amount > 0) {
      bill.payment_status = 'PAID';
    } else if (bill.paid_amount > 0) {
      bill.payment_status = 'PARTIALLY_PAID';
    } else {
      bill.payment_status = 'PENDING';
    }

    bill.updated_at = new Date().toISOString();
    this.save();
  }

  // --- Billing Settings ---
  public getBillingSettings(): BillingSettings {
    return this.data.billing_settings;
  }

  public updateBillingSettings(settings: Partial<BillingSettings>): BillingSettings {
    this.data.billing_settings = {
      ...this.data.billing_settings,
      ...settings,
      updated_at: new Date().toISOString()
    };
    this.save();
    return this.data.billing_settings;
  }

  // --- Monthly Bills ---
  public getMonthlyBills(month?: number, year?: number): MonthlyBill[] {
    let list = this.data.monthly_bills;
    if (month) list = list.filter(b => b.month === month);
    if (year) list = list.filter(b => b.year === year);
    return list;
  }

  public getStudentBill(studentId: string, month: number, year: number): MonthlyBill | undefined {
    return this.data.monthly_bills.find(b => b.student_id === studentId && b.month === month && b.year === year);
  }

  public recordPayment(
    billId: string,
    amount: number,
    paymentMethod: Payment['payment_method'],
    receivedBy: string,
    referenceId?: string,
    notes?: string
  ): { success: boolean; payment?: Payment; bill?: MonthlyBill; error?: string } {
    const bill = this.data.monthly_bills.find(b => b.id === billId);
    if (!bill) {
      return { success: false, error: 'Monthly bill not found' };
    }

    const newPayment: Payment = {
      id: 'pay-' + crypto.randomUUID(),
      bill_id: billId,
      student_id: bill.student_id,
      student_name: bill.student_name,
      amount,
      payment_method: paymentMethod,
      reference_id: referenceId,
      notes,
      received_by: receivedBy || 'Mess Admin',
      paid_at: new Date().toISOString()
    };

    this.data.payments.push(newPayment);

    bill.paid_amount += amount;
    bill.balance_amount = Math.max(0, bill.total_amount - bill.paid_amount);

    if (bill.balance_amount <= 0) {
      bill.payment_status = 'PAID';
      bill.balance_amount = 0;
    } else if (bill.paid_amount > 0) {
      bill.payment_status = 'PARTIALLY_PAID';
    }

    bill.updated_at = new Date().toISOString();
    this.save();

    return { success: true, payment: newPayment, bill };
  }

  public getPaymentsForBill(billId: string): Payment[] {
    return this.data.payments.filter(p => p.bill_id === billId);
  }

  public getAllPayments(): Payment[] {
    return this.data.payments;
  }

  // --- Hostel Settings ---
  public getHostelSettings(): HostelSettings {
    return this.data.hostel_settings;
  }

  public updateHostelSettings(settings: Partial<HostelSettings>): HostelSettings {
    this.data.hostel_settings = {
      ...this.data.hostel_settings,
      ...settings
    };
    this.save();
    return this.data.hostel_settings;
  }

  // --- Sessions ---
  public createSession(userId: string, role: 'student' | 'admin'): string {
    let student: Student | undefined;
    if (role === 'student') {
      student = this.findStudentById(userId);
    }
    const token = createSignedSessionToken(
      userId,
      role,
      student?.phone_number,
      student?.full_name,
      student?.room_number
    );
    const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    if (!this.data.sessions) this.data.sessions = {};
    this.data.sessions[token] = { userId, role, expiresAt };
    this.save();
    return token;
  }

  public validateSession(token?: string): { userId: string; role: 'student' | 'admin' } | null {
    if (!token) return null;

    // Check signed token first (stateless & resilient across serverless instances)
    const signed = verifySignedSessionToken(token);
    if (signed) {
      if (signed.role === 'student') {
        let student = this.findStudentById(signed.userId);
        if (!student && signed.phone_number) {
          student = this.findStudentByPhone(signed.phone_number);
        }

        // Resilient Vercel serverless cold-start & multi-instance fallback:
        // If student is validly signed by our HMAC secret but missing from this container's temporary DB, restore it!
        if (!student && signed.phone_number && signed.full_name) {
          student = {
            id: signed.userId,
            full_name: signed.full_name,
            phone_number: signed.phone_number,
            room_number: signed.room_number || '',
            password_hash: '',
            status: 'ACTIVE',
            created_at: new Date(signed.ts || Date.now()).toISOString(),
            updated_at: new Date().toISOString()
          };
          this.data.students.push(student);
          this.save();
        }

        if (student && student.status === 'ACTIVE') {
          return { userId: student.id, role: 'student' };
        }
      } else if (signed.role === 'admin') {
        const admin = this.findAdminById(signed.userId);
        if (admin) {
          return { userId: admin.id, role: 'admin' };
        }
      }
    }

    // Fallback: check in-memory / JSON session store
    if (this.data && this.data.sessions && this.data.sessions[token]) {
      const session = this.data.sessions[token];
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        delete this.data.sessions[token];
        this.save();
        return null;
      }
      return session;
    }
    return null;
  }

  public removeSession(token?: string) {
    if (token && this.data && this.data.sessions && this.data.sessions[token]) {
      delete this.data.sessions[token];
      this.save();
    }
  }
}

const SESSION_SECRET = process.env.SESSION_SECRET || 'tastebox-hostel-mess-hmac-key-2026';

function createSignedSessionToken(
  userId: string,
  role: 'student' | 'admin',
  phone_number?: string,
  full_name?: string,
  room_number?: string
): string {
  const payloadData: any = { userId, role, ts: Date.now() };
  if (phone_number) payloadData.phone_number = phone_number;
  if (full_name) payloadData.full_name = full_name;
  if (room_number) payloadData.room_number = room_number;
  const payload = Buffer.from(JSON.stringify(payloadData)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifySignedSessionToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payload, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      if (Date.now() - data.ts < 30 * 86400000) {
        return data;
      }
    }
  } catch {}
  return null;
}

export const db = new Database();

// =============================================================================
// 3. REST API ROUTER & CONTROLLERS
// =============================================================================
export const apiRouter = Router();

// Synchronize latest database state across serverless instances before handling request
apiRouter.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    if (db.hasSupabaseConfigured()) {
      await db.syncFromSupabase();
    } else if (db.hasCloudConfigured()) {
      await db.syncFromCloud();
    } else if (process.env.VERCEL) {
      db.checkAndReloadTmpFile();
    }
  } catch (err) {
    console.error('Database sync hook error:', err);
  }
  next();
});

function getParamId(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

// Zod Validation Schemas
export const studentLoginSchema = z.object({
  phone_number: z.string().min(5, 'Valid phone number is required'),
  password: z.string().min(1, 'Password is required')
});

export const adminLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

export const createStudentSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  phone_number: z.string().trim().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  password: z.string().min(4, 'Password must be at least 4 characters').optional(),
  room_number: z.string().optional()
});

export const markCollectionSchema = z.object({
  meal_id: z.string().min(1, 'meal_id is required'),
  food_item_id: z.string().optional(),
  food_item_name: z.string().optional()
});

export const foodItemSchema = z.object({
  name: z.string().min(1, 'Dish name is required'),
  meal_type: z.enum(['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER']),
  price: z.number().nonnegative('Price cannot be negative'),
  category: z.enum(['VEG', 'NON_VEG', 'EGG']).optional(),
  description: z.string().optional(),
  image_url: z.string().optional(),
  serving_date: z.string().optional()
});

export const billingSettingsSchema = z.object({
  mode: z.enum(['FIXED', 'PER_MEAL']),
  fixed_monthly_rate: z.number().nonnegative(),
  breakfast_rate: z.number().nonnegative(),
  lunch_rate: z.number().nonnegative(),
  snacks_rate: z.number().nonnegative(),
  dinner_rate: z.number().nonnegative(),
  late_fee_amount: z.number().nonnegative()
});

export const recordPaymentSchema = z.object({
  bill_id: z.string().min(1, 'Bill ID is required'),
  amount: z.number().positive('Payment amount must be greater than 0'),
  payment_method: z.enum(['UPI', 'CASH', 'BANK_TRANSFER', 'CARD']),
  reference_id: z.string().optional(),
  notes: z.string().optional(),
  received_by: z.string().optional()
});

// Helper to extract session token from Authorization header or cookie
function getSessionToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) return token;
  }
  if (req.cookies && req.cookies.mess_session) {
    return req.cookies.mess_session;
  }
  return undefined;
}

// Set persistent cookie
function setSessionCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
  res.cookie('mess_session', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/'
  });
}

// -----------------------------------------------------------------------------
// REALTIME SSE STREAM
// -----------------------------------------------------------------------------
apiRouter.get('/realtime/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  realtimeManager.addClient(res);

  // Send initial handshake
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString(), message: 'Connected to Live Mess Stream' })}\n\n`);

  // Periodic heartbeat every 25 seconds
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    realtimeManager.removeClient(res);
  });
});

// -----------------------------------------------------------------------------
// AUTHENTICATION: STUDENT
// -----------------------------------------------------------------------------

// Student Registration: Open account creation for students (10-digit phone, no duplicates)
apiRouter.post('/auth/student/register', (req: Request, res: Response) => {
  const parseResult = createStudentSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid input data' });
    return;
  }

  const { full_name, phone_number, password, room_number } = parseResult.data;
  const cleanPhone = phone_number.trim();
  const existing = db.findStudentByPhone(cleanPhone);
  if (existing) {
    res.status(409).json({ error: 'A student with this phone number is already registered. Please log in.' });
    return;
  }

  const passwordHash = hashPassword(password || 'Student@123');
  const student = db.createStudent(full_name, cleanPhone, passwordHash, room_number);
  const token = db.createSession(student.id, 'student');
  setSessionCookie(res, token);

  // Broadcast & persist notification for Admin Portal
  const notif = db.addNotification({
    student_id: student.id,
    student_name: student.full_name,
    meal_category: 'REGISTRATION' as any,
    food_name: student.room_number ? `Room ${student.room_number}` : 'New Student',
    date: getTodayDateString(),
    timestamp: new Date().toISOString(),
    message: `${student.full_name}${student.room_number ? ` (Room ${student.room_number})` : ''} created a new student account (${student.phone_number}).`
  });

  realtimeManager.broadcast({
    type: 'NOTIFICATION_CREATED',
    timestamp: new Date().toISOString(),
    data: notif
  });

  const { password_hash, ...safeStudent } = student;

  realtimeManager.broadcast({
    type: 'STUDENT_CREATED' as any,
    timestamp: new Date().toISOString(),
    data: safeStudent
  });

  res.status(201).json({
    message: 'Account created successfully',
    token,
    student: safeStudent
  });
});

// Student Login: Phone Number & Password
apiRouter.post('/auth/student/login', (req: Request, res: Response) => {
  const parseResult = studentLoginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Phone number and password are required' });
    return;
  }

  const { phone_number, password } = parseResult.data;
  const cleanPhone = phone_number.trim().replace(/\s+/g, '');
  const student = db.findStudentByPhone(cleanPhone);

  if (!student) {
    res.status(401).json({ error: 'Account not found. Please contact the Mess Warden to set up your account.' });
    return;
  }

  if (student.status === 'DEACTIVATED') {
    res.status(403).json({ error: 'Your account has been deactivated. Please contact the Mess Warden.' });
    return;
  }

  if (!verifyPassword(password, student.password_hash)) {
    res.status(401).json({ error: 'Incorrect password. Please try again.' });
    return;
  }

  const token = db.createSession(student.id, 'student');
  setSessionCookie(res, token);

  const { password_hash, ...safeStudent } = student;
  res.json({
    message: 'Login successful',
    token,
    student: safeStudent
  });
});

// Student Session Verification (GET /api/auth/student/me)
apiRouter.get('/auth/student/me', (req: Request, res: Response) => {
  const token = getSessionToken(req);
  const session = db.validateSession(token);

  if (!session || session.role !== 'student') {
    res.status(401).json({ authenticated: false, error: 'No active student session' });
    return;
  }

  const student = db.findStudentById(session.userId);
  if (!student || student.status === 'DEACTIVATED') {
    res.status(401).json({ authenticated: false, error: 'Student not found or deactivated' });
    return;
  }

  const { password_hash, ...safeStudent } = student;
  res.json({ authenticated: true, student: safeStudent });
});

// Student Password Update (PUT /api/auth/student/password)
apiRouter.put('/auth/student/password', (req: Request, res: Response) => {
  const token = getSessionToken(req);
  const session = db.validateSession(token);

  if (!session || session.role !== 'student') {
    res.status(401).json({ error: 'Please log in to update your password' });
    return;
  }

  const { new_password, current_password } = req.body;
  if (!new_password || typeof new_password !== 'string' || new_password.trim().length < 4) {
    res.status(400).json({ error: 'New password must be at least 4 characters long' });
    return;
  }

  const student = db.findStudentById(session.userId);
  if (!student) {
    res.status(404).json({ error: 'Student not found' });
    return;
  }

  if (current_password && !verifyPassword(current_password, student.password_hash)) {
    res.status(400).json({ error: 'Current password is incorrect' });
    return;
  }

  const newHash = hashPassword(new_password.trim());
  const updated = db.updateStudent(student.id, { password_hash: newHash });
  if (!updated) {
    res.status(500).json({ error: 'Failed to update password in database' });
    return;
  }

  res.json({ message: 'Password updated successfully' });
});

// -----------------------------------------------------------------------------
// AUTHENTICATION: ADMIN
// -----------------------------------------------------------------------------

// Admin Login: Username & Password
apiRouter.post('/auth/admin/login', (req: Request, res: Response) => {
  const parseResult = adminLoginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Username and password are required' });
    return;
  }

  const { username, password } = parseResult.data;
  const admin = db.findAdminByUsername(username);
  if (!admin) {
    res.status(401).json({ error: 'Invalid admin credentials' });
    return;
  }

  if (!verifyPassword(password, admin.password_hash)) {
    res.status(401).json({ error: 'Invalid admin credentials' });
    return;
  }

  const token = db.createSession(admin.id, 'admin');
  setSessionCookie(res, token);

  const { password_hash, ...safeAdmin } = admin;
  res.json({
    message: 'Admin login successful',
    token,
    admin: safeAdmin
  });
});

// Admin Session Verification (GET /api/auth/admin/me)
apiRouter.get('/auth/admin/me', (req: Request, res: Response) => {
  const token = getSessionToken(req);
  const session = db.validateSession(token);

  if (!session || session.role !== 'admin') {
    res.status(401).json({ authenticated: false, error: 'No active admin session' });
    return;
  }

  const admin = db.findAdminById(session.userId);
  if (!admin) {
    res.status(401).json({ authenticated: false, error: 'Admin not found' });
    return;
  }

  const { password_hash, ...safeAdmin } = admin;
  res.json({ authenticated: true, admin: safeAdmin });
});

// Common Logout
apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const token = getSessionToken(req);
  db.removeSession(token);
  res.clearCookie('mess_session', { path: '/' });
  res.json({ message: 'Logged out successfully' });
});

// -----------------------------------------------------------------------------
// MENU & LIVE SERVING STATUS
// -----------------------------------------------------------------------------

// Get today's menu with meals and items
apiRouter.get('/menu/today', (req: Request, res: Response) => {
  const date = (req.query.date as string) || getTodayDateString();
  const meals = db.getMeals();
  const allItems = db.getAllFoodItems();
  const items = allItems.filter(item => !item.serving_date || item.serving_date === date);

  const menu = meals.map(meal => {
    const mealItems = items.filter(item => item.meal_id === meal.id || item.meal_type === meal.meal_type);
    return {
      ...meal,
      items: mealItems
    };
  });

  res.json({
    date,
    meals: menu
  });
});

// Get all meals & food items
apiRouter.get('/menu/all', (_req: Request, res: Response) => {
  const meals = db.getMeals();
  const items = db.getAllFoodItems();
  res.json({ meals, items });
});

// Add a food item
apiRouter.post('/menu/items', (req: Request, res: Response) => {
  const { meal_id, meal_type, name, description, category, price, image_url, serving_date } = req.body;

  if (!meal_id || !meal_type || !name) {
    res.status(400).json({ error: 'meal_id, meal_type, and name are required' });
    return;
  }

  const newItem = db.createFoodItem({
    meal_id,
    meal_type,
    name,
    description: description || '',
    category: category || 'VEG',
    price: Number(price) || 0,
    image_url: image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    serving_date: serving_date || undefined
  });

  realtimeManager.broadcast({
    type: 'MENU_UPDATED',
    timestamp: new Date().toISOString(),
    data: newItem
  });

  res.status(201).json(newItem);
});

// Update a food item
apiRouter.put('/menu/items/:id', (req: Request, res: Response) => {
  const id = getParamId(req.params.id);
  const updates = { ...req.body };
  if (updates.price !== undefined) updates.price = Number(updates.price);
  
  const updated = db.updateFoodItem(id, updates);
  if (!updated) {
    res.status(404).json({ error: 'Food item not found' });
    return;
  }

  realtimeManager.broadcast({
    type: 'MENU_UPDATED',
    timestamp: new Date().toISOString(),
    data: updated
  });

  res.json(updated);
});

// Delete a food item
apiRouter.delete('/menu/items/:id', (req: Request, res: Response) => {
  const id = getParamId(req.params.id);
  const deleted = db.deleteFoodItem(id);
  if (!deleted) {
    res.status(404).json({ error: 'Food item not found' });
    return;
  }

  realtimeManager.broadcast({
    type: 'MENU_UPDATED',
    timestamp: new Date().toISOString(),
    data: { id, deleted: true }
  });

  res.json({ message: 'Food item deleted successfully' });
});

// -----------------------------------------------------------------------------
// FOOD COLLECTIONS (QR-BASED RECORDING & TRACKING)
// -----------------------------------------------------------------------------

// Student marks food as collected
apiRouter.post('/collections/mark', (req: Request, res: Response) => {
  const token = getSessionToken(req);
  const session = db.validateSession(token);

  if (!session || session.role !== 'student') {
    res.status(401).json({ error: 'Please log in to record food collection' });
    return;
  }

  const student = db.findStudentById(session.userId);
  if (!student) {
    res.status(401).json({ error: 'Student account not found' });
    return;
  }

  if (student.status !== 'ACTIVE') {
    res.status(403).json({ error: 'Your student account is not active' });
    return;
  }

  const parseResult = markCollectionSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0]?.message || 'meal_id is required' });
    return;
  }

  const { meal_id, food_item_id, food_item_name } = parseResult.data;
  let meal = db.findMealById(meal_id);
  if (!meal) {
    const allMeals = db.getMeals();
    meal = allMeals.find(m => m.id === meal_id || m.meal_type === meal_id || `meal-${m.meal_type.toLowerCase()}` === meal_id);
  }

  if (!meal) {
    res.status(404).json({ error: 'Meal not found' });
    return;
  }

  const today = getTodayDateString();
  const allFoodItems = db.getAllFoodItems();
  const matchedItem = food_item_id
    ? allFoodItems.find(i => i.id === food_item_id)
    : (food_item_name ? allFoodItems.find(i => i.name.toLowerCase() === food_item_name.toLowerCase()) : undefined);
  const resolvedFoodName = matchedItem?.name || food_item_name || 'Meal';
  const resolvedFoodId = matchedItem?.id || food_item_id;
  const itemNames = [resolvedFoodName];

  // Attempt to mark unique dish collection with strict single-dish validation
  const result = db.markFoodCollected(
    student.id,
    student.full_name,
    student.phone_number,
    meal.id,
    meal.meal_type,
    today,
    itemNames,
    resolvedFoodId,
    resolvedFoodName
  );

  if (!result.success) {
    res.status(409).json({ error: result.error });
    return;
  }

  // Broadcast event to admin monitoring screen with explicit food_item_name
  realtimeManager.broadcast({
    type: 'COLLECTION_MARKED',
    timestamp: new Date().toISOString(),
    data: {
      ...result.collection,
      food_item_name: resolvedFoodName || meal.name
    }
  });

  if (result.notification) {
    realtimeManager.broadcast({
      type: 'NOTIFICATION_CREATED',
      timestamp: new Date().toISOString(),
      data: result.notification
    });
  }

  res.status(201).json({
    message: resolvedFoodName ? `${resolvedFoodName} marked as collected!` : `Food collection confirmed for ${meal.name}!`,
    collection: result.collection,
    notification: result.notification
  });
});

// Student's own collection history
apiRouter.get('/collections/my', (req: Request, res: Response) => {
  const token = getSessionToken(req);
  const session = db.validateSession(token);

  if (!session || session.role !== 'student') {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const month = req.query.month ? Number(req.query.month) : undefined;
  const year = req.query.year ? Number(req.query.year) : undefined;

  let list = db.getCollections().filter(c => c.student_id === session.userId);

  if (month && year) {
    list = list.filter(c => {
      const d = new Date(c.collection_date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });
  }

  list.sort((a, b) => new Date(b.collected_at).getTime() - new Date(a.collected_at).getTime());
  res.json(list);
});

// Admin collection feed & summary
apiRouter.get('/collections', (req: Request, res: Response) => {
  const date = (req.query.date as string) || '';
  const mealType = (req.query.meal_type as string) || '';
  const search = (req.query.search as string || '').toLowerCase().trim();

  let list = db.getCollections();

  if (date) {
    list = list.filter(c => c.collection_date === date);
  }
  if (mealType) {
    list = list.filter(c => c.meal_type === mealType);
  }
  if (search) {
    list = list.filter(
      c =>
        c.student_name.toLowerCase().includes(search) ||
        c.student_phone.includes(search)
    );
  }

  list.sort((a, b) => new Date(b.collected_at).getTime() - new Date(a.collected_at).getTime());
  res.json(list);
});

// Admin collection summary & analytics
apiRouter.get('/collections/summary', (req: Request, res: Response) => {
  const date = (req.query.date as string) || getTodayDateString();
  const allStudents = db.getStudents().filter(s => s.status === 'ACTIVE');
  const allCollections = db.getCollections();
  const todayCollections = allCollections.filter(c => c.collection_date === date);

  const now = new Date(date);
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const monthlyCollections = allCollections.filter(c => {
    const d = new Date(c.collection_date);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });

  const bills = db.getMonthlyBills(currentMonth, currentYear);
  const monthlyRevenue = bills.reduce((acc, b) => acc + (b.paid_amount || 0), 0);
  const pendingPayments = bills.reduce((acc, b) => acc + (b.balance_amount || 0), 0);

  const meals = db.getMeals();

  const successfulCollections = todayCollections.filter(c => c.payment_status === 'PAID');
  const pendingCollections = todayCollections.filter(c => c.payment_status === 'PENDING' || !c.payment_status);
  const failedCollections = todayCollections.filter(c => c.payment_status === 'FAILED');

  const successful_payments_count = successfulCollections.length;
  const successful_payments_amount = successfulCollections.reduce((sum, c) => sum + (c.amount || db.getMealRate(c.meal_type)), 0);
  const pending_payments_count = pendingCollections.length;
  const pending_payments_amount = pendingCollections.reduce((sum, c) => sum + (c.amount || db.getMealRate(c.meal_type)), 0);
  const failed_payments_count = failedCollections.length;

  const mealSummary = meals.map(m => {
    const mealCollections = todayCollections.filter(c => c.meal_id === m.id || c.meal_type === m.meal_type);
    const collectedStudentIds = new Set(mealCollections.map(c => c.student_id));

    const collectedStudents = allStudents.filter(s => collectedStudentIds.has(s.id));
    const uncollectedStudents = allStudents.filter(s => !collectedStudentIds.has(s.id));

    return {
      meal_id: m.id,
      meal_type: m.meal_type,
      name: m.name,
      start_time: m.start_time,
      end_time: m.end_time,
      collected_count: mealCollections.length,
      total_students: allStudents.length,
      collected_students: collectedStudents.map(s => ({ id: s.id, name: s.full_name, phone: s.phone_number })),
      uncollected_students: uncollectedStudents.map(s => ({ id: s.id, name: s.full_name, phone: s.phone_number }))
    };
  });

  res.json({
    date,
    total_active_students: allStudents.length,
    total_collections_today: todayCollections.length,
    monthly_collections: monthlyCollections.length,
    monthly_revenue: monthlyRevenue,
    pending_payments: pendingPayments,
    successful_payments_count,
    successful_payments_amount,
    pending_payments_count,
    pending_payments_amount,
    failed_payments_count,
    meals: mealSummary
  });
});

// -----------------------------------------------------------------------------
// NOTIFICATIONS (PERSISTENT ADMIN ALERTS)
// -----------------------------------------------------------------------------
apiRouter.get('/notifications', (req: Request, res: Response) => {
  const token = getSessionToken(req);
  const session = db.validateSession(token);

  if (!session || session.role !== 'admin') {
    res.status(401).json({ error: 'Unauthorized: Admin access required' });
    return;
  }

  const notifications = db.getNotifications();
  const unread_count = db.getUnreadNotificationCount();
  res.json({ notifications, unread_count });
});

apiRouter.patch('/notifications/:id/read', (req: Request, res: Response) => {
  const token = getSessionToken(req);
  const session = db.validateSession(token);

  if (!session || session.role !== 'admin') {
    res.status(401).json({ error: 'Unauthorized: Admin access required' });
    return;
  }

  const id = getParamId(req.params.id);
  const success = db.markNotificationRead(id);
  if (!success) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }

  res.json({ success: true, message: 'Notification marked as read' });
});

apiRouter.post('/notifications/read-all', (req: Request, res: Response) => {
  const token = getSessionToken(req);
  const session = db.validateSession(token);

  if (!session || session.role !== 'admin') {
    res.status(401).json({ error: 'Unauthorized: Admin access required' });
    return;
  }

  const count = db.markAllNotificationsRead();
  res.json({ success: true, count });
});

// -----------------------------------------------------------------------------
// COLLECTION-SPECIFIC MEAL PAYMENT SETTLEMENT
// -----------------------------------------------------------------------------
apiRouter.post('/payments/collect-pay', (req: Request, res: Response) => {
  const token = getSessionToken(req);
  const session = db.validateSession(token);

  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { collection_id, payment_method, reference_id } = req.body;
  if (!collection_id) {
    res.status(400).json({ error: 'collection_id is required' });
    return;
  }

  const result = db.recordCollectionPayment(collection_id, payment_method || 'UPI', reference_id);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  realtimeManager.broadcast({
    type: 'PAYMENT_RECORDED',
    timestamp: new Date().toISOString(),
    data: { payment: result.payment, collection: result.collection }
  });

  realtimeManager.broadcast({
    type: 'BILL_UPDATED',
    timestamp: new Date().toISOString(),
    data: { payment: result.payment }
  });

  res.status(201).json(result);
});

// -----------------------------------------------------------------------------
// STUDENT MANAGEMENT (ADMIN)
// -----------------------------------------------------------------------------

// List students
apiRouter.get('/students', (req: Request, res: Response) => {
  const search = (req.query.search as string || '').toLowerCase().trim();
  let students = db.getStudents();

  if (search) {
    students = students.filter(
      s => s.full_name.toLowerCase().includes(search) || s.phone_number.includes(search) || (s.room_number && s.room_number.toLowerCase().includes(search))
    );
  }

  const safeStudents = students.map(({ password_hash, ...rest }) => rest);
  res.json(safeStudents);
});

// Admin add student manually
apiRouter.post('/students', (req: Request, res: Response) => {
  const parseResult = createStudentSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Full name and phone number are required' });
    return;
  }

  const { full_name, phone_number, password, room_number } = parseResult.data;
  const cleanPhone = String(phone_number).trim().replace(/\s+/g, '');
  if (db.findStudentByPhone(cleanPhone)) {
    res.status(409).json({ error: 'Student with this phone number already exists' });
    return;
  }

  const defaultPassword = password || 'Student@123';
  const newStudent = db.createStudent(full_name, cleanPhone, hashPassword(defaultPassword));
  if (room_number) {
    db.updateStudent(newStudent.id, { room_number });
  }

  // Broadcast & persist notification for Admin Portal
  const notif = db.addNotification({
    student_id: newStudent.id,
    student_name: newStudent.full_name,
    meal_category: 'REGISTRATION' as any,
    food_name: room_number ? `Room ${room_number}` : 'New Student',
    date: getTodayDateString(),
    timestamp: new Date().toISOString(),
    message: `Student account created for ${newStudent.full_name}${room_number ? ` (Room ${room_number})` : ''} (${newStudent.phone_number}).`
  });

  realtimeManager.broadcast({
    type: 'NOTIFICATION_CREATED',
    timestamp: new Date().toISOString(),
    data: notif
  });

  const { password_hash, ...safe } = newStudent;

  realtimeManager.broadcast({
    type: 'STUDENT_CREATED' as any,
    timestamp: new Date().toISOString(),
    data: safe
  });

  res.status(201).json(safe);
});

// Update student
apiRouter.put('/students/:id', (req: Request, res: Response) => {
  const id = getParamId(req.params.id);
  const { full_name, phone_number, room_number, status, password } = req.body;

  const updates: any = {};
  if (full_name) updates.full_name = full_name;
  if (phone_number) updates.phone_number = phone_number.trim().replace(/\s+/g, '');
  if (room_number !== undefined) updates.room_number = room_number;
  if (status) updates.status = status;
  if (password) updates.password_hash = hashPassword(password);

  const updated = db.updateStudent(id, updates);
  if (!updated) {
    res.status(404).json({ error: 'Student not found' });
    return;
  }

  const { password_hash, ...safe } = updated;

  realtimeManager.broadcast({
    type: 'STUDENT_UPDATED' as any,
    timestamp: new Date().toISOString(),
    data: safe
  });

  res.json(safe);
});

// Delete student
apiRouter.delete('/students/:id', (req: Request, res: Response) => {
  const id = getParamId(req.params.id);
  const student = db.findStudentById(id);
  if (!student) {
    res.status(404).json({ error: 'Student not found' });
    return;
  }

  const deleted = db.deleteStudent(id);
  if (!deleted) {
    res.status(500).json({ error: 'Failed to delete student' });
    return;
  }

  realtimeManager.broadcast({
    type: 'STUDENT_DELETED' as any,
    timestamp: new Date().toISOString(),
    data: { id, full_name: student.full_name, phone_number: student.phone_number }
  });

  res.json({ message: 'Student account deleted successfully', id });
});

// Student Profile with History & Billing
apiRouter.get('/students/:id/profile', (req: Request, res: Response) => {
  const id = getParamId(req.params.id);
  const student = db.findStudentById(id);
  if (!student) {
    res.status(404).json({ error: 'Student not found' });
    return;
  }

  const collections = db.getCollections().filter(c => c.student_id === id);
  const bills = db.getMonthlyBills().filter(b => b.student_id === id);
  const payments = db.getAllPayments().filter(p => p.student_id === id);

  const { password_hash, ...safeStudent } = student;
  res.json({
    student: safeStudent,
    total_collections: collections.length,
    collections: collections.slice(0, 30),
    bills,
    payments
  });
});

// -----------------------------------------------------------------------------
// BILLING & PAYMENTS
// -----------------------------------------------------------------------------

// Get billing settings
apiRouter.get('/billing/settings', (_req: Request, res: Response) => {
  res.json(db.getBillingSettings());
});

// Update billing settings
apiRouter.put('/billing/settings', (req: Request, res: Response) => {
  const parseResult = billingSettingsSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid billing configuration' });
    return;
  }
  const updated = db.updateBillingSettings(parseResult.data);
  realtimeManager.broadcast({
    type: 'BILL_UPDATED',
    timestamp: new Date().toISOString(),
    data: updated
  });
  res.json(updated);
});

// Get Monthly Bills (Admin)
apiRouter.get('/billing/bills', (req: Request, res: Response) => {
  const month = req.query.month ? Number(req.query.month) : undefined;
  const year = req.query.year ? Number(req.query.year) : undefined;
  const bills = db.getMonthlyBills(month, year);
  res.json(bills);
});

// Student's Current Bill
apiRouter.get('/billing/my-bill', (req: Request, res: Response) => {
  const token = getSessionToken(req);
  const session = db.validateSession(token);

  if (!session || session.role !== 'student') {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const now = new Date();
  const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
  const year = req.query.year ? Number(req.query.year) : now.getFullYear();

  const bill = db.getStudentBill(session.userId, month, year);
  const settings = db.getBillingSettings();

  if (!bill) {
    // Return empty placeholder bill
    res.json({
      student_id: session.userId,
      month,
      year,
      breakfast_count: 0,
      lunch_count: 0,
      snacks_count: 0,
      dinner_count: 0,
      total_meals: 0,
      billing_mode: settings.mode,
      base_amount: 0,
      late_fee: 0,
      total_amount: 0,
      paid_amount: 0,
      balance_amount: 0,
      payment_status: 'PAID',
      settings
    });
    return;
  }

  const payments = db.getPaymentsForBill(bill.id);
  res.json({ ...bill, payments, settings });
});

// Record Payment
apiRouter.post(['/billing/payments', '/payments'], (req: Request, res: Response) => {
  const parseResult = recordPaymentSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid payment record data' });
    return;
  }

  const { bill_id, amount, payment_method, received_by, reference_id, notes } = parseResult.data;

  const result = db.recordPayment(bill_id, Number(amount), payment_method, received_by, reference_id, notes);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  realtimeManager.broadcast({
    type: 'BILL_UPDATED',
    timestamp: new Date().toISOString(),
    data: { bill: result.bill, payment: result.payment }
  });

  res.status(201).json(result);
});

// -----------------------------------------------------------------------------
// HOSTEL SETTINGS & QR INFO
// -----------------------------------------------------------------------------
apiRouter.get('/settings/info', (_req: Request, res: Response) => {
  res.json(db.getHostelSettings());
});

apiRouter.put('/settings/info', (req: Request, res: Response) => {
  const updated = db.updateHostelSettings(req.body);
  res.json(updated);
});

// -----------------------------------------------------------------------------
// DATABASE STATUS, CLOUD PERSISTENCE, BACKUP & RESTORE
// -----------------------------------------------------------------------------
apiRouter.get('/database/status', (_req: Request, res: Response) => {
  res.json(db.getPersistenceStatus());
});

apiRouter.get('/database/backup', (req: Request, res: Response) => {
  const token = getSessionToken(req);
  const session = db.validateSession(token);
  if (!session || session.role !== 'admin') {
    res.status(401).json({ error: 'Unauthorized. Admin credentials required to export database.' });
    return;
  }
  const dateStr = getTodayDateString();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="hostel_mess_backup_${dateStr}.json"`);
  res.send(JSON.stringify(db.getData(), null, 2));
});

apiRouter.post('/database/restore', async (req: Request, res: Response) => {
  const token = getSessionToken(req);
  const session = db.validateSession(token);
  if (!session || session.role !== 'admin') {
    res.status(401).json({ error: 'Unauthorized. Admin credentials required to restore database.' });
    return;
  }

  const payload = req.body;
  if (!payload || !Array.isArray(payload.students) || !Array.isArray(payload.food_collections)) {
    res.status(400).json({ error: 'Invalid database backup structure. Required "students" and "food_collections" arrays.' });
    return;
  }

  const restored = await db.restoreData(payload);
  if (!restored) {
    res.status(500).json({ error: 'Failed to restore database state.' });
    return;
  }

  realtimeManager.broadcast({
    type: 'POLL_SYNC',
    timestamp: new Date().toISOString(),
    data: { action: 'RESTORE' }
  });

  res.json({
    message: 'Database restored successfully',
    stats: {
      students: payload.students.length,
      collections: payload.food_collections.length,
      bills: (payload.monthly_bills || []).length,
      payments: (payload.payments || []).length
    }
  });
});

// =============================================================================
// 4. UNIFIED EXPRESS SERVER & PRODUCTION SPA HANDLER
// =============================================================================
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Mount API routes
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Serve static frontend files if production build exists
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

// For SPA routing
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    const indexPath = path.join(distPath, 'index.html');
    res.sendFile(indexPath, err => {
      if (err) next();
    });
  } else {
    next();
  }
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({ error: err?.message || 'Internal Server Error' });
});

if (process.env.RUN_STANDALONE === 'true') {
  app.listen(PORT, () => {
    console.log(`Hostel Mess Management Server running on http://localhost:${PORT}`);
  });
}

export default app;
