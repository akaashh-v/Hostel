import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const DEMO_FOOD_ITEMS = [
  // BREAKFAST
  {
    name: 'Idli',
    description: 'Steamed fluffy rice and lentil cakes served with coconut chutney & sambar',
    price: 25,
    mealType: 'BREAKFAST',
    category: 'VEG',
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Masala Dosa',
    description: 'Crispy golden crepe filled with spiced potato masala, served with chutneys',
    price: 40,
    mealType: 'BREAKFAST',
    category: 'VEG',
    imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Poori Bhaji',
    description: 'Puffy deep-fried whole wheat pooris served with tempered potato bhaji',
    price: 35,
    mealType: 'BREAKFAST',
    category: 'VEG',
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Appam',
    description: 'Soft-centered lacy fermented rice pancakes paired with coconut milk or vegetable stew',
    price: 30,
    mealType: 'BREAKFAST',
    category: 'VEG',
    imageUrl: 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Upma',
    description: 'Roasted semolina tempered with mustard seeds, curry leaves, ginger & roasted cashews',
    price: 25,
    mealType: 'BREAKFAST',
    category: 'VEG',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Puttu & Kadala Curry',
    description: 'Steamed cylindrical rice ground layers with grated coconut & spiced black chickpea curry',
    price: 40,
    mealType: 'BREAKFAST',
    category: 'VEG',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Tea',
    description: 'Freshly brewed aromatic Indian spiced milk tea (Chai)',
    price: 10,
    mealType: 'BREAKFAST',
    category: 'VEG',
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Coffee',
    description: 'Authentic South Indian froth filter coffee brewed with chicory blend',
    price: 15,
    mealType: 'BREAKFAST',
    category: 'VEG',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'
  },

  // LUNCH
  {
    name: 'Kerala Meals',
    description: 'Traditional thali: Matta rice, sambar, thoran, avial, pulissery, pickle, moru & papadam',
    price: 60,
    mealType: 'LUNCH',
    category: 'VEG',
    imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Chicken Biriyani',
    description: 'Fragrant seeraga samba/basmati rice layered with tender marinated chicken pieces & spices',
    price: 100,
    mealType: 'LUNCH',
    category: 'NON_VEG',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Veg Biriyani',
    description: 'Aromatic basmati rice cooked with fresh seasonal farm vegetables, mint & whole spices',
    price: 70,
    mealType: 'LUNCH',
    category: 'VEG',
    imageUrl: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Chicken Curry',
    description: 'Homestyle rich chicken curry simmered with onions, tomatoes, coriander & coconut milk',
    price: 50,
    mealType: 'LUNCH',
    category: 'NON_VEG',
    imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Fish Curry',
    description: 'Tangy and spicy coastal fish curry simmered with cocum (kudampuli) & chili',
    price: 50,
    mealType: 'LUNCH',
    category: 'NON_VEG',
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Rice & Sambar',
    description: 'Steamed rice served with slow-cooked lentil vegetable sambar & roasted papadam',
    price: 45,
    mealType: 'LUNCH',
    category: 'VEG',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Curd',
    description: 'Fresh probiotic whole milk hostel curd bowl',
    price: 15,
    mealType: 'LUNCH',
    category: 'VEG',
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Payasam',
    description: 'Sweet festive dessert prepared with roasted vermicelli, jaggery/milk, ghee & dry fruits',
    price: 25,
    mealType: 'LUNCH',
    category: 'VEG',
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80'
  },

  // EVENING SNACKS
  {
    name: 'Samosa',
    description: 'Golden triangular pastry crust stuffed with savory spiced potatoes & green peas',
    price: 15,
    mealType: 'SNACKS',
    category: 'VEG',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Parippu Vada',
    description: 'Crunchy deep-fried chana dal fritters with shallots, ginger, curry leaves & green chilies',
    price: 10,
    mealType: 'SNACKS',
    category: 'VEG',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Banana Fry',
    description: 'Pazham Pori - Sweet ripe Kerala nendran bananas dipped in batter & fried crisp golden',
    price: 15,
    mealType: 'SNACKS',
    category: 'VEG',
    imageUrl: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Puffs',
    description: 'Flaky baked golden pastry pocket filled with spiced vegetable or boiled egg filling',
    price: 20,
    mealType: 'SNACKS',
    category: 'VEG',
    imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Tea',
    description: 'Hot fragrant evening cardamom milk tea',
    price: 10,
    mealType: 'SNACKS',
    category: 'VEG',
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Coffee',
    description: 'Freshly decocted filter coffee for evening snack break',
    price: 15,
    mealType: 'SNACKS',
    category: 'VEG',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Sandwich',
    description: 'Grilled double-layer vegetable sandwich with mint chutney and cucumber tomato filling',
    price: 35,
    mealType: 'SNACKS',
    category: 'VEG',
    imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80'
  },

  // DINNER
  {
    name: 'Chapati',
    description: 'Soft whole wheat phulka flatbread cooked without oil on a hot tawa',
    price: 12,
    mealType: 'DINNER',
    category: 'VEG',
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Porotta',
    description: 'Flaky, layered Malabar parotta brushed with light ghee and served hot',
    price: 15,
    mealType: 'DINNER',
    category: 'VEG',
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Chicken Curry',
    description: 'Rich evening chicken salna / curry spiced with roasted cumin and crushed pepper',
    price: 50,
    mealType: 'DINNER',
    category: 'NON_VEG',
    imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Egg Curry',
    description: 'Boiled eggs simmered in onion-tomato masala gravy seasoned with roasted spices',
    price: 30,
    mealType: 'DINNER',
    category: 'EGG',
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Vegetable Curry',
    description: 'Mixed vegetable kurma prepared with carrots, beans, peas & coconut cashew paste',
    price: 30,
    mealType: 'DINNER',
    category: 'VEG',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Fried Rice',
    description: 'Wok-tossed aromatic rice with finely chopped vegetables, scallions & mild soy sauce',
    price: 70,
    mealType: 'DINNER',
    category: 'VEG',
    imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Ghee Rice',
    description: 'Fragrant basmati rice gently fried in pure desi ghee with whole spices, cashews & raisins',
    price: 60,
    mealType: 'DINNER',
    category: 'VEG',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80'
  }
];

