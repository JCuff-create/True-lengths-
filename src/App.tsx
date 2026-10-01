import React, { useState, useMemo, useCallback } from 'react';
import {
  UserRole,
  UserProfile,
  Service,
  Stylist,
  Appointment,
  HairFormula,
  GalleryItem,
  InventoryItem,
  GiftCard,
  AppNotification,
  LoyaltyReward,
} from './types';

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
import { ServiceCatalogManager } from './components/owner/ServiceCatalogManager';

import {
  Home,
  Calendar,
  Sparkles,
  Image as ImageIcon,
  Gift,
  Scissors,
  Crown,
  Package,
  BarChart3,
  FileText,
  ArrowLeft,
} from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import { WelcomeAuthView } from './components/auth/WelcomeAuthView';
import { RoleLoadingView } from './components/auth/RoleLoadingView';
import { AccountPendingView } from './components/auth/AccountPendingView';
import { StaffApprovalManager } from './components/owner/StaffApprovalManager';
import { useSalonStore } from './hooks/useSalonStore';
import { computeMetricsFromAppointments, EMPTY_METRICS } from './lib/salonStore';
import {
  canAccessPortal,
  defaultViewForPortal,
  isViewAllowedForPortal,
} from './lib/roles';

function SalonAppContent() {
  const {
    firebaseUser,
    userProfile,
    loading,
    signOutUser,
    updateOwnProfile,
    allProfiles,
  } = useAuth();

  const [currentRole, setCurrentRole] = useState<UserRole>('customer');
  const [currentView, setCurrentView] = useState<string>('home');
  const [bookingCategory, setBookingCategory] = useState<string | undefined>();
  const [isStaffApprovalOpen, setIsStaffApprovalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [toasts, setToasts] = useState<AppNotification[]>([]);
  const [showServicesManager, setShowServicesManager] = useState(false);

  const actualUserRole = userProfile?.role || 'customer';
  // Portal access is derived from Firestore role/status — never trust UI state alone.
  const effectiveRole: UserRole = canAccessPortal(
    userProfile?.role,
    userProfile?.status,
    currentRole
  )
    ? currentRole
    : actualUserRole === 'owner' || actualUserRole === 'stylist' || actualUserRole === 'customer'
      ? actualUserRole
      : 'customer';

  const salon = useSalonStore(
    firebaseUser && userProfile && userProfile.status !== 'disabled'
      ? {
          uid: userProfile.uid || userProfile.id,
          role: userProfile.role,
          status: userProfile.status,
        }
      : null
  );
  const {
    services,
    stylists,
    appointments,
    gallery,
    inventory,
    formulas,
    loyaltyRewards,
    giftCards,
    notifications,
    save,
    remove,
    newId,
  } = salon;

  const customerCount = allProfiles.filter((p) => p.role === 'customer').length;
  const metrics = useMemo(
    () =>
      appointments.length === 0 && customerCount === 0
        ? EMPTY_METRICS
        : computeMetricsFromAppointments(appointments, customerCount),
    [appointments, customerCount]
  );

  React.useEffect(() => {
    if (!userProfile?.role || userProfile.status !== 'active') return;
    const portal = userProfile.role;
    setCurrentRole(portal);
    setCurrentView(defaultViewForPortal(portal));
  }, [userProfile?.role, userProfile?.status]);

  React.useEffect(() => {
    if (!isViewAllowedForPortal(effectiveRole, currentView)) {
      setCurrentView(defaultViewForPortal(effectiveRole));
    }
  }, [effectiveRole, currentView]);

  const handleReturn = () => {
    setCurrentView(defaultViewForPortal(effectiveRole));
  };

  const isSecondaryView =
    (effectiveRole === 'customer' && currentView !== 'home') ||
    (effectiveRole === 'stylist' && currentView !== 'stylist_schedule') ||
    (effectiveRole === 'owner' && currentView !== 'owner_dashboard');

  const getReturnLabel = () => {
    if (effectiveRole === 'customer') return 'Return to Home';
    if (effectiveRole === 'stylist') return 'Return to Schedule';
    if (effectiveRole === 'owner') return 'Return to Executive Dashboard';
    return 'Return';
  };

  const pushToast = (notif: AppNotification) => {
    setToasts((prev) => [notif, ...prev]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== notif.id));
    }, 5000);
  };

  const addNotification = useCallback(
    async (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
      const newNotif: AppNotification = {
        ...notif,
        id: newId('notif'),
        timestamp: new Date().toISOString(),
        read: false,
      };
      try {
        await save('notifications', newNotif.id, { ...newNotif });
        pushToast(newNotif);
      } catch (err: any) {
        console.error('Notification save failed:', err);
        pushToast(newNotif);
      }
    },
    [save, newId]
  );

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleMarkAllRead = async () => {
    try {
      await Promise.all(
        notifications
          .filter((n) => !n.read)
          .map((n) => save('notifications', n.id, { ...n, read: true }))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update notifications.');
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await Promise.all(notifications.map((n) => remove('notifications', n.id)));
    } catch (err: any) {
      alert(err.message || 'Failed to clear notifications.');
    }
  };

  const handleToggleNotifRead = async (id: string) => {
    const n = notifications.find((x) => x.id === id);
    if (!n) return;
    try {
      await save('notifications', id, { ...n, read: !n.read });
    } catch (err: any) {
      alert(err.message || 'Failed to update notification.');
    }
  };

  const handleSendTestNotification = () => {
    void addNotification({
      title: 'Salon System Alert',
      message: `System notification for ${effectiveRole.toUpperCase()} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      type: 'general',
      targetRole: effectiveRole,
    });
  };

  const currentUserProfile: UserProfile = userProfile
    ? { ...userProfile }
    : {
        id: 'unknown',
        name: 'Guest',
        email: '',
        role: 'customer',
      };

  const handleUpdateCustomerProfile = async (updatedProfile: UserProfile) => {
    try {
      await updateOwnProfile(updatedProfile);
      await addNotification({
        title: 'Profile Updated',
        message: `Profile details for ${updatedProfile.name} were saved successfully.`,
        type: 'general',
        targetRole: userProfile?.role || 'customer',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to save profile to Firestore.');
      throw err;
    }
  };

  const handleRoleChange = (requestedRole: UserRole) => {
    if (!canAccessPortal(userProfile?.role, userProfile?.status, requestedRole)) {
      const fallback = userProfile?.role || 'customer';
      setCurrentRole(fallback);
      setCurrentView(defaultViewForPortal(fallback));
      return;
    }
    setCurrentRole(requestedRole);
    setCurrentView(defaultViewForPortal(requestedRole));
  };

  const handleBookingComplete = async (newApt: Appointment) => {
    try {
      const uid = userProfile?.uid || userProfile?.id;
      const aptToSave: Appointment =
        userProfile?.role === 'customer' && uid
          ? {
              ...newApt,
              customerId: uid,
              customerName: userProfile.name,
            }
          : newApt;
      await save('appointments', aptToSave.id, { ...aptToSave });
      if (userProfile?.role === 'customer' && userProfile.uid) {
        const pts = (userProfile.loyaltyPoints || 0) + Math.round(aptToSave.price || 0);
        await updateOwnProfile({ loyaltyPoints: pts });
      }
      if (effectiveRole === 'customer') setCurrentView('appointments');
      await addNotification({
        title: 'Appointment Confirmed',
        message: `${aptToSave.serviceName} with ${aptToSave.stylistName} is set for ${aptToSave.date} at ${aptToSave.time}.`,
        type: 'booking_confirmation',
        targetRole: 'customer',
      });
      await addNotification({
        title: 'New Booking Assigned',
        message: `${aptToSave.customerName} booked ${aptToSave.serviceName} on ${aptToSave.date} at ${aptToSave.time}.`,
        type: 'new_booking',
        targetRole: 'stylist',
      });
      await addNotification({
        title: 'New Client Appointment Booked',
        message: `${aptToSave.customerName} booked ${aptToSave.serviceName} with ${aptToSave.stylistName}.`,
        type: 'general',
        targetRole: 'owner',
      });
    } catch (err: any) {
      const msg = err.message || 'Failed to save appointment. Please try again or pick another time.';
      alert(msg);
      throw err;
    }
  };

  const handleSendReminderNotification = useCallback(
    async (apt: Appointment) => {
      try {
        await save('appointments', apt.id, { ...apt, reminderSent: true });
        await addNotification({
          title: 'Appointment Reminder',
          message: `Reminder: ${apt.serviceName} with ${apt.stylistName} on ${apt.date} at ${apt.time}.`,
          type: 'booking_confirmation',
          targetRole: 'customer',
        });
      } catch (err: any) {
        alert(err.message || 'Failed to send reminder.');
      }
    },
    [save, addNotification]
  );

  const handleCancelAppointment = async (id: string) => {
    const apt = appointments.find((a) => a.id === id);
    if (!apt) return;
    try {
      await save('appointments', id, { ...apt, status: 'canceled' });
      await addNotification({
        title: 'Appointment Canceled',
        message: `${apt.serviceName} on ${apt.date} has been canceled.`,
        type: 'status_update',
        targetRole: 'customer',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment.');
    }
  };

  const handleUpdateStatus = async (id: string, status: 'upcoming' | 'in_progress' | 'completed') => {
    const apt = appointments.find((a) => a.id === id);
    if (!apt) return;
    try {
      await save('appointments', id, { ...apt, status });
      const statusLabel =
        status === 'in_progress'
          ? 'is now in progress'
          : status === 'completed'
            ? 'has been completed'
            : 'is upcoming';
      await addNotification({
        title: 'Service Status Updated',
        message: `Your ${apt.serviceName} with ${apt.stylistName} ${statusLabel}.`,
        type: 'status_update',
        targetRole: 'customer',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to update appointment status.');
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      await remove('appointments', id);
    } catch (err: any) {
      alert(err.message || 'Failed to delete appointment.');
    }
  };

  const handleSaveFormula = async (newFormula: HairFormula) => {
    try {
      const id = newFormula.id || newId('formula');
      await save('formulas', id, { ...newFormula, id });
    } catch (err: any) {
      alert(err.message || 'Failed to save formula.');
    }
  };

  const handleUpdateStylist = async (updatedStylist: Stylist) => {
    try {
      await save('stylists', updatedStylist.id, { ...updatedStylist });
      await addNotification({
        title: 'Stylist Profile Updated',
        message: `${updatedStylist.name}'s profile was saved.`,
        type: 'general',
        targetRole: 'stylist',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to save stylist profile.');
    }
  };

  const handleRestockItem = async (id: string, amount: number) => {
    const item = inventory.find((i) => i.id === id);
    if (!item) return;
    const next = {
      ...item,
      stockCount: item.stockCount + amount,
      status:
        item.stockCount + amount <= 0
          ? ('out_of_stock' as const)
          : item.stockCount + amount <= item.reorderLevel
            ? ('low_stock' as const)
            : ('in_stock' as const),
    };
    try {
      await save('inventory', id, { ...next });
      await addNotification({
        title: 'Inventory Restocked',
        message: `Added ${amount} units of ${item.name}.`,
        type: 'inventory_alert',
        targetRole: 'owner',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to restock item.');
    }
  };

  const handleUpdateInventoryItem = async (updatedItem: InventoryItem) => {
    try {
      await save('inventory', updatedItem.id, { ...updatedItem });
      await addNotification({
        title: 'Inventory Item Updated',
        message: `Updated details for ${updatedItem.name}.`,
        type: 'inventory_alert',
        targetRole: 'owner',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to update inventory item.');
    }
  };

  const handleAddInventoryItem = async (newItem: InventoryItem) => {
    try {
      const id = newItem.id || newId('inv');
      await save('inventory', id, { ...newItem, id });
      await addNotification({
        title: 'New Product Added',
        message: `Added ${newItem.name} to inventory.`,
        type: 'inventory_alert',
        targetRole: 'owner',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to add inventory item.');
    }
  };

  const handleDeleteInventoryItem = async (id: string) => {
    const item = inventory.find((i) => i.id === id);
    try {
      await remove('inventory', id);
      if (item) {
        await addNotification({
          title: 'Product Removed',
          message: `Removed ${item.name} from inventory.`,
          type: 'inventory_alert',
          targetRole: 'owner',
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete inventory item.');
    }
  };

  const handleAddGalleryItem = async (newItem: Omit<GalleryItem, 'id' | 'likes'>) => {
    try {
      const id = newId('g');
      const createdItem: GalleryItem = { ...newItem, id, likes: 0 };
      await save('gallery', id, { ...createdItem });
      await addNotification({
        title: 'Portfolio Photo Added',
        message: `"${createdItem.title}" added to portfolio.`,
        type: 'general',
        targetRole: 'owner',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to add gallery item.');
    }
  };

  const handleUpdateGalleryItem = async (updatedItem: GalleryItem) => {
    try {
      await save('gallery', updatedItem.id, { ...updatedItem });
      await addNotification({
        title: 'Portfolio Item Updated',
        message: `Updated details for "${updatedItem.title}".`,
        type: 'general',
        targetRole: 'owner',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to update gallery item.');
    }
  };

  const handleDeleteGalleryItem = async (id: string) => {
    const item = gallery.find((g) => g.id === id);
    try {
      await remove('gallery', id);
      if (item) {
        await addNotification({
          title: 'Portfolio Photo Removed',
          message: `Removed "${item.title}" from portfolio.`,
          type: 'general',
          targetRole: 'owner',
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete gallery item.');
    }
  };

  const handleSaveService = async (service: Service) => {
    try {
      await save('services', service.id, { ...service });
      await addNotification({
        title: 'Service Saved',
        message: `"${service.name}" was saved to the service catalog.`,
        type: 'general',
        targetRole: 'owner',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to save service.');
      throw err;
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      await remove('services', id);
    } catch (err: any) {
      alert(err.message || 'Failed to delete service.');
      throw err;
    }
  };

  const handleSaveLoyaltyReward = async (reward: LoyaltyReward) => {
    try {
      await save('loyaltyRewards', reward.id, { ...reward });
    } catch (err: any) {
      alert(err.message || 'Failed to save loyalty reward.');
      throw err;
    }
  };

  const handleBuyGiftCard = async (amount: number, recipient: string) => {
    const uid = currentUserProfile.uid || currentUserProfile.id;
    const newGc: GiftCard = {
      id: newId('gc'),
      code: `TL-${Math.floor(1000 + Math.random() * 9000)}`,
      initialBalance: amount,
      currentBalance: amount,
      recipientName: recipient,
      recipientEmail: '',
      senderName: currentUserProfile.name,
      purchaseDate: new Date().toISOString().split('T')[0],
      createdByUid: uid,
    };
    try {
      await save('giftCards', newGc.id, { ...newGc });
    } catch (err: any) {
      alert(err.message || 'Failed to save gift card.');
    }
  };

  const handleRedeemReward = async (reward: LoyaltyReward) => {
    if (!userProfile) return;
    const pts = (userProfile.loyaltyPoints || 0) - reward.pointsRequired;
    if (pts < 0) {
      alert('Not enough loyalty points.');
      return;
    }
    try {
      await updateOwnProfile({ loyaltyPoints: pts });
      alert(`Redeemed ${reward.title}!`);
    } catch (err: any) {
      alert(err.message || 'Failed to redeem reward.');
    }
  };

  const unreadCount = notifications.filter(
    (n) => (n.targetRole === effectiveRole || n.targetRole === 'all') && !n.read
  ).length;

  const upcomingAppointment = appointments.find(
    (a) => a.status === 'upcoming' || a.status === 'in_progress'
  );

  const myStylistCard: Stylist =
    stylists.find((s) => s.id === userProfile?.uid || s.id === userProfile?.id) ||
    stylists[0] || {
      id: userProfile?.uid || 'stylist',
      name: userProfile?.name || 'Stylist',
      roleTitle: 'Stylist',
      bio: '',
      avatar:
        userProfile?.avatar ||
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      rating: 0,
      totalReviews: 0,
      specialties: [],
      commissionRate: 0.5,
    };

  const lowStockCount = inventory.filter((i) => i.stockCount <= i.reorderLevel).length;

  if (loading) return <RoleLoadingView />;
  if (!firebaseUser || !userProfile) return <WelcomeAuthView />;
  if (userProfile.status === 'pending') return <AccountPendingView status="pending" />;
  if (userProfile.status === 'disabled') return <AccountPendingView status="disabled" />;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2D2D2D] font-sans flex flex-col selection:bg-[#B68A4C] selection:text-[#FAF8F5]">
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      <NotificationCenter
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        currentRole={effectiveRole}
        onMarkAllAsRead={handleMarkAllRead}
        onClearAll={handleClearAllNotifications}
        onToggleRead={handleToggleNotifRead}
        onSendTestNotification={handleSendTestNotification}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUserProfile}
        onUpdateProfile={handleUpdateCustomerProfile}
      />

      {effectiveRole === 'owner' && (
        <StaffApprovalManager
          isOpen={isStaffApprovalOpen}
          onClose={() => setIsStaffApprovalOpen(false)}
        />
      )}

      {effectiveRole === 'owner' && showServicesManager && (
        <ServiceCatalogManager
          services={services}
          rewards={loyaltyRewards}
          onSaveService={handleSaveService}
          onDeleteService={handleDeleteService}
          onSaveReward={handleSaveLoyaltyReward}
          onClose={() => setShowServicesManager(false)}
          newId={newId}
        />
      )}

      <Header
        currentRole={effectiveRole}
        actualRole={actualUserRole}
        onRoleChange={handleRoleChange}
        currentUser={currentUserProfile}
        onHomeClick={handleReturn}
        unreadCount={unreadCount}
        onOpenNotifications={() => setIsNotifOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenStaffApproval={actualUserRole === 'owner' ? () => setIsStaffApprovalOpen(true) : undefined}
        onSignOut={signOutUser}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 pt-3 sm:pt-6 pb-24">
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

        {effectiveRole === 'customer' && (
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
                customer={currentUserProfile}
                onBookingComplete={handleBookingComplete}
                onCancel={() => setCurrentView('home')}
              />
            )}

            {currentView === 'appointments' && (
              <MyAppointments
                appointments={appointments.filter(
                  (a) =>
                    a.customerId === currentUserProfile.uid ||
                    a.customerId === currentUserProfile.id
                )}
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
                currentRole={effectiveRole}
                onAddGalleryItem={handleAddGalleryItem}
                stylists={stylists}
              />
            )}

            {currentView === 'loyalty' && (
              <LoyaltyGiftCards
                loyaltyPoints={currentUserProfile.loyaltyPoints || 0}
                rewards={loyaltyRewards}
                giftCards={giftCards}
                onRedeemReward={handleRedeemReward}
                onBuyGiftCard={handleBuyGiftCard}
              />
            )}
          </>
        )}

        {effectiveRole === 'stylist' && (
          <>
            {currentView === 'stylist_schedule' && (
              <StylistSchedule
                stylist={myStylistCard}
                appointments={appointments}
                formulas={formulas}
                onOpenFormula={() => setCurrentView('formulas')}
                onUpdateStatus={handleUpdateStatus}
                onUpdateStylist={handleUpdateStylist}
              />
            )}

            {currentView === 'formulas' && (
              <HairFormulaManager formulas={formulas} onSaveFormula={handleSaveFormula} />
            )}
          </>
        )}

        {effectiveRole === 'owner' && (
          <>
            {currentView === 'owner_dashboard' && (
              <OwnerDashboard
                metrics={metrics}
                lowStockCount={lowStockCount}
                onOpenAIMarketing={() => setCurrentView('marketing')}
                onOpenInventory={() => setCurrentView('inventory')}
                onOpenOwnerAI={() => setCurrentView('owner_ai')}
                onOpenPortfolio={() => setCurrentView('portfolio')}
                onOpenServices={() => setShowServicesManager(true)}
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
                onDeleteAppointment={handleDeleteAppointment}
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

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-t border-[#B68A4C]/20 py-2 px-4">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {effectiveRole === 'customer' && (
            <>
              <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${currentView === 'home' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60 hover:text-[#2D2D2D]'}`}>
                <Home className="w-5 h-5" /><span>Home</span>
              </button>
              <button onClick={() => setCurrentView('appointments')} className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${currentView === 'appointments' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60 hover:text-[#2D2D2D]'}`}>
                <Calendar className="w-5 h-5" /><span>Appointments</span>
              </button>
              <button onClick={() => setCurrentView('assistant')} className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${currentView === 'assistant' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60 hover:text-[#2D2D2D]'}`}>
                <div className="relative"><Sparkles className="w-5 h-5 text-[#B68A4C]" /><span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#8B5E34]" /></div>
                <span>Assistant</span>
              </button>
              <button onClick={() => setCurrentView('gallery')} className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${currentView === 'gallery' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60 hover:text-[#2D2D2D]'}`}>
                <ImageIcon className="w-5 h-5" /><span>Gallery</span>
              </button>
              <button onClick={() => setCurrentView('loyalty')} className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${currentView === 'loyalty' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60 hover:text-[#2D2D2D]'}`}>
                <Gift className="w-5 h-5" /><span>Perks</span>
              </button>
            </>
          )}

          {effectiveRole === 'stylist' && (
            <>
              <button onClick={() => setCurrentView('stylist_schedule')} className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${currentView === 'stylist_schedule' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60'}`}>
                <Scissors className="w-5 h-5" /><span>Schedule</span>
              </button>
              <button onClick={() => setCurrentView('formulas')} className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${currentView === 'formulas' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60'}`}>
                <FileText className="w-5 h-5" /><span>Formulas</span>
              </button>
            </>
          )}

          {effectiveRole === 'owner' && (
            <>
              <button onClick={() => setCurrentView('owner_dashboard')} className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${currentView === 'owner_dashboard' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60'}`}>
                <BarChart3 className="w-5 h-5" /><span>Dashboard</span>
              </button>
              <button onClick={() => setCurrentView('portfolio')} className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${currentView === 'portfolio' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60'}`}>
                <ImageIcon className="w-5 h-5" /><span>Portfolio</span>
              </button>
              <button onClick={() => setCurrentView('owner_calendar')} className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${currentView === 'owner_calendar' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60'}`}>
                <Calendar className="w-5 h-5" /><span>Calendar</span>
              </button>
              <button onClick={() => setCurrentView('inventory')} className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${currentView === 'inventory' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60'}`}>
                <Package className="w-5 h-5" /><span>Inventory</span>
              </button>
              <button onClick={() => setCurrentView('marketing')} className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${currentView === 'marketing' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60'}`}>
                <Sparkles className="w-5 h-5 text-[#B68A4C]" /><span>Marketing</span>
              </button>
              <button onClick={() => setCurrentView('owner_ai')} className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${currentView === 'owner_ai' ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/60'}`}>
                <Crown className="w-5 h-5" /><span>AI Advisor</span>
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
