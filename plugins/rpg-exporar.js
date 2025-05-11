let cooldowns = {}

let handler = async (m, { conn }) => {
  let user = global.db.data.users[m.sender]
  
  let tiempoEspera = 5 * 60 * 1000
  if (cooldowns[m.sender] && Date.now() - cooldowns[m.sender] < tiempoEspera) {
    let tiempoRestante = segundosAHMS(Math.ceil((cooldowns[m.sender] + tiempoEspera - Date.now()) / 1000))
    return conn.reply(m.chat, `⏱️ Debes esperar *${tiempoRestante}* antes de volver a explorar.`, m)
  }
  
  cooldowns[m.sender] = Date.now()
  
  if (user.health < 40) return m.reply(`${global.emoji2} Necesitas al menos 40 de salud para explorar. Usa *#heal* para recuperar salud.`)
  
  let locations = [
    { name: 'Bosque Encantado', resources: ['wood', 'food', 'potion'] },
    { name: 'Montañas Heladas', resources: ['stone', 'iron', 'diamonds'] },
    { name: 'Cavernas Profundas', resources: ['coal', 'iron', 'gold'] },
    { name: 'Río Cristalino', resources: ['gold', 'emerald', 'food'] },
    { name: 'Ruinas Antiguas', resources: ['stone', 'emerald', 'potion'] }
  ]
  
  let location = locations[Math.floor(Math.random() * locations.length)]
  let healthLoss = Math.floor(Math.random() * 20) + 10
  
  user.health -= healthLoss
  if (user.health < 0) user.health = 0
  
  let rewards = {}
  let rewardText = ''
  
  location.resources.forEach(resource => {
    let amount = Math.floor(Math.random() * 5) + 1
    if (!user[resource]) user[resource] = 0
    user[resource] += amount
    
    let emoji = ''
    switch (resource) {
      case 'wood': emoji = '🪵'; break
      case 'stone': emoji = '🪨'; break
      case 'food': emoji = '🍗'; break
      case 'potion': emoji = '🧪'; break
      case 'iron': emoji = '🔩'; break
      case 'gold': emoji = '🏅'; break
      case 'diamonds': emoji = '💎'; break
      case 'emerald': emoji = '♦️'; break
      case 'coal': emoji = '🕋'; break
      default: emoji = '📦'
    }
    
    rewardText += `┃ ${emoji} ${resource}: +${amount}\n`
  })
  
  let expReward = Math.floor(Math.random() * 100) + 50
  user.exp += expReward
  
  let mensaje = `
╭━━━━━━━━━⬣
┃ 🔍 *EXPLORACIÓN*
┃ Has explorado: ${location.name}
┃ -${healthLoss} ❤️ Salud
┃ +${expReward} ⚡ XP
┃
┃ *RECURSOS ENCONTRADOS:*
${rewardText}╰━━━━━━━━━⬣`
  
  conn.reply(m.chat, mensaje, m)
}

handler.help = ['explorar']
handler.tags = ['rpg']
handler.command = ['explorar', 'explore']
handler.group = true
handler.register = true

export default handler

function segundosAHMS(segundos) {
  let minutos = Math.floor(segundos / 60)
  let segundosRestantes = segundos % 60
  return `${minutos} minutos y ${segundosRestantes} segundos`
}