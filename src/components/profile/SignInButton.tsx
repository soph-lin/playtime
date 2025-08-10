"use client";

import { useUser, SignInButton as ClerkSignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import LoadingSpinner from "../effects/LoadingSpinner";
import { UserProfileButton } from "./UserProfileButton";
import { SignInIcon } from "@phosphor-icons/react";

export function SignInButton() {
  const { user, isLoaded } = useUser();

  if (user) {
    return <UserProfileButton />;
  }

  const buttonContent = !isLoaded ? (
    <LoadingSpinner />
  ) : (
    <>
      <SignInIcon className="w-7 h-7" /> Sign In
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
