import {
  Service,
  Stylist,
  Appointment,
  HairFormula,
  GalleryItem,
  InventoryItem,
  RevenueMetric,
  LoyaltyReward,
  GiftCard,
  Review,
  UserProfile,
} from '../types';

export const INITIAL_CUSTOMER_PROFILES: UserProfile[] = [
  {
    id: 'cust-1',
    name: 'Jasmine R.',
    email: 'jasmine@truelengths.com',
    phone: '(555) 234-5678',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    hairType: '4C - High Density Coily',
    loyaltyPoints: 350,
    loyaltyTier: 'Gold',
    memberSince: 'March 2024',
    notes: 'Sensitive scalp, prefers low-tension silk press with steam treatment.'
  },
  {
    id: 'cust-2',
    name: 'Maya L.',
    email: 'maya.l@example.com',
    phone: '(555) 876-5432',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=300&q=80',
    hairType: '4B - Kinky Coily',
    loyaltyPoints: 720,
    loyaltyTier: 'Platinum',
    memberSince: 'January 2024',
    notes: 'Loves knotless braids and honey gloss balayage.'
  },
  {
    id: 'cust-3',
    name: 'Nia T.',
    email: 'nia.t@example.com',
    phone: '(555) 987-1234',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=300&q=80',
    hairType: 'Locs & Scalp Detox',
    loyaltyPoints: 1450,
    loyaltyTier: 'Diamond',
    memberSince: 'November 2023',
    notes: 'Micro-loc retwist every 6 weeks with botanical scalp oil treatment.'
  }
];

export const INITIAL_SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Silk Press & Treatment',
    category: 'Silk Press',
    description: 'Deep hydrating steam treatment, precision trim, and sleek silk press with thermal heat protection.',
    price: 75,
    startingPrice: true,
    durationMinutes: 90,
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
    popular: true
  },
  {
    id: 's2',
    name: 'Knotless Braids (Medium/Long)',
    category: 'Braids',
    description: 'Tension-free, lightweight knotless box braids customized to your natural length and density.',
    price: 150,
    startingPrice: true,
    durationMinutes: 210,
    imageUrl: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=600&q=80',
    popular: true
  },
  {
    id: 's3',
    name: 'Balayage & Gloss Finish',
    category: 'Balayage',
    description: 'Hand-painted dimensional balayage highlights with custom toner gloss for luminous, natural shine.',
    price: 180,
    startingPrice: true,
    durationMinutes: 150,
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
    popular: true
  },
  {
    id: 's4',
    name: 'Color + Signature Style',
    category: 'Color',
    description: 'Full single-process custom color formulation accompanied by a blowout or silk finish.',
    price: 120,
    startingPrice: true,
    durationMinutes: 120,
    imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80',
    popular: true
  },
  {
    id: 's5',
    name: 'Microlinks Extensions Install',
    category: 'Treatments',
    description: 'Seamless strand-by-strand microlink installation for maximum length, volume, and natural versatility.',
    price: 350,
    startingPrice: true,
    durationMinutes: 240,
    imageUrl: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 's6',
    name: 'Loc Retwist & Scalp Detox',
    category: 'Locs & Cuts',
    description: 'Organic clarifying scalp soak, organic oil nourish treatment, and palm-roll loc retwist.',
    price: 95,
    startingPrice: false,
    durationMinutes: 105,
    imageUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80'
  }
];

