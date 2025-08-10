"use client";

import { useUser, SignInButton as ClerkSignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon } from "@phosphor-icons/react";
import LoadingSpinner from "../effects/LoadingSpinner";
import { UserProfileButton } from "./UserProfileButton";

export function SignInButton() {
  const { user, isLoaded } = useUser();

  if (user) {
    return <UserProfileButton />;
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
