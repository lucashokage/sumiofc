import fs from "fs"
import path from "path"
import { makeWASocket } from "@whiskeysockets/baileys"

let handler = async (m, { conn }) => {
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
    const connectionResults = []

    for (const botId of botFolders) {
      try {
        const botPath = path.join(sumibotsDir, botId, 'creds.json')
        if (!fs.existsSync(botPath)) {
          failedBots.push(`${botId} (creds.json no encontrado)`)
          continue
        }

        const credsData = JSON.parse(fs.readFileSync(botPath))
        const authState = {
          creds: credsData,
          keys: {
            // Estructura compatible con Baileys
            noiseKey: credsData.noiseKey,
            pairingEphemeralKeyPair: credsData.pairingEphemeralKeyPair,
            signedIdentityKey: credsData.signedIdentityKey,
            signedPreKey: credsData.signedPreKey
          }
        }

        if (!authState.creds || !authState.keys) {
          failedBots.push(`${botId} (estructura inválida)`)
          continue
        }

        let connectionSuccessful = false
        const newConn = makeWASocket({
          printQRInTerminal: false,
          auth: authState,
          logger: { level: 'silent' }
        })

        const connectionPromise = new Promise((resolve) => {
          newConn.ev.on('connection.update', (update) => {
            if (update.connection === 'open') {
              connectionSuccessful = true
              global.connections[botId] = newConn
              resolve(true)
            }
          })

          setTimeout(() => {
            if (!connectionSuccessful) {
              try { newConn.ws.close() } catch {}
              resolve(false)
            }
          }, 15000)
        })

        const result = await connectionPromise
        if (result) {
          successCount++
          connectionResults.push(`🟢 ${botId} - Conectado`)
        } else {
          failedBots.push(botId)
          connectionResults.push(`🔴 ${botId} - Timeout`)
        }

        await new Promise(resolve => setTimeout(resolve, 2500))
      } catch (e) {
        failedBots.push(botId)
        connectionResults.push(`🔴 ${botId} - Error: ${e.message.split('\n')[0]}`)
      }
    }

    let resultMessage = [
      `📊 Resultado final:`,
      `✅ Conectados: ${successCount}`,
      `❌ Fallidos: ${failedBots.length}`,
      ``,
      ...connectionResults.slice(0, 8)
    ].join('\n')

    if (connectionResults.length > 8) {
      resultMessage += `\n...y ${connectionResults.length - 8} más`
    }

    return conn.reply(m.chat, resultMessage, m)
  } catch (error) {
    return conn.reply(m.chat, `⚠️ Error global: ${error.message}`, m)
  }
}

handler.help = ['rconectall']
handler.tags = ['subbot']
handler.command = ['rconectall','reconectartodos'] 
handler.rowner = true

export default handler