export const INITIAL_STYLISTS: Stylist[] = [
  {
    id: 'st1',
    name: 'Carolyn R.',
    roleTitle: 'Salon Founder & Master Stylist',
    bio: 'Specializing in Healthy Hair Care, Precision Silk Presses, and Microlink Extensions with 18+ years experience.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    rating: 4.98,
    totalReviews: 342,
    specialties: ['Silk Press', 'Microlinks', 'Scalp Care', 'Precision Cut'],
    commissionRate: 0.60
  },
  {
    id: 'st2',
    name: 'Tina M.',
    roleTitle: 'Senior Colorist & Balayage Specialist',
    bio: 'Master of warm caramel balayage, dimensional tones, and color transformation without compromising hair integrity.',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    rating: 4.95,
    totalReviews: 218,
    specialties: ['Balayage', 'Custom Color', 'Gloss Treatments'],
    commissionRate: 0.50
  },
  {
    id: 'st3',
    name: 'Maria S.',
    roleTitle: 'Master Braider & Natural Hair Specialist',
    bio: 'Creating lightweight, protective knotless braids, goddess locs, and elaborate protective styling.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    rating: 4.99,
    totalReviews: 289,
    specialties: ['Knotless Braids', 'Loc Maintenance', 'Cornrows'],
    commissionRate: 0.50
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    customerId: 'cust-1',
    customerName: 'Jasmine R.',
    customerPhone: '(555) 234-5678',
    customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    serviceId: 's1',
    serviceName: 'Silk Press & Treatment',
    price: 75,
    durationMinutes: 90,
    date: '2026-08-01',
    time: '10:00 AM',
    status: 'in_progress',
    stylistId: 'st1',
    stylistName: 'Carolyn R.',
    notes: 'Client prefers gentle heat and low tension. Uses True Lengths Silk Serum.'
  },
  {
    id: 'apt-2',
    customerId: 'cust-2',
    customerName: 'Maria S.',
    customerPhone: '(555) 987-6543',
    customerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    serviceId: 's2',
    serviceName: 'Knotless Braids',
    price: 150,
    durationMinutes: 210,
    date: '2026-08-01',
    time: '09:00 AM',
    status: 'completed',
    stylistId: 'st3',
    stylistName: 'Maria S.',
    notes: 'Medium length, waist length extension. Natural color #1B.'
  },
  {
    id: 'apt-3',
    customerId: 'cust-3',
    customerName: 'Tiffany P.',
    customerPhone: '(555) 456-7890',
    serviceId: 's4',
    serviceName: 'Color + Signature Style',
    price: 120,
    durationMinutes: 120,
    date: '2026-08-01',
    time: '12:00 PM',
    status: 'upcoming',
    stylistId: 'st2',
    stylistName: 'Tina M.',
    notes: 'Copper honey glow retouch.'
  },
  {
    id: 'apt-4',
    customerId: 'cust-4',
    customerName: 'Amanda L.',
    customerPhone: '(555) 876-5432',
    serviceId: 's3',
    serviceName: 'Balayage & Gloss Finish',
    price: 180,
    durationMinutes: 150,
    date: '2026-08-01',
    time: '01:30 PM',
    status: 'upcoming',
    stylistId: 'st2',
    stylistName: 'Tina M.'
  },
  {
    id: 'apt-5',
    customerId: 'cust-5',
    customerName: 'Danielle M.',
    customerPhone: '(555) 345-6789',
    serviceId: 's1',
    serviceName: 'Silk Press & Treatment',
    price: 75,
    durationMinutes: 90,
    date: '2026-08-01',
    time: '03:00 PM',
    status: 'upcoming',
    stylistId: 'st1',
    stylistName: 'Carolyn R.'
  },
  {
    id: 'apt-6',
    customerId: 'cust-1',
    customerName: 'Jasmine R.',
    serviceId: 's3',
    serviceName: 'Balayage & Gloss Finish',
    price: 180,
    durationMinutes: 150,
    date: '2026-08-15',
    time: '11:00 AM',
    status: 'upcoming',
    stylistId: 'st2',
    stylistName: 'Tina M.'
  }
];

export const INITIAL_FORMULAS: HairFormula[] = [
  {
    id: 'f1',
    clientId: 'cust-1',
    clientName: 'Jasmine R.',
    date: '2026-07-10',
    serviceName: 'Caramel Honey Balayage',
    baseFormula: 'Wella Illumina 6/37 + 20vol (Root shadow)',
    developerVolume: '20 Vol / 30 Vol for mid-lengths',
    highlightToner: 'Redken Shades EQ 09N + 09G equal parts',
    processingTime: '35 mins ambient room temp',
    notes: 'Hair responded beautifully. Lifted to level 8 naturally without warmth brassiness.',
    stylistName: 'Tina M.'
  },
  {
    id: 'f2',
    clientId: 'cust-3',
    clientName: 'Tiffany P.',
    date: '2026-06-22',
    serviceName: 'Copper Auburn Red',
    baseFormula: 'Matrix SoColor 7CG (Copper Gold) + 6RC',
    developerVolume: '20 Vol Matrix Cream',
    highlightToner: 'Clear gloss shine glaze',
    processingTime: '40 mins',
    notes: 'Client loves the warm autumn glow. Recommend sulfate-free color lock shampoo.',
    stylistName: 'Tina M.'
  }
];

