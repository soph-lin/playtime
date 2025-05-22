import Modal from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useState } from "react";
import useGameStore from "@/stores/gameStore";
import { toast } from "react-hot-toast";
import { GAME_CONFIG } from "@/constants/game";

interface JoinGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinGameModal({ isOpen, onClose }: JoinGameModalProps) {
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const joinGame = useGameStore((state) => state.joinGame);

  const handleJoin = async () => {
    // Validate code
    if (!code) {
      toast.error("Please enter a game code");
      return;
    }

    // Validate nickname
    if (nickname.length < GAME_CONFIG.MIN_NICKNAME_LENGTH) {
      toast.error(`Nickname must be at least ${GAME_CONFIG.MIN_NICKNAME_LENGTH} characters`);
      return;
    }

    if (nickname.length > GAME_CONFIG.MAX_NICKNAME_LENGTH) {
      toast.error(`Nickname must be at most ${GAME_CONFIG.MAX_NICKNAME_LENGTH} characters`);
      return;
    }

    if (!GAME_CONFIG.ALLOWED_NICKNAME_CHARS.test(nickname)) {
      toast.error("Nickname can only contain letters, numbers, spaces, hyphens, and underscores");
      return;
    }

    setIsSubmitting(true);
    try {
      await joinGame(code, nickname);
      onClose();
    } catch (error) {
      console.error("Failed to join game:", error);
      toast.error("Failed to join game. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="Join Game" isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Game Code</label>
          <Input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter game code"
            className="text-2xl font-mono"
            maxLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
          <Input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Enter your nickname"
            className="text-lg"
            maxLength={GAME_CONFIG.MAX_NICKNAME_LENGTH}
          />
          <p className="mt-1 text-sm text-gray-500">
            {GAME_CONFIG.MIN_NICKNAME_LENGTH}-{GAME_CONFIG.MAX_NICKNAME_LENGTH} characters, letters, numbers, spaces,
            hyphens, and underscores only
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleJoin} disabled={isSubmitting} className="bg-primary">
            Join Game
          </Button>
        </div>
      </div>
    </Modal>
  );
}
