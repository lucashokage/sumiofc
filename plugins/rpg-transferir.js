let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0] || !args[1]) return m.reply(`${global.emoji2} Uso correcto: ${usedPrefix + command} <tipo> <cantidad> <@usuario>\n\n*Ejemplo:* ${usedPrefix + command} coin 100 @usuario\n\n*Tipos disponibles:*\n- coin (monedas)\n- exp (experiencia)\n- diamond (diamantes)`)
  
  let tipo = args[0].toLowerCase()
  let cantidad = parseInt(args[1])
  let usuario = m.mentionedJid[0]
  
  if (!usuario) return m.reply(`${global.emoji2} Debes mencionar al usuario al que quieres transferir.`)
  if (isNaN(cantidad) || cantidad <= 0) return m.reply(`${global.emoji2} La cantidad debe ser un número mayor a 0.`)
  
  let sender = m.sender
  let senderUser = global.db.data.users[sender]
  let targetUser = global.db.data.users[usuario]
  
  if (!targetUser) return m.reply(`${global.emoji2} El usuario no está registrado en la base de datos.`)
  
  switch (tipo) {
    case 'coin':
    case 'coins':
    case 'moneda':
    case 'monedas':
      if (senderUser.coin < cantidad) return m.reply(`${global.emoji2} No tienes suficientes ${global.moneda} para transferir.`)
      senderUser.coin -= cantidad
      targetUser.coin += cantidad
      m.reply(`${global.emoji} Has transferido *${cantidad} ${global.moneda}* a @${usuario.split('@')[0]}.`, null, { mentions: [usuario] })
      break
      
    case 'exp':
    case 'experiencia':
      if (senderUser.exp < cantidad) return m.reply(`${global.emoji2} No tienes suficiente experiencia para transferir.`)
      senderUser.exp -= cantidad
      targetUser.exp += cantidad
      m.reply(`${global.emoji} Has transferido *${cantidad} de experiencia* a @${usuario.split('@')[0]}.`, null, { mentions: [usuario] })
      break
      
    case 'diamond':
    case 'diamonds':
    case 'diamante':
    case 'diamantes':
      if (senderUser.diamonds < cantidad) return m.reply(`${global.emoji2} No tienes suficientes diamantes para transferir.`)
      senderUser.diamonds -= cantidad
      targetUser.diamonds += cantidad
      m.reply(`${global.emoji} Has transferido *${cantidad} diamantes* a @${usuario.split('@')[0]}.`, null, { mentions: [usuario] })
      break
      
    default:
      return m.reply(`${global.emoji2} Tipo no válido. Tipos disponibles: coin, exp, diamond`)
  }
}

handler.help = ['transferir']
handler.tags = ['rpg']
handler.command = ['transferir', 'transfer', 'dar', 'give']
handler.group = true
handler.register = true

export default handler