import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const generateRandomPhone = () => {
  return '01' + Math.floor(Math.random() * 900000000 + 100000000).toString();
};

export const seedDatabase = async () => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const pastDate1 = new Date();
    pastDate1.setDate(today.getDate() - 3);
    const pd1Str = pastDate1.toISOString().split('T')[0];

    const futureDate1 = new Date();
    futureDate1.setDate(today.getDate() + 2);
    const fd1Str = futureDate1.toISOString().split('T')[0];

    // 1. Inventory Items
    const products = [
      { name: 'Samsung LED Display 32"', category: 'Display', buyPrice: 4000, sellPrice: 5500, stock: 12, minStock: 3, description: 'Original panel' },
      { name: 'Sony TV Motherboard', category: 'Board', buyPrice: 2500, sellPrice: 3500, stock: 5, minStock: 2, description: 'Compatible with Bravia' },
      { name: 'LG Remote Control', category: 'Accessories', buyPrice: 300, sellPrice: 600, stock: 20, minStock: 10, description: 'Universal' },
      { name: 'Power Supply Unit 500W', category: 'Power', buyPrice: 1200, sellPrice: 1800, stock: 2, minStock: 5, description: 'PC/Server power' }, // Low stock
      { name: 'HDMI Cable 2m', category: 'Cable', buyPrice: 150, sellPrice: 300, stock: 50, minStock: 10, description: 'High speed' },
      { name: 'Capacitor 470uF', category: 'Components', buyPrice: 10, sellPrice: 50, stock: 100, minStock: 20, description: 'Standard' }
    ];

    const productIds = [];
    for (const p of products) {
      const docRef = await addDoc(collection(db, 'products'), p);
      productIds.push(docRef.id);
    }

    // 2. Mechanics
    const mechanics = [
      { name: 'Md. Hasan', phone: '01711000001', address: 'Mirpur 10', specialities: 'TV Repair', activeJobs: 0 },
      { name: 'Kamrul Islam', phone: '01811000002', address: 'Dhanmondi', specialities: 'Laptop & PC', activeJobs: 0 }
    ];
    for (const m of mechanics) {
      await addDoc(collection(db, 'mechanics'), m);
    }

    // 3. Customers
    const customers = [
      {
        name: 'Abdur Rahman', phone: generateRandomPhone(), address: 'Uttara, Dhaka',
        brand: 'Samsung', deviceType: 'Smart TV 43"', imeiOrSerial: 'SN998877',
        issue: 'No Display, Sound OK', estCost: 4500, advance: 1000, dueBalance: 3500,
        totalBill: 4500, deliveryDate: fd1Str, status: 'Running', paymentMethod: 'Cash',
        notes: 'Needs new backlight', mechanic: '', loyaltyPoints: 45, createdAt: pd1Str
      },
      {
        name: 'Fahim Ahmed', phone: generateRandomPhone(), address: 'Gulshan',
        brand: 'Sony', deviceType: 'Bravia 55"', imeiOrSerial: 'SN112233',
        issue: 'Power Issue', estCost: 3000, advance: 3000, dueBalance: 0,
        totalBill: 3000, deliveryDate: todayStr, status: 'Complete', paymentMethod: 'Card',
        notes: 'Replaced power board', mechanic: '', loyaltyPoints: 30, createdAt: pd1Str
      },
      {
        name: 'Kazi Rakib', phone: generateRandomPhone(), address: 'Banani',
        brand: 'LG', deviceType: 'Monitor 24"', imeiOrSerial: 'LG445566',
        issue: 'Lines on screen', estCost: 2000, advance: 500, dueBalance: 1500,
        totalBill: 2000, deliveryDate: pd1Str, status: 'Pending', paymentMethod: 'Cash', // Overdue
        notes: 'Waiting for parts', mechanic: '', loyaltyPoints: 20, createdAt: pd1Str
      },
      {
        name: 'Tahsan Khan', phone: generateRandomPhone(), address: 'Mohammadpur',
        brand: 'Dell', deviceType: 'Laptop', imeiOrSerial: 'DL778899',
        issue: 'Keyboard not working', estCost: 1500, advance: 0, dueBalance: 1500,
        totalBill: 1500, deliveryDate: todayStr, status: 'Delivery', paymentMethod: 'Cash',
        nextPaymentDate: pd1Str, // Overdue payment
        notes: 'Delivered but payment due', mechanic: '', loyaltyPoints: 15, createdAt: pd1Str
      },
      {
        name: 'Sazzad Hossain', phone: generateRandomPhone(), address: 'Badda',
        brand: 'Walton', deviceType: 'Fridge', imeiOrSerial: 'WL123456',
        issue: 'Cooling problem', estCost: 2500, advance: 500, dueBalance: 2000,
        totalBill: 2500, deliveryDate: todayStr, status: 'Cancel', paymentMethod: 'Cash',
        notes: 'Customer canceled repair', mechanic: '', loyaltyPoints: 0, createdAt: todayStr
      },
      {
        name: 'Tariqul Islam', phone: generateRandomPhone(), address: 'Mirpur',
        brand: 'HP', deviceType: 'Desktop PC', imeiOrSerial: 'HP987654',
        issue: 'Windows corrupted, RAM issue', estCost: 1200, advance: 1200, dueBalance: 0,
        totalBill: 1200, deliveryDate: todayStr, status: 'Received', paymentMethod: 'bKash',
        notes: 'Received today', mechanic: '', loyaltyPoints: 12, createdAt: todayStr // Today's sales
      }
    ];

    for (const c of customers) {
      await addDoc(collection(db, 'customers'), c);
    }

    // 4. Expenses
    const expenses = [
      { category: 'Rent', amount: 15000, date: pd1Str, paymentMethod: 'Cash', note: 'Shop rent for this month' },
      { category: 'Utilities', amount: 2500, date: todayStr, paymentMethod: 'Cash', note: 'Electricity Bill' },
      { category: 'Salary', amount: 10000, date: pd1Str, paymentMethod: 'Bank', note: 'Staff salary' },
      { category: 'Snacks', amount: 300, date: todayStr, paymentMethod: 'Cash', note: 'Tea and snacks' }
    ];
    for (const e of expenses) {
      await addDoc(collection(db, 'expenses'), e);
    }

    // 5. Suppliers
    const suppliers = [
      { name: 'Dhaka Electronics Hub', phone: '01700112233', address: 'Stadium Market', balance: 5000 },
      { name: 'China Importers BD', phone: '01800112233', address: 'Nawabpur', balance: 0 }
    ];
    for (const s of suppliers) {
      await addDoc(collection(db, 'suppliers'), s);
    }

    return true;
  } catch (error) {
    console.error("Error seeding database:", error);
    return false;
  }
};
