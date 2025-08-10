"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { User } from "@phosphor-icons/react";
import LoadingSpinner from "../effects/LoadingSpinner";

export function UserProfileButton() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  return (
    <Link href="/profile" className="block">
      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 hover:border-white/40 transition-colors cursor-pointer">
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
    </Link>
  );
}
