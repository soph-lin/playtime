"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { User } from "@phosphor-icons/react";
import LoadingSpinner from "../effects/LoadingSpinner";
import ProfileModal from "./ProfileModal";

export function UserProfileButton() {
  const { user, isLoaded } = useUser();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <div
        className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 hover:border-white/40 transition-colors cursor-pointer"
        onClick={() => setIsProfileModalOpen(true)}
      >
        {user.imageUrl ? (
          <img
            src={user.imageUrl}
            alt={`${user.firstName || user.username || "User"} profile`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-white/10 flex items-center justify-center">
            <User className="w-6 h-6 text-white" weight="fill" />
          </div>
        )}
      </div>

      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </>
  );
}
