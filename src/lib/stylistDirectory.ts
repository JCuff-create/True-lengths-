import { Stylist } from '../types';

function stylistIdentity(stylist: Stylist): string {
  return stylist.name.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

/**
 * Keep active stylists bookable while suppressing obsolete pre-account records.
 * A legacy record is removed only when an explicitly active stylist with the
 * same normalized name exists. Two explicitly active same-name stylists remain.
 */
export function buildBookableStylistDirectory(stylists: Stylist[]): Stylist[] {
  const enabled = stylists.filter((stylist) => stylist.active !== false);
  const modernActiveNames = new Set(
    enabled
      .filter((stylist) => stylist.active === true)
      .map(stylistIdentity)
  );
  const retainedLegacyNames = new Set<string>();

  return enabled.filter((stylist) => {
    if (stylist.active === true) return true;

    const identity = stylistIdentity(stylist);
    if (modernActiveNames.has(identity) || retainedLegacyNames.has(identity)) return false;

    retainedLegacyNames.add(identity);
    return true;
  });
}
