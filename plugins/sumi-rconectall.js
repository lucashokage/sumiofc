import fs from "fs"
import path from "path"

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

    await conn.reply(m.chat, `♻️ Reconectando ${botFolders.length} bots...`, m)

    let successCount = 0
    const failedBots = []
    
    for (const botId of botFolders) {
      try {
        const botPath = path.join(sumibotsDir, botId, 'creds.json')
        if (fs.existsSync(botPath)) {
          const { state, saveState } = JSON.parse(fs.readFileSync(botPath))
          
          const newConn = makeWASocket({
            printQRInTerminal: true,
            auth: {
              creds: state.creds,
              keys: state.keys
            }
          })
          
          global.connections[botId] = newConn
          successCount++
        }
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (e) {
        failedBots.push(botId)
      }
    }

    let result = `✅ Resultado:\nConectados: ${successCount}\nFallidos: ${failedBots.length}`
    if (failedBots.length > 0) {
      result += `\nFallidos:\n${failedBots.slice(0, 5).join('\n')}`
    }

    return conn.reply(m.chat, result, m)
  } catch (error) {
    return conn.reply(m.chat, '⚠️ Error en el proceso', m)
  }
}

handler.help = ['rconectall']
handler.tags = ['subbot']
handler.command = ['rconectall','reconectartodos'] 
handler.rowner = true

export default handler
