import { useState, useEffect } from 'react';
import type { FontProfile } from '../types/profile.types';

const STORAGE_KEY = 'akshar_custom_profiles';

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<FontProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeProfiles = async () => {
      try {
        // 1. Fetch built-in default profiles
        const profileFetches = await Promise.all([
          fetch('/profiles/terafont-kinnari.json'),
          fetch('/profiles/krutidev-010.json'),
          fetch('/profiles/terafont-varun.json'),
          fetch('/profiles/lmg-arun.json'),
          fetch('/profiles/shree-guj.json'),
          fetch('/profiles/shivaji.json'),
          fetch('/profiles/preeti.json'),
          fetch('/profiles/sutonnymj.json'),
          fetch('/profiles/chanakya.json'),
          fetch('/profiles/dv-ttsurekh.json'),
          fetch('/profiles/shreelipi.json'),
          fetch('/profiles/kundali.json'),
          fetch('/profiles/akruti.json'),
          fetch('/profiles/dv-ttyogesh.json'),
          fetch('/profiles/shusha.json'),
          fetch('/profiles/agra.json'),
          fetch('/profiles/suchi-dev.json'),
          fetch('/profiles/xdvng.json'),
          fetch('/profiles/bhaskar.json'),
          fetch('/profiles/saumil.json'),
        ]);

        const builtInProfiles: FontProfile[] = await Promise.all(
          profileFetches.map((res) => res.json())
        );

        // 2. Load custom user profiles from LocalStorage
        const storedCustom = localStorage.getItem(STORAGE_KEY);
        const customProfiles: FontProfile[] = storedCustom ? JSON.parse(storedCustom) : [];

        // 3. Merge them
        const allProfiles = [...builtInProfiles, ...customProfiles];
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
