import fs from "fs";
import path from "path";

let handler = async (m, { conn, args, command, usedPrefix, isOwner }) => {
    
    let isSubbotOwner = conn.user.jid === m.sender;
    if (!isSubbotOwner && !isOwner) {
        return m.reply("⚠️ Solo el owner del bot o el número asociado a este subbot pueden usar este comando.");
    }

    if (!args[0]) {
        return m.reply(`🌲 Por favor especifica qué logo deseas resetear. Opciones:

- banner -> Resetea el banner del menú
- welcome -> Resetea la imagen de bienvenida

Ejemplo: ${usedPrefix + command} banner`);
    }

    // URL predeterminadas (cámbialas por las tuyas)
    const defaultImages = {
        banner: "https://telegra.ph/file/default-banner.jpg",
        welcome: "https://telegra.ph/file/default-welcome.jpg"
    };

    const option = args[0].toLowerCase();
    
    if (!['banner', 'welcome'].includes(option)) {
        return m.reply("Opción no válida. Usa 'banner' o 'welcome'.");
    }

    // Verificar y inicializar la estructura de datos si no existe
    if (!global.db.data.settings) global.db.data.settings = {};
    if (!global.db.data.settings[conn.user.jid]) global.db.data.settings[conn.user.jid] = {};
    if (!global.db.data.settings[conn.user.jid].logo) global.db.data.settings[conn.user.jid].logo = {};

    // Resetear a la imagen predeterminada
    global.db.data.settings[conn.user.jid].logo[option] = defaultImages[option];

    const cap = `✅ Imagen de ${option} reseteada a la predeterminada para @${conn.user.jid.split("@")[0]}`;
    
    await conn.sendMessage(m.chat, { 
        image: { url: defaultImages[option] }, 
        caption: cap,
        mentions: conn.parseMention(cap)
    }, { quoted: m });
}

handler.tags = ["serbot"];
handler.help = handler.command = ["dellogo"];
export default handler;
