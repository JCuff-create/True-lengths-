import React, { useState } from 'react';
import { UserRole, UserProfile, Service, Stylist, Appointment, HairFormula, GalleryItem, InventoryItem, RevenueMetric, LoyaltyReward, GiftCard } from './types';
import {
  INITIAL_SERVICES,
  INITIAL_STYLISTS,
  INITIAL_APPOINTMENTS,
  INITIAL_FORMULAS,
  INITIAL_GALLERY,
  INITIAL_INVENTORY,
  INITIAL_REVENUE_METRICS,
  INITIAL_LOYALTY_REWARDS,
  INITIAL_GIFT_CARDS,
  INITIAL_NOTIFICATIONS,
  INITIAL_CUSTOMER_PROFILES,
} from './data/initialData';
import { AppNotification } from './types';

import { Header } from './components/common/Header';
import { NotificationCenter } from './components/common/NotificationCenter';
import { UserProfileModal } from './components/common/UserProfileModal';
import { ToastContainer } from './components/common/ToastContainer';
import { CustomerHome } from './components/customer/CustomerHome';
import { BookingFlow } from './components/customer/BookingFlow';
import { MyAppointments } from './components/customer/MyAppointments';
import { CustomerAIAssistant } from './components/customer/CustomerAIAssistant';
import { GalleryView } from './components/customer/GalleryView';
import { LoyaltyGiftCards } from './components/customer/LoyaltyGiftCards';

import { StylistSchedule } from './components/stylist/StylistSchedule';
import { HairFormulaManager } from './components/stylist/HairFormulaManager';

import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { OwnerCalendar } from './components/owner/OwnerCalendar';
import { InventoryManager } from './components/owner/InventoryManager';
import { MarketingAI } from './components/owner/MarketingAI';
import { OwnerAIAssistant } from './components/owner/OwnerAIAssistant';
import { PortfolioManager } from './components/owner/PortfolioManager';

import { Home, Calendar, Sparkles, Image as ImageIcon, Gift, Scissors, Crown, Package, MessageSquare, BarChart3, FileText, ArrowLeft } from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import { WelcomeAuthView } from './components/auth/WelcomeAuthView';
import { RoleLoadingView } from './components/auth/RoleLoadingView';
import { AccountPendingView } from './components/auth/AccountPendingView';
import { StaffApprovalManager } from './components/owner/StaffApprovalManager';

