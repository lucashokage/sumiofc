let handler = async (m, { isPrems, conn }) => {
  let user = global.db.data.users[m.sender]
  let time = user.lastmonthly + 2592000000
  if (new Date - user.lastmonthly < 2592000000) return m.reply(`${global.emoji2} Ya reclamaste tu recompensa mensual\n\nVuelve en *${msToTime(time - new Date())}*`)
  
  let reward = 50000
  let premReward = 100000
  let finalReward = isPrems ? premReward : reward
  
  user.coin += finalReward
  user.diamonds += 10
  user.exp += 5000
  
  m.reply(`
╭━━━━━━━━━⬣
┃ ✅ *RECOMPENSA MENSUAL*
┃ *${finalReward}* ${global.moneda}
┃ *10* 💎 Diamantes
┃ *5000* ⚡ XP
╰━━━━━━━━━⬣`)
  
  user.lastmonthly = new Date() * 1
}

handler.help = ['mensual']
handler.tags = ['rpg']
handler.command = ['mensual', 'monthly']
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