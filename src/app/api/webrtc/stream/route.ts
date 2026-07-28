import { eventBus } from "@/lib/event-bus";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId") || undefined;
  const peerId = searchParams.get("peerId") || undefined;
  const clientId = `sse-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (data: any) => {
        try {
          const payload = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(new TextEncoder().encode(payload));
        } catch (err) {
          // Stream closed
        }
      };

      // Send initial welcome/handshake event
      sendEvent({
        type: "sse-connected",
        clientId,
        roomId,
        peerId,
        timestamp: Date.now(),
      });

      // Subscribe to EventBus
      const unsubscribe = eventBus.subscribe(
        clientId,
        (event) => {
          sendEvent(event);
        },
        { roomId, peerId }
      );

      // Heartbeat interval to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          sendEvent({
            type: "sse-heartbeat",
            timestamp: Date.now(),
          });
        } catch (err) {
          clearInterval(heartbeatInterval);
        }
      }, 15000);

      // When the request is aborted or stream is cancelled
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
        unsubscribe();
        try {
          controller.close();
        } catch (e) {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable Nginx buffering if present
    },
  });
}
