const handler = async (m, { conn, usedPrefix }) => {
  const user = global.db.data.users[m.sender]

  // Verificar que el usuario existe
  if (!user) {
    return conn.reply(m.chat, `${global.emoji || "❌"} El usuario no se encuentra en la base de Datos.`, m)
  }

  // Función mejorada para formatear números y evitar NaN
  const formatNumber = (value) => {
    // Convertir a número si es posible, o usar 0 como valor predeterminado
    const num = Number(value) || 0
    // Asegurarse de que es un número finito
    if (!isFinite(num)) return "0"
    // Formatear con separadores de miles
    return num.toLocaleString()
  }

  // Función para obtener valor seguro
  const getSafeValue = (obj, key) => {
    if (!obj) return 0
    const value = obj[key]
    if (value === undefined || value === null) return 0
    return value
  }

  // Calcular tiempos de espera
  const calculateCooldown = (lastTime, cooldownTime) => {
    if (!lastTime) return "Disponible"
    const timeLeft = lastTime + cooldownTime - Date.now()
    return timeLeft > 0 ? msToTime(timeLeft) : "Disponible"
  }

  // Obtener estado de cooldowns
  const miningCooldown = calculateCooldown(getSafeValue(user, "lastmiming"), 600000) // 10 minutos
  const huntingCooldown = calculateCooldown(getSafeValue(user, "lastberburu"), 2700000) // 45 minutos
  const adventureCooldown = calculateCooldown(getSafeValue(user, "lastAdventure"), 1500000) // 25 minutos
  const chestCooldown = calculateCooldown(getSafeValue(user, "lastcofre"), 86400000) // 24 horas

  const inventario = `
╭━━━━━━━━━━━━━━━━━━━━⬣
┃ *INVENTARIO DE ${conn.getName(m.sender)}*
┃
┃ 💰 *ECONOMÍA*
┃ • ${global.moneda || "💸"}: ${formatNumber(getSafeValue(user, "coin"))}
┃ • 💎 Diamantes: ${formatNumber(getSafeValue(user, "diamonds"))}
┃ • 🏦 Banco: ${formatNumber(getSafeValue(user, "bank"))}
┃ • ❖ Tokens: ${formatNumber(getSafeValue(user, "joincount"))}
┃
┃ 🧪 *POCIONES Y CONSUMIBLES*
┃ • 🧪 Pociones: ${formatNumber(getSafeValue(user, "potion"))}
┃ • 🍗 Comida: ${formatNumber(getSafeValue(user, "food"))}
┃
┃ 🔮 *RECURSOS MINADOS Y AVENTURA*
┃ • 🪵 Madera: ${formatNumber(getSafeValue(user, "wood"))}
┃ • 🪨 Piedra: ${formatNumber(getSafeValue(user, "stone"))}
┃ • 🔩 Hierro: ${formatNumber(getSafeValue(user, "iron"))}
┃ • 🏅 Oro: ${formatNumber(getSafeValue(user, "gold"))}
┃ • ♦️ Esmeralda: ${formatNumber(getSafeValue(user, "emerald"))}
┃ • 🕋 Carbón: ${formatNumber(getSafeValue(user, "coal"))}
┃
┃ 🐾 *ANIMALES CAZADOS*
┃ • 🐂 Búfalo: ${formatNumber(getSafeValue(user, "banteng"))}
┃ • 🐅 Tigre: ${formatNumber(getSafeValue(user, "harimau"))}
┃ • 🐘 Elefante: ${formatNumber(getSafeValue(user, "gajah"))}
┃ • 🐐 Cabra: ${formatNumber(getSafeValue(user, "kambing"))}
┃ • 🐼 Panda: ${formatNumber(getSafeValue(user, "panda"))}
┃ • 🐊 Cocodrilo: ${formatNumber(getSafeValue(user, "buaya"))}
┃ • 🐃 Búfalo de agua: ${formatNumber(getSafeValue(user, "kerbau"))}
┃ • 🐮 Vaca: ${formatNumber(getSafeValue(user, "sapi"))}
┃ • 🐒 Mono: ${formatNumber(getSafeValue(user, "monyet"))}
┃ • 🐗 Jabalí: ${formatNumber(getSafeValue(user, "babihutan"))}
┃ • 🐖 Cerdo: ${formatNumber(getSafeValue(user, "babi"))}
┃ • 🐓 Pollo: ${formatNumber(getSafeValue(user, "ayam"))}
┃
┃ ⚔️ *ESTADÍSTICAS*
┃ • ❤️ Salud: ${getSafeValue(user, "health")}/100
┃ • ✨ Experiencia: ${formatNumber(getSafeValue(user, "exp"))}
┃ • 🏆 Nivel: ${getSafeValue(user, "level") || 0}
┃ • 🏅 Rango: ${getSafeValue(user, "role") || "Novato"}
┃
┃ 🛠️ *DURABILIDAD DE HERRAMIENTAS*
┃ • ⛏️ Pico: ${getSafeValue(user, "pickaxedurability") || 0}/100
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
