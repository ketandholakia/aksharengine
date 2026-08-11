import { useState, useEffect } from 'react';
import type { FontProfile } from '../types/profile.types';

const STORAGE_KEY = 'akshar_custom_profiles';
const PROFILE_INDEX_URL = '/profiles/index.json';

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<FontProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeProfiles = async () => {
      try {
        // 1. Fetch built-in default profiles from the generated index.
        const indexResponse = await fetch(PROFILE_INDEX_URL);
        if (!indexResponse.ok) {
          throw new Error(`Failed to load profile index from ${PROFILE_INDEX_URL}`);
        }

        const profilePaths: string[] = await indexResponse.json();
        const profileFetches = await Promise.all(profilePaths.map((profilePath) => fetch(profilePath)));

        const builtInProfiles: FontProfile[] = await Promise.all(
          profileFetches.map((res, idx) => {
            if (!res.ok) {
              throw new Error(`Failed to load profile: ${profilePaths[idx]}`);
            }
            return res.json();
          })
        );

        // 2. Load custom user profiles from LocalStorage
        const storedCustom = localStorage.getItem(STORAGE_KEY);
        const customProfiles: FontProfile[] = storedCustom ? JSON.parse(storedCustom) : [];

        // 3. Merge them, de-duplicating by id.
        // Custom profiles (which include OTA-synced updates to built-ins,
        // see useProfileSync) must win over the bundled JSON with the same id,
        // otherwise the same profile shows up twice in the list.
        const customIds = new Set(customProfiles.map((p) => p.id));
        const dedupedBuiltIns = builtInProfiles.filter((p) => !customIds.has(p.id));
        const allProfiles = [...dedupedBuiltIns, ...customProfiles];
        setProfiles(allProfiles);

        if (allProfiles.length > 0) {
          setSelectedProfileId(allProfiles[0].id);
        }
      } catch (err) {
        console.error('Failed to initialize profiles', err);
      } finally {
        setLoading(false);
      }
    };

    initializeProfiles();
  }, []);

  const saveToLocalStorage = (allProfiles: FontProfile[]) => {
    const customOnly = allProfiles.filter((p) => !p.isBuiltIn);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customOnly));
  };

  const handleImportProfile = (newProfile: FontProfile) => {
    // If a profile with the same ID exists, replace it. Otherwise, add it.
    const updatedProfiles = profiles.filter((p) => p.id !== newProfile.id).concat(newProfile);
    setProfiles(updatedProfiles);
    saveToLocalStorage(updatedProfiles);
    setSelectedProfileId(newProfile.id);
  };

  const handleDeleteProfile = (profileId: string) => {
    const updatedProfiles = profiles.filter((p) => p.id !== profileId);
    setProfiles(updatedProfiles);
    saveToLocalStorage(updatedProfiles);

    if (selectedProfileId === profileId) {
      setSelectedProfileId(updatedProfiles[0]?.id || '');
    }
  };

  const handleSaveProfile = (updatedProfile: FontProfile) => {
    // Make sure it's marked as a custom profile so it saves to LocalStorage
    const profileToSave = { ...updatedProfile, isBuiltIn: false };
    const updatedProfiles = profiles.map((p) =>
      p.id === profileToSave.id ? profileToSave : p
    );

    // If it was a built-in profile being edited, this effectively "forks" it if the ID changed,
    // or overwrites it locally if the ID remained the same.
    setProfiles(updatedProfiles);
    saveToLocalStorage(updatedProfiles);
  };

  const handleBulkUpdateProfiles = (updatedProfiles: FontProfile[]) => {
    setProfiles(updatedProfiles);
    saveToLocalStorage(updatedProfiles);
  };

  return {
    profiles,
    selectedProfileId,
    setSelectedProfileId,
    loading,
    handleImportProfile,
    handleDeleteProfile,
    handleSaveProfile,
    handleBulkUpdateProfiles,
  };
};
