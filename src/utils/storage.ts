import localforage from 'localforage';
import type { FontProfile, StoredProfileEntry } from '@/types/profile.types';

const PROFILE_STORE = 'akshar_profiles';

const profilesDb = localforage.createInstance({
  name: 'AksharEngine',
  storeName: PROFILE_STORE,
});

export async function getStoredProfiles(): Promise<FontProfile[]> {
  const entries: StoredProfileEntry[] = [];
  await profilesDb.iterate<StoredProfileEntry, void>((value) => {
    entries.push(value);
  });
  return entries.map((entry) => entry.profile);
}

export async function storeProfile(profile: FontProfile): Promise<void> {
  const entry: StoredProfileEntry = {
    profile,
    lastUsedAt: new Date().toISOString(),
  };
  await profilesDb.setItem(profile.id, entry);
}

export async function removeProfile(id: string): Promise<void> {
  await profilesDb.removeItem(id);
}

export async function clearProfiles(): Promise<void> {
  await profilesDb.clear();
}
