let cooldowns = {}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  let user = global.db.data.users[m.sender]
  
  let tiempoEspera = 600000
  if (cooldowns[m.sender] && Date.now() - cooldowns[m.sender] < tiempoEspera) {
    let tiempoRestante = msToTime(cooldowns[m.sender] + tiempoEspera - Date.now())
    return conn.reply(m.chat, `《✧》 Debes esperar ${tiempoRestante} para volver a minar.`, m)
  }
  
  cooldowns[m.sender] = Date.now()
  
  let coin = pickRandom([1000, 1500, 2000, 900, 800, 1230, 2500, 1200, 1900, 899, 2700])
  let hasil = Math.floor(Math.random() * 1000)
  
  user.coin += coin
  user.exp += hasil
  
  let info = `❀ *Te has adentrando en lo profundo de las cuevas*\n\n` +
  `> *❀ Obtuviste estos recursos ❀*\n\n` +
  `✩ *Exp*: ${hasil}\n` +
  `⛀ *${global.moneda}*: ${coin}\n`
  
  await conn.reply(m.chat, info, m)
  await m.react('⛏️')
}

handler.help = ['minar']
handler.tags = ['economy']
handler.command = ['minar', 'miming', 'mine']
handler.register = true
handler.group = true

export default handler

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function msToTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 100),
  seconds = Math.floor((duration / 1000) % 60),
  minutes = Math.floor((duration / (1000 * 60)) % 60),
  hours = Math.floor((duration / (1000 * 60 * 60)) % 24)

  hours = (hours < 10) ? '0' + hours : hours
  minutes = (minutes < 10) ? '0' + minutes : minutes
  seconds = (seconds < 10) ? '0' + seconds : seconds

  return minutes + ' m y ' + seconds + ' s '
}
