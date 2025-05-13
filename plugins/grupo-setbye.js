const handler = async (m, { conn, text, isROwner, isOwner }) => {
  if (text) {
    // Asegurarse de que la estructura de datos existe
    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}

    // Guardar el mensaje de despedida personalizado
    global.db.data.chats[m.chat].sBye = text
    m.reply(`✅ Mensaje de despedida actualizado correctamente`)
  } else {
    throw `✳️ Por favor, ingresa el texto para el mensaje de despedida\n\nEjemplo: .setbye Gracias por estar con nosotros`
  }
}

handler.help = ["setbye <texto>"]
handler.tags = ["group"]
handler.command = ["setbye"]
handler.admin = true
handler.group = true

export default handler
