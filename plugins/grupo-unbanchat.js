let handler = async (m, { conn, usedPrefix, command, args }) => {
  if (!(m.chat in global.db.data.chats)) {
    global.db.data.chats[m.chat] = {
      isBanned: false,
      welcome: false,
      detect: true,
      antiLink: false,
      nsfw: false,
      antiBot: false
    }
  }

  let chat = global.db.data.chats[m.chat]
  const botName = conn.getName(conn.user.jid) || 'el bot'

  if (args.length === 0) {
    const estado = chat.isBanned ? '✗ Desactivado' : '✓ Activado'
    return conn.reply(m.chat, `「✦」Configuración de *${botName}*:\n\n> ✐ *${usedPrefix}bot on* - Activar\n> ✐ *${usedPrefix}bot off* - Desactivar\n\nEstado actual: *${estado}*`, m)
  }

  const action = args[0].toLowerCase()
  
  if (action === 'on') {
    if (!chat.isBanned) {
      return conn.reply(m.chat, `《✧》${botName} ya estaba activado.`, m)
    }
    chat.isBanned = false
    return conn.reply(m.chat, `✅ *${botName} activado* en este grupo.`, m)
  } 
  else if (action === 'off') {
    if (chat.isBanned) {
      return conn.reply(m.chat, `《✧》${botName} ya estaba desactivado.`, m)
    }
    chat.isBanned = true
    return conn.reply(m.chat, `❌ *${botName} desactivado* en este grupo.`, m)
  }
}

handler.help = ['bot [on/off]']
handler.tags = ['group']
handler.command = ['bot']
handler.admin = true

export default handler
