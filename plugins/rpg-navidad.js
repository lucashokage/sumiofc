let handler = async (m, { conn }) => {
  let user = global.db.data.users[m.sender]
  
  if (new Date().getMonth() !== 11) return m.reply(`${global.emoji2} Este comando solo está disponible durante el mes de diciembre (Navidad).`)
  
  let time = user.lastchristmas + 86400000
  if (new Date - user.lastchristmas < 86400000) return m.reply(`${global.emoji2} Ya reclamaste tu regalo de Navidad hoy\n\nVuelve en *${msToTime(time - new Date())}*`)
  
  let rewards = [
    { item: 'coin', amount: Math.floor(Math.random() * 5000) + 1000, emoji: global.moneda },
    { item: 'exp', amount: Math.floor(Math.random() * 1000) + 500, emoji: '⚡' },
    { item: 'diamonds', amount: Math.floor(Math.random() * 5) + 1, emoji: '💎' }
  ]
  
  let randomReward = rewards[Math.floor(Math.random() * rewards.length)]
  
  user[randomReward.item] += randomReward.amount
  user.lastchristmas = new Date() * 1
  
  m.reply(`
╭━━━━━━━━━⬣
┃ 🎄 *REGALO DE NAVIDAD*
┃ Has recibido:
┃ *${randomReward.amount}* ${randomReward.emoji}
╰━━━━━━━━━⬣`)
}

handler.help = ['navidad']
handler.tags = ['rpg']
handler.command = ['navidad', 'christmas']
handler.group = true
handler.register = true

export default handler

function msToTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24)

  hours = (hours < 10) ? "0" + hours : hours
  minutes = (minutes < 10) ? "0" + minutes : minutes
  seconds = (seconds < 10) ? "0" + seconds : seconds

  return hours + " horas " + minutes + " minutos"
}