import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from './config/db';
import User from './models/User';
import Category from './models/Category';
import FoodItem from './models/FoodItem';
import Promotion from './models/Promotion';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting database seed...');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await FoodItem.deleteMany({});
    await Promotion.deleteMany({});

    // Create users
    const users = await User.create([
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@flavordash.com',
        password: 'password123',
        role: 'admin',
        phone: '+94771234567',
      },
      {
        firstName: 'Kitchen',
        lastName: 'Staff',
        email: 'kitchen@flavordash.com',
        password: 'password123',
        role: 'kitchen',
        phone: '+94779876543',
      },
      {
        firstName: 'Shenal',
        lastName: 'Customer',
        email: 'customer@flavordash.com',
        password: 'password123',
        role: 'customer',
        phone: '+94775551234',
        address: {
          street: '123 Main Street',
          city: 'Colombo',
          state: 'Western',
          zipCode: '10100',
          country: 'Sri Lanka',
        },
      },
    ]);
    console.log(`✅ Created ${users.length} users`);

    // Create categories
    const categories = await Category.create([
      { name: 'Rice & Curry', description: 'Traditional Sri Lankan rice and curry dishes', sortOrder: 1 },
      { name: 'Kottu', description: 'Chopped roti with vegetables, egg, and meat', sortOrder: 2 },
      { name: 'Fried Rice', description: 'Wok-fried rice with various proteins', sortOrder: 3 },
      { name: 'Noodles', description: 'Stir-fried and soup noodles', sortOrder: 4 },
      { name: 'Appetizers', description: 'Starters and snacks', sortOrder: 5 },
      { name: 'Beverages', description: 'Hot and cold drinks', sortOrder: 6 },
      { name: 'Desserts', description: 'Sweet treats and traditional sweets', sortOrder: 7 },
      { name: 'Burgers & Sandwiches', description: 'Burgers, wraps, and sandwiches', sortOrder: 8 },
    ]);
    console.log(`✅ Created ${categories.length} categories`);

    // Create food items
    const foodItems = await FoodItem.create([
      // Rice & Curry
      { name: 'Chicken Rice & Curry', description: 'Steamed rice served with chicken curry, dhal, pol sambol, and seasonal vegetables', price: 650, category: categories[0]._id, isAvailable: true, isPopular: true, prepTimeMinutes: 15, calories: 520, tags: ['rice', 'chicken', 'traditional'], allergens: [] },
      { name: 'Fish Rice & Curry', description: 'Steamed rice with spicy fish curry, dhal curry, and fresh accompaniments', price: 700, category: categories[0]._id, isAvailable: true, isPopular: true, prepTimeMinutes: 15, calories: 480, tags: ['rice', 'fish', 'spicy'], allergens: ['fish'] },
      { name: 'Vegetable Rice & Curry', description: 'Steamed rice with mixed vegetable curry, dhal, and coconut sambol', price: 450, category: categories[0]._id, isAvailable: true, prepTimeMinutes: 12, calories: 380, tags: ['rice', 'vegetarian', 'healthy'], allergens: [] },
      { name: 'Egg Rice & Curry', description: 'Rice served with egg curry, dhal, and traditional sides', price: 500, category: categories[0]._id, isAvailable: true, prepTimeMinutes: 12, calories: 450, tags: ['rice', 'egg'], allergens: ['eggs'] },

      // Kottu
      { name: 'Chicken Kottu', description: 'Chopped godamba roti with chicken, vegetables, and spices', price: 750, category: categories[1]._id, isAvailable: true, isPopular: true, prepTimeMinutes: 12, calories: 620, tags: ['kottu', 'chicken', 'popular'], allergens: ['gluten'] },
      { name: 'Cheese Kottu', description: 'Kottu roti loaded with melted cheese and chicken', price: 950, category: categories[1]._id, isAvailable: true, isPopular: true, prepTimeMinutes: 15, calories: 780, tags: ['kottu', 'cheese', 'indulgent'], allergens: ['gluten', 'dairy'] },
      { name: 'Egg Kottu', description: 'Chopped roti with scrambled eggs and vegetables', price: 550, category: categories[1]._id, isAvailable: true, prepTimeMinutes: 10, calories: 520, tags: ['kottu', 'egg'], allergens: ['gluten', 'eggs'] },
      { name: 'Vegetable Kottu', description: 'Chopped roti with mixed vegetables and spices', price: 500, category: categories[1]._id, isAvailable: true, prepTimeMinutes: 10, calories: 420, tags: ['kottu', 'vegetarian'], allergens: ['gluten'] },

      // Fried Rice
      { name: 'Chicken Fried Rice', description: 'Wok-fried rice with chicken, vegetables, and soy sauce', price: 700, category: categories[2]._id, isAvailable: true, isPopular: true, prepTimeMinutes: 12, calories: 580, tags: ['fried rice', 'chicken'], allergens: ['soy'] },
      { name: 'Seafood Fried Rice', description: 'Fried rice with prawns, squid, and mixed seafood', price: 1100, category: categories[2]._id, isAvailable: true, prepTimeMinutes: 15, calories: 550, tags: ['fried rice', 'seafood', 'premium'], allergens: ['shellfish', 'soy'] },
      { name: 'Egg Fried Rice', description: 'Simple fried rice with eggs and vegetables', price: 500, category: categories[2]._id, isAvailable: true, prepTimeMinutes: 10, calories: 480, tags: ['fried rice', 'egg', 'budget'], allergens: ['eggs', 'soy'] },

      // Noodles
      { name: 'Chicken Noodles', description: 'Stir-fried egg noodles with chicken and vegetables', price: 650, category: categories[3]._id, isAvailable: true, prepTimeMinutes: 12, calories: 520, tags: ['noodles', 'chicken'], allergens: ['gluten', 'eggs'] },
      { name: 'Seafood Noodles', description: 'Egg noodles with prawns and squid in aromatic sauce', price: 1000, category: categories[3]._id, isAvailable: true, prepTimeMinutes: 15, calories: 500, tags: ['noodles', 'seafood'], allergens: ['gluten', 'shellfish'] },

      // Appetizers
      { name: 'Chicken Wings (6pcs)', description: 'Crispy fried chicken wings with chili sauce', price: 550, category: categories[4]._id, isAvailable: true, isPopular: true, prepTimeMinutes: 15, calories: 450, tags: ['appetizer', 'chicken', 'crispy'], allergens: ['gluten'] },
      { name: 'Fish Cutlets (4pcs)', description: 'Traditional Sri Lankan fish cutlets with seeni sambol', price: 400, category: categories[4]._id, isAvailable: true, prepTimeMinutes: 10, calories: 320, tags: ['appetizer', 'fish', 'traditional'], allergens: ['fish', 'gluten'] },
      { name: 'Vegetable Spring Rolls (4pcs)', description: 'Crispy spring rolls filled with vegetables', price: 350, category: categories[4]._id, isAvailable: true, prepTimeMinutes: 8, calories: 280, tags: ['appetizer', 'vegetarian', 'crispy'], allergens: ['gluten'] },
      { name: 'Devilled Prawns', description: 'Spicy devilled prawns with onions and peppers', price: 1200, category: categories[4]._id, isAvailable: true, prepTimeMinutes: 15, calories: 380, tags: ['appetizer', 'prawns', 'spicy'], allergens: ['shellfish'] },

      // Beverages
      { name: 'Fresh Lime Juice', description: 'Freshly squeezed lime with sugar or salt', price: 180, category: categories[5]._id, isAvailable: true, prepTimeMinutes: 3, calories: 80, tags: ['drink', 'fresh', 'lime'], allergens: [] },
      { name: 'Mango Lassi', description: 'Creamy mango yogurt smoothie', price: 280, category: categories[5]._id, isAvailable: true, prepTimeMinutes: 3, calories: 220, tags: ['drink', 'mango', 'yogurt'], allergens: ['dairy'] },
      { name: 'Iced Coffee', description: 'Chilled coffee with milk and ice', price: 250, category: categories[5]._id, isAvailable: true, prepTimeMinutes: 3, calories: 150, tags: ['drink', 'coffee', 'cold'], allergens: ['dairy'] },
      { name: 'Plain Tea', description: 'Traditional Sri Lankan black tea', price: 100, category: categories[5]._id, isAvailable: true, prepTimeMinutes: 3, calories: 5, tags: ['drink', 'tea', 'hot'], allergens: [] },

      // Desserts
      { name: 'Watalappam', description: 'Traditional Sri Lankan coconut custard pudding with jaggery', price: 300, category: categories[6]._id, isAvailable: true, prepTimeMinutes: 5, calories: 350, tags: ['dessert', 'traditional', 'sweet'], allergens: ['dairy', 'eggs'] },
      { name: 'Ice Cream Sundae', description: 'Three scoops of ice cream with toppings and whipped cream', price: 450, category: categories[6]._id, isAvailable: true, prepTimeMinutes: 5, calories: 480, tags: ['dessert', 'ice cream'], allergens: ['dairy'] },

      // Burgers
      { name: 'Classic Chicken Burger', description: 'Crispy chicken fillet with lettuce, tomato, and mayo in a toasted bun', price: 650, category: categories[7]._id, isAvailable: true, isPopular: true, prepTimeMinutes: 12, calories: 580, tags: ['burger', 'chicken'], allergens: ['gluten', 'eggs'] },
      { name: 'Beef Burger', description: 'Juicy beef patty with cheese, lettuce, and special sauce', price: 800, category: categories[7]._id, isAvailable: true, prepTimeMinutes: 15, calories: 720, tags: ['burger', 'beef', 'cheese'], allergens: ['gluten', 'dairy'] },
      { name: 'Club Sandwich', description: 'Triple-decker sandwich with chicken, egg, lettuce, and mayo', price: 550, category: categories[7]._id, isAvailable: true, prepTimeMinutes: 10, calories: 480, tags: ['sandwich', 'chicken'], allergens: ['gluten', 'eggs'] },
    ]);
    console.log(`✅ Created ${foodItems.length} food items`);

    // Create promotions
    const promotions = await Promotion.create([
      {
        code: 'WELCOME10',
        description: '10% off on your first order',
        type: 'percentage',
        value: 10,
        minOrderAmount: 500,
        maxDiscount: 200,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2027-12-31'),
        isActive: true,
        usageLimit: 100,
      },
      {
        code: 'SAVE200',
        description: 'LKR 200 off on orders above LKR 1500',
        type: 'fixed',
        value: 200,
        minOrderAmount: 1500,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2027-12-31'),
        isActive: true,
        usageLimit: 50,
      },
      {
        code: 'FREEDEL',
        description: 'Free delivery on orders above LKR 2000',
        type: 'fixed',
        value: 300,
        minOrderAmount: 2000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2027-12-31'),
        isActive: true,
        usageLimit: 0,
      },
    ]);
    console.log(`✅ Created ${promotions.length} promotions`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('  Admin:    admin@flavordash.com / password123');
    console.log('  Kitchen:  kitchen@flavordash.com / password123');
    console.log('  Customer: customer@flavordash.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedData();
