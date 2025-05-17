export async function before(m) {
  // Ignorar si no es un comando con prefijo
  if (!m.text || !global.prefix.test(m.text)) {
    return;
  }

  const usedPrefix = global.prefix.exec(m.text)[0];
  const fullCommand = m.text.slice(usedPrefix.length).trim();
  const command = fullCommand.split(' ')[0].toLowerCase();

  // Función para validar comandos
  const validCommand = (cmd, plugins) => {
    for (let plugin of Object.values(plugins)) {
      if (plugin.command && 
          (Array.isArray(plugin.command) ? 
           plugin.command : [plugin.command])
          .some(c => c.toLowerCase() === cmd)) {
        return true;
      }
    }
    return false;
  };

  // Permitir siempre el comando 'bot' aunque esté desactivado
  if (command === "bot") {
    return;
  }

  // Verificar si el comando existe
  if (validCommand(command, global.plugins)) {
    let chat = global.db.data.chats[m.chat];
    let user = global.db.data.users[m.sender];

    // Verificar si el bot está desactivado en este chat
    if (chat?.isBanned) {
      const botName = global.botname || 'este bot';
      const avisoDesactivado = `╭─「 *BOT DESACTIVADO* 」
│
│ ✦ El bot *${botName}* está desactivado
│   en este grupo.
│
│ ╭─「 *INFORMACIÓN* 」
│ │ • Solo administradores pueden
│ │   reactivarlo
│ │ • Usa: *${usedPrefix}bot on*
│ ╰─────────────────
╰─────────────────`.trim();
      
      await m.reply(avisoDesactivado);
      return true; // Detener el procesamiento del comando
    }

    // Contabilizar uso de comandos
    if (!user.commands) user.commands = 0;
    user.commands += 1;
  } else {
    // Comando no reconocido
    const comando = fullCommand.split(' ')[0];
    await m.reply(`❌ El comando *${comando}* no existe.\n\nℹ️ Usa *${usedPrefix}help* para ver la lista de comandos disponibles.`);
    return true;
  }
}
