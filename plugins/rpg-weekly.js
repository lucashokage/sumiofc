let handler = async (m, { isPrems, conn }) => {
  let user = global.db.data.users[m.sender]
  let time = user.lastweekly + 604800000
  if (new Date - user.lastweekly < 604800000) return m.reply(`${global.emoji2} Ya reclamaste tu recompensa semanal\n\nVuelve en *${msToTime(time - new Date())}*`)
  
  let reward = 20000
  let premReward = 40000
  let finalReward = isPrems ? premReward : reward
  
  user.coin += finalReward
  user.diamonds += 5
  user.exp += 2000
  
  m.reply(`
╭━━━━━━━━━⬣
┃ ✅ *RECOMPENSA SEMANAL*
┃ *${finalReward}* ${global.moneda}
┃ *5* 💎 Diamantes
┃ *2000* ⚡ XP
╰━━━━━━━━━⬣`)
  
  user.lastweekly = new Date() * 1
}

handler.help = ['weekly']
handler.tags = ['rpg']
handler.command = ['weekly', 'semanal']
handler.register = true
handler.group = true

export default handler

function msToTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24),
    days = Math.floor(duration / (1000 * 60 * 60 * 24))

  return `${days} días, ${hours} horas, ${minutes} minutos`
}