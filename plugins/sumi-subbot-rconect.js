import fs from "fs"

let handler = async (m, { conn, args, usedPrefix }) => {
  if (!global.handleReconnectCommand) {
    return conn.reply(m.chat, '❌ Error: Sistema de reconexión no disponible.', m)
  }

  // Verificar si se solicita reconectar todos los bots
  if (args[0]?.toLowerCase() === 'all') {
    try {
      // Obtener lista de archivos de subbots
      const subbotFiles = fs.readdirSync('./plugins')
        .filter(file => file.startsWith('sumibot-subbot') && file.endsWith('.js'))
      
      if (subbotFiles.length === 0) {
        return conn.reply(m.chat, '❌ No se encontraron bots subordinados.', m)
      }

      // Enviar mensaje de inicio
      await conn.reply(m.chat, `♻️ Iniciando reconexión de ${subbotFiles.length} bots subordinados...`, m)

      // Reconectar cada bot
      let successCount = 0
      for (const file of subbotFiles) {
        try {
          // Eliminar caché del módulo
          delete require.cache[require.resolve(`../plugins/${file}`)]
          
          // Ejecutar reconexión
          await global.handleReconnectCommand(m, { conn, args, usedPrefix })
          successCount++
          
          // Pequeño delay entre reconexiones
          await new Promise(resolve => setTimeout(resolve, 2000))
        } catch (e) {
          console.error(`Error reconectando ${file}:`, e)
        }
      }

      return conn.reply(m.chat, `✅ Reconexión completada:\n${successCount} bots reconectados exitosamente.\n${subbotFiles.length - successCount} fallos.`, m)
    } catch (error) {
      console.error('Error en reconexión masiva:', error)
      return conn.reply(m.chat, '❌ Error al reconectar todos los bots.', m)
    }
  }

  // Reconexión normal para el bot actual
  return global.handleReconnectCommand(m, { conn, args, usedPrefix })
}

handler.help = ['reconnect [all]']
handler.tags = ['subbot']
handler.command = ['rconect', 'reconnect']
handler.rowner = false

export default handler
