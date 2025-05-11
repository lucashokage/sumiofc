let cooldowns = {}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  let who = m.mentionedJid[0]
  if (!who) return m.reply(`${global.emoji2} Menciona al usuario al que quieres robar.\n\nEjemplo: *${usedPrefix + command} @usuario*`)
  if (who === m.sender) return m.reply(`${global.emoji2} No puedes robarte a ti mismo.`)
  
  let user = global.db.data.users[m.sender]
  let target = global.db.data.users[who]
  
  if (!target) return m.reply(`${global.emoji2} El usuario no está registrado en la base de datos.`)
  
  let tiempoEspera = 10 * 60 * 1000
  if (cooldowns[m.sender] && Date.now() - cooldowns[m.sender] < tiempoEspera) {
    let tiempoRestante = segundosAHMS(Math.ceil((cooldowns[m.sender] + tiempoEspera - Date.now()) / 1000))
    return conn.reply(m.chat, `⏱️ Debes esperar *${tiempoRestante}* antes de volver a intentar robar.`, m)
  }
  
  cooldowns[m.sender] = Date.now()
  
  if (target.coin < 100) return m.reply(`${global.emoji2} El usuario tiene menos de 100 ${global.moneda}, no vale la pena robarle.`)
  if (target.bank > 0) {
    let bankPercentage = Math.random()
    if (bankPercentage < 0.7) { // 70% de probabilidad de que el dinero esté protegido en el banco
      return m.reply(`${global.emoji2} El usuario tiene su dinero protegido en el banco.`)
    }
  }
  
  let success = Math.random() < 0.5 // 50% de probabilidad de éxito
  
  if (success) {
    let stolenAmount = Math.floor(Math.random() * (target.coin / 2)) + 50
    if (stolenAmount > target.coin) stolenAmount = target.coin
    
    user.coin += stolenAmount
    target.coin -= stolenAmount
    
    conn.reply(m.chat, `${global.emoji} Has robado *${stolenAmount} ${global.moneda}* a @${who.split('@')[0]}.`, m, { mentions: [who] })
  } else {
    let penalty = Math.floor(Math.random() * 500) + 200
    if (penalty > user.coin) penalty = user.coin
    
    user.coin -= penalty
    
    conn.reply(m.chat, `${global.emoji2} @${who.split('@')[0]} te descubrió intentando robar y has perdido *${penalty} ${global.moneda}* como multa.`, m, { mentions: [who] })
  }
}

handler.help = ['robarcoin']
handler.tags = ['rpg']
handler.command = ['robarcoin', 'stealcoin', 'robar']
handler.group = true
handler.register = true

export default handler

function segundosAHMS(segundos) {
  let minutos = Math.floor(segundos / 60)
  let segundosRestantes = segundos % 60
  return `${minutos} minutos y ${segundosRestantes} segundos`
}