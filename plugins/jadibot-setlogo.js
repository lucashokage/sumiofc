import fetch from "node-fetch"

const handler = async (m, { conn, args, text, command, usedPrefix, isOwner }) => {
  const isSubbotOwner = conn.user.jid === m.sender
  if (!isSubbotOwner && !isOwner) {
    return m.reply("⚠️ Solo el owner del bot o el número asociado a este subbot pueden usar este comando.")
  }

  const q = m.quoted ? m.quoted : m
  if (!q) return m.reply(`🌱 Responde a una imagen para cambiar la foto de perfil del bot.`)

  let buffer
  try {
    buffer = await q.download()
  } catch (e) {
    if (q.url) {
      buffer = await fetch(q.url).then((res) => res.buffer())
    }
  }

  if (!buffer) return m.reply("No se pudo descargar el archivo, intenta responder a una imagen primero.")

  try {
    await conn.updateProfilePicture(conn.user.jid, buffer)

    const cap = `≡ 🌴 Se ha cambiado con éxito la foto de perfil para @${conn.user.jid.split("@")[0]}`

    conn.sendMessage(
      m.chat,
      {
        image: { url: URL.createObjectURL(new Blob([buffer])) },
        caption: cap,
        mentions: conn.parseMention(cap),
      },
      { quoted: m },
    )
  } catch (e) {
    console.error(e)
    return m.reply("Error al cambiar la foto de perfil. Inténtalo de nuevo.")
  }
}

handler.tags = ["serbot"]
handler.help = handler.command = ["setprofile"]
export default handler
