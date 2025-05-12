let handler = async (m, { conn, text, isRowner }) => {
  if (!text) return m.reply(`${emoji} Por favor, proporciona un nombre para el bot.\n> Ejemplo: #setname Nombre/Texto`);

  const names = text.split('/');
  if (names.length !== 2) return m.reply(`${emoji} Por favor, proporciona ambos nombres separados por una barra (/) en el formato: nombre1/nombre2.`);

  // Guardar en variables globales
  global.botname = names[0].trim();
  const texto1bot = ` • Powered By ${etiqueta}`;
  global.textbot = `${names[1].trim()}${texto1bot}`;
  
  // Guardar en la base de datos del usuario para que el menú pueda acceder a él
  const botJid = conn.user.jid;
  if (!global.db.data.users[botJid]) {
    global.db.data.users[botJid] = {};
  }
  global.db.data.users[botJid].namebebot = global.botname;
  
  // También guardar en la configuración del bot
  if (!global.db.data.settings[botJid]) {
    global.db.data.settings[botJid] = {};
  }
  global.db.data.settings[botJid].botname = global.botname;
  global.db.data.settings[botJid].textbot = global.textbot;
  
  m.reply(`${emoji} El nombre del bot ha sido cambiado a: ${global.botname}\n\n> ${emoji2} El texto del bot ha sido cambiado a: ${global.textbot}`);
};

handler.help = ['setname'];
handler.tags = ['tools'];
handler.command = ['setname'];
handler.rowner = true;

export default handler;
