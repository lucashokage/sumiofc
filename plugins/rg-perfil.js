const handler = async (m, { conn, args }) => {
  let userId
  if (m.quoted && m.quoted.sender) {
    userId = m.quoted.sender
  } else {
    userId = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender
  }

  const user = global.db.data.users[userId]
  if (!user) return m.reply(`《✧》Usuario no encontrado en la base de datos.`)

  const name = user.name || conn.getName(userId)
  const age = user.age || "No registrado"
  const regTime = user.regTime ? new Date(user.regTime).toLocaleString() : "No registrado"
  const registered = user.registered ? "✅" : "❌"

  const exp = user.exp || 0
  const coin = user.coin || 0
  const joincount = user.joincount || 0

  const dev = "powered by leonel"

  const perfil = await conn.profilePictureUrl(userId, "image").catch((_) => "./src/avatar.jpg")

  const profileText = `
「✿」 *Perfil* ◢@${userId.split("@")[0]}◤

✦ Nombre » ${name}
✦ Edad » ${age}
✦ Registrado » ${registered}
✦ Fecha de registro » ${regTime}

☆ *Experiencia* » ${exp.toLocaleString()}
⛁ *Coins* » ${coin.toLocaleString()}
❖ *Tokens* » ${joincount.toLocaleString()}
  `.trim()

  await conn.sendMessage(
    m.chat,
    {
      text: profileText,
      contextInfo: {
        mentionedJid: [userId],
        externalAdReply: {
          title: "✧ Perfil de Usuario ✧",
          body: dev,
          thumbnailUrl: perfil,
          sourceUrl: perfil,
          mediaType: 1,
          showAdAttribution: true,
          renderLargerThumbnail: true,
        },
      },
    },
    { quoted: m },
  )
}

handler.help = ["profile"]
handler.tags = ["rg"]
handler.command = ["profile", "perfil"]

export default handler
