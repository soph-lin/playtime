"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export function useUserSync() {
  const { user, isLoaded } = useUser();
  const [syncAttempts, setSyncAttempts] = useState(0);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      // Sync user data with our database
      const syncUser = async () => {
        try {
          setLastSyncError(null);
          const response = await fetch("/api/profile/sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
          }

          const result = await response.json();
          if (result.success) {
            console.log("User data synced successfully");
            setSyncAttempts(0); // Reset attempts on success
          } else {
            throw new Error("Sync failed");
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          console.error("Error syncing user data:", errorMessage);
          setLastSyncError(errorMessage);

          // Retry logic - retry up to 3 times with exponential backoff
          if (syncAttempts < 3) {
            const delay = Math.pow(2, syncAttempts) * 1000; // 1s, 2s, 4s
            setTimeout(() => {
              setSyncAttempts((prev) => prev + 1);
            }, delay);
          }
        }
      };

      syncUser();
    }
  }, [user, isLoaded, syncAttempts]);

  return {
    user,
    isLoaded,
    syncAttempts,
    lastSyncError,
    isSyncing: syncAttempts > 0 && lastSyncError !== null,
  };
}
