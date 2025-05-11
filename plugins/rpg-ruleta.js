let handler = async (m, { conn, args, usedPrefix, command }) => {
  let amount = parseInt(args[0])
  let user = global.db.data.users[m.sender]
  
  if (!amount || isNaN(amount) || amount < 10) 
    return m.reply(`${global.emoji2} Debes apostar al menos 10 ${global.moneda}.\n\nEjemplo: *${usedPrefix + command} 100*`)
  
  if (user.coin < amount)
    return m.reply(`${global.emoji2} No tienes suficientes ${global.moneda}. Tienes: ${user.coin}`)
  
  let result = Math.random()
  
  if (result < 0.03) { // 3% probabilidad de ganar x10
    let winAmount = amount * 10
    user.coin += winAmount - amount
    
    m.reply(`
╭━━━━━━━━━⬣
┃ 🎰 *RULETA DE LA FORTUNA* 🎰
┃
┃ 🎊 *¡PREMIO MAYOR!* 🎊
┃ Has ganado *${winAmount} ${global.moneda}*
┃ (x10 tu apuesta)
╰━━━━━━━━━⬣`)
  } else if (result < 0.15) { // 12% probabilidad de ganar x5
    let winAmount = amount * 5
    user.coin += winAmount - amount
    
    m.reply(`
╭━━━━━━━━━⬣
┃ 🎰 *RULETA DE LA FORTUNA* 🎰
┃
┃ 🎉 *¡GRAN PREMIO!* 🎉
┃ Has ganado *${winAmount} ${global.moneda}*
┃ (x5 tu apuesta)
╰━━━━━━━━━⬣`)
  } else if (result < 0.35) { // 20% probabilidad de ganar x2
    let winAmount = amount * 2
    user.coin += winAmount - amount
    
    m.reply(`
╭━━━━━━━━━⬣
┃ 🎰 *RULETA DE LA FORTUNA* 🎰
┃
┃ 🎁 *¡Premio!* 🎁
┃ Has ganado *${winAmount} ${global.moneda}*
┃ (x2 tu apuesta)
╰━━━━━━━━━⬣`)
  } else if (result < 0.5) { // 15% probabilidad de recuperar lo apostado
    m.reply(`
╭━━━━━━━━━⬣
┃ 🎰 *RULETA DE LA FORTUNA* 🎰
┃
┃ 🔄 *Empate* 🔄
┃ Recuperas tu apuesta de *${amount} ${global.moneda}*
╰━━━━━━━━━⬣`)
  } else { // 50% probabilidad de perder
    user.coin -= amount
    
    m.reply(`
╭━━━━━━━━━⬣
┃ 🎰 *RULETA DE LA FORTUNA* 🎰
┃
┃ 😔 *Perdiste* 😔
┃ Has perdido *${amount} ${global.moneda}*
╰━━━━━━━━━⬣`)
  }
}

handler.help = ['ruleta']
handler.tags = ['rpg']
handler.command = ['ruleta', 'roulette']
handler.group = true
handler.register = true

export default handler