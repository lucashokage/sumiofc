let handler = async (m, { conn, usedPrefix }) => {
  let user = global.db.data.users[m.sender]
  
  let inventario = `
╭━━━━━━━━━⬣
┃ *INVENTARIO DE ${conn.getName(m.sender)}*
┃
┃ 💰 *ECONOMÍA*
┃ • ${global.moneda}: ${user.coin || 0}
┃ • 💎 Diamantes: ${user.diamonds || 0}
┃ • 🏦 Banco: ${user.bank || 0}
┃
┃ 🧪 *POCIONES Y CONSUMIBLES*
┃ • 🧪 Pociones: ${user.potion || 0}
┃ • 🍗 Comida: ${user.food || 0}
┃
┃ 🔮 *RECURSOS*
┃ • 🪵 Madera: ${user.wood || 0}
┃ • 🪨 Piedra: ${user.stone || 0}
┃ • 🔩 Hierro: ${user.iron || 0}
┃ • 🏅 Oro: ${user.gold || 0}
┃ • ♦️ Esmeralda: ${user.emerald || 0}
┃ • 🕋 Carbón: ${user.coal || 0}
┃
┃ 🐾 *ANIMALES CAZADOS*
┃ • 🐂 Búfalo: ${user.banteng || 0}
┃ • 🐅 Tigre: ${user.harimau || 0}
┃ • 🐘 Elefante: ${user.gajah || 0}
┃ • 🐐 Cabra: ${user.kambing || 0}
┃ • 🐼 Panda: ${user.panda || 0}
┃ • 🐊 Cocodrilo: ${user.buaya || 0}
┃ • 🐃 Búfalo de agua: ${user.kerbau || 0}
┃ • 🐮 Vaca: ${user.sapi || 0}
┃ • 🐒 Mono: ${user.monyet || 0}
┃ • 🐗 Jabalí: ${user.babihutan || 0}
┃ • 🐖 Cerdo: ${user.babi || 0}
┃ • 🐓 Pollo: ${user.ayam || 0}
┃
┃ ⚔️ *ESTADÍSTICAS*
┃ • ❤️ Salud: ${user.health || 0}/100
┃ • ⚡ Experiencia: ${user.exp || 0}
┃ • 🏆 Nivel: ${user.level || 0}
┃ • 🏅 Rango: ${user.role || 'Novato'}
╰━━━━━━━━━⬣

Usa *${usedPrefix}shop* para comprar objetos.`

  conn.reply(m.chat, inventario, m)
}

handler.help = ['inventario']
handler.tags = ['rpg']
handler.command = ['inventario', 'inventory', 'inv']
handler.group = true
handler.register = true

export default handler