const handler = async (m, { conn, text, isROwner, isOwner }) => {
  if (text) {
    // Asegurarse de que la estructura de datos existe
    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}

    // Guardar el mensaje de bienvenida personalizado
    global.db.data.chats[m.chat].sWelcome = text
    m.reply(`✅ Mensaje de bienvenida actualizado correctamente`)
  } else {
    throw `✳️ Por favor, ingresa el texto para el mensaje de bienvenida\n\nEjemplo: .setwelcome Bienvenido a nuestro grupo!`
  }
}

handler.help = ["setwelcome <texto>"]
handler.tags = ["group"]
handler.command = ["setwelcome"]
handler.admin = true
handler.group = true

export default handler
