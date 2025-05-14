import fs from "fs"
import path from "path"

let handler = async (m, { conn, args, usedPrefix }) => {
  if (!global.handleReconnectCommand) {
    return conn.reply(m.chat, '❌ Error: Sistema de reconexión no disponible.', m)
  }

  // Modo reconexión masiva (all)
  if (args[0]?.toLowerCase() === 'all') {
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

      await conn.reply(m.chat, `♻️ Iniciando reconexión de ${botFolders.length} bots...`, m)

      let successCount = 0
      const failedBots = []
      
      for (const folder of botFolders) {
        try {
          // Lógica especial para reconexión masiva que evita la validación de token
          await global.handleReconnectCommand(m, { 
            conn, 
            args: ['bypass_validation'], // Argumento especial para evitar validación
            usedPrefix,
            isMassReconnect: true // Flag especial
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
      return conn.reply(m.chat, '❌ Error al reconectar todos los bots.', m)
    }
  }

  // Modo reconexión individual (validación normal)
  if (!args[0] || !/^\d+.*/.test(args[0])) {
    return conn.reply(m.chat, 'Formato incorrecto. Uso: .rconect [token]', m)
  }

  return global.handleReconnectCommand(m, { conn, args, usedPrefix })
}

handler.help = ['reconnect [token/all]']
handler.tags = ['subbot']
handler.command = ['rconect', 'reconnect']
handler.rowner = true

export default handler
