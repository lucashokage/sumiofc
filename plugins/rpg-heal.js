let handler = async (m, { args, usedPrefix }) => {
  let user = global.db.data.users[m.sender]
  
  if (user.health >= 100) return m.reply(`${global.emoji2} Tu salud ya está completa.`)
  
  let healAmount = 0
  let potionCost = 0
  
  if (args[0] === 'all') {
    healAmount = 100 - user.health
    potionCost = Math.ceil(healAmount / 10)
  } else {
    healAmount = parseInt(args[0]) || 10
    potionCost = Math.ceil(healAmount / 10)
  }
  
  if (user.potion < potionCost) return m.reply(`${global.emoji2} No tienes suficientes pociones. Necesitas ${potionCost} pociones para curar ${healAmount} de salud.\n\nUsa *${usedPrefix}buy potion ${potionCost}* para comprar pociones.`)
  
  user.potion -= potionCost
  user.health += healAmount
  
  if (user.health > 100) user.health = 100
  
  m.reply(`
╭━━━━━━━━━⬣
┃ ✅ *CURACIÓN EXITOSA*
┃ Usaste ${potionCost} pociones
┃ Recuperaste ${healAmount} de salud
┃ Salud actual: ${user.health}/100
╰━━━━━━━━━⬣`)
}

handler.help = ['heal']
handler.tags = ['rpg']
handler.command = ['heal', 'curar']
handler.group = true
handler.register = true

export default handler