export const INITIAL_GALLERY: GalleryItem[] = [
  {
    id: 'g1',
    title: 'Warm Copper Melt & Curtain Bangs',
    category: 'Custom Color',
    afterUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1000&q=80',
    beforeUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1000&q=80'
    ],
    stylistName: 'Carolyn C.',
    date: 'July 28, 2026',
    likes: 342,
    description: 'Bespoke warm copper formulation featuring a subtle shadowed root, curtain fringe layering, and high-shine blowout finish.',
    servicePerformed: 'Full Custom Color Melt, Hydration Treatment & Face-Framing Cut',
    duration: '2.5 Hours',
    priceRange: '$185 - $230',
    productsUsed: ['Matrix SoColor 7CG', 'Olaplex No. 3 Bond Building Mask', 'Mizani Thermasmooth Serum', 'True Lengths Botanical Silk Drops'],
    maintenanceCycle: '6 - 8 Weeks',
    hairTextureType: 'Texture Type 3A - 3C',
    serviceId: 's4',
    stylistId: 'st2'
  },
  {
    id: 'g2',
    title: 'Crown Braids & Silver Updo',
    category: 'Protective Styles',
    afterUrl: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=1000&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80'
    ],
    stylistName: 'Maria S.',
    date: 'July 25, 2026',
    likes: 418,
    description: 'Exquisite custom crown braids celebrating natural silver tones, sculpted into an intricate halo updo bun with zero scalp tension.',
    servicePerformed: 'Scalp Detox Wash, Botanical Micro-Steam & Sculpted Crown Braid Updo',
    duration: '3.5 Hours',
    priceRange: '$210 - $260',
    productsUsed: ['Shine & Jam Magic Hold Gel', 'Design Essentials Rosemary Oil', 'True Lengths Moisture Mist'],
    maintenanceCycle: '4 - 6 Weeks',
    hairTextureType: 'Texture Type 4A - 4C (Silver/Grey)',
    serviceId: 's2',
    stylistId: 'st3'
  },
  {
    id: 'g3',
    title: 'Tapered Pixie & Nape Line Art',
    category: 'Precision Cuts',
    afterUrl: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=1000&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1000&q=80'
    ],
    stylistName: 'Tina M.',
    date: 'July 20, 2026',
    likes: 289,
    description: 'Modern tapered pixie cut featuring rich mahogany highlights, defined textured crown curls, and razor-etched dual arc line art at the nape.',
    servicePerformed: 'Precision Taper Cut, Razor Line Etching, Dimension Highlights & Foam Molding',
    duration: '1.5 Hours',
    priceRange: '$95 - $135',
    productsUsed: ['KeraCare Foam Wrap Lotion', 'Paul Mitchell Sculpting Foam', 'True Lengths Scalp Nectar'],
    maintenanceCycle: '3 - 4 Weeks',
    hairTextureType: 'Short Tapered / Texture 3C - 4B',
    serviceId: 's5',
    stylistId: 'st2'
  },
  {
    id: 'g4',
    title: 'Silk Press & Botanical Steam',
    category: 'Silk Press',
    afterUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80',
    beforeUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80'
    ],
    stylistName: 'Carolyn R.',
    date: 'July 18, 2026',
    likes: 512,
    description: 'Transforming dense 4C natural coils into mirror-like glass silk with zero thermal stress. Includes deep botanical steam hydration.',
    servicePerformed: 'Clarifying Detox Shampoo, 20-Min Herbal Steam Hydration, Dusting Trim & Silk Press',
    duration: '2.0 Hours',
    priceRange: '$85 - $125',
    productsUsed: ['Mizani 25 Miracle Milk', 'True Lengths Thermal Shield', 'Silk Infusion Glaze Drops'],
    maintenanceCycle: '2 - 3 Weeks',
    hairTextureType: 'Texture Type 4B - 4C Natural',
    serviceId: 's1',
    stylistId: 'st1'
  },
  {
    id: 'g5',
    title: 'Golden Honey Blonde Pixie Crop',
    category: 'Pixie Cuts',
    afterUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1000&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1000&q=80'
    ],
    stylistName: 'Tina M.',
    date: 'July 14, 2026',
    likes: 310,
    description: 'Edgy yet sophisticated pixie crop with sun-kissed honey blonde fringe, dark tapered side contrast, and sleek temple line work.',
    servicePerformed: 'Sectioned Foil Lightener, Redken Shades EQ Gloss, Pixie Shaping & Side Line Design',
    duration: '2.5 Hours',
    priceRange: '$175 - $220',
    productsUsed: ['Wella Blondor Plex Lightener', 'Redken Shades EQ 09G Buttercream', 'K18 Molecular Repair Mask'],
    maintenanceCycle: '4 - 5 Weeks',
    hairTextureType: 'Short Pixie Crop / Texture Type 2C - 3C',
    serviceId: 's4',
    stylistId: 'st2'
  },
  {
    id: 'g6',
    title: 'Caramel Honey Balayage & Silk',
    category: 'Balayage',
    afterUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1000&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1000&q=80'
    ],
    stylistName: 'Tina M.',
    date: 'July 10, 2026',
    likes: 475,
    description: 'Seamless hand-painted caramel balayage adding rich warmth and dimension to dark brown tresses, finished with beachy silk waves.',
    servicePerformed: 'Hand-Painted Balayage, Shadow Root Gloss Melt & Signature Waves',
    duration: '3.0 Hours',
    priceRange: '$220 - $280',
    productsUsed: ['Schwarzkopf Blondme', 'Redken Shades EQ 08WG', 'Moroccanoil Light Oil'],
    maintenanceCycle: '10 - 12 Weeks',
    hairTextureType: 'Texture Type 2A - 3B',
    serviceId: 's3',
    stylistId: 'st2'
  },
  {
    id: 'g7',
    title: 'Waist-Length Knotless Goddess Braids',
    category: 'Braids',
    afterUrl: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=1000&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80'
    ],
    stylistName: 'Maria S.',
    date: 'July 05, 2026',
    likes: 620,
    description: 'Featherlight knotless box braids with cascading bohemian curl inserts, square partings, and soothing scalp tea tree treatment.',
    servicePerformed: 'Tension-Free Feed-In Braids, Bohemian Curl Extensions & Scalp Seal',
    duration: '4.5 Hours',
    priceRange: '$250 - $320',
    productsUsed: ['X-pression Pre-Stretched Hair #1B', 'AllDay Locks Braiding Jam', 'Peppermint Scalp Tonic'],
    maintenanceCycle: '6 - 8 Weeks',
    hairTextureType: 'Texture Type 3C - 4C Natural',
    serviceId: 's2',
    stylistId: 'st3'
  },
  {
    id: 'g8',
    title: 'Hydrating Botanical Wash & Curl',
    category: 'Natural Hair',
    afterUrl: 'https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?auto=format&fit=crop&w=1000&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80'
    ],
    stylistName: 'Carolyn R.',
    date: 'June 29, 2026',
    likes: 388,
    description: 'Nourishing organic wash & curl treatment defining bouncy, frizz-free natural coil clumps with long-lasting moisture retention.',
    servicePerformed: 'Sulfate-Free Cleansing, Protein Moisture Balance, Curl Clumping & Diffuser Set',
    duration: '1.5 Hours',
    priceRange: '$90 - $125',
    productsUsed: ['Innersense Organic I Create Hold', 'Camille Rose Moisture Milk', 'True Lengths Curl Nectar'],
    maintenanceCycle: '1 - 2 Weeks',
    hairTextureType: 'Texture Type 3B - 4A Curls',
    serviceId: 's1',
    stylistId: 'st1'
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-1',
    name: 'True Lengths Moisture Steam Elixir (8oz)',
    brand: 'True Lengths Pro',
    category: 'Shampoo & Conditioner',
    stockCount: 18,
    reorderLevel: 8,
    unitCost: 12.00,
    retailPrice: 28.00,
    supplier: 'True Lengths Labs',
    status: 'in_stock'
  },
  {
    id: 'inv-2',
    name: 'Silk Thermal Protectant Serum (4oz)',
    brand: 'True Lengths Pro',
    category: 'Styling & Oils',
    stockCount: 4,
    reorderLevel: 10,
    unitCost: 9.50,
    retailPrice: 24.00,
    supplier: 'True Lengths Labs',
    status: 'low_stock'
  },
  {
    id: 'inv-3',
    name: 'Wella Illumina Color Gloss Base 6/37',
    brand: 'Wella Professionals',
    category: 'Color & Lightener',
    stockCount: 2,
    reorderLevel: 5,
    unitCost: 14.20,
    retailPrice: 35.00,
    supplier: 'SalonCentric',
    status: 'low_stock'
  },
  {
    id: 'inv-4',
    name: 'Organic Scalp Detox Tea Tree Cleanser',
    brand: 'Botanical Haircare',
    category: 'Shampoo & Conditioner',
    stockCount: 22,
    reorderLevel: 6,
    unitCost: 11.00,
    retailPrice: 26.00,
    supplier: 'Beauty Supply Co.',
    status: 'in_stock'
  }
];

