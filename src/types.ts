export type UserRole = 'customer' | 'stylist' | 'owner';
export type UserStatus = 'active' | 'pending' | 'disabled';

export interface UserProfile {
  id: string;
  uid?: string;
  name: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  salonId?: string;
  avatar?: string;
  phone?: string;
  hairType?: string;
  loyaltyPoints?: number;
  loyaltyTier?: 'Gold' | 'Platinum' | 'Diamond';
  memberSince?: string;
  notes?: string;
}

export interface Service {
  id: string;
  name: string;
  category: 'Silk Press' | 'Braids' | 'Color' | 'Balayage' | 'Treatments' | 'Locs & Cuts';
  description: string;
  price: number;
  startingPrice?: boolean;
  durationMinutes: number;
  imageUrl: string;
  popular?: boolean;
}

export interface Stylist {
  id: string;
  name: string;
  roleTitle: string;
  bio: string;
  avatar: string;
  rating: number;
  totalReviews: number;
  specialties: string[];
  commissionRate: number; // e.g. 0.50 for 50%
}

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerAvatar?: string;
  serviceId: string;
  serviceName: string;
  price: number;
  durationMinutes: number;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "10:00 AM"
  status: 'upcoming' | 'in_progress' | 'completed' | 'canceled';
  stylistId: string;
  stylistName: string;
  notes?: string;
  formulaId?: string;
  reminderSent?: boolean;
}

export interface HairFormula {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  serviceName: string;
  baseFormula?: string;
  developerVolume?: string;
  highlightToner?: string;
  processingTime?: string;
  notes?: string;
  stylistName: string;
  photoUrl?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  beforeUrl?: string;
  afterUrl: string;
  additionalImages?: string[];
  stylistName: string;
  date: string;
  likes: number;
  description?: string;
  servicePerformed?: string;
  duration?: string;
  priceRange?: string;
  productsUsed?: string[];
  maintenanceCycle?: string;
  hairTextureType?: string;
  serviceId?: string;
  stylistId?: string;
  isFeatured?: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  brand: string;
  category: 'Shampoo & Conditioner' | 'Styling & Oils' | 'Color & Lightener' | 'Extensions & Braiding Hair';
  stockCount: number;
  reorderLevel: number;
  unitCost: number;
  retailPrice: number;
  supplier: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface RevenueMetric {
  totalRevenue: number;
  revenueGrowth: number;
  totalAppointments: number;
  appointmentsGrowth: number;
  newClients: number;
  newClientsGrowth: number;
  retentionRate: number;
  retentionGrowth: number;
  topServices: { name: string; percentage: number; revenue: number }[];
  monthlyBreakdown: { month: string; revenue: number; appointments: number }[];
}

export interface LoyaltyReward {
  id: string;
  title: string;
  pointsRequired: number;
  discountValue: number;
  description: string;
  category: 'Service Discount' | 'Free Product' | 'VIP Treatment';
}

export interface GiftCard {
  id: string;
  code: string;
  initialBalance: number;
  currentBalance: number;
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  purchaseDate: string;
}

export interface Review {
  id: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  date: string;
  comment: string;
  serviceName: string;
  stylistName: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionablePrompts?: string[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'booking_confirmation' | 'new_booking' | 'status_update' | 'inventory_alert' | 'loyalty_reward' | 'general';
  targetRole: UserRole | 'all';
}
