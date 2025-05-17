import fs from 'fs/promises';

let handler = async (m, { conn, args, command, usedPrefix, isOwner }) => {
    // Verificación estricta de permisos
    if (!(conn.user.jid === m.sender || isOwner)) {
        return m.reply('🚫 Solo el owner puede usar este comando');
    }

    // Validación básica de argumentos
    if (!args[0]) {
        return m.reply(`📌 Uso: ${usedPrefix}${command} [welcome/banner]`);
    }

    const option = args[0].toLowerCase();

    // Inicialización segura de la DB
    global.db.data.settings[conn.user.jid] = global.db.data.settings[conn.user.jid] || {};
    global.db.data.settings[conn.user.jid].logo = global.db.data.settings[conn.user.jid].logo || {};

    if (option === 'welcome') {
        // Elimina solo la configuración personalizada
        delete global.db.data.settings[conn.user.jid].logo.welcome;
        return m.reply('✅ Configuración de welcome eliminada\n\nEl sistema ahora usará:\n1. Foto de perfil del usuario\n2. avatar.jpg como respaldo');
    }
    else if (option === 'banner') {
        // Elimina la configuración y muestra el banner predeterminado
        delete global.db.data.settings[conn.user.jid].logo.banner;
        return conn.sendMessage(m.chat, {
            image: { url: "https://files.catbox.moe/k2hyt1.jpg" },
            caption: '✅ Banner resetado a predeterminado'
        }, { quoted: m });
    }
    else {
        return m.reply('❌ Opción no válida. Usa "welcome" o "banner"');
    }
}

handler.help = ['dellogo <welcome/banner>'];
handler.tags = ['owner'];
handler.command = ['dellogo'];
handler.rowner = true;

export default handler;
