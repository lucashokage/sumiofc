import fs from "fs"
import path from "path"
import { makeWASocket } from "@whiskeysockets/baileys"
import pino from "pino"

let handler = async (m, { conn }) => {
  // Configuración del logger robusto
  const logger = pino({
    level: 'silent',
    transport: {
      target: 'pino-pretty',
      options: { colorize: true }
    }
  })

  try {
    const sumibotsDir = './sumibots'
    
    if (!fs.existsSync(sumibotsDir)) {
      return conn.reply(m.chat, '❌ Carpeta sumibots no encontrada', m)
    }

    const botFolders = fs.readdirSync(sumibotsDir)
      .filter(folder => fs.statSync(path.join(sumibotsDir, folder)).isDirectory())

    if (botFolders.length === 0) {
      return conn.reply(m.chat, '❌ No hay bots configurados', m)
    }

    await conn.reply(m.chat, `♻️ Iniciando reconexión de ${botFolders.length} bots...`, m)

    let successCount = 0
    const failedBots = []
    const connectionDetails = []

    for (const botId of botFolders) {
      try {
        const botPath = path.join(sumibotsDir, botId, 'creds.json')
        if (!fs.existsSync(botPath)) {
          failedBots.push(botId)
          connectionDetails.push(`🔴 ${botId} - creds.json no encontrado`)
          continue
        }

        const credsData = JSON.parse(fs.readFileSync(botPath))
        const authState = {
          creds: credsData,
          keys: {
            noiseKey: credsData.noiseKey,
            pairingEphemeralKeyPair: credsData.pairingEphemeralKeyPair,
            signedIdentityKey: credsData.signedIdentityKey,
            signedPreKey: credsData.signedPreKey
          }
        }

        const newConn = makeWASocket({
          printQRInTerminal: false,
          auth: authState,
          logger: logger, // Logger configurado correctamente
          markOnlineOnConnect: false,
          connectTimeoutMs: 30_000,
          keepAliveIntervalMs: 25_000
        })

        // Verificación de conexión con Promise.race
        const connectionResult = await Promise.race([
          new Promise(resolve => {
            newConn.ev.on('connection.update', update => {
              if (update.connection === 'open') {
                global.connections[botId] = newConn
                resolve(true)
              }
            })
          }),
          new Promise(resolve => setTimeout(() => resolve(false), 20_000))
        ])

        if (connectionResult) {
          successCount++
          connectionDetails.push(`🟢 ${botId} - Conectado`)
        } else {
          failedBots.push(botId)
          connectionDetails.push(`🔴 ${botId} - Timeout`)
          try { newConn.end() } catch {}
        }

        await new Promise(resolve => setTimeout(resolve, 3000))
      } catch (e) {
        failedBots.push(botId)
        connectionDetails.push(`🔴 ${botId} - ${e.message.split('\n')[0].slice(0, 50)}`)
      }
    }

    // Generar reporte detallado
    let report = [
      '📊 **Resultado de Reconexión**',
      `✅ Conectados: ${successCount}`,
      `❌ Fallidos: ${failedBots.length}`,
      '',
      ...connectionDetails.slice(0, 10)
    ].join('\n')

    if (connectionDetails.length > 10) {
      report += `\n...y ${connectionDetails.length - 10} más`
    }

    return conn.reply(m.chat, report, m)
  } catch (error) {
    return conn.reply(m.chat, `⚠️ Error crítico: ${error.message}`, m)
  }
}

handler.help = ['rconectall']
handler.tags = ['subbot']
handler.command = ['rconectall', 'reconectartodos']
handler.rowner = true

export default handler
