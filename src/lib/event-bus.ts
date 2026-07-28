// Real-time Event Bus for Server-Sent Events (SSE) and WebRTC Signaling
// Supports multi-tab / multi-client instant synchronization

type EventCallback = (event: ServerEvent) => void;

export interface ServerEvent {
  type:
    | "peer-joined"
    | "peer-left"
    | "peer-state-changed"
    | "webrtc-offer"
    | "webrtc-answer"
    | "webrtc-ice-candidate"
    | "new-message"
    | "message-deleted"
    | "new-announcement"
    | "announcement-updated"
    | "announcement-deleted"
    | "room-updated";
  roomId?: string;
  fromPeerId?: string;
  toPeerId?: string;
  payload: any;
  timestamp: number;
}

class EventBus {
  private listeners: Set<{
    id: string;
    roomId?: string;
    peerId?: string;
    callback: EventCallback;
  }> = new Set();

  public subscribe(
    id: string,
    callback: EventCallback,
    options?: { roomId?: string; peerId?: string }
  ) {
    const listener = {
      id,
      roomId: options?.roomId,
      peerId: options?.peerId,
      callback,
    };
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  public publish(event: ServerEvent) {
    this.listeners.forEach((listener) => {
      // If event is targeted to a specific peer (like WebRTC offer/answer/ICE)
      if (event.toPeerId && listener.peerId && event.toPeerId !== listener.peerId) {
        return;
      }
      // If event is scoped to a room
      if (
        event.roomId &&
        listener.roomId &&
        event.roomId !== listener.roomId &&
        event.type !== "new-announcement" &&
        event.type !== "announcement-updated" &&
        event.type !== "announcement-deleted"
      ) {
        return;
      }
      try {
        listener.callback(event);
      } catch (err) {
        console.error("Error dispatching event to listener:", err);
      }
    });
  }

  public getListenerCount(roomId?: string): number {
    if (!roomId) return this.listeners.size;
    let count = 0;
    this.listeners.forEach((l) => {
      if (l.roomId === roomId) count++;
    });
    return count;
  }
}

// Global singleton across server invocations
const globalForEventBus = globalThis as typeof globalThis & {
  __connectHubEventBus?: EventBus;
};

export const eventBus =
  globalForEventBus.__connectHubEventBus ?? new EventBus();

if (process.env.NODE_ENV !== "production") {
  globalForEventBus.__connectHubEventBus = eventBus;
}