export const INITIAL_REVENUE_METRICS: RevenueMetric = {
  totalRevenue: 24350,
  revenueGrowth: 12.5,
  totalAppointments: 236,
  appointmentsGrowth: 8.2,
  newClients: 32,
  newClientsGrowth: 14.7,
  retentionRate: 68,
  retentionGrowth: 9.1,
  topServices: [
    { name: 'Silk Press & Treatment', percentage: 45, revenue: 10957 },
    { name: 'Knotless Braids', percentage: 30, revenue: 7305 },
    { name: 'Color & Highlights', percentage: 15, revenue: 3652 },
    { name: 'Balayage & Gloss', percentage: 10, revenue: 2435 }
  ],
  monthlyBreakdown: [
    { month: 'Mar', revenue: 19800, appointments: 190 },
    { month: 'Apr', revenue: 21200, appointments: 205 },
    { month: 'May', revenue: 22400, appointments: 218 },
    { month: 'Jun', revenue: 23100, appointments: 224 },
    { month: 'Jul', revenue: 24350, appointments: 236 }
  ]
};

export const INITIAL_LOYALTY_REWARDS: LoyaltyReward[] = [
  {
    id: 'r1',
    title: '$15 Off Any Silk Press',
    pointsRequired: 150,
    discountValue: 15,
    description: 'Redeem 150 points for an instant $15 savings on your next Silk Press & Treatment.',
    category: 'Service Discount'
  },
  {
    id: 'r2',
    title: 'Free Travel-Size Thermal Serum',
    pointsRequired: 200,
    discountValue: 24,
    description: 'Complimentary 2oz True Lengths Silk Thermal Protectant Serum at checkout.',
    category: 'Free Product'
  },
  {
    id: 'r3',
    title: 'Complimentary Deep Steam Scalp Detox',
    pointsRequired: 300,
    discountValue: 35,
    description: 'Add a luxurious clarifying steam treatment to any service.',
    category: 'VIP Treatment'
  }
];

