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
          failedBots.push(`${botId} (sin creds.json)`)
          continue
        }

        const { state } = JSON.parse(fs.readFileSync(botPath))
        let connectionSuccessful = false

        const newConn = makeWASocket({
          printQRInTerminal: false,
          auth: { creds: state.creds, keys: state.keys },
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
              newConn.ws.close()
              resolve(false)
            }
          }, 10000)
        })

        const result = await connectionPromise
        if (result) {
          successCount++
          connectionResults.push(`🟢 ${botId} - Conectado`)
        } else {
          failedBots.push(botId)
          connectionResults.push(`🔴 ${botId} - Falló`)
        }

        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (e) {
        failedBots.push(botId)
        connectionResults.push(`🔴 ${botId} - Error: ${e.message}`)
      }
    }

    let resultMessage = `✅ Resultado final:\nConectados: ${successCount}\nFallidos: ${failedBots.length}\n\n`
    resultMessage += connectionResults.slice(0, 10).join('\n')
    
    if (connectionResults.length > 10) {
      resultMessage += `\n...y ${connectionResults.length - 10} más`
    }

    return conn.reply(m.chat, resultMessage, m)
  } catch (error) {
    return conn.reply(m.chat, `⚠️ Error en el proceso: ${error.message}`, m)
  }
}

handler.help = ['rconectall']
handler.tags = ['subbot']
handler.command = ['rconectall','reconectartodos'] 
handler.rowner = true

export default handler
