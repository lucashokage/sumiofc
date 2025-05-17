// plugins/bot-toggle.js
// Comando para activar/desactivar el bot en grupos (solo admins)

let handler = async (m, { conn, usedPrefix, command, args }) => {
    // Verificar si el chat está en la base de datos
    if (!(m.chat in global.db.data.chats)) {
        return conn.reply(m.chat, '❌ Este chat no está registrado en la base de datos.', m);
    }

    // Verificar si el usuario es administrador
    const isAdmin = m.isGroup ? (await conn.groupMetadata(m.chat)).participants.find(p => p.id === m.sender)?.admin === 'admin' : false;
    if (!isAdmin && m.isGroup) {
        return conn.reply(m.chat, '⚠️ Solo los administradores pueden usar este comando.', m);
    }

    let chat = global.db.data.chats[m.chat];
    const botName = global.botname || 'este bot';

    if (command === 'bot') {
        if (args.length === 0) {
            const estado = chat.isBanned ? '❌ Desactivado' : '✅ Activado';
            const info = `
╭─「 *CONFIGURACIÓN DEL BOT* 」
│
│ ✦ Estado actual: ${estado}
│
│ ╭─「 *OPCIONES* 」
│ │ • ${usedPrefix}bot on - Activar el bot
│ │ • ${usedPrefix}bot off - Desactivar el bot
│ ╰─────────────
╰─────────────
`.trim();
            return conn.reply(m.chat, info, m);
        }

        const action = args[0].toLowerCase();
        
        if (action === 'off' || action === 'desactivar') {
            if (chat.isBanned) {
                return conn.reply(m.chat, `ℹ️ ${botName} ya estaba desactivado en este chat.`, m);
            }
            chat.isBanned = true;
            return conn.reply(m.chat, `✅ *${botName} desactivado* correctamente. No responderé a comandos hasta que me actives.`, m);
        } 
        
        if (action === 'on' || action === 'activar') {
            if (!chat.isBanned) {
                return conn.reply(m.chat, `ℹ️ ${botName} ya estaba activado en este chat.`, m);
            }
            chat.isBanned = false;
            return conn.reply(m.chat, `✨ ¡${botName} reactivado! Ahora puedo responder a tus comandos.`, m);
        }
        
        // Si el argumento no es válido
        return conn.reply(m.chat, `❌ Opción no válida. Usa:\n• *${usedPrefix}bot on* para activar\n• *${usedPrefix}bot off* para desactivar`, m);
    }
};

handler.help = ['bot [on/off]'];
handler.tags = ['group'];
handler.command = ['bot'];
handler.admin = true;
handler.group = true;

export default handler;
