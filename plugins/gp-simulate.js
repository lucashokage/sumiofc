const handler = async (m, { conn, usedPrefix, command, args: [event], text }) => {
  // Verificar que las bienvenidas estén activadas
  const chat = global.db.data.chats[m.chat] || {}
  if (!chat.welcome) {
    throw `✳️ Para usar este comando debe activar las Bienvenidas con\n\n*${usedPrefix}on welcome*`
  }

  const te = `
  ┌─⊷ *EVENTOS*
  ▢ welcome
  ▢ bye
  ▢ promote
  ▢ demote
  └───────────
  
  📌 Ejemplo:
  
  *${usedPrefix + command}* welcome @user`

  if (!event) return await m.reply(te)

  const mentions = text.replace(event, "").trimStart()
  const who = mentions ? conn.parseMention(mentions) : []
  const part = who.length ? who : [m.sender]
  let act = false

  m.reply(`✅ Simulando ${event}...`)

  switch (event.toLowerCase()) {
    case "add":
    case "bienvenida":
    case "invite":
    case "welcome":
      act = "add"
      break

    case "bye":
    case "despedida":
    case "leave":
    case "remove":
      act = "remove"
      break

    case "promote":
    case "promover":
      act = "promote"
      break

    case "demote":
    case "degradar":
      act = "demote"
      break

    default:
      throw te
  }

  // Simular el evento actualizando los participantes
  if (act) {
    return conn.participantsUpdate({
      id: m.chat,
      participants: part,
      action: act,
    })
  }
}

handler.help = ["simulate <evento> @usuario"]
handler.tags = ["group"]
handler.command = ["simular", "simulate"]
handler.admin = true
handler.group = true

export default handler
