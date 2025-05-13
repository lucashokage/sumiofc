import fetch from "node-fetch"
import fs from "fs/promises"

const welcomeCache = new Set()

export async function before(m, { conn, participants, groupMetadata }) {
  if (!m.messageStubType || !m.isGroup) return

  const bot = global.db.data.settings[conn.user.jid] || {}
  const chat = global.db.data.chats[m.chat] || {}

  const eventKey = `${m.chat}_${m.messageStubParameters[0]}_${m.messageStubType}`

  if (welcomeCache.has(eventKey)) return
  welcomeCache.add(eventKey)

  setTimeout(() => welcomeCache.delete(eventKey), 5000)

  const welcomeMsg = chat.sWelcome || bot.welcome || "¡Bienvenido al grupo!"
  const byeMsg = chat.sBye || bot.bye || "¡Adiós! Esperamos verte pronto."
  const botName = bot.botName || "=͟͟͞❀ sᥙmі - sᥲkᥙrᥲsᥲᥕᥲ  ⏤͟͟͞͞★"

  let img
  try {
    const userJid = m.messageStubParameters[0]
    const pp = bot.logo?.welcome || (await conn.profilePictureUrl(userJid, "image").catch(() => null))
    img = pp ? await (await fetch(pp)).buffer() : await fs.readFile("./src/avatar.jpg")
  } catch (e) {
    console.error("Error al obtener imagen:", e)
    img = await fs.readFile("./src/avatar.jpg")
  }

  const groupSize =
    m.messageStubType === 27
      ? participants.length + 1 
      : participants.length - 1

  // Procesar el evento
  if (chat.welcome) {
    const userJid = m.messageStubParameters[0]
    const username = userJid.split("@")[0]

    if (m.messageStubType === 27) {
      // Bienvenida
      const message =
        `❀ *Bienvenido* a ${groupMetadata.subject}\n` +
        `✰ @${username}\n` +
        `${welcomeMsg}\n` +
        `✦ Ahora somos ${groupSize} miembros.\n` +
        `•(=^●ω●^=)• Disfruta tu estadía!\n` +
        `> ✐ Usa *#help* para ver comandos.`

      await conn.sendMessage(m.chat, {
        image: img,
        caption: message,
        mentions: [userJid],
      })
    } else if ([28, 32].includes(m.messageStubType)) {
      // Despedida
      const message =
        `❀ *Adiós* de ${groupMetadata.subject}\n` +
        `✰ @${username}\n` +
        `${byeMsg}\n` +
        `✦ Ahora somos ${groupSize} miembros.\n` +
        `•(=^●ω●^=)• Te esperamos pronto!\n` +
        `> ✐ Usa *#help* para ver comandos.`

      await conn.sendMessage(m.chat, {
        image: img,
        caption: message,
        mentions: [userJid],
      })
    }
  }
}
