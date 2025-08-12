import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GameSession, GameSessionPlayer, Playlist } from "@prisma/client";

interface GameState {
  // Session data
  session:
    | (GameSession & {
        players: GameSessionPlayer[];
        playlist: Playlist;
      })
    | null;

  // Actions
  createGame: (playlistId: string, hostNickname: string) => Promise<GameState["session"]>;
  joinGame: (code: string, nickname: string) => Promise<void>;
  leaveGame: (sessionId: string, playerId: string) => Promise<void>;
  startGame: () => Promise<void>;
}

const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state
      session: null,

      // Actions
      createGame: async (playlistId: string, hostNickname: string) => {
        try {
          const response = await fetch("/api/sessions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ playlistId, hostNickname }),
          });

          if (!response.ok) {
            throw new Error("Failed to create game");
          }

          const session = await response.json();
          set({ session });
          return session;
        } catch (error) {
          console.error("Error creating game:", error);
          throw error;
        }
      },

      joinGame: async (code: string, nickname: string) => {
        try {
          const response = await fetch("/api/sessions/join", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code, nickname }),
          });

          if (!response.ok) {
            throw new Error("Failed to join game");
          }

          const session = await response.json();
          set({ session });
        } catch (error) {
          console.error("Error joining game:", error);
          throw error;
        }
      },

      leaveGame: async (sessionId: string, playerId: string) => {
        try {
          const response = await fetch("/api/sessions/leave", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sessionId, playerId }),
          });

          if (!response.ok) {
            throw new Error("Failed to leave game");
          }

          const data = await response.json();

          // If the session was deleted (no players left)
          if (data.message === "Session deleted as no players remain") {
            set({ session: null });
            return;
          }

          // If we successfully left, clear the session
          set({ session: null });
        } catch (error) {
          console.error("Error leaving game:", error);
          throw error;
        }
      },

      startGame: async () => {
        const { session } = get();
        if (!session) return;

        try {
          const response = await fetch(`/api/sessions/${session.code}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "ACTIVE" }),
          });

          if (!response.ok) {
            throw new Error("Failed to start game");
          }

          const updatedSession = await response.json();
          set({ session: updatedSession });
        } catch (error) {
          console.error("Error starting game:", error);
          throw error;
        }
      },
    }),
    {
      name: "game-storage",
      partialize: (state) => ({ session: state.session }),
    }
  )
);

export default useGameStore;
