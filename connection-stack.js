import { DisconnectReason } from "@whiskeysockets/baileys"
import { chain } from "lodash" 

export function getEnhancedConnectionOptions(originalOptions) {
  return {
    ...originalOptions,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
    retryRequestDelayMs: 3000,
    patchMessageBeforeSending: (message) => {
      const requiresPatch = !!(message.buttonsMessage || message.templateMessage || message.listMessage)

      if (requiresPatch) {
        message = {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadataVersion: 2,
                deviceListMetadata: {},
              },
              ...message,
            },
          },
        }
      }

      return message
    },
    version: [2, 3000, 1015901307],
  }
}

export async function handleSetupHealthCheckError(conn, reloadHandler) {
  let reconnectAttempts = 0
  const maxReconnectAttempts = 5

  return async function enhancedConnectionUpdate(update) {
    const { connection, lastDisconnect, isNewLogin } = update

    if (isNewLogin) conn.isInit = true

    const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode

    if (
      lastDisconnect?.error?.message?.includes("setupHealthCheck") ||
      lastDisconnect?.error?.message?.includes("Connection Closed")
    ) {
      console.log("\n[CONEXIÓN] Error detectado en setupHealthCheck")

      reconnectAttempts++

      if (reconnectAttempts <= maxReconnectAttempts) {
        const waitTime = 10000 + reconnectAttempts * 5000
        console.log(
          `\n[RECONEXIÓN] Esperando ${waitTime / 1000} segundos antes de reconectar (intento ${reconnectAttempts}/${maxReconnectAttempts})...`,
        )

        await new Promise((resolve) => setTimeout(resolve, waitTime))

        console.log("\n[RECONEXIÓN] Intentando reconectar...")
        await reloadHandler(true).catch(console.error)
        conn.timestamp.connect = new Date()
      } else {
        console.log("\n[RECONEXIÓN] Máximo de intentos alcanzado. Limpiando sesión...")
        await cleanSession()
        process.exit(1)
      }
      return
    }

    if (connection === "open") {
      reconnectAttempts = 0
      console.log("\n[CONEXIÓN] Conexión establecida correctamente")

      startPeriodicPing(conn)
    }

    if (code && code !== DisconnectReason.loggedOut && conn?.ws.socket == null) {
      console.log(await reloadHandler(true).catch(console.error))
      conn.timestamp.connect = new Date()
    }

    if (global.db.data == null) loadDatabase()
  }
}

export async function cleanSession() {
  const authDir = global.authFile
  const fs = await import("fs")
  const path = await import("path")

  try {
    if (fs.existsSync(authDir)) {
      console.log("\n[SESIÓN] Limpiando archivos de sesión...")

      const problematicFiles = ["app-state-sync-key", "app-state-sync-version"]

      fs.readdirSync(authDir).forEach((file) => {
        if (problematicFiles.some((pf) => file.includes(pf))) {
          fs.unlinkSync(path.join(authDir, file))
          console.log(`[SESIÓN] Archivo eliminado: ${file}`)
        }
      })

      console.log("[SESIÓN] Limpieza completada")
    }
  } catch (error) {
    console.error("[ERROR] Error al limpiar sesión:", error)
  }
}

export function startPeriodicPing(conn) {
  if (global.pingInterval) clearInterval(global.pingInterval)

  global.pingInterval = setInterval(() => {
    if (conn.user) {
      conn.sendPresenceUpdate("available")
      conn.ws.send(JSON.stringify(["admin", "test"]))
    } else {
      clearInterval(global.pingInterval)
    }
  }, 25000)

  return global.pingInterval
}

function loadDatabase() {
  if (global.db.READ)
    return new Promise((resolve) =>
      setInterval(async function () {
        if (!global.db.READ) {
          clearInterval(this)
          resolve(global.db.data == null ? global.loadDatabase() : global.db.data)
        }
      }, 1 * 1000),
    )
  if (global.db.data !== null) return
  global.db.READ = true
  global.db.read().catch(console.error)
  global.db.READ = null
  global.db.data = { users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {}, ...(global.db.data || {}) }
  global.db.chain = chain(global.db.data) // Use chain from lodash
}
