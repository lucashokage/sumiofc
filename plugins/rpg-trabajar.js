let cooldowns = {}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  let user = global.db.data.users[m.sender]
  
  let tiempoEspera = 5 * 60 * 1000
  if (cooldowns[m.sender] && Date.now() - cooldowns[m.sender] < tiempoEspera) {
    let tiempoRestante = segundosAHMS(Math.ceil((cooldowns[m.sender] + tiempoEspera - Date.now()) / 1000))
    return conn.reply(m.chat, `⏱️ Espera *${tiempoRestante}* para volver a trabajar.`, m)
  }
  
  cooldowns[m.sender] = Date.now()
  
  let trabajos = [
    { nombre: 'Programador', pago: Math.floor(Math.random() * 500) + 300 },
    { nombre: 'Diseñador Gráfico', pago: Math.floor(Math.random() * 400) + 250 },
    { nombre: 'Contador', pago: Math.floor(Math.random() * 450) + 280 },
    { nombre: 'Chef', pago: Math.floor(Math.random() * 350) + 200 },
    { nombre: 'Mecánico', pago: Math.floor(Math.random() * 380) + 230 },
    { nombre: 'Vendedor', pago: Math.floor(Math.random() * 300) + 180 },
    { nombre: 'Profesor', pago: Math.floor(Math.random() * 420) + 260 },
    { nombre: 'Repartidor', pago: Math.floor(Math.random() * 280) + 150 },
    { nombre: 'Médico', pago: Math.floor(Math.random() * 550) + 350 },
    { nombre: 'Electricista', pago: Math.floor(Math.random() * 400) + 240 }
  ]
  
  let trabajo = trabajos[Math.floor(Math.random() * trabajos.length)]
  let expGanada = Math.floor(Math.random() * 200) + 100
  
  user.coin += trabajo.pago
  user.exp += expGanada
  
  let mensaje = `
╭━━━━━━━━━⬣
┃ ✅ *TRABAJO COMPLETADO*
┃ Trabajaste como ${trabajo.nombre}
┃ *${trabajo.pago}* ${global.moneda}
┃ *${expGanada}* ⚡ XP
╰━━━━━━━━━⬣`
  
  conn.reply(m.chat, mensaje, m)
}

handler.help = ['trabajar']
handler.tags = ['rpg']
handler.command = ['trabajar', 'work']
handler.group = true
handler.register = true

export default handler

function segundosAHMS(segundos) {
  let minutos = Math.floor(segundos / 60)
  let segundosRestantes = segundos % 60
  return `${minutos} minutos y ${segundosRestantes} segundos`
}