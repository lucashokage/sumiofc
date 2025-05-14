let handler = async (m, { conn, args, usedPrefix }) => {
  if (!global.handleReconnectCommand) {
    return conn.reply(m.chat, '❌ Error: Sistema de reconexión no disponible.', m)
  }

  if (!args[0] || !/^\d+.*/.test(args[0])) {
    return conn.reply(m.chat, 'Formato incorrecto. Uso: .rconect [token]', m)
  }

  return global.handleReconnectCommand(m, { 
    conn, 
    args, 
    usedPrefix,
    isSingleReconnect: true
  })
}

handler.help = ['reconnect [token]']
handler.tags = ['subbot']
handler.command = ['rconect', 'reconnect']
handler.rowner = true

export default handler