async function main() {
  console.log('🌱 Seeding HOSTEL MESS Management System database...');

  // 1. Seed Administrator
  const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 10);
  const adminPhone = process.env.ADMIN_PHONE || 'admin';

  const admin = await prisma.user.upsert({
    where: { phoneNumber: adminPhone },
    update: { passwordHash: adminPasswordHash, role: 'ADMIN', status: 'ACTIVE' },
    create: {
      phoneNumber: adminPhone,
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });
  console.log(`✓ Admin user created/verified: ${admin.phoneNumber}`);

  // 2. Seed Billing Configuration
  await prisma.billingConfiguration.upsert({
    where: { id: 'default-config' },
    update: {},
    create: {
      id: 'default-config',
      mode: 'PER_MEAL',
      fixedMonthlyRate: 3000.0,
      breakfastRate: 45.0,
      lunchRate: 85.0,
      snacksRate: 35.0,
      dinnerRate: 85.0,
      lateFeeAmount: 100.0
    }
  });
  console.log('✓ Default billing configuration seeded');

  // 3. Seed Demo Students (Created by Admin only)
  const demoStudents = [
    { name: 'Rahul Sharma', phone: '9876543210', room: 'B-204', pass: 'Student@123' },
    { name: 'Ananya Verma', phone: '9876543211', room: 'A-108', pass: 'Student@123' },
    { name: 'Priya Patel', phone: '9876543212', room: 'C-302', pass: 'Student@123' }
  ];

  for (const s of demoStudents) {
    const hash = await bcrypt.hash(s.pass, 10);
    const user = await prisma.user.upsert({
      where: { phoneNumber: s.phone },
      update: { passwordHash: hash, status: 'ACTIVE', role: 'STUDENT' },
      create: {
        phoneNumber: s.phone,
        passwordHash: hash,
        role: 'STUDENT',
        status: 'ACTIVE',
        profile: {
          create: {
            fullName: s.name,
            phoneNumber: s.phone,
            roomNumber: s.room
          }
        }
      }
    });
    console.log(`✓ Student seeded: ${s.name} (${s.phone})`);
  }

  // 4. Seed all 30 Demo Menu Items
  for (const item of DEMO_FOOD_ITEMS) {
    const existing = await prisma.menuItem.findFirst({
      where: { name: item.name, mealType: item.mealType as any }
    });

    if (!existing) {
      await prisma.menuItem.create({
        data: {
          name: item.name,
          description: item.description,
          price: item.price,
          mealType: item.mealType as any,
          category: item.category as any,
          imageUrl: item.imageUrl,
          isAvailable: true
        }
      });
    }
  }
  console.log(`✓ Seeded ${DEMO_FOOD_ITEMS.length} demo menu items with prices and images`);

  console.log('🎉 Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
