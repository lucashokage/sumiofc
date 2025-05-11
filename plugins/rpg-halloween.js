let handler = async (m, { conn }) => {
  let user = global.db.data.users[m.sender]
  
  if (new Date().getMonth() !== 9) return m.reply(`${global.emoji2} Este comando solo está disponible durante el mes de octubre (Halloween).`)
  
  let time = user.lasthalloween + 86400000
  if (new Date - user.lasthalloween < 86400000) return m.reply(`${global.emoji2} Ya reclamaste tu regalo de Halloween hoy\n\nVuelve en *${msToTime(time - new Date())}*`)
  
  let rewards = [
    { item: 'coin', amount: Math.floor(Math.random() * 3000) + 1000, emoji: global.moneda },
    { item: 'exp', amount: Math.floor(Math.random() * 800) + 300, emoji: '⚡' },
    { item: 'pumpkin', amount: Math.floor(Math.random() * 5) + 1, emoji: '🎃' }
  ]
  
  let randomReward = rewards[Math.floor(Math.random() * rewards.length)]
  
  if (!user[randomReward.item]) user[randomReward.item] = 0
  user[randomReward.item] += randomReward.amount
  user.lasthalloween = new Date() * 1
  
  m.reply(`
╭━━━━━━━━━⬣
┃ 🎃 *REGALO DE HALLOWEEN*
┃ Has recibido:
┃ *${randomReward.amount}* ${randomReward.emoji}
╰━━━━━━━━━⬣`)
}

handler.help = ['halloween']
handler.tags = ['rpg']
handler.command = ['halloween', 'spooky']
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