"use client";

import { useUser, SignInButton as ClerkSignInButton, SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react";
import LoadingSpinner from "../effects/LoadingSpinner";

export function SignInButton() {
  const { user, isLoaded } = useUser();

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <Link href="/profile">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            Profile
          </Button>
        </Link>
        <SignOutButton>
          <Button variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/20">
            Sign Out
          </Button>
        </SignOutButton>
      </div>
    );
  }

  const buttonContent = !isLoaded ? (
    <LoadingSpinner />
  ) : (
    <>
      Sign In <ArrowRightIcon className="w-7 h-7" />
    </>
  );

  return (
    <ClerkSignInButton mode="modal">
      <Button
        className="text-2xl px-2 bg-baby-blue border-cerulean flex items-center gap-2 min-w-[140px] justify-center"
        variant="outline"
      >
        {buttonContent}
      </Button>
    </ClerkSignInButton>
  );
}
