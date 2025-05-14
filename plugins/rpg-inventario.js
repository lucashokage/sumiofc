const handler = async (m, { conn, usedPrefix }) => {
  const user = global.db.data.users[m.sender]

  // Verificar que el usuario existe
  if (!user) {
    return conn.reply(m.chat, `${global.emoji || "❌"} El usuario no se encuentra en la base de Datos.`, m)
  }

  // Función para formatear números
  const formatNumber = (num) => {
    return num !== undefined && num !== null ? num.toLocaleString() : "0"
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
┃ • ${global.moneda || "💸"}: ${formatNumber(user.coin)}
┃ • 💎 Diamantes: ${formatNumber(user.diamonds)}
┃ • 🏦 Banco: ${formatNumber(user.bank)}
┃ • ❖ Tokens: ${formatNumber(user.joincount)}
┃
┃ 🧪 *POCIONES Y CONSUMIBLES*
┃ • 🧪 Pociones: ${formatNumber(user.potion)}
┃ • 🍗 Comida: ${formatNumber(user.food)}
┃
┃ 🔮 *RECURSOS MINADOS Y AVENTURA*
┃ • 🪵 Madera: ${formatNumber(user.wood)}
┃ • 🪨 Piedra: ${formatNumber(user.stone)}
┃ • 🔩 Hierro: ${formatNumber(user.iron)}
┃ • 🏅 Oro: ${formatNumber(user.gold)}
┃ • ♦️ Esmeralda: ${formatNumber(user.emerald)}
┃ • 🕋 Carbón: ${formatNumber(user.coal)}
┃
┃ 🐾 *ANIMALES CAZADOS*
┃ • 🐂 Búfalo: ${formatNumber(user.banteng)}
┃ • 🐅 Tigre: ${formatNumber(user.harimau)}
┃ • 🐘 Elefante: ${formatNumber(user.gajah)}
┃ • 🐐 Cabra: ${formatNumber(user.kambing)}
┃ • 🐼 Panda: ${formatNumber(user.panda)}
┃ • 🐊 Cocodrilo: ${formatNumber(user.buaya)}
┃ • 🐃 Búfalo de agua: ${formatNumber(user.kerbau)}
┃ • 🐮 Vaca: ${formatNumber(user.sapi)}
┃ • 🐒 Mono: ${formatNumber(user.monyet)}
┃ • 🐗 Jabalí: ${formatNumber(user.babihutan)}
┃ • 🐖 Cerdo: ${formatNumber(user.babi)}
┃ • 🐓 Pollo: ${formatNumber(user.ayam)}
┃
┃ ⚔️ *ESTADÍSTICAS*
┃ • ❤️ Salud: ${user.health || 0}/100
┃ • ✨ Experiencia: ${formatNumber(user.exp)}
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
