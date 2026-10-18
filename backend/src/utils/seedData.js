import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import RoomListing from '../models/RoomListing.js';
import PreferenceProfile from '../models/PreferenceProfile.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Interaction from '../models/Interaction.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roomsync';

export async function seedDatabase() {
  console.log('[Seed] Connecting to MongoDB at:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('[Seed] Connected successfully.');

  // Clean existing collections to avoid stale references
  await Promise.all([
    User.deleteMany({ email: { $in: [
      'aditya.owner@example.com',
      'meera.owner@example.com',
      'seeker.priya@example.com',
      'rahul.seeker@example.com'
    ]}}),
    Message.deleteMany({}),
    Conversation.deleteMany({}),
  ]);

  const plainPassword = 'password123';

  console.log('[Seed] Creating verified test users...');

  // 1. Property Owner 1 (Aditya Verma)
  const adityaOwner = await User.create({
    fullName: 'Aditya Verma',
    email: 'aditya.owner@example.com',
    password: plainPassword,
    phone: '9845012345',
    role: 'owner',
    isVerified: true,
    verificationMethod: 'Govt_ID',
    occupation: 'Property Manager & Tech Investor',
    company: 'Verma Properties',
    city: 'Bengaluru',
    bio: 'Professional landlord managing peaceful residential spaces in Koramangala. Available for direct calls and Saturday visits.',
  });

  // 2. Property Owner 2 (Meera Krishnan)
  const meeraOwner = await User.create({
    fullName: 'Meera Krishnan',
    email: 'meera.owner@example.com',
    password: plainPassword,
    phone: '9900112233',
    role: 'owner',
    isVerified: true,
    verificationMethod: 'Govt_ID',
    occupation: 'Architect & Interior Designer',
    company: 'Krishnan Living',
    city: 'Bengaluru',
    bio: 'Designed residential flats in Indiranagar and HSR. Looking for clean, responsible working professionals.',
  });

  // 3. Room Seeker 1 (Priya Sharma)
  const priyaSeeker = await User.create({
    fullName: 'Priya Sharma',
    email: 'seeker.priya@example.com',
    password: plainPassword,
    phone: '9876543210',
    role: 'seeker',
    isVerified: true,
    verificationMethod: 'Work_Email',
    occupation: 'Product Designer',
    company: 'Swiggy',
    city: 'Bengaluru',
    bio: 'Quiet UX designer working in Koramangala. Values early sleep schedules, clean common areas, and friendly weekend brunches.',
    hasCompletedOnboarding: true,
  });

  // 4. Room Seeker 2 (Rahul Nair)
  const rahulSeeker = await User.create({
    fullName: 'Rahul Nair',
    email: 'rahul.seeker@example.com',
    password: plainPassword,
    phone: '9123456780',
    role: 'seeker',
    isVerified: true,
    verificationMethod: 'Work_Email',
    occupation: 'Senior Backend Engineer',
    company: 'Razorpay',
    city: 'Bengaluru',
    bio: 'Tech lead in Koramangala. Non-smoker, enjoys board games and quiet work evenings.',
    hasCompletedOnboarding: true,
  });

  console.log('[Seed] Users seeded: Aditya (owner), Meera (owner), Priya (seeker), Rahul (seeker).');

  // Seed PreferenceProfile for Priya
  await PreferenceProfile.deleteMany({ user: { $in: [priyaSeeker._id, rahulSeeker._id] } });
  
  await PreferenceProfile.create({
    user: priyaSeeker._id,
    hardConstraints: {
      budgetCeiling: 22000,
      maxDeposit: 45000,
      dietaryRule: 'Any',
      smokingPolicy: 'Strictly Non-Smoking',
      alcoholPolicy: 'Moderate',
      petPolicy: 'Pet-Friendly',
      maxCommuteMins: 30,
    },
    flexiblePreferences: {
      sleepSchedule: 23.0,
      wakeSchedule: 7.0,
      cleanliness: 4,
      noiseTolerance: 3,
      guestPolicy: 'Occasional',
      overnightGuests: 'With Notice',
      socialPreference: 'Balanced',
      workSchedule: 'Standard day shifts',
      wfhDays: 3,
      cookingHabit: 'Occasional',
      petsPreference: 'Cat friendly',
      foodSharing: 'Separate Groceries',
      personalSpace: 'High',
      rulesStrictness: 'Moderate',
    },
    importanceWeights: {
      budget: 5,
      diet: 4,
      sleepSync: 5,
      cleanliness: 4,
      noise: 4,
      guests: 3,
      wfh: 3,
    },
  });

  console.log('[Seed] Preference profile seeded for Priya Sharma.');

  // Clean any old listings by these owners
  await RoomListing.deleteMany({ owner: { $in: [adityaOwner._id, meeraOwner._id] } });

  console.log('[Seed] Creating room listings with complete 22 living conditions...');

  // Listing 1 (Aditya)
  const room1 = await RoomListing.create({
    owner: adityaOwner._id,
    title: 'Sunlit Master Bedroom with Balcony in Koramangala 4th Block',
    locality: 'Koramangala 4th Block',
    city: 'Bengaluru',
    state: 'Karnataka',
    pinCode: '560034',
    rent: 18500,
    maintenance: 1500,
    deposit: 37000,
    roomType: 'Private Room with Attached Bath',
    furnishing: 'Fully Furnished',
    availableFrom: new Date(),
    minStayMonths: 6,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: [
      'High-Speed 300 Mbps Fiber WiFi',
      'Split Air Conditioner',
      'Private Attached Washroom',
      'Dedicated Work Desk & Ergonomic Chair',
      'Washing Machine & Dryer',
      'Fully Equipped Shared Kitchen',
      'Gated Security 24/7 with CCTV'
    ],
    livingConditions: {
      locationCommute: '8 mins to Sony World Junction & Wipro Park',
      foodPreference: 'Eggetarian / Flexible Non-veg',
      smoking: 'Strictly Non-Smoking',
      alcohol: 'Social Drinking OK',
      sleepSchedule: 23.0,
      wakeSchedule: 7.0,
      cleanliness: 4.5,
      noiseTolerance: 3.0,
      guestsDay: 'Day guests welcome with prior heads-up in WhatsApp group',
      guestsOvernight: 'Allowed with 24h prior notification',
      socialPreference: 'Balanced: quiet workdays, occasional movie nights',
      workSchedule: 'Tech professionals with hybrid/day schedule',
      wfhFrequency: 2,
      studyHabits: 'Quiet hours observed between 11 PM and 7 AM',
      cookingFrequency: 'Shared cook prepares lunch & dinner; kitchen accessible anytime',
      petsPreference: 'Cat friendly; currently no pets',
      foodSharing: 'Split grocery staples and housekeeping essentials',
      personalSpace: 'High respect for individual private bedrooms',
      rulesStrictness: 'Gated society, secure biometric entry, no landlord curfews'
    },
    status: 'active'
  });

  // Listing 2 (Aditya)
  const room2 = await RoomListing.create({
    owner: adityaOwner._id,
    title: 'Peaceful Private Room with Garden View in Koramangala 6th Block',
    locality: 'Koramangala 6th Block',
    city: 'Bengaluru',
    state: 'Karnataka',
    pinCode: '560095',
    rent: 16000,
    maintenance: 1200,
    deposit: 32000,
    roomType: 'Private Room (Shared Bath)',
    furnishing: 'Semi-Furnished',
    availableFrom: new Date(),
    minStayMonths: 6,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: [
      'High-Speed WiFi',
      'Power Backup Inverter',
      'Water Purifier (RO)',
      'Covered Two-Wheeler Parking',
      'Microwave Oven & Refrigerator'
    ],
    livingConditions: {
      locationCommute: 'Walking distance to 100ft road eateries and gyms',
      foodPreference: 'Pure Vegetarian',
      smoking: 'Strictly Non-Smoking',
      alcohol: 'Teetotaler',
      sleepSchedule: 22.5,
      wakeSchedule: 6.5,
      cleanliness: 4.0,
      noiseTolerance: 2.5,
      guestsDay: 'Friends welcome during daytime',
      guestsOvernight: 'Restricted to same-gender or family members',
      socialPreference: 'Quiet retreat: reading, study, calm evenings',
      workSchedule: 'Day shifts',
      wfhFrequency: 3,
      studyHabits: 'Quiet environment for exam prep and deep work',
      cookingFrequency: 'Home cooking preferred; clean as you cook policy',
      petsPreference: 'Strictly no pets',
      foodSharing: 'Separate groceries and pantry shelves',
      personalSpace: 'Solitary downtime prioritized',
      rulesStrictness: 'Moderate society rules with main gate closed after midnight'
    },
    status: 'active'
  });

  // Listing 3 (Meera Krishnan)
  const room3 = await RoomListing.create({
    owner: meeraOwner._id,
    title: 'Modern Minimalist Studio Room in Indiranagar 100ft Road',
    locality: 'Indiranagar 100ft Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pinCode: '560038',
    rent: 21000,
    maintenance: 2000,
    deposit: 42000,
    roomType: 'Private Room with Attached Bath',
    furnishing: 'Fully Furnished',
    availableFrom: new Date(),
    minStayMonths: 6,
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: [
      'High-Speed Fiber Internet',
      'Split AC & Smart TV',
      'Attached European Bathroom with Geyser',
      'Large Wardrobe & Study Desk',
      'Rooftop Terrace with Garden',
      '100% Power Backup DG'
    ],
    livingConditions: {
      locationCommute: '5 mins walk to CMH Road Metro Station',
      foodPreference: 'Non-Veg Welcome',
      smoking: 'Balcony Only',
      alcohol: 'Social Drinking OK',
      sleepSchedule: 23.5,
      wakeSchedule: 7.5,
      cleanliness: 4.0,
      noiseTolerance: 3.5,
      guestsDay: 'Day guests welcome anytime',
      guestsOvernight: 'Allowed with advance notification',
      socialPreference: 'Friendly and conversational; weekend outings',
      workSchedule: 'Flexible / Startup hours',
      wfhFrequency: 4,
      studyHabits: 'Headphones encouraged for media/calls',
      cookingFrequency: 'Combination of Swiggy and weekend cooking',
      petsPreference: 'Pet-friendly',
      foodSharing: 'Shared basics, individual snacks',
      personalSpace: 'Comfortable balance between social and private time',
      rulesStrictness: 'Self-managed flat; digital access lock on main door'
    },
    status: 'active'
  });

  // Listing 4 (Meera Krishnan)
  const room4 = await RoomListing.create({
    owner: meeraOwner._id,
    title: 'Cozy Room in Sector 2 HSR Layout near BDA Complex',
    locality: 'HSR Layout Sector 2',
    city: 'Bengaluru',
    state: 'Karnataka',
    pinCode: '560102',
    rent: 14000,
    maintenance: 1000,
    deposit: 28000,
    roomType: 'Private Room (Shared Bath)',
    furnishing: 'Semi-Furnished',
    availableFrom: new Date(),
    minStayMonths: 6,
    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: [
      'High-Speed WiFi',
      'Automatic Washing Machine',
      'Geyser & Water Filter',
      'Two-Wheeler Covered Parking'
    ],
    livingConditions: {
      locationCommute: 'Direct bus and metro feeder to Outer Ring Road Bellandur tech parks',
      foodPreference: 'Eggetarian / Flexible Non-veg',
      smoking: 'Strictly Non-Smoking',
      alcohol: 'Social Drinking OK',
      sleepSchedule: 23.0,
      wakeSchedule: 7.0,
      cleanliness: 4.0,
      noiseTolerance: 3.0,
      guestsDay: 'Occasional daytime visitors allowed',
      guestsOvernight: 'Allowed with mutual roommate consent',
      socialPreference: 'Relaxed and low-key home vibe',
      workSchedule: 'Standard corporate hours',
      wfhFrequency: 2,
      studyHabits: 'Quiet evenings after 10 PM',
      cookingFrequency: 'Daily evening cooking',
      petsPreference: 'No pets allowed by society',
      foodSharing: 'Separate groceries',
      personalSpace: 'High respect for quiet personal space',
      rulesStrictness: 'Standard gated society guidelines'
    },
    status: 'active'
  });

  console.log('[Seed] 4 room listings created in MongoDB.');

  // Create real enquiry & messaging conversation between Seeker (Priya) and Owner (Aditya) for Room 1
  const conv = await Conversation.create({
    participants: [priyaSeeker._id, adityaOwner._id],
    room: room1._id,
    lastMessage: 'Hi Priya! Yes, the master bedroom is available. You are welcome to visit this Saturday around 4:00 PM.',
    lastMessageAt: new Date(),
  });

  const msg1 = await Message.create({
    conversation: conv._id,
    sender: priyaSeeker._id,
    text: 'Hello Mr. Verma! I saw your Koramangala 4th Block master bedroom on RoomSync. Our 22-factor lifestyle compatibility score is 94%! Is the room still available for a visit this weekend?',
    isRead: true,
    createdAt: new Date(Date.now() - 3600000 * 2),
  });

  const msg2 = await Message.create({
    conversation: conv._id,
    sender: adityaOwner._id,
    text: 'Hi Priya! Yes, the master bedroom is available. You are welcome to visit this Saturday around 4:00 PM. Let me know if that time works for you.',
    isRead: true,
    createdAt: new Date(Date.now() - 3600000),
  });

  // Bookmark room1 for Priya in Interactions (saved-rooms)
  await Interaction.deleteMany({ user: priyaSeeker._id, room: room1._id });
  await Interaction.create({
    user: priyaSeeker._id,
    room: room1._id,
    action: 'save',
  });

  console.log('[Seed] Real conversation, messages, and saved room created between Priya and Aditya.');

  console.log('\n======================================================');
  console.log('RoomSync Database Seeding Completed Successfully!');
  console.log('======================================================');
  console.log('Test Accounts available for testing:\n');
  console.log('1. Room Seeker Account:');
  console.log('   Email:    seeker.priya@example.com');
  console.log('   Password: password123');
  console.log('   Role:     seeker (Priya Sharma, Product Designer at Swiggy)');
  console.log('   Features: 22-factor profile active, 1 saved room, active enquiry with Aditya\n');
  console.log('2. Property Owner / Landlord Account:');
  console.log('   Email:    aditya.owner@example.com');
  console.log('   Password: password123');
  console.log('   Role:     owner (Aditya Verma, Phone: +91 9845012345)');
  console.log('   Features: 2 active room listings, landlord dashboard, real-time chat with Priya\n');
  console.log('3. Additional Owner Account:');
  console.log('   Email:    meera.owner@example.com');
  console.log('   Password: password123');
  console.log('   Role:     owner (Meera Krishnan, Phone: +91 9900112233)');
  console.log('======================================================\n');

  await mongoose.disconnect();
}

// Run directly if called as a script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed] Error during seeding:', err);
      process.exit(1);
    });
}
