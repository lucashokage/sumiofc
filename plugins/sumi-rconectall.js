import fs from "fs"
import path from "path"
import { makeWASocket } from "@whiskeysockets/baileys"

let handler = async (m, { conn }) => {
  try {
    const sumibotsDir = './sumibots'
    
    if (!fs.existsSync(sumibotsDir)) {
      return conn.reply(m.chat, '❌ No se encontró la carpeta de bots', m)
    }

    const botFolders = fs.readdirSync(sumibotsDir)
      .filter(folder => fs.statSync(path.join(sumibotsDir, folder)).isDirectory())

    if (botFolders.length === 0) {
      return conn.reply(m.chat, '❌ No hay bots configurados', m)
    }

    await conn.reply(m.chat, `♻️ Iniciando reconexión de ${botFolders.length} bots...`, m)

    let successCount = 0
    const failedBots = []
    
    for (const botId of botFolders) {
      try {
        const botPath = path.join(sumibotsDir, botId, 'creds.json')
        if (fs.existsSync(botPath)) {
          const { state } = JSON.parse(fs.readFileSync(botPath))
          
          const newConn = makeWASocket({
            printQRInTerminal: false,
            auth: { creds: state.creds, keys: state.keys },
            logger: { level: 'silent' }
          })

          newConn.ev.on('connection.update', (update) => {
            if (update.connection === 'open') {
              successCount++
              global.connections[botId] = newConn
            }
          })

          await new Promise(resolve => setTimeout(resolve, 2500))
        }
      } catch (e) {
        failedBots.push(botId)
      }
    }

    await new Promise(resolve => setTimeout(resolve, 5000))

    let result = `✅ Resultado final:\n🟢 Conectados: ${successCount}\n🔴 Fallidos: ${failedBots.length}`
    if (failedBots.length > 0) {
      result += `\n\nBots con problemas:\n${failedBots.slice(0, 5).join('\n')}`
      if (failedBots.length > 5) result += `\n...y ${failedBots.length - 5} más`
    }

    return conn.reply(m.chat, result, m)
  } catch (error) {
    return conn.reply(m.chat, '⚠️ Error crítico en el proceso', m)
  }
}

handler.help = ['rconectall']
handler.tags = ['subbot']
handler.command = ['rconectall','reconectartodos'] 
handler.rowner = true

export default handler
