import Pusher from "pusher";
import PusherClient from "pusher-js";

// Server-side Pusher instance
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
  secret: process.env.PUSHER_APP_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// Client-side Pusher instance
export const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
});

// Types for Pusher events
export type PusherEvent = {
  type: "playerLeft" | "hostChanged" | "playerJoined" | "gameStarted" | "roundUpdate" | "scoreUpdate";
  data: Record<string, unknown>;
};

// Helper function to broadcast updates
export const broadcastUpdate = (channel: string, event: PusherEvent) => {
  pusherServer.trigger(channel, event.type, event.data);
};
