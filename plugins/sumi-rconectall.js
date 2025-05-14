import fs from "fs"
import path from "path"

let handler = async (m, { conn, usedPrefix }) => {
  if (!global.handleReconnectCommand) {
    return conn.reply(m.chat, '❌ Error: Sistema de reconexión no disponible.', m)
  }

  try {
    const sumibotsDir = './sumibots'
    
    if (!fs.existsSync(sumibotsDir)) {
      return conn.reply(m.chat, '❌ No se encontró la carpeta "sumibots".', m)
    }

    const botFolders = fs.readdirSync(sumibotsDir)
      .filter(folder => 
        fs.statSync(path.join(sumibotsDir, folder)).isDirectory() && 
        folder !== 'creds'
      )

    if (botFolders.length === 0) {
      return conn.reply(m.chat, '❌ No se encontraron bots en la carpeta sumibots.', m)
    }

    await conn.reply(m.chat, `♻️ Iniciando reconexión masiva de ${botFolders.length} bots...`, m)

    let successCount = 0
    const failedBots = []
    
    for (const folder of botFolders) {
      try {
        await global.handleReconnectCommand(m, { 
          conn,
          args: [folder],
          usedPrefix,
          isMassReconnect: true
        })
        
        successCount++
        await new Promise(resolve => setTimeout(resolve, 2500))
      } catch (e) {
        failedBots.push(folder)
        console.error(`Error reconectando ${folder}:`, e)
      }
    }

    let resultMessage = `✅ Reconexión masiva completada:\n🟢 ${successCount} exitosas\n🔴 ${botFolders.length - successCount} fallidas`
    
    if (failedBots.length > 0) {
      resultMessage += `\n\nBots con problemas:\n${failedBots.join('\n')}`
    }

    return conn.reply(m.chat, resultMessage, m)
  } catch (error) {
    console.error('Error en reconexión masiva:', error)
    return conn.reply(m.chat, '❌ Error crítico durante la reconexión masiva', m)
  }
}

handler.help = ['reconnectall']
handler.tags = ['subbot']
handler.command = ['rconectall', 'reconnectall']
handler.rowner = true

export default handler
