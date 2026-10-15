type AccountRecord = {
  role?: unknown;
  status?: unknown;
  salonId?: unknown;
} | undefined;

function salonId(account: AccountRecord, fallback: string): string {
  return String(account?.salonId || fallback).trim();
}

export function canUploadAvatar(
  actorUid: string,
  targetUid: string,
  actor: AccountRecord,
  target: AccountRecord,
  fallbackSalonId = 'truelengths-main'
): boolean {
  if (!actorUid || !targetUid) return false;
  if (actorUid === targetUid) return true;

  return actor?.role === 'owner'
    && actor?.status === 'active'
    && target?.role === 'stylist'
    && salonId(actor, fallbackSalonId) === salonId(target, fallbackSalonId);
}
