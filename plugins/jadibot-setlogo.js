import fs from "fs"
import path from "path"
import fetch from "node-fetch"

const handler = async (m, { conn, args, text, command, usedPrefix, isOwner }) => {
  const isSubbotOwner = conn.user.jid === m.sender
  const botNumber = conn.user.jid.split("@")[0]

  if (!isSubbotOwner && !isOwner) {
    return m.reply("⚠️ Solo el owner del bot o el número asociado a este subbot pueden usar este comando.")
  }

  if (!args[0]) {
    return m.reply(`🌲 Por favor especifica la categoría en la que desea cambiar la imagen. Lista :

- welcome -> Cambia la imagen del welcome.
- banner -> Cambia la imagen del menú.

## Ejemplo :
${usedPrefix + command} welcome
`)
  }

  if (args[0] !== "welcome" && args[0] !== "banner") {
    return m.reply("No coincide con ninguna opción de la lista.")
  }

  const isSubbot = conn.user.jid !== global.conn.user.jid
  const baseDir = isSubbot ? "./subbots" : "./botofc"
  const logosDir = path.join(baseDir, "logos")
  const typeDir = path.join(logosDir, args[0])

  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true })
  }

  if (!fs.existsSync(logosDir)) {
    fs.mkdirSync(logosDir, { recursive: true })
  }

  if (!fs.existsSync(typeDir)) {
    fs.mkdirSync(typeDir, { recursive: true })
  }

  const fileName = `${botNumber}${args[0]}.jpg`
  const filePath = path.join(typeDir, fileName)

  const q = m.quoted ? m.quoted : m
  if (!q) return m.reply(`🌱 Responde a una imagen para cambiar el logo del bot.`)

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
    fs.writeFileSync(filePath, buffer)

    if (!global.db.data.settings) global.db.data.settings = {}
    if (!global.db.data.settings[conn.user.jid]) global.db.data.settings[conn.user.jid] = {}
    if (!global.db.data.settings[conn.user.jid].logo) global.db.data.settings[conn.user.jid].logo = {}

    global.db.data.settings[conn.user.jid].logo[args[0]] = filePath

    const isWel = args[0] === "welcome"
    const cap = `≡ 🌴 Se ha cambiado con éxito la imagen ${isWel ? "de la bienvenida" : "del menú"} para @${botNumber}`

    conn.sendMessage(
      m.chat,
      {
        image: { url: filePath },
        caption: cap,
        mentions: conn.parseMention(cap),
      },
      { quoted: m },
    )
  } catch (e) {
    console.error(e)
    return m.reply("Error al guardar la imagen. Inténtalo de nuevo.")
  }
}

handler.tags = ["serbot"]
handler.help = handler.command = ["setlogo"]
export default handler
