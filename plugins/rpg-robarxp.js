let cooldowns = {}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  let who = m.mentionedJid[0]
  if (!who) return m.reply(`${global.emoji2} Menciona al usuario al que quieres robar XP.\n\nEjemplo: *${usedPrefix + command} @usuario*`)
  if (who === m.sender) return m.reply(`${global.emoji2} No puedes robarte a ti mismo.`)
  
  let user = global.db.data.users[m.sender]
  let target = global.db.data.users[who]
  
  if (!target) return m.reply(`${global.emoji2} El usuario no está registrado en la base de datos.`)
  
  let tiempoEspera = 10 * 60 * 1000
  if (cooldowns[m.sender] && Date.now() - cooldowns[m.sender] < tiempoEspera) {
    let tiempoRestante = segundosAHMS(Math.ceil((cooldowns[m.sender] + tiempoEspera - Date.now()) / 1000))
    return conn.reply(m.chat, `⏱️ Debes esperar *${tiempoRestante}* antes de volver a intentar robar XP.`, m)
  }
  
  cooldowns[m.sender] = Date.now()
  
  if (user.level < 5) return m.reply(`${global.emoji2} Necesitas ser nivel 5 o superior para robar XP.`)
  if (target.exp < 100) return m.reply(`${global.emoji2} El usuario tiene muy poca XP para robar.`)
  
  let success = Math.random() < 0.6 // 60% de probabilidad de éxito
  
  if (success) {
    let stolenXP = Math.floor(Math.random() * 500) + 100
    if (stolenXP > target.exp) stolenXP = target.exp
    
    user.exp += stolenXP
    target.exp -= stolenXP
    
    conn.reply(m.chat, `${global.emoji} Has robado *${stolenXP} XP* a @${who.split('@')[0]}.`, m, { mentions: [who] })
  } else {
    let penalty = Math.floor(Math.random() * 300) + 100
    if (penalty > user.exp) penalty = user.exp
    
    user.exp -= penalty
    
    conn.reply(m.chat, `${global.emoji2} @${who.split('@')[0]} te descubrió intentando robar XP y has perdido *${penalty} XP* como castigo.`, m, { mentions: [who] })
  }
}

handler.help = ['robarxp']
handler.tags = ['rpg']
handler.command = ['robarxp', 'stealxp']
handler.group = true
handler.register = true

export default handler

function segundosAHMS(segundos) {
  let minutos = Math.floor(segundos / 60)
  let segundosRestantes = segundos % 60
  return `${minutos} minutos y ${segundosRestantes} segundos`
}