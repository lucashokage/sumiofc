import lodash from "lodash";
import { DisconnectReason } from "@whiskeysockets/baileys";

const { chain } = lodash;

export function getEnhancedConnectionOptions(originalOptions) {
  return {
    ...originalOptions,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
    retryRequestDelayMs: 3000,
    patchMessageBeforeSending: (message) => {
      const requiresPatch = !!(message.buttonsMessage || message.templateMessage || message.listMessage);
      if (requiresPatch) {
        return {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadataVersion: 2,
                deviceListMetadata: {},
              },
              ...message,
            },
          },
        };
      }
      return message;
    },
    version: [2, 3000, 1015901307],
  };
}

export function createConnectionHandler(conn, reloadHandler) {
  if (typeof reloadHandler !== 'function') {
    throw new TypeError('reloadHandler debe ser una función válida');
  }

  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;
  const BASE_RECONNECT_DELAY = 10000;

  return async function handleConnectionUpdate(update) {
    const { connection, lastDisconnect, isNewLogin } = update || {};
    
    if (isNewLogin && conn) {
      conn.isInit = true;
    }

    const disconnectCode = lastDisconnect?.error?.output?.statusCode || 
                         lastDisconnect?.error?.output?.payload?.statusCode;

    if (lastDisconnect?.error) {
      const shouldReconnect = [
        "setupHealthCheck",
        "Connection Closed",
        "Timed Out"
      ].some(msg => lastDisconnect.error.message?.includes(msg));

      if (shouldReconnect) {
        reconnectAttempts++;
        
        if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
          const delay = BASE_RECONNECT_DELAY + (reconnectAttempts * 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          await reloadHandler(true);
          if (conn?.timestamp) conn.timestamp.connect = new Date();
          return;
        }

        await cleanSession();
        process.exit(1);
      }
    }

    if (connection === "open") {
      reconnectAttempts = 0;
      if (conn) startHeartbeat(conn);
    }

    if (disconnectCode && disconnectCode !== DisconnectReason.loggedOut && !conn?.ws?.socket) {
      await reloadHandler(true);
      if (conn?.timestamp) conn.timestamp.connect = new Date();
    }

    if (global.db?.data == null) global.loadDatabase?.();
  };
}

export function startHeartbeat(conn) {
  if (global.heartbeatInterval) {
    clearInterval(global.heartbeatInterval);
  }

  global.heartbeatInterval = setInterval(() => {
    try {
      if (!conn?.user || conn.ws.socket?.readyState !== 1) {
        clearInterval(global.heartbeatInterval);
        return;
      }
      
      conn.sendPresenceUpdate("available");
      conn.ws.send(JSON.stringify(["admin", "test"]));
    } catch (error) {
      clearInterval(global.heartbeatInterval);
    }
  }, 25000);
}

export async function cleanSession() {
  try {
    if (!global.authFile) return;

    const fs = await import("fs");
    const path = await import("path");

    if (!fs.existsSync(global.authFile)) return;

    const SESSION_FILES = ["app-state-sync-key", "app-state-sync-version"];
    
    fs.readdirSync(global.authFile)
      .filter(file => SESSION_FILES.some(pattern => file.includes(pattern)))
      .forEach(file => {
        fs.unlinkSync(path.join(global.authFile, file));
      });
  } catch (error) {
    console.error("Cleanup error:", error);
  }
}
