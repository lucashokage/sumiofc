let handler = async (m, { conn, command, args, usedPrefix }) => {
  let user = global.db.data.users[m.sender]
  
  const items = {
    potion: { name: 'Poción', price: 500, description: 'Recupera 25 de salud' },
    diamond: { name: 'Diamante', price: 1000, description: 'Recurso valioso' },
    wood: { name: 'Madera', price: 100, description: 'Recurso básico' },
    stone: { name: 'Piedra', price: 150, description: 'Recurso básico' },
    iron: { name: 'Hierro', price: 300, description: 'Recurso intermedio' },
    food: { name: 'Comida', price: 200, description: 'Recupera 10 de salud' },
    emerald: { name: 'Esmeralda', price: 800, description: 'Recurso valioso' },
    gold: { name: 'Oro', price: 500, description: 'Recurso valioso' }
  }
  
  let listItems = Object.keys(items)
    .map(key => {
      let item = items[key]
      return `${key}: ${item.price} ${global.moneda}`
    })
    .join('\n')
  
  let type = (args[0] || '').toLowerCase()
  let count = Math.floor(isNumber(args[1]) ? Math.min(Math.max(parseInt(args[1]), 1), Number.MAX_SAFE_INTEGER) : 1)
  
  if (!(type in items)) {
    return conn.reply(m.chat, `
╭━━━━━━━━━⬣
┃ 🛒 *TIENDA RPG* 🛒
┃
${listItems}
┃
┃ Ejemplo de uso:
┃ *${usedPrefix + command} potion 5*
╰━━━━━━━━━⬣`, m)
  }
  
  if (user.coin < items[type].price * count) {
    return m.reply(`${global.emoji2} No tienes suficientes ${global.moneda}. Necesitas ${items[type].price * count} ${global.moneda} para comprar ${count} ${items[type].name}.`)
  }
  
  user.coin -= items[type].price * count
  
  // Incrementar el ítem en el inventario del usuario
  if (!user[type]) user[type] = 0
  user[type] += count
  
  m.reply(`${global.emoji} Has comprado ${count} ${items[type].name} por ${items[type].price * count} ${global.moneda}.`)
}

handler.help = ['shop']
handler.tags = ['rpg']
handler.command = ['shop', 'tienda', 'comprar', 'buy']
handler.group = true
handler.register = true

export default handler

function isNumber(number) {
  if (!number) return number
  number = parseInt(number)
  return typeof number == 'number' && !isNaN(number)
}