import { deleteDoc, doc, updateDoc, type Firestore } from 'firebase/firestore';
import { db } from './firebase';
import type { AppNotification } from '../types';
import { deleteSalonDoc, upsertSalonDoc } from './salonStore';

export async function markNotification(notification: AppNotification, read: boolean, store: Firestore = db) {
  if (notification.recipientUid) {
    await updateDoc(doc(store, 'users', notification.recipientUid, 'notifications', notification.id), { read });
  } else {
    await upsertSalonDoc('notifications', notification.id, { ...notification, read });
  }
}

export async function clearNotification(notification: AppNotification, store: Firestore = db) {
  if (notification.recipientUid) {
    await deleteDoc(doc(store, 'users', notification.recipientUid, 'notifications', notification.id));
  } else {
    await deleteSalonDoc('notifications', notification.id);
  }
}
