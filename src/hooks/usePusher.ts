import { useEffect, useRef, useCallback } from "react";
import { pusherClient, PusherEvent } from "@/lib/pusher";
import useGameStore from "@/stores/gameStore";

export const usePusher = (
  channelName: string,
  eventType: PusherEvent["type"],
  callback: (data: Record<string, unknown>) => void
) => {
  const channelRef = useRef<ReturnType<typeof pusherClient.subscribe> | null>(null);
  const session = useGameStore((state) => state.session);
  const setSession = useGameStore((state) => state.setSession);

  // Create a stable callback that includes the session update logic
  const stableCallback = useCallback(
    (data: Record<string, unknown>) => {
      // Call the provided callback for notifications
      callback(data);

      // Update session state based on event type
      if (eventType === "playerJoined" || eventType === "playerLeft") {
        // Fetch updated session data
        fetch(`/api/sessions/${session?.code}`)
          .then((res) => res.json())
          .then((updatedSession) => {
            setSession(updatedSession);
          })
          .catch((error) => {
            console.error("Error fetching updated session:", error);
          });
      }
    },
    [callback, eventType, session?.code, setSession]
  );

  useEffect(() => {
    if (!session) return;

    // Subscribe to the channel
    const channel = pusherClient.subscribe(channelName);
    channelRef.current = channel;

    // Bind to the event
    channel.bind(eventType, stableCallback);

    // Cleanup function
    return () => {
      if (channelRef.current) {
        channelRef.current.unbind(eventType, stableCallback);
        pusherClient.unsubscribe(channelName);
        channelRef.current = null;
      }
    };
  }, [channelName, eventType, stableCallback, session]);
};