export const INITIAL_GIFT_CARDS: GiftCard[] = [
  {
    id: 'gc-1',
    code: 'TL-LUXE-8821',
    initialBalance: 150,
    currentBalance: 150,
    recipientName: 'Jasmine R.',
    recipientEmail: 'jasmine@example.com',
    senderName: 'Mom',
    purchaseDate: '2026-07-01'
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    customerName: 'Jasmine R.',
    rating: 5,
    date: '2 days ago',
    comment: 'Carolyn gave my natural hair the softest, most weightless silk press I have ever had! The atmosphere at True Lengths is unmatched.',
    serviceName: 'Silk Press & Treatment',
    stylistName: 'Carolyn R.'
  },
  {
    id: 'rev-2',
    customerName: 'Maya B.',
    rating: 5,
    date: '1 week ago',
    comment: 'Tina understood my caramel balayage vision completely. No brassiness, just pure golden dimension. Will never go anywhere else!',
    serviceName: 'Balayage & Gloss Finish',
    stylistName: 'Tina M.'
  }
];

export const INITIAL_NOTIFICATIONS: import('../types').AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Appointment Confirmed ✨',
    message: 'Your Silk Press & Treatment with Carolyn R. is scheduled for Aug 1, 10:00 AM.',
    timestamp: '10m ago',
    read: false,
    type: 'booking_confirmation',
    targetRole: 'customer',
  },
  {
    id: 'notif-2',
    title: 'New Client Booking ✂️',
    message: 'Amanda L. booked Balayage & Gloss Finish for Aug 1 at 01:30 PM.',
    timestamp: '1h ago',
    read: false,
    type: 'new_booking',
    targetRole: 'stylist',
  },
  {
    id: 'notif-3',
    title: 'Loyalty Reward Unlocked 👑',
    message: 'You unlocked $15 Off Any Silk Press reward! Check your Perks tab to redeem.',
    timestamp: '2h ago',
    read: true,
    type: 'loyalty_reward',
    targetRole: 'customer',
  },
  {
    id: 'notif-4',
    title: 'Low Stock Alert 📦',
    message: 'Silk Thermal Protectant Serum (4oz) has reached reorder threshold (4 left).',
    timestamp: '3h ago',
    read: false,
    type: 'inventory_alert',
    targetRole: 'owner',
  },
  {
    id: 'notif-5',
    title: 'Executive Telemetry Update 📈',
    message: 'Monthly revenue crossed $24,350 (+12.5% MoM). 14 re-booking candidates identified.',
    timestamp: 'Yesterday',
    read: true,
    type: 'general',
    targetRole: 'owner',
  }
];
