import fs from "fs"
import chalk from 'chalk'

let handler = async (m, { conn, args, usedPrefix }) => {
  if (!global.handleReconnectCommand) {
    return conn.reply(m.chat, '❌ Error: Sistema de reconexión no disponible.', m);
  }
  
  return global.handleReconnectCommand(m, { conn, args, usedPrefix });
}

handler.help = ['reconnect']
handler.tags = ['subbot']
handler.command = ['rconect']
handler.rowner = false

export default handler
