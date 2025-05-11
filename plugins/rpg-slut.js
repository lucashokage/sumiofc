let cooldowns = {}

let handler = async (m, { conn }) => {
  let user = global.db.data.users[m.sender]
  
  let tiempoEspera = 5 * 60 * 1000
  if (cooldowns[m.sender] && Date.now() - cooldowns[m.sender] < tiempoEspera) {
    let tiempoRestante = segundosAHMS(Math.ceil((cooldowns[m.sender] + tiempoEspera - Date.now()) / 1000))
    return conn.reply(m.chat, `⏱️ Espera *${tiempoRestante}* antes de volver a usar este comando.`, m)
  }
  
  cooldowns[m.sender] = Date.now()
  
  let resultado = Math.random()
  
  if (resultado < 0.4) { // 40% de probabilidad de éxito
    let ganancia = Math.floor(Math.random() * 500) + 100
    user.coin += ganancia
    
    let mensajes = [
      `Saliste a la calle y encontraste a alguien que te pagó ${ganancia} ${global.moneda} por tus servicios.`,
      `Alguien quedó muy satisfecho con tu compañía y te dio ${ganancia} ${global.moneda} como propina.`,
      `Tuviste suerte y conseguiste ${ganancia} ${global.moneda} por tu trabajo.`,
      `Te contrataron para una fiesta privada y ganaste ${ganancia} ${global.moneda}.`
    ]
    
    let mensaje = mensajes[Math.floor(Math.random() * mensajes.length)]
    conn.reply(m.chat, `${global.emoji} ${mensaje}`, m)
  } else if (resultado < 0.8) { // 40% de probabilidad de ser arrestado
    let multa = Math.floor(Math.random() * 300) + 50
    user.coin -= multa
    if (user.coin < 0) user.coin = 0
    
    let mensajes = [
      `La policía te atrapó y tuviste que pagar una multa de ${multa} ${global.moneda}.`,
      `Un oficial encubierto te arrestó. Perdiste ${multa} ${global.moneda} en la fianza.`,
      `Te denunciaron y tuviste que pagar ${multa} ${global.moneda} para evitar problemas.`,
      `Fuiste descubierto por las autoridades y te confiscaron ${multa} ${global.moneda}.`
    ]
    
    let mensaje = mensajes[Math.floor(Math.random() * mensajes.length)]
    conn.reply(m.chat, `${global.emoji2} ${mensaje}`, m)
  } else { // 20% de probabilidad de ser robado
    let robo = Math.floor(Math.random() * 500) + 200
    if (robo > user.coin) robo = user.coin
    user.coin -= robo
    if (user.coin < 0) user.coin = 0
    
    let mensajes = [
      `Un cliente te robó ${robo} ${global.moneda} y escapó.`,
      `Te tendieron una trampa y perdiste ${robo} ${global.moneda}.`,
      `Fuiste asaltado mientras trabajabas y te quitaron ${robo} ${global.moneda}.`,
      `Alguien te drogó y despertaste sin tus ${robo} ${global.moneda}.`
    ]
    
    let mensaje = mensajes[Math.floor(Math.random() * mensajes.length)]
    conn.reply(m.chat, `${global.emoji2} ${mensaje}`, m)
  }
}

handler.help = ['slut']
handler.tags = ['rpg']
handler.command = ['slut', 'prostitute']
handler.group = true
handler.register = true

export default handler

function segundosAHMS(segundos) {
  let minutos = Math.floor(segundos / 60)
  let segundosRestantes = segundos % 60
  return `${minutos} minutos y ${segundosRestantes} segundos`
}