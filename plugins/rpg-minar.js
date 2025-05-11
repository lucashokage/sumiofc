let cooldowns = {}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  let user = global.db.data.users[m.sender]
  
  let tiempoEspera = 5 * 60 * 1000
  if (cooldowns[m.sender] && Date.now() - cooldowns[m.sender] < tiempoEspera) {
    let tiempoRestante = segundosAHMS(Math.ceil((cooldowns[m.sender] + tiempoEspera - Date.now()) / 1000))
    return conn.reply(m.chat, `⏱️ Espera *${tiempoRestante}* para volver a minar.`, m)
  }
  
  cooldowns[m.sender] = Date.now()
  
  let randomDiamonds = Math.floor(Math.random() * 10) + 1
  let randomExp = Math.floor(Math.random() * 500) + 100
  let randomCoins = Math.floor(Math.random() * 500) + 100
  
  user.diamonds += randomDiamonds
  user.exp += randomExp
  user.coin += randomCoins
  
  let mensaje = `
╭━━━━━━━━━⬣
┃ ✅ Minaste exitosamente!
┃ *${randomDiamonds}* 💎 Diamantes
┃ *${randomExp}* ⚡ XP
┃ *${randomCoins}* ${global.moneda} Monedas
╰━━━━━━━━━⬣`
  
  conn.reply(m.chat, mensaje, m)
}

handler.help = ['minar']
handler.tags = ['rpg']
handler.command = ['minar', 'minardiamantes', 'mine']
handler.group = true
handler.register = true

export default handler

function segundosAHMS(segundos) {
  let minutos = Math.floor(segundos / 60)
  let segundosRestantes = segundos % 60
  return `${minutos} minutos y ${segundosRestantes} segundos`
}