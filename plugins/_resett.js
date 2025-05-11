import { resetSubbot } from "../sumibot-subbots.js"

const handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) {
    return m.reply(`⚠️ Debes especificar el número del subbot a reiniciar\n\nEjemplo: ${usedPrefix}${command} 123456789`)
  }

  const targetJid = args[0].includes("@") ? args[0] : args[0] + "@s.whatsapp.net"

  m.reply("🔄 Reiniciando subbot, por favor espere...")

  const success = await resetSubbot(targetJid)

  if (success) {
    m.reply(`✅ Subbot ${args[0]} reiniciado exitosamente`)
  } else {
    m.reply(
      `❌ No se pudo reiniciar el subbot ${args[0]}. Verifica que el número sea correcto y que el subbot esté conectado.`,
    )
  }
}

handler.help = ["resetbot"]
handler.tags = ["owner"]
handler.command = ["resetbot", "resetsub", "reiniciarbot"]
handler.rowner = true

export default handler
