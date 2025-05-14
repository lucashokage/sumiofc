const handler = async (m, { conn, usedPrefix }) => {
  const user = global.db.data.users[m.sender]

  // Verificar que el usuario existe
  if (!user) {
    return conn.reply(m.chat, "❌ No se encontraron datos de usuario.", m)
  }

  // Función para formatear números grandes
  const formatNumber = (num) => {
    return num ? num.toLocaleString() : "0"
  }

  const inventario = `
╭━━━━━━━━━⬣
┃ *INVENTARIO DE ${conn.getName(m.sender)}*
┃
┃ 💰 *ECONOMÍA*
┃ • ${global.moneda || "💸"}: ${formatNumber(user.coin || 0)}
┃ • 💎 Diamantes: ${formatNumber(user.diamonds || 0)}
┃ • 🏦 Banco: ${formatNumber(user.bank || 0)}
┃
┃ 🧪 *POCIONES Y CONSUMIBLES*
┃ • 🧪 Pociones: ${formatNumber(user.potion || 0)}
┃ • 🍗 Comida: ${formatNumber(user.food || 0)}
┃
┃ 🔮 *RECURSOS MINADOS*
┃ • 🪵 Madera: ${formatNumber(user.wood || 0)}
┃ • 🪨 Piedra: ${formatNumber(user.stone || 0)}
┃ • 🔩 Hierro: ${formatNumber(user.iron || 0)}
┃ • 🏅 Oro: ${formatNumber(user.gold || 0)}
┃ • ♦️ Esmeralda: ${formatNumber(user.emerald || 0)}
┃ • 🕋 Carbón: ${formatNumber(user.coal || 0)}
┃ • ✨ Experiencia: ${formatNumber(user.exp || 0)}
┃
┃ 🐾 *ANIMALES CAZADOS*
┃ • 🐂 Búfalo: ${formatNumber(user.banteng || 0)}
┃ • 🐅 Tigre: ${formatNumber(user.harimau || 0)}
┃ • 🐘 Elefante: ${formatNumber(user.gajah || 0)}
┃ • 🐐 Cabra: ${formatNumber(user.kambing || 0)}
┃ • 🐼 Panda: ${formatNumber(user.panda || 0)}
┃ • 🐊 Cocodrilo: ${formatNumber(user.buaya || 0)}
┃ • 🐃 Búfalo de agua: ${formatNumber(user.kerbau || 0)}
┃ • 🐮 Vaca: ${formatNumber(user.sapi || 0)}
┃ • 🐒 Mono: ${formatNumber(user.monyet || 0)}
┃ • 🐗 Jabalí: ${formatNumber(user.babihutan || 0)}
┃ • 🐖 Cerdo: ${formatNumber(user.babi || 0)}
┃ • 🐓 Pollo: ${formatNumber(user.ayam || 0)}
┃
┃ ⚔️ *ESTADÍSTICAS*
┃ • ❤️ Salud: ${user.health || 0}/100
┃ • ⚡ Experiencia: ${formatNumber(user.exp || 0)}
┃ • 🏆 Nivel: ${user.level || 0}
┃ • 🏅 Rango: ${user.role || "Novato"}
┃
┃ 🛠️ *DURABILIDAD DE HERRAMIENTAS*
┃ • ⛏️ Pico: ${user.pickaxedurability || 0}/100
┃
┃ ⏱️ *COOLDOWNS*
┃ • ⛏️ Minar: ${user.lastmiming ? formatCooldown(user.lastmiming) : "Disponible"}
┃ • 🏹 Cazar: ${user.lastberburu ? formatCooldown(user.lastberburu) : "Disponible"}
╰━━━━━━━━━⬣

Usa *${usedPrefix}shop* para comprar objetos.
Usa *${usedPrefix}minar* para obtener recursos.
Usa *${usedPrefix}cazar* para obtener animales.`

  conn.reply(m.chat, inventario, m)
}

// Función para formatear el tiempo de cooldown
function formatCooldown(lastTime) {
  const now = new Date()
  const miningCooldown = 600000 // 10 minutos para minar
  const huntingCooldown = 2700000 // 45 minutos para cazar

  const miningTime = lastTime + miningCooldown - now
  const huntingTime = lastTime + huntingCooldown - now

  if (miningTime > 0) {
    return msToTime(miningTime)
  } else if (huntingTime > 0) {
    return msToTime(huntingTime)
  } else {
    return "Disponible"
  }
}

// Función para convertir milisegundos a formato de tiempo
function msToTime(duration) {
  const seconds = Math.floor((duration / 1000) % 60)
  const minutes = Math.floor((duration / (1000 * 60)) % 60)

  return minutes + " m y " + seconds + " s"
}

handler.help = ["inventario"]
handler.tags = ["rpg"]
handler.command = ["inventario", "inventory", "inv"]
handler.group = true
handler.register = true

export default handler
