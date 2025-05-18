const handler = async (m, { conn, text, usedPrefix, command }) => {
  const who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
  const name = text
  if (!name) throw `Usa: ${usedPrefix + command} <nombre>\nEjemplo: ${usedPrefix + command} bot`
  try {
    global.db.data.settings[conn.user.jid].botName = text

    if (global.db.data.users && global.db.data.users[conn.user.jid]) {
      global.db.data.users[conn.user.jid].namebebot = text
    }
    m.reply(` ◈ nombre del bot actualizado a: ${text}`)
  } catch (e) {
    console.error(e)
    throw "Error"
  }
}
handler.help = ["setname <nombre>"]
handler.tags = ["owner"]
handler.command = /^setname$/i
handler.owner = true

export default handler
