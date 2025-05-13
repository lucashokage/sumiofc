let handler = async (m, { conn, usedPrefix, command, args: [event], text }) => {
  // Verificar si los eventos están activados
  let chat = global.db.data.chats[m.chat]
  if (!chat.welcome) {
    await m.reply(`✳️ Para usar este comando debe activar las Bienvenidas con\n\n*${usedPrefix}on welcome*`)
    return
  }

  // Mensaje de ayuda
  let helpText = `
  ┌─⊷ *EVENTOS*
  ▢ welcome
  ▢ bye
  ▢ promote
  ▢ demote
  └───────────
  
  📌 Ejemplo:
  *${usedPrefix + command}* welcome @user`

  if (!event) {
    await m.reply(helpText)
    return
  }

  try {
    // Procesar menciones
    let mentions = text.replace(event, '').trimStart()
    let who = mentions ? conn.parseMention(mentions) : []
    let part = who.length ? who : [m.sender]
    
    await m.reply(`✅ Simulando ${event}...`)

    // Determinar la acción
    let action
    switch (event.toLowerCase()) {
      case 'add':
      case 'bienvenida':
      case 'invite':
      case 'welcome':
        action = 'add'
        break
      case 'bye':
      case 'despedida':
      case 'leave':
      case 'remove':
        action = 'remove'
        break
      case 'promote':
      case 'promover':
        action = 'promote'
        break
      case 'demote':
      case 'degradar':
        action = 'demote'
        break
      default:
        await m.reply(helpText)
        return
    }

    // Ejecutar la acción
    if (action) {
      await conn.participantsUpdate({
        id: m.chat,
        participants: part,
        action: action
      })
      await m.reply(`✔️ Evento ${event} simulado correctamente`)
    }
  } catch (error) {
    console.error('Error en el comando simular:', error)
    await m.reply(`❌ Ocurrió un error al simular el evento:\n${error.message}`)
  }
}

handler.help = ['simulate <event> @user']
handler.tags = ['group']
handler.command = ['simular', 'simulate'] 
handler.admin = true
handler.group = true

export default handler
