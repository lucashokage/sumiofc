/* Código hecho por @Fabri115 y mejorado por BrunoSobrino */
import { existsSync, promises as fs } from 'fs'
import path from 'path'

const sessionFolder = './sessions/'

var handler = async (m, { conn }) => {
  if (global.conn.user.jid !== conn.user.jid) {
    return conn.reply(m.chat, '⚠️ Utiliza este comando directamente en el número principal del Bot.', m)
  }

  try {
    await conn.reply(m.chat, '🔄 Iniciando proceso de eliminación de archivos de sesión...', m)
    m.react('⏳')

    if (!existsSync(sessionFolder)) {
      return await conn.reply(m.chat, 'ℹ️ No se encontró la carpeta de sesiones.', m)
    }

    const files = await fs.readdir(sessionFolder)
    let filesDeleted = 0

    for (const file of files) {
      if (file !== 'creds.json') {
        try {
          await fs.unlink(path.join(sessionFolder, file))
          filesDeleted++
        } catch (e) {
          console.error(`Error al eliminar ${file}:`, e)
        }
      }
    }

    
    if (filesDeleted === 0) {
      await conn.reply(m.chat, 'ℹ️ No se encontraron archivos para eliminar.', m)
    } else {
      m.react('✅') 
      await conn.reply(m.chat, `✔️ Se eliminaron ${filesDeleted} archivos de sesión (se conservó creds.json).`, m)
      conn.reply(m.chat, '👋 ¡Hola! ¿Puedes verme ahora?', m)
    }

  } catch (err) {
    console.error('Error general:', err)
    await conn.reply(m.chat, '❌ Ocurrió un error durante el proceso.', m)
  }
}

handler.help = ['dsowner']
handler.tags = ['owner']
handler.command = ['delai', 'dsowner', 'clearallsession']
handler.rowner = true

export default handler
