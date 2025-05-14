const handler = async (m, { conn, usedPrefix }) => {
  const user = global.db.data.users[m.sender]

  // Verificar que el usuario existe
  if (!user) {
    return conn.reply(m.chat, `${global.emoji || "❌"} El usuario no se encuentra en la base de Datos.`, m)
  }

  // Función para formatear números grandes
  const formatNumber = (num) => {
    return num ? num.toLocaleString() : "0"
  }

  // Calcular tiempos de espera
  const calculateCooldown = (lastTime, cooldownTime) => {
    if (!lastTime) return "Disponible"
    const timeLeft = lastTime + cooldownTime - Date.now()
    return timeLeft > 0 ? msToTime(timeLeft) : "Disponible"
  }

  // Obtener estado de cooldowns
  const miningCooldown = calculateCooldown(user.lastmiming, 600000) // 10 minutos
  const huntingCooldown = calculateCooldown(user.lastberburu, 2700000) // 45 minutos
  const adventureCooldown = calculateCooldown(user.lastAdventure, 1500000) // 25 minutos
  const chestCooldown = calculateCooldown(user.lastcofre, 86400000) // 24 horas

  const inventario = `
╭━━━━━━━━━━━━━━━━━━━━⬣
┃ *INVENTARIO DE ${conn.getName(m.sender)}*
┃
┃ 💰 *ECONOMÍA*
┃ • ${global.moneda || "💸"}: ${formatNumber(user.coin || 0)}
┃ • 💎 Diamantes: ${formatNumber(user.diamonds || 0)}
┃ • 🏦 Banco: ${formatNumber(user.bank || 0)}
┃ • ❖ Tokens: ${formatNumber(user.joincount || 0)}
┃
┃ 🧪 *POCIONES Y CONSUMIBLES*
┃ • 🧪 Pociones: ${formatNumber(user.potion || 0)}
┃ • 🍗 Comida: ${formatNumber(user.food || 0)}
┃
┃ 🔮 *RECURSOS MINADOS Y AVENTURA*
┃ • 🪵 Madera: ${formatNumber(user.wood || 0)}
┃ • 🪨 Piedra: ${formatNumber(user.stone || 0)}
┃ • 🔩 Hierro: ${formatNumber(user.iron || 0)}
┃ • 🏅 Oro: ${formatNumber(user.gold || 0)}
┃ • ♦️ Esmeralda: ${formatNumber(user.emerald || 0)}
┃ • 🕋 Carbón: ${formatNumber(user.coal || 0)}
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
┃ • ✨ Experiencia: ${formatNumber(user.exp || 0)}
┃ • 🏆 Nivel: ${user.level || 0}
┃ • 🏅 Rango: ${user.role || "Novato"}
┃
┃ 🛠️ *DURABILIDAD DE HERRAMIENTAS*
┃ • ⛏️ Pico: ${user.pickaxedurability || 0}/100
┃
┃ ⏱️ *TIEMPOS DE ESPERA*
┃ • ⛏️ Minar: ${miningCooldown}
┃ • 🏹 Cazar: ${huntingCooldown}
┃ • 🗺️ Aventura: ${adventureCooldown}
┃ • 🎁 Cofre: ${chestCooldown}
╰━━━━━━━━━━━━━━━━━━━━⬣

*COMANDOS DISPONIBLES:*
• *${usedPrefix}shop* - Comprar objetos
• *${usedPrefix}minar* - Obtener recursos minando
• *${usedPrefix}cazar* - Cazar animales
• *${usedPrefix}aventura* - Ir de aventura
• *${usedPrefix}cofre* - Abrir cofre diario
• *${usedPrefix}heal* - Curarse con pociones`

  conn.reply(m.chat, inventario, m)
}

// Función para convertir milisegundos a formato de tiempo
function msToTime(duration) {
  // Convertir a valores positivos
  duration = Math.max(0, duration)

  const milliseconds = Number.parseInt((duration % 1000) / 100)
  const seconds = Math.floor((duration / 1000) % 60)
  const minutes = Math.floor((duration / (1000 * 60)) % 60)
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24)

  // Formatear según la duración
  if (hours > 0) {
    return `${hours} h ${minutes} m`
  } else if (minutes > 0) {
    return `${minutes} m ${seconds} s`
  } else {
    return `${seconds} s`
  }
}

handler.help = ["inventario"]
handler.tags = ["rpg"]
handler.command = ["inventario", "inventory", "inv"]
handler.group = true
handler.register = true

export default handler
