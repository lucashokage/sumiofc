import { DisconnectReason } from "@whiskeysockets/baileys";

// 1. Función para opciones de conexión mejoradas
export function getEnhancedConnectionOptions(originalOptions) {
  return {
    ...originalOptions,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
    retryRequestDelayMs: 3000,
    patchMessageBeforeSending: (message) => {
      const requiresPatch = !!(message.buttonsMessage || message.templateMessage || message.listMessage);
      return requiresPatch ? {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadataVersion: 2,
              deviceListMetadata: {},
            },
            ...message,
          },
        },
      } : message;
    },
    version: [2, 3000, 1015901307],
  };
}

// 2. Manejador de conexión principal
export function createConnectionHandler(conn, reloadHandler = async () => {}) {
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;
  const BASE_RECONNECT_DELAY = 10000;

  return async function handleConnectionUpdate(update) {
    const { connection, lastDisconnect, isNewLogin } = update || {};
    
    if (isNewLogin) conn.isInit = true;

    const code = lastDisconnect?.error?.output?.statusCode || 
                lastDisconnect?.error?.output?.payload?.statusCode;

    // Manejo de errores de conexión
    if (lastDisconnect?.error?.message?.match(/setupHealthCheck|Connection Closed|Timed Out/)) {
      if (++reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
        const delay = BASE_RECONNECT_DELAY + (reconnectAttempts * 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        await reloadHandler(true);
        conn.timestamp.connect = new Date();
        return;
      }
      await cleanSession();
      process.exit(1);
    }

    if (connection === "open") {
      reconnectAttempts = 0;
      startHeartbeat(conn);
    }

    if (code && code !== DisconnectReason.loggedOut && !conn?.ws?.socket) {
      await reloadHandler(true);
      conn.timestamp.connect = new Date();
    }

    global.db?.data == null && global.loadDatabase?.();
  };
}

// 3. Función de limpieza de sesión
export async function cleanSession() {
  try {
    if (!global.authFile) return;

    const fs = await import("fs");
    const path = await import("path");

    if (fs.existsSync(global.authFile)) {
      ["app-state-sync-key", "app-state-sync-version"].forEach(pattern => {
        fs.readdirSync(global.authFile)
          .filter(file => file.includes(pattern))
          .forEach(file => fs.unlinkSync(path.join(global.authFile, file)));
      });
    }
  } catch (error) {
    console.error("Error cleaning session:", error);
  }
}

export function startHeartbeat(conn) {
  global.heartbeatInterval && clearInterval(global.heartbeatInterval);
  
  global.heartbeatInterval = setInterval(() => {
    conn?.user && conn.ws.socket?.readyState === 1 && 
    conn.sendPresenceUpdate("available").catch(console.error);
  }, 25000);
}

export const handleSetupHealthCheckError = createConnectionHandler;
export const startPeriodicPing = startHeartbeat;
