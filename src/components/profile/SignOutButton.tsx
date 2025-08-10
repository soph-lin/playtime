import { Button } from "@/components/ui/Button";
import { SignOutButton as ClerkSignOutButton } from "@clerk/nextjs";
import { SignOutIcon } from "@phosphor-icons/react";

export function SignOutButton() {
  return (
    <ClerkSignOutButton>
      <Button
        variant="outline"
        className="text-xl border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-400"
      >
        <SignOutIcon size={24} />
        Sign Out
      </Button>
    </ClerkSignOutButton>
  );
}
