import { useState, useCallback, useRef, useEffect } from 'react';
import type { FontProfile } from '../types/profile.types';

const REGISTRY_URL = 'https://your-domain.com/api/registry.json'; // Replace with your actual URL
const STORAGE_KEY = 'akshar_custom_profiles';

interface RemoteRegistry {
  lastUpdated: string;
  profiles: Array<{
    id: string;
    version: string;
    downloadUrl: string;
  }>;
}

export const useProfileSync = (
  localProfiles: FontProfile[], 
  setLocalProfiles: (profiles: FontProfile[]) => void
) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ updatedCount: number; message: string } | null>(null);

  // Keep a ref to the latest profiles to avoid stale closure in async callback
  const profilesRef = useRef(localProfiles);
  useEffect(() => {
    profilesRef.current = localProfiles;
  }, [localProfiles]);

  const isNewerVersion = (remoteVersion: string, localVersion: string) => {
    // Simple semantic versioning comparison (e.g., 1.0.1 > 1.0.0)
    const remoteParts = remoteVersion.split('.').map(Number);
    const localParts = localVersion.split('.').map(Number);
    
    for (let i = 0; i < Math.max(remoteParts.length, localParts.length); i++) {
      const r = remoteParts[i] || 0;
      const l = localParts[i] || 0;
      if (r > l) return true;
      if (r < l) return false;
    }
    return false;
  };

  const syncProfiles = useCallback(async () => {
    // Guard against placeholder URL
    if (REGISTRY_URL.includes('your-domain.com')) {
      setLastSyncResult({
        updatedCount: 0,
        message: 'No registry URL configured. Set REGISTRY_URL to enable OTA updates.'
      });
      return;
    }

    setIsSyncing(true);
    setLastSyncResult(null);
    let updatedCount = 0;

    try {
      // 1. Fetch the manifest
      const response = await fetch(REGISTRY_URL);
      if (!response.ok) throw new Error('Failed to fetch profile registry');
      
      const registry: RemoteRegistry = await response.json();
      // Read from ref to always get the latest profiles
      let profilesUpdated = [...profilesRef.current];

      // 2. Compare versions and download updates
      for (const remoteProfile of registry.profiles) {
        const localMatch = profilesUpdated.find(p => p.id === remoteProfile.id);
        
        // If we don't have it, or the remote version is newer, download it
        if (!localMatch || isNewerVersion(remoteProfile.version, localMatch.version)) {
          const profileResponse = await fetch(remoteProfile.downloadUrl);
          if (profileResponse.ok) {
            const updatedProfileData: FontProfile = await profileResponse.json();
            
            // Mark it as custom so it persists in LocalStorage
            updatedProfileData.isBuiltIn = false;
            
            // Replace or add the profile in our local array
            profilesUpdated = profilesUpdated.filter(p => p.id !== remoteProfile.id).concat(updatedProfileData);
            updatedCount++;
          }
        }
      }

      // 3. Save to LocalStorage and update state if anything changed
      if (updatedCount > 0) {
        setLocalProfiles(profilesUpdated);
        const customOnly = profilesUpdated.filter(p => !p.isBuiltIn);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customOnly));
      }

      setLastSyncResult({
        updatedCount,
        message: updatedCount > 0 ? `Successfully updated ${updatedCount} profiles.` : 'All profiles are up to date.'
      });

    } catch (error: any) {
      setLastSyncResult({
        updatedCount: 0,
        message: `Sync failed: ${error.message}`
      });
    } finally {
      setIsSyncing(false);
    }
  }, [setLocalProfiles]);

  return { syncProfiles, isSyncing, lastSyncResult };
};
