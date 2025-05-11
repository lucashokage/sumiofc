let handler = async (m, { args, usedPrefix, command }) => {
  let count = parseInt(args[0])
  let user = global.db.data.users[m.sender]
  
  if (!count) return m.reply(`${global.emoji2} Debes especificar la cantidad de ${global.moneda} que deseas apostar.\n\nEjemplo: *${usedPrefix + command} 100*`)
  if (isNaN(count) || count <= 0) return m.reply(`${global.emoji2} La cantidad debe ser un número mayor a 0.`)
  if (user.coin < count) return m.reply(`${global.emoji2} No tienes suficientes ${global.moneda}. Tienes: ${user.coin}`)
  
  let emojis = ["🍎", "🍌", "🍇", "🍊", "🍋", "🍑", "🍓", "🍒", "🍈", "🍍"]
  
  let a = Math.floor(Math.random() * emojis.length)
  let b = Math.floor(Math.random() * emojis.length)
  let c = Math.floor(Math.random() * emojis.length)
  
  let x = [], y = [], z = []
  for (let i = 0; i < 3; i++) {
    x[i] = emojis[a]
    a++
    if (a == emojis.length) a = 0
  }
  for (let i = 0; i < 3; i++) {
    y[i] = emojis[b]
    b++
    if (b == emojis.length) b = 0
  }
  for (let i = 0; i < 3; i++) {
    z[i] = emojis[c]
    c++
    if (c == emojis.length) c = 0
  }
  
  let end
  if (a == b && b == c) {
    end = `¡JACKPOT! 🎉 Ganaste *${count * 5} ${global.moneda}*`
    user.coin += count * 4
  } else if (a == b || a == c || b == c) {
    end = `🎉 Casi lo logras, ganaste *${count * 2} ${global.moneda}*`
    user.coin += count
  } else {
    end = `😔 Perdiste *${count} ${global.moneda}*`
    user.coin -= count
  }
  
  let result = `
╭━━━━━━━━━⬣
┃ 🎰 *SLOT MACHINE* 🎰
┃
┃ ${x[0]} : ${y[0]} : ${z[0]}
┃ ${x[1]} : ${y[1]} : ${z[1]} ◄━━
┃ ${x[2]} : ${y[2]} : ${z[2]}
┃
┃ ${end}
╰━━━━━━━━━⬣`

  m.reply(result)
}

handler.help = ['slot']
handler.tags = ['rpg']
handler.command = ['slot', 'tragamonedas']
handler.group = true
handler.register = true

export default handler