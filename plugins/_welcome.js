import { sticker } from "../lib/sticker.js"

const handler = async (m, { conn, args, usedPrefix, command, text }) => {
  const who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
  if (who) {
    try {
      const pp = await conn.profilePictureUrl(who, "image")
      const str = `https://api.lolhuman.xyz/api/welcomeimage?img=${pp}&text=${text}&apikey=${lolhuman}`
      const stiker = await sticker(null, str, global.packname, global.author)
      conn.sendFile(m.chat, stiker, "sticker.webp", "", m)
    } catch (e) {
      console.log(e)
    }
  }
}

handler.before = async (m, { conn, participants, groupMetadata, bot }) => {
  const isWelcome = global.db.data.chats[m.chat].welcome
  if (!isWelcome) return
  const welcomeMsg = global.welcome
  const groupSize = participants.length
  const username = m.sender.split("@")[0]
  const user = m.sender
  const botName = bot.botName || "=͟͟͞❀ sᥙmі - sᥲkᥙrᥲsᥲᥕᥲ  ⏤͟͟͞͞★"
  if (m.mtype == "groupInviteMessage") {
    const gcname = (await conn.getName(m.msg.groupInviteMessage.groupJid)) || "Grupo"
    const pp = await conn.profilePictureUrl(m.sender, "image").catch((_) => "https://i.imgur.com/whjlJSf.png")
    const str = `https://api.lolhuman.xyz/api/welcomeimage?img=${pp}&text=Bienvenido a ${gcname}&apikey=${lolhuman}`
    const stiker = await sticker(null, str, global.packname, global.author)
    conn.sendFile(m.chat, stiker, "sticker.webp", "", m)
  }
  if (m.mtype == "group_participant_add") {
    const pp = await conn.profilePictureUrl(user, "image").catch((_) => "https://i.imgur.com/whjlJSf.png")
    const str = `https://api.lolhuman.xyz/api/welcomeimage?img=${pp}&text=Bienvenido a ${groupMetadata.subject}&apikey=${lolhuman}`
    const stiker = await sticker(null, str, global.packname, global.author)
    const message =
      `❀ *Bienvenido* a ${groupMetadata.subject}\n` +
      `✰ @${username}\n` +
      `${welcomeMsg}\n` +
      `✦ Ahora somos ${groupSize} miembros.\n` +
      `•(=^●ω●^=)• Disfruta tu estadía!\n` +
      `> ✐ Usa *#help* para ver comandos de ${botName}.`
    conn.sendFile(m.chat, stiker, "sticker.webp", "", m, { mentions: [user] })
    conn.sendMessage(m.chat, { text: message, mentions: [user] }, { quoted: m })
  }
}

export default handler
