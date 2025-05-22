import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { Button } from "../ui/Button";
import { MicrophoneStage, Headphones } from "@phosphor-icons/react";
import CreateGameModal from "./CreateGameModal";
import JoinGameModal from "./JoinGameModal";
interface StartGameModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function StartGameModal({ isOpen, setIsOpen }: StartGameModalProps) {
  const [isCreateGameModalOpen, setIsCreateGameModalOpen] = useState(false);
  const [isJoinGameModalOpen, setIsJoinGameModalOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsCreateGameModalOpen(false);
      setIsJoinGameModalOpen(false);
    }
  }, [isOpen]);

  const handleCloseMainModal = () => {
    setIsOpen(false);
    setIsCreateGameModalOpen(false);
    setIsJoinGameModalOpen(false);
  };

  const handleCloseCreateGameModal = () => {
    setIsCreateGameModalOpen(false);
  };

  const handleCloseJoinGameModal = () => {
    setIsJoinGameModalOpen(false);
  };

  const handleCreateGame = () => {
    setIsCreateGameModalOpen(true);
  };

  const handleJoinGame = () => {
    setIsJoinGameModalOpen(true);
  };

  return (
    <>
      <Modal
        title="Start Game"
        isOpen={isOpen && !isCreateGameModalOpen && !isJoinGameModalOpen}
        onClose={handleCloseMainModal}
      >
        <div className="flex flex-row gap-4">
          <Button
            onClick={handleCreateGame}
            variant="outline"
            className="text-2xl text-primary hover:text-primary float-animation"
            tabIndex={-1}
          >
            <span className="flex items-center gap-2">
              Create Game
              <MicrophoneStage size={24} />
            </span>
          </Button>
          <Button
            onClick={handleJoinGame}
            variant="outline"
            className="text-2xl text-primary hover:text-primary float-animation-delayed"
            tabIndex={-1}
          >
            <span className="flex items-center gap-2">
              Join Game
              <Headphones size={24} />
            </span>
          </Button>
        </div>
      </Modal>
      <CreateGameModal isOpen={isCreateGameModalOpen} onClose={handleCloseCreateGameModal} />
      <JoinGameModal isOpen={isJoinGameModalOpen} onClose={handleCloseJoinGameModal} />
    </>
  );
}
