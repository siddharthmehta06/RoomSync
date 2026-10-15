/**
 * High-quality mock data for RoomSync representing real shared rentals in Indian metros.
 * Includes complete 22-factor lifestyle and living conditions for explainable matchmaking.
 */

export const MOCK_ROOMS = [
  {
    id: "room-101",
    title: "Sunlit Master Bedroom in 3BHK Penthouse",
    locality: "Koramangala 4th Block",
    city: "Bengaluru",
    state: "Karnataka",
    pinCode: "560034",
    rent: 18500,
    maintenance: 1500,
    deposit: 50000,
    roomType: "Private Room with Attached Bath",
    furnishing: "Fully Furnished",
    availableFrom: "2026-11-01",
    minStayMonths: 6,
    images: [
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1502005229762-ee1b43b6e082?auto=format&fit=crop&w=800&q=80"
    ],
    amenities: ["High-speed WiFi (300 Mbps)", "Power Backup", "AC in Room", "Washing Machine", "Housekeeping Included", "Balcony"],
    owner: {
      name: "Aditya Sharma",
      role: "Lead Flatmate & Tech Professional",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      verified: true,
      phone: "+91 98765 43210"
    },
    compatibilityScore: 94,
    rankingScore: 9.1,
    strengths: [
      "Synchronized sleep schedule (11:30 PM - 7:30 AM)",
      "Strict non-smoking preference match",
      "Both work in hybrid tech roles (2 days WFH)",
      "Dedicated high-speed desk space"
    ],
    mismatches: [
      "Occasional weekend acoustic guitar sessions"
    ],
    livingConditions: {
      locationCommute: "15 min to Sony World Signal & Embassy GolfLinks",
      budgetFlexibility: "Rent fixed, maintenance shared equally",
      foodPreference: "Eggetarian / Flexible Non-veg (cooks twice a week)",
      smoking: "Strictly Non-Smoking inside and on balcony",
      alcohol: "Social drinking on weekends welcome",
      sleepSchedule: 23.5, // 11:30 PM
      wakeSchedule: 7.5,   // 7:30 AM
      cleanliness: 4.8,    // 5-point scale: daily maid for dusting & dishes
      noiseTolerance: 3.5,
      guestsDay: "Occasional friends visiting with prior heads-up",
      guestsOvernight: "Allowed with 24h prior notification",
      socialPreference: "Balanced: relaxed weekdays, casual board-game weekends",
      workSchedule: "Tech product manager, standard 10 AM - 7 PM",
      wfhFrequency: 2,     // 2 days/week
      studyHabits: "Quiet reading time after 10 PM",
      cookingFrequency: "Shared cook prepares lunch & dinner",
      petsPreference: "No pets currently; cat-friendly",
      foodSharing: "Split pantry staples (oil, spices, milk, groceries)",
      moveInDate: "2026-11-01",
      stayDuration: 11,
      personalSpace: "High respect for personal rooms; friendly lounge chats",
      rulesStrictness: "Gated society, 24/7 security, no arbitrary curfews"
    }
  },
  {
    id: "room-102",
    title: "Minimalist Garden-Facing Room in HSR Sector 2",
    locality: "HSR Layout Sector 2",
    city: "Bengaluru",
    state: "Karnataka",
    pinCode: "560102",
    rent: 16000,
    maintenance: 1200,
    deposit: 45000,
    roomType: "Private Room (Shared Bath)",
    furnishing: "Semi-Furnished",
    availableFrom: "2026-10-25",
    minStayMonths: 6,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80"
    ],
    amenities: ["Fiber Internet", "Covered Bike Parking", "Modular Kitchen", "Refrigerator", "Water Purifier (RO)"],
    owner: {
      name: "Pooja Hegde",
      role: "UX Designer",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
      verified: true,
      phone: "+91 98451 12345"
    },
    compatibilityScore: 88,
    rankingScore: 8.6,
    strengths: [
      "Vegetarian kitchen preference alignment",
      "Quiet hours strictly observed after 11 PM",
      "High cleanliness rating (daily floor mopping)",
      "Walking distance to 27th Main cafes"
    ],
    mismatches: [
      "Shared bathroom with one female flatmate",
      "No overnight male guests per society guidelines"
    ],
    livingConditions: {
      locationCommute: "5 min walk to BDA Complex & 27th Main",
      budgetFlexibility: "Non-negotiable deposit",
      foodPreference: "Pure Vegetarian preferred kitchen",
      smoking: "Strictly Non-Smoking",
      alcohol: "Non-drinking apartment",
      sleepSchedule: 23,
      wakeSchedule: 7,
      cleanliness: 4.9,
      noiseTolerance: 2.0,
      guestsDay: "Occasional female friends only",
      guestsOvernight: "Female friends allowed with prior notice",
      socialPreference: "Quiet retreat, peaceful home vibe",
      workSchedule: "Design lead, 9:30 AM - 6:30 PM",
      wfhFrequency: 4,
      studyHabits: "Studying for design certifications",
      cookingFrequency: "Self-cooking breakfast and light dinner",
      petsPreference: "Strictly no pets (due to mild allergy)",
      foodSharing: "Individual groceries",
      moveInDate: "2026-10-25",
      stayDuration: 6,
      personalSpace: "Values serene private downtime",
      rulesStrictness: "Society main gate closes at 11:30 PM (guard entry permitted)"
    }
  },
  {
    id: "room-103",
    title: "Airy High-Rise Room overlooking Baner Hills",
    locality: "Baner - Balewadi High Street",
    city: "Pune",
    state: "Maharashtra",
    pinCode: "411045",
    rent: 14000,
    maintenance: 1000,
    deposit: 35000,
    roomType: "Private Room with Attached Balcony",
    furnishing: "Fully Furnished",
    availableFrom: "2026-11-15",
    minStayMonths: 11,
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1540518614846-7ede433c4ef3?auto=format&fit=crop&w=800&q=80"
    ],
    amenities: ["Swimming Pool", "Gym", "Clubhouse", "24/7 Power Backup", "Dedicated Car Parking", "Microwave"],
    owner: {
      name: "Rohan Kulkarni",
      role: "Fintech Analyst",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      verified: true,
      phone: "+91 97654 98765"
    },
    compatibilityScore: 78,
    rankingScore: 8.2,
    strengths: [
      "Fitness and gym routine compatibility",
      "Long-term 11-month lease stability",
      "Spacious ergonomic desk setup"
    ],
    mismatches: [
      "Night owl schedule (sleeps at 1:30 AM)",
      "Balcony smoking permitted"
    ],
    livingConditions: {
      locationCommute: "10 mins to Hinjewadi Phase 1 via Highway bypass",
      budgetFlexibility: "Slight room for negotiation on deposit",
      foodPreference: "Non-vegetarian friendly, Swiggy/Zomato frequent",
      smoking: "Smoking allowed exclusively on private room balcony",
      alcohol: "Social drinking permitted",
      sleepSchedule: 1.5, // 1:30 AM
      wakeSchedule: 8.5, // 8:30 AM
      cleanliness: 3.8,
      noiseTolerance: 4.0,
      guestsDay: "Friends often visit on weekends for sports screening",
      guestsOvernight: "Allowed",
      socialPreference: "Extroverted & social weekend community",
      workSchedule: "US Shift overlap (1 PM - 10 PM)",
      wfhFrequency: 3,
      studyHabits: "Casual evening podcasts & news",
      cookingFrequency: "Weekend cooking experiments",
      petsPreference: "Pet lover (Golden Retriever in flat twice a month)",
      foodSharing: "Open kitchen sharing, split weekly bills via Splitwise",
      moveInDate: "2026-11-15",
      stayDuration: 11,
      personalSpace: "Loves shared movie nights in hall",
      rulesStrictness: "Modern society, no landlord restrictions"
    }
  },
  {
    id: "room-104",
    title: "Contemporary Studio in Financial District",
    locality: "Gachibowli",
    city: "Hyderabad",
    state: "Telangana",
    pinCode: "500032",
    rent: 21000,
    maintenance: 2000,
    deposit: 60000,
    roomType: "Private Master Suite",
    furnishing: "Fully Furnished (Luxury)",
    availableFrom: "2026-11-05",
    minStayMonths: 6,
    images: [
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80"
    ],
    amenities: ["EV Charging", "Smart TV", "Central AC", "Maid Service", "Concierge", "High Speed Mesh WiFi"],
    owner: {
      name: "Sneha Reddy",
      role: "Software Architect",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      verified: true,
      phone: "+91 99887 76655"
    },
    compatibilityScore: 91,
    rankingScore: 9.4,
    strengths: [
      "Exact budget match for premium seekers",
      "Ultra-fast fiber line with battery inverter",
      "Strict cleanliness and professional hygiene standards"
    ],
    mismatches: [
      "No non-veg preparation on Tuesdays & Thursdays"
    ],
    livingConditions: {
      locationCommute: "3 min drive to DLF Cyber City & Microsoft campus",
      budgetFlexibility: "Fixed corporate pricing",
      foodPreference: "Eggetarian / Non-veg allowed (mild religious respect days)",
      smoking: "Strictly Non-Smoking anywhere on property",
      alcohol: "Moderate wine/craft beer socially",
      sleepSchedule: 23,
      wakeSchedule: 7,
      cleanliness: 4.9,
      noiseTolerance: 2.5,
      guestsDay: "Colleagues and family visitors welcome",
      guestsOvernight: "Advance intimation preferred",
      socialPreference: "Quiet professional focus during weekdays",
      workSchedule: "Standard hybrid engineering hours",
      wfhFrequency: 3,
      studyHabits: "Technical research and quiet reading",
      cookingFrequency: "Cook visits twice daily",
      petsPreference: "Small pets welcome upon approval",
      foodSharing: "Cook menu planned together, expenses split",
      moveInDate: "2026-11-05",
      stayDuration: 11,
      personalSpace: "High privacy appreciation",
      rulesStrictness: "Standard luxury gated community rules"
    }
  }
];
