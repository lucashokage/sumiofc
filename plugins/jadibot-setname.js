import ws from "ws";

let handler = async (m, { conn, args, text, command, usedPrefix, isOwner }) => {
    let isSubbotOwner = conn.user.jid === m.sender;
    if (!isSubbotOwner && !isOwner) {
        return m.reply("⚠️ Solo el owner del bot o el número asociado a este subbot pueden usar este comando.");
    }

    if (!text) {
        return m.reply(`🌲 Por favor especifica el nuevo nombre del bot.`);
    }

    global.db.data.settings[conn.user.jid].botName = text;
    let cap = `
≡ 🌴 Se ha cambiado con éxito el nombre para @${conn.user.jid.split("@")[0]}

🌿 Nuevo nombre : ${text}
`;
    conn.reply(m.chat, cap, m, { mentions: conn.parseMention(cap) });
}

handler.tags = ["serbot"];
handler.help = handler.command = ["setname"];
export default handler;
