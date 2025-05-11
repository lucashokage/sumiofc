let cooldowns = {}

let handler = async (m, { conn }) => {
  let user = global.db.data.users[m.sender]
  
  let tiempoEspera = 10 * 60 * 1000
  if (cooldowns[m.sender] && Date.now() - cooldowns[m.sender] < tiempoEspera) {
    let tiempoRestante = segundosAHMS(Math.ceil((cooldowns[m.sender] + tiempoEspera - Date.now()) / 1000))
    return conn.reply(m.chat, `⏱️ Debes esperar *${tiempoRestante}* antes de volver a entrar a la mazmorra.`, m)
  }
  
  cooldowns[m.sender] = Date.now()
  
  if (user.health < 50) return m.reply(`${global.emoji2} Necesitas al menos 50 de salud para entrar a la mazmorra. Usa *#heal* para recuperar salud.`)
  
  let enemies = ['Esqueleto', 'Zombie', 'Fantasma', 'Vampiro', 'Hombre Lobo', 'Gárgola', 'Demonio', 'Goblin', 'Orco']
  let enemy = enemies[Math.floor(Math.random() * enemies.length)]
  
  let result = Math.random() < 0.7
  
  let coinReward = Math.floor(Math.random() * 1000) + 500
  let expReward = Math.floor(Math.random() * 500) + 250
  let healthLoss = Math.floor(Math.random() * 40) + 10
  
  user.health -= healthLoss
  
  if (result) {
    user.coin += coinReward
    user.exp += expReward
    
    let mensaje = `
╭━━━━━━━━━⬣
┃ ✅ *MAZMORRA COMPLETADA*
┃ Derrotaste a un ${enemy}
┃ *${coinReward}* ${global.moneda}
┃ *${expReward}* ⚡ XP
┃ -${healthLoss} ❤️ Salud
╰━━━━━━━━━⬣`
    
    conn.reply(m.chat, mensaje, m)
  } else {
    let mensaje = `
╭━━━━━━━━━⬣
┃ ❌ *DERROTA EN LA MAZMORRA*
┃ Un ${enemy} te ha vencido
┃ -${healthLoss} ❤️ Salud
╰━━━━━━━━━⬣`
    
    conn.reply(m.chat, mensaje, m)
  }
  
  if (user.health < 0) user.health = 0
}

handler.help = ['mazmorra']
handler.tags = ['rpg']
handler.command = ['mazmorra', 'dungeon']
handler.group = true
handler.register = true

export default handler

function segundosAHMS(segundos) {
  let minutos = Math.floor(segundos / 60)
  let segundosRestantes = segundos % 60
  return `${minutos} minutos y ${segundosRestantes} segundos`
}