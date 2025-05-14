import fs from "fs"
import path from "path"

let handler = async (m, { conn, args, usedPrefix }) => {
  if (!global.handleReconnectCommand) {
    return conn.reply(m.chat, '❌ Error: Sistema de reconexión no disponible.', m)
  }

  // Verificar si se solicita reconectar todos los bots
  if (args[0]?.toLowerCase() === 'all') {
    try {
      const sumibotsDir = './sumibots' // Ruta a la carpeta sumibots
      
      // Verificar si existe la carpeta
      if (!fs.existsSync(sumibotsDir)) {
        return conn.reply(m.chat, '❌ No se encontró la carpeta "sumibots".', m)
      }

      // Obtener todas las subcarpetas (cada una representa un bot)
      const botFolders = fs.readdirSync(sumibotsDir)
        .filter(folder => 
          fs.statSync(path.join(sumibotsDir, folder)).isDirectory() && 
          folder !== 'creds' // Excluir carpeta de credenciales si existe
        )

      if (botFolders.length === 0) {
        return conn.reply(m.chat, '❌ No se encontraron bots en la carpeta sumibots.', m)
      }

      await conn.reply(m.chat, `♻️ Iniciando reconexión de ${botFolders.length} bots...`, m)

      let successCount = 0
      for (const folder of botFolders) {
        try {
          // Aquí implementa la lógica específica para reconectar cada bot
          // Dependerá de cómo manejas las sesiones en tu estructura
          await global.handleReconnectCommand(m, { 
            conn, 
            args: [...args, folder], // Pasamos la carpeta como parámetro adicional
            usedPrefix 
          })
          
          successCount++
          await new Promise(resolve => setTimeout(resolve, 2500)) // Delay entre reconexiones
        } catch (e) {
          console.error(`Error reconectando ${folder}:`, e)
        }
      }

      return conn.reply(m.chat, `✅ Reconexión masiva completada:\n🟢 ${successCount} exitosas\n🔴 ${botFolders.length - successCount} fallidas`, m)
    } catch (error) {
      console.error('Error en reconexión masiva:', error)
      return conn.reply(m.chat, '❌ Error al reconectar todos los bots.', m)
    }
  }

  // Reconexión normal individual
  return global.handleReconnectCommand(m, { conn, args, usedPrefix })
}

handler.help = ['reconnect [all]']
handler.tags = ['subbot']
handler.command = ['rconect', 'reconnect']
handler.rowner = true // Recomendado dejarlo solo para owner

export default handler
