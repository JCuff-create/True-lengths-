import { useEffect, useState, useCallback } from 'react';
import {
  Appointment,
  AppNotification,
  GalleryItem,
  GiftCard,
  HairFormula,
  InventoryItem,
  LoyaltyReward,
  Service,
  Stylist,
  UserRole,
  UserStatus,
} from '../types';
import {
  SALON_COLLECTIONS,
  EMPTY_SALON_DATA,
  subscribeSalonCollection,
  upsertSalonDoc,
  deleteSalonDoc,
  clearLegacyLocalDemoData,
  newId,
  appointmentConstraintsForRole,
  giftCardConstraintsForRole,
  notificationConstraintsForRole,
} from '../lib/salonStore';

export type SalonActor = {
  uid: string;
  role: UserRole;
  status?: UserStatus;
};

/**
 * Live Firestore subscriptions scoped to the authenticated role.
 * Customers never subscribe to inventory/formulas; queries match security rules.
 */
export function useSalonStore(actor: SalonActor | null) {
  const [services, setServices] = useState<Service[]>(EMPTY_SALON_DATA.services);
  const [stylists, setStylists] = useState<Stylist[]>(EMPTY_SALON_DATA.stylists);
  const [appointments, setAppointments] = useState<Appointment[]>(EMPTY_SALON_DATA.appointments);
  const [gallery, setGallery] = useState<GalleryItem[]>(EMPTY_SALON_DATA.gallery);
  const [inventory, setInventory] = useState<InventoryItem[]>(EMPTY_SALON_DATA.inventory);
  const [formulas, setFormulas] = useState<HairFormula[]>(EMPTY_SALON_DATA.formulas);
  const [loyaltyRewards, setLoyaltyRewards] = useState<LoyaltyReward[]>(
    EMPTY_SALON_DATA.loyaltyRewards
  );
  const [giftCards, setGiftCards] = useState<GiftCard[]>(EMPTY_SALON_DATA.giftCards);
  const [notifications, setNotifications] = useState<AppNotification[]>(
    EMPTY_SALON_DATA.notifications
  );
  const [dataLoading, setDataLoading] = useState(true);
  const [writeError, setWriteError] = useState<string | null>(null);

  useEffect(() => {
    clearLegacyLocalDemoData();
  }, []);

  useEffect(() => {
    if (!actor?.uid || !actor.role) {
      setServices([]);
      setStylists([]);
      setAppointments([]);
      setGallery([]);
      setInventory([]);
      setFormulas([]);
      setLoyaltyRewards([]);
      setGiftCards([]);
      setNotifications([]);
      setDataLoading(false);
      return;
    }

    const isStaff =
      (actor.role === 'owner' && actor.status === 'active') ||
      (actor.role === 'stylist' && actor.status === 'active');
    const canLoadOps = actor.status === 'active' || actor.role === 'customer';
    setDataLoading(true);
    if (!canLoadOps) {
      setDataLoading(false);
      return;
    }
    let pending = isStaff ? 9 : 7;
    const done = () => {
      pending -= 1;
      if (pending <= 0) setDataLoading(false);
    };

    const unsubs = [
      subscribeSalonCollection<Service>(SALON_COLLECTIONS.services, (items) => {
        setServices(items);
        done();
      }),
      subscribeSalonCollection<Stylist>(SALON_COLLECTIONS.stylists, (items) => {
        setStylists(items);
        done();
      }),
      subscribeSalonCollection<Appointment>(
        SALON_COLLECTIONS.appointments,
        (items) => {
          setAppointments(items);
          done();
        },
        undefined,
        appointmentConstraintsForRole(actor.role, actor.uid)
      ),
      subscribeSalonCollection<GalleryItem>(SALON_COLLECTIONS.gallery, (items) => {
        setGallery(items);
        done();
      }),
      subscribeSalonCollection<LoyaltyReward>(SALON_COLLECTIONS.loyaltyRewards, (items) => {
        setLoyaltyRewards(items);
        done();
      }),
      subscribeSalonCollection<GiftCard>(
        SALON_COLLECTIONS.giftCards,
        (items) => {
          setGiftCards(items);
          done();
        },
        undefined,
        giftCardConstraintsForRole(actor.role, actor.uid)
      ),
      subscribeSalonCollection<AppNotification>(
        SALON_COLLECTIONS.notifications,
        (items) => {
          setNotifications(
            items.sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
          );
          done();
        },
        undefined,
        notificationConstraintsForRole(actor.role)
      ),
    ];

    if (isStaff) {
      unsubs.push(
        subscribeSalonCollection<InventoryItem>(SALON_COLLECTIONS.inventory, (items) => {
          setInventory(items);
          done();
        }),
        subscribeSalonCollection<HairFormula>(SALON_COLLECTIONS.formulas, (items) => {
          setFormulas(items);
          done();
        })
      );
    } else {
      setInventory([]);
      setFormulas([]);
    }

    const t = window.setTimeout(() => setDataLoading(false), 4000);

    return () => {
      window.clearTimeout(t);
      unsubs.forEach((u) => u());
    };
  }, [actor?.uid, actor?.role, actor?.status]);

  const save = useCallback(
    async (collectionName: keyof typeof SALON_COLLECTIONS, id: string, data: Record<string, unknown>) => {
      setWriteError(null);
      try {
        await upsertSalonDoc(SALON_COLLECTIONS[collectionName], id, data);
      } catch (err: any) {
        const msg = err?.message || 'Failed to save to Firestore.';
        setWriteError(msg);
        throw new Error(msg);
      }
    },
    []
  );

  const remove = useCallback(async (collectionName: keyof typeof SALON_COLLECTIONS, id: string) => {
    setWriteError(null);
    try {
      await deleteSalonDoc(SALON_COLLECTIONS[collectionName], id);
    } catch (err: any) {
      const msg = err?.message || 'Failed to delete from Firestore.';
      setWriteError(msg);
      throw new Error(msg);
    }
  }, []);

  return {
    services,
    stylists,
    appointments,
    gallery,
    inventory,
    formulas,
    loyaltyRewards,
    giftCards,
    notifications,
    dataLoading,
    writeError,
    setWriteError,
    save,
    remove,
    newId,
  };
}