function SalonAppContent() {
  const {
    firebaseUser,
    userProfile,
    loading,
    signOutUser,
  } = useAuth();

  // App State
  const [currentRole, setCurrentRole] = useState<UserRole>('customer');
  const [currentView, setCurrentView] = useState<string>('home');
  const [bookingCategory, setBookingCategory] = useState<string | undefined>();
  const [isStaffApprovalOpen, setIsStaffApprovalOpen] = useState<boolean>(false);

  // Sync role and view with userProfile role from Firestore after authentication
  React.useEffect(() => {
    if (userProfile?.role) {
      setCurrentRole(userProfile.role);
      if (userProfile.role === 'customer') setCurrentView('home');
      else if (userProfile.role === 'stylist') setCurrentView('stylist_schedule');
      else if (userProfile.role === 'owner') setCurrentView('owner_dashboard');
    }
  }, [userProfile?.role]);

  const handleReturn = () => {
    if (currentRole === 'customer') setCurrentView('home');
    else if (currentRole === 'stylist') setCurrentView('stylist_schedule');
    else if (currentRole === 'owner') setCurrentView('owner_dashboard');
  };

  const isSecondaryView =
    (currentRole === 'customer' && currentView !== 'home') ||
    (currentRole === 'stylist' && currentView !== 'stylist_schedule') ||
    (currentRole === 'owner' && currentView !== 'owner_dashboard');

  const getReturnLabel = () => {
    if (currentRole === 'customer') return 'Return to Home';
    if (currentRole === 'stylist') return 'Return to Schedule';
    if (currentRole === 'owner') return 'Return to Executive Dashboard';
    return 'Return';
  };

  // Data State with LocalStorage Persistence
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [stylists, setStylists] = useState<Stylist[]>(() => {
    const saved = localStorage.getItem('truelengths_stylists');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_STYLISTS;
  });
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('truelengths_appointments');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_APPOINTMENTS;
  });
  const [formulas, setFormulas] = useState<HairFormula[]>(INITIAL_FORMULAS);
  const [gallery, setGallery] = useState<GalleryItem[]>(() => {
    const saved = localStorage.getItem('truelengths_gallery');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_GALLERY;
  });
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('truelengths_inventory');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_INVENTORY;
  });
  const [metrics, setMetrics] = useState<RevenueMetric>(INITIAL_REVENUE_METRICS);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(350);
  const [giftCards, setGiftCards] = useState<GiftCard[]>(INITIAL_GIFT_CARDS);

  // Customer Profiles State
  const [customerProfiles, setCustomerProfiles] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('truelengths_customer_profiles');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_CUSTOMER_PROFILES;
  });
  const [activeCustomerId, setActiveCustomerId] = useState<string>(() => {
    return localStorage.getItem('truelengths_active_cust_id') || 'cust-1';
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Sync customer profiles and active client ID to localStorage
  React.useEffect(() => {
    localStorage.setItem('truelengths_customer_profiles', JSON.stringify(customerProfiles));
  }, [customerProfiles]);

  React.useEffect(() => {
    localStorage.setItem('truelengths_active_cust_id', activeCustomerId);
  }, [activeCustomerId]);

  // Sync gallery, appointments, inventory, and stylists to localStorage whenever updated
  React.useEffect(() => {
    localStorage.setItem('truelengths_gallery', JSON.stringify(gallery));
  }, [gallery]);

  React.useEffect(() => {
    localStorage.setItem('truelengths_appointments', JSON.stringify(appointments));
  }, [appointments]);

  React.useEffect(() => {
    localStorage.setItem('truelengths_inventory', JSON.stringify(inventory));
  }, [inventory]);

  React.useEffect(() => {
    localStorage.setItem('truelengths_stylists', JSON.stringify(stylists));
  }, [stylists]);

  const handleUpdateStylist = (updatedStylist: Stylist) => {
    setStylists((prev) =>
      prev.map((s) => (s.id === updatedStylist.id ? updatedStylist : s))
    );
    addNotification({
      title: 'Stylist Profile Updated 👤',
      message: `${updatedStylist.name}'s profile and commission settings were updated successfully.`,
      type: 'general',
      targetRole: 'stylist',
    });
  };

  // Notification System State
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [toasts, setToasts] = useState<AppNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);

  const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setToasts((prev) => [newNotif, ...prev]);

    // Auto dismiss toast popup after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newNotif.id));
    }, 5000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleToggleNotifRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const handleSendTestNotification = () => {
    addNotification({
      title: 'Real-Time Salon System Alert ⚡',
      message: `System notification triggered for ${currentRole.toUpperCase()} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      type: 'general',
      targetRole: currentRole,
    });
  };

  // Active Profile Calculation
  const activeCustomer = customerProfiles.find((p) => p.id === activeCustomerId) || customerProfiles[0];

  const currentUserProfile: UserProfile =
    currentRole === 'customer'
      ? {
          ...activeCustomer,
          loyaltyPoints: loyaltyPoints !== undefined ? loyaltyPoints : activeCustomer.loyaltyPoints,
        }
      : currentRole === 'stylist'
      ? {
          id: 'st-1',
          name: 'Carolyn R.',
          email: 'carolyn@truelengths.com',
          role: 'stylist',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
          phone: '(555) 345-6789',
        }
      : {
          id: 'owner-1',
          name: 'Carolyn R. (Owner)',
          email: 'carolyn.owner@truelengths.com',
          role: 'owner',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
          phone: '(555) 345-6789',
        };

  const handleUpdateCustomerProfile = (updatedProfile: UserProfile) => {
    setCustomerProfiles((prev) =>
      prev.map((p) => (p.id === updatedProfile.id ? updatedProfile : p))
    );
    if (updatedProfile.loyaltyPoints !== undefined) {
      setLoyaltyPoints(updatedProfile.loyaltyPoints);
    }
    addNotification({
      title: 'Profile Updated 👤',
      message: `Profile details for ${updatedProfile.name} were saved successfully.`,
      type: 'general',
      targetRole: 'customer',
    });
  };

  const handleCreateCustomerProfile = (newProfile: UserProfile) => {
    setCustomerProfiles((prev) => [...prev, newProfile]);
    setActiveCustomerId(newProfile.id);
    if (newProfile.loyaltyPoints !== undefined) {
      setLoyaltyPoints(newProfile.loyaltyPoints);
    }
    addNotification({
      title: 'Welcome to True Lengths! 🎉',
      message: `Created and activated new profile for ${newProfile.name}.`,
      type: 'general',
      targetRole: 'customer',
    });
  };

  const handleSelectCustomerProfile = (profileId: string) => {
    setActiveCustomerId(profileId);
    const selected = customerProfiles.find((p) => p.id === profileId);
    if (selected && selected.loyaltyPoints !== undefined) {
      setLoyaltyPoints(selected.loyaltyPoints);
    }
    if (selected) {
      addNotification({
        title: 'Profile Switched 👤',
        message: `Switched active client profile to ${selected.name}.`,
        type: 'general',
        targetRole: 'customer',
      });
    }
  };

  const handleDeleteCustomerProfile = (profileId: string) => {
    if (customerProfiles.length <= 1) return;
    const filtered = customerProfiles.filter((p) => p.id !== profileId);
    setCustomerProfiles(filtered);
    if (activeCustomerId === profileId) {
      setActiveCustomerId(filtered[0].id);
      if (filtered[0].loyaltyPoints !== undefined) {
        setLoyaltyPoints(filtered[0].loyaltyPoints);
      }
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    if (role === 'customer') setCurrentView('home');
    if (role === 'stylist') setCurrentView('stylist_schedule');
    if (role === 'owner') setCurrentView('owner_dashboard');
  };

  const handleBookingComplete = (newApt: Appointment) => {
    setAppointments((prev) => [newApt, ...prev]);
    setLoyaltyPoints((prev) => prev + newApt.price);
    if (currentRole === 'customer') {
      setCurrentView('appointments');
    }

    // Push Notifications & Toasts for Customer, Stylist, and Owner
    addNotification({
      title: 'Appointment Confirmed ✨',
      message: `Your ${newApt.serviceName} with ${newApt.stylistName} is set for ${newApt.date} at ${newApt.time}.`,
      type: 'booking_confirmation',
      targetRole: 'customer',
    });

    addNotification({
      title: 'New Booking Assigned ✂️',
      message: `${newApt.customerName} booked ${newApt.serviceName} with you on ${newApt.date} at ${newApt.time}.`,
      type: 'new_booking',
      targetRole: 'stylist',
    });

    addNotification({
      title: 'New Client Appointment Booked 📅',
      message: `${newApt.customerName} booked ${newApt.serviceName} with ${newApt.stylistName} on ${newApt.date} at ${newApt.time}.`,
      type: 'general',
      targetRole: 'owner',
    });
  };

  const handleSendReminderNotification = React.useCallback((apt: Appointment) => {
    // Mark as sent in appointments state
    setAppointments((prev) =>
      prev.map((a) => (a.id === apt.id ? { ...a, reminderSent: true } : a))
    );

    addNotification({
      title: 'Appointment Tomorrow Reminder ⏰',
      message: `Friendly Reminder: You have an upcoming ${apt.serviceName} with ${apt.stylistName} scheduled for tomorrow (${apt.date}) at ${apt.time}.`,
      type: 'booking_confirmation',
      targetRole: 'customer',
    });

    addNotification({
      title: 'Upcoming Client Tomorrow ✂️',
      message: `Reminder: You have ${apt.customerName} scheduled for ${apt.serviceName} tomorrow (${apt.date}) at ${apt.time}.`,
      type: 'new_booking',
      targetRole: 'stylist',
    });

    addNotification({
      title: '1-Day Automated Push Sent 📱',
      message: `Automated 1-day reminder push sent to ${apt.customerName} for ${apt.date} at ${apt.time}.`,
      type: 'general',
      targetRole: 'owner',
    });
  }, []);

  // Automated 1-Day Push Notification Engine
  React.useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const formatYMD = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const todayStr = formatYMD(today);
    const tomorrowStr = formatYMD(tomorrow);

    // Find all upcoming appointments scheduled for tomorrow or today that haven't had 1-day push sent yet
    const pendingReminders = appointments.filter(
      (a) =>
        a.status === 'upcoming' &&
        !a.reminderSent &&
        (a.date === tomorrowStr || a.date === todayStr)
    );

    if (pendingReminders.length > 0) {
      pendingReminders.forEach((apt) => {
        handleSendReminderNotification(apt);
      });
    }
  }, [appointments, handleSendReminderNotification]);

  const handleCancelAppointment = (id: string) => {
    setAppointments(
      appointments.map((a) => (a.id === id ? { ...a, status: 'canceled' as const } : a))
    );

    const apt = appointments.find((a) => a.id === id);
    if (apt) {
      addNotification({
        title: 'Appointment Canceled',
        message: `${apt.serviceName} appointment on ${apt.date} has been canceled.`,
        type: 'status_update',
        targetRole: 'customer',
      });
      addNotification({
        title: 'Appointment Canceled ✂️',
        message: `${apt.customerName}'s ${apt.serviceName} appointment on ${apt.date} was canceled.`,
        type: 'status_update',
        targetRole: 'stylist',
      });
    }
  };

  const handleUpdateStatus = (id: string, status: 'upcoming' | 'in_progress' | 'completed') => {
    setAppointments(
      appointments.map((a) => (a.id === id ? { ...a, status } : a))
    );

    const apt = appointments.find((a) => a.id === id);
    if (apt) {
      const statusLabel = status === 'in_progress' ? 'is now in progress' : status === 'completed' ? 'has been completed' : 'is upcoming';
      addNotification({
        title: `Service Status Updated ✂️`,
        message: `Your ${apt.serviceName} with ${apt.stylistName} ${statusLabel}.`,
        type: 'status_update',
        targetRole: 'customer',
      });
    }
  };

  const handleSaveFormula = (newFormula: HairFormula) => {
    setFormulas([newFormula, ...formulas]);
  };

  const handleRestockItem = (id: string, amount: number) => {
    setInventory((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, stockCount: inv.stockCount + amount } : inv
      )
    );

    const item = inventory.find((i) => i.id === id);
    if (item) {
      addNotification({
        title: 'Inventory Restocked 📦',
        message: `Added ${amount} units of ${item.name}. New total: ${item.stockCount + amount}.`,
        type: 'inventory_alert',
        targetRole: 'owner',
      });
    }
  };

  const handleUpdateInventoryItem = (updatedItem: InventoryItem) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    addNotification({
      title: 'Inventory Item Updated 📦',
      message: `Updated details for ${updatedItem.name}.`,
      type: 'inventory_alert',
      targetRole: 'owner',
    });
  };

  const handleAddInventoryItem = (newItem: InventoryItem) => {
    setInventory((prev) => [newItem, ...prev]);
    addNotification({
      title: 'New Product Added to Inventory 📦',
      message: `Added ${newItem.name} (${newItem.stockCount} units) to inventory.`,
      type: 'inventory_alert',
      targetRole: 'owner',
    });
  };

  const handleDeleteInventoryItem = (id: string) => {
    const item = inventory.find((i) => i.id === id);
    setInventory((prev) => prev.filter((i) => i.id !== id));
    if (item) {
      addNotification({
        title: 'Product Removed from Inventory 🗑️',
        message: `Removed ${item.name} from inventory.`,
        type: 'inventory_alert',
        targetRole: 'owner',
      });
    }
  };

  const handleAddGalleryItem = (newItem: Omit<GalleryItem, 'id' | 'likes'>) => {
    const createdItem: GalleryItem = {
      ...newItem,
      id: `g-${Date.now()}`,
      likes: Math.floor(Math.random() * 40) + 12,
    };
    setGallery([createdItem, ...gallery]);
    addNotification({
      title: 'Portfolio Photo Added ✨',
      message: `"${createdItem.title}" (${createdItem.category}) added to master portfolio.`,
      type: 'general',
      targetRole: 'owner',
    });
  };

  const handleUpdateGalleryItem = (updatedItem: GalleryItem) => {
    setGallery((prev) => prev.map((g) => (g.id === updatedItem.id ? updatedItem : g)));
    addNotification({
      title: 'Portfolio Item Updated 📸',
      message: `Updated details for "${updatedItem.title}".`,
      type: 'general',
      targetRole: 'owner',
    });
  };

  const handleDeleteGalleryItem = (id: string) => {
    const item = gallery.find((g) => g.id === id);
    setGallery((prev) => prev.filter((g) => g.id !== id));
    if (item) {
      addNotification({
        title: 'Portfolio Photo Removed 🗑️',
        message: `Removed "${item.title}" from master portfolio.`,
        type: 'general',
        targetRole: 'owner',
      });
    }
  };

  const unreadCount = notifications.filter(
    (n) => (n.targetRole === currentRole || n.targetRole === 'all') && !n.read
  ).length;

  const upcomingAppointment = appointments.find((a) => a.status === 'upcoming' || a.status === 'in_progress');

  if (loading) {
    return <RoleLoadingView />;
  }

  if (!firebaseUser || !userProfile) {
    return <WelcomeAuthView />;
  }

  if (userProfile.status === 'pending') {
    return <AccountPendingView status="pending" />;
  }

  if (userProfile.status === 'disabled') {
    return <AccountPendingView status="disabled" />;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2D2D2D] font-sans flex flex-col selection:bg-[#B68A4C] selection:text-[#FAF8F5]">
      
      {/* Toast Alert Popups */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* Notification Center Modal Drawer */}
      <NotificationCenter
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        currentRole={currentRole}
        onMarkAllAsRead={handleMarkAllRead}
        onClearAll={handleClearAllNotifications}
        onToggleRead={handleToggleNotifRead}
        onSendTestNotification={handleSendTestNotification}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUserProfile}
        allProfiles={customerProfiles}
        onUpdateProfile={handleUpdateCustomerProfile}
        onCreateProfile={handleCreateCustomerProfile}
        onSelectProfile={handleSelectCustomerProfile}
        onDeleteProfile={handleDeleteCustomerProfile}
      />

      {/* Staff Approval Modal */}
      <StaffApprovalManager
        isOpen={isStaffApprovalOpen}
        onClose={() => setIsStaffApprovalOpen(false)}
      />

      {/* Top Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        currentUser={currentUserProfile}
        onHomeClick={handleReturn}
        unreadCount={unreadCount}
        onOpenNotifications={() => setIsNotifOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenStaffApproval={() => setIsStaffApprovalOpen(true)}
        onSignOut={signOutUser}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 pt-3 sm:pt-6 pb-24">
        
        {/* Global Return Button for Sub-Views */}
        {isSecondaryView && (
          <div className="mb-3 sm:mb-6 flex items-center justify-between bg-[#FAF8F5] border border-[#B68A4C]/25 p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-xs">
            <button
              onClick={handleReturn}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-[#8B5E34] hover:bg-[#7A5A3A] text-[#FAF8F5] text-xs font-bold transition-all shadow-xs group cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:-translate-x-1" />
              <span>{getReturnLabel()}</span>
            </button>
            <span className="text-xs text-[#8B5E34] font-medium hidden sm:inline">
              Active View: <span className="font-bold capitalize">{currentView.replace('_', ' ')}</span>
            </span>
          </div>
        )}
        
        {/* CUSTOMER VIEWS */}
        {currentRole === 'customer' && (
          <>
            {currentView === 'home' && (
              <CustomerHome
                user={currentUserProfile}
                services={services}
                gallery={gallery}
                upcomingAppointment={upcomingAppointment}
                onBookNow={() => {
                  setBookingCategory(undefined);
                  setCurrentView('booking');
                }}
                onSelectCategory={(cat) => {
                  setBookingCategory(cat);
                  setCurrentView('booking');
                }}
                onViewGallery={() => setCurrentView('gallery')}
                onOpenAI={() => setCurrentView('assistant')}
                onViewAppointments={() => setCurrentView('appointments')}
              />
            )}

            {currentView === 'booking' && (
              <BookingFlow
                services={services}
                stylists={stylists}
                initialCategory={bookingCategory}
                onBookingComplete={handleBookingComplete}
                onCancel={() => setCurrentView('home')}
              />
            )}

            {currentView === 'appointments' && (
              <MyAppointments
                appointments={appointments}
                onBookNew={() => {
                  setBookingCategory(undefined);
                  setCurrentView('booking');
                }}
                onCancelAppointment={handleCancelAppointment}
                onRescheduleAppointment={(apt) => {
                  setBookingCategory(apt.serviceName);
                  setCurrentView('booking');
                }}
              />
            )}

            {currentView === 'assistant' && <CustomerAIAssistant />}

            {currentView === 'gallery' && (
              <GalleryView
                gallery={gallery}
                onBookNow={() => setCurrentView('booking')}
                currentRole={currentRole}
                onAddGalleryItem={handleAddGalleryItem}
                stylists={stylists}
              />
            )}

            {currentView === 'loyalty' && (
              <LoyaltyGiftCards
                loyaltyPoints={loyaltyPoints}
                rewards={INITIAL_LOYALTY_REWARDS}
                giftCards={giftCards}
                onRedeemReward={(reward) => {
                  setLoyaltyPoints((prev) => prev - reward.pointsRequired);
                  alert(`Redeemed ${reward.title}! Check your appointments.`);
                }}
                onBuyGiftCard={(amount, recipient) => {
                  const newGc: GiftCard = {
                    id: `gc-${Date.now()}`,
                    code: `TL-LUXE-${Math.floor(1000 + Math.random() * 9000)}`,
                    initialBalance: amount,
                    currentBalance: amount,
                    recipientName: recipient,
                    recipientEmail: `${recipient.toLowerCase().replace(/\s+/g, '')}@example.com`,
                    senderName: currentUserProfile.name,
                    purchaseDate: new Date().toISOString().split('T')[0],
                  };
                  setGiftCards([newGc, ...giftCards]);
                }}
              />
            )}
          </>
        )}

        {/* STYLIST VIEWS */}
        {currentRole === 'stylist' && (
          <>
            {currentView === 'stylist_schedule' && (
              <StylistSchedule
                stylist={stylists[0]}
                appointments={appointments}
                formulas={formulas}
                onOpenFormula={(clientId, name) => setCurrentView('formulas')}
                onUpdateStatus={handleUpdateStatus}
                onUpdateStylist={handleUpdateStylist}
              />
            )}

            {currentView === 'formulas' && (
              <HairFormulaManager
                formulas={formulas}
                onSaveFormula={handleSaveFormula}
              />
            )}
          </>
        )}

        {/* OWNER VIEWS */}
        {currentRole === 'owner' && (
          <>
            {currentView === 'owner_dashboard' && (
              <OwnerDashboard
                metrics={metrics}
                onOpenAIMarketing={() => setCurrentView('marketing')}
                onOpenInventory={() => setCurrentView('inventory')}
                onOpenOwnerAI={() => setCurrentView('owner_ai')}
                onOpenPortfolio={() => setCurrentView('portfolio')}
              />
            )}

            {currentView === 'portfolio' && (
              <PortfolioManager
                gallery={gallery}
                stylists={stylists}
                onAddGalleryItem={handleAddGalleryItem}
                onUpdateGalleryItem={handleUpdateGalleryItem}
                onDeleteGalleryItem={handleDeleteGalleryItem}
              />
            )}

            {currentView === 'owner_calendar' && (
              <OwnerCalendar
                appointments={appointments}
                stylists={stylists}
                services={services}
                onAddAppointment={handleBookingComplete}
                onUpdateStatus={handleUpdateStatus}
                onSendReminder={handleSendReminderNotification}
                onDeleteAppointment={(id) => setAppointments((prev) => prev.filter((a) => a.id !== id))}
              />
            )}

            {currentView === 'inventory' && (
              <InventoryManager
                inventory={inventory}
                onRestockItem={handleRestockItem}
                onUpdateItem={handleUpdateInventoryItem}
                onAddItem={handleAddInventoryItem}
                onDeleteItem={handleDeleteInventoryItem}
              />
            )}

            {currentView === 'marketing' && <MarketingAI />}

            {currentView === 'owner_ai' && <OwnerAIAssistant metrics={metrics} />}
          </>
        )}

      </main>

      {/* Bottom Floating Navigation Bar (Mobile & Desktop App Style) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-t border-[#B68A4C]/20 py-2 px-4">
        <div className="max-w-md mx-auto flex items-center justify-around">
          
          {/* CUSTOMER BOTTOM NAV */}
          {currentRole === 'customer' && (
            <>
              <button
                onClick={() => setCurrentView('home')}
                className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
                  currentView === 'home' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60 hover:text-[#2D2D2D]'
                }`}
              >
                <Home className="w-5 h-5" />
                <span>Home</span>
              </button>

              <button
                onClick={() => setCurrentView('appointments')}
                className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
                  currentView === 'appointments' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60 hover:text-[#2D2D2D]'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span>Appointments</span>
              </button>

              <button
                onClick={() => setCurrentView('assistant')}
                className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
                  currentView === 'assistant' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60 hover:text-[#2D2D2D]'
                }`}
              >
                <div className="relative">
                  <Sparkles className="w-5 h-5 text-[#B68A4C]" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#8B5E34]" />
                </div>
                <span>Assistant</span>
              </button>

              <button
                onClick={() => setCurrentView('gallery')}
                className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
                  currentView === 'gallery' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60 hover:text-[#2D2D2D]'
                }`}
              >
                <ImageIcon className="w-5 h-5" />
                <span>Gallery</span>
              </button>

              <button
                onClick={() => setCurrentView('loyalty')}
                className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
                  currentView === 'loyalty' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60 hover:text-[#2D2D2D]'
                }`}
              >
                <Gift className="w-5 h-5" />
                <span>Perks</span>
              </button>
            </>
          )}

          {/* STYLIST BOTTOM NAV */}
          {currentRole === 'stylist' && (
            <>
              <button
                onClick={() => setCurrentView('stylist_schedule')}
                className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
                  currentView === 'stylist_schedule' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60'
                }`}
              >
                <Scissors className="w-5 h-5" />
                <span>Schedule</span>
              </button>

              <button
                onClick={() => setCurrentView('formulas')}
                className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
                  currentView === 'formulas' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>Formulas</span>
              </button>
            </>
          )}

          {/* OWNER BOTTOM NAV */}
          {currentRole === 'owner' && (
            <>
              <button
                onClick={() => setCurrentView('owner_dashboard')}
                className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
                  currentView === 'owner_dashboard' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setCurrentView('portfolio')}
                className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
                  currentView === 'portfolio' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60'
                }`}
              >
                <ImageIcon className="w-5 h-5" />
                <span>Portfolio</span>
              </button>

              <button
                onClick={() => setCurrentView('owner_calendar')}
                className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
                  currentView === 'owner_calendar' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span>Calendar</span>
              </button>

              <button
                onClick={() => setCurrentView('inventory')}
                className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
                  currentView === 'inventory' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60'
                }`}
              >
                <Package className="w-5 h-5" />
                <span>Inventory</span>
              </button>

              <button
                onClick={() => setCurrentView('marketing')}
                className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
                  currentView === 'marketing' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60'
                }`}
              >
                <Sparkles className="w-5 h-5 text-[#B68A4C]" />
                <span>Marketing</span>
              </button>

              <button
                onClick={() => setCurrentView('owner_ai')}
                className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
                  currentView === 'owner_ai' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60'
                }`}
              >
                <Crown className="w-5 h-5" />
                <span>AI Advisor</span>
              </button>
            </>
          )}

        </div>
      </nav>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SalonAppContent />
    </AuthProvider>
  );
}
