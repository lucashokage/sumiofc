import fs from "fs"
import path from "path"

let handler = async (m, { conn }) => {
  if (!global.handleMassReconnect) {
    return conn.reply(m.chat, '❌ Error: Función de reconexión masiva no disponible', m)
  }

  try {
    const sumibotsDir = './sumibots'
    
    if (!fs.existsSync(sumibotsDir)) {
      return conn.reply(m.chat, '❌ No se encontró la carpeta de bots "sumibots"', m)
    }
    const botFolders = fs.readdirSync(sumibotsDir)
      .filter(folder => 
        fs.statSync(path.join(sumibotsDir, folder)).isDirectory() && 
        !folder.includes('creds') // Excluir carpeta de credenciales
      )

    if (botFolders.length === 0) {
      return conn.reply(m.chat, '❌ No hay bots configurados para reconexión', m)
    }

    // Iniciar proceso
    await conn.reply(m.chat, `♻️ Iniciando reconexión automática de ${botFolders.length} bots...`, m)

    let successCount = 0
    const failedBots = []
    
    for (const botId of botFolders) {
      try {
        await global.handleMassReconnect(botId)
        successCount++
        
        // Pequeña pausa entre reconexiones
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (e) {
        failedBots.push(botId)
        console.error(`Error en bot ${botId}:`, e.message)
      }
    }

    let result = `✅ Reconexión masiva completada:
🟢 ${successCount} exitosas
🔴 ${failedBots.length} fallidas`

    if (failedBots.length > 0) {
      result += `\n\n📛 Fallos:\n${failedBots.slice(0, 5).join('\n')}`
      if (failedBots.length > 5) result += `\n...y ${failedBots.length - 5} más`
    }

    return conn.reply(m.chat, result, m)
  } catch (error) {
    console.error('Error crítico:', error)
    return conn.reply(m.chat, '⚠️ Error inesperado durante la reconexión masiva', m)
  }
}

handler.help = ['rconectall']
handler.tags = ['subbot']
handler.command = ['rconectall', 'reconectartodos'] 
handler.rowner = true // Solo el dueño puede usarlo

export default handler
