import ws from "ws";

let handler = async (m, { conn, args, text, command, usedPrefix, isOwner }) => {
    const users = [...new Set(
        global.conns
            .filter(conn => conn.user && conn.ws?.socket && conn.ws.socket.readyState !== ws.CLOSED)
            .map(conn => conn.user.jid)
    )];

    let isSubbot = users.includes(m.sender);
    if (!isSubbot && !isOwner) return m.reply("Solo un subbot autorizado puede usar este comando.");

    if (!text) {
        return m.reply(`🌲 Por favor especifica el nuevo nombre del bot.`);
    }

    // Inicialización segura de la estructura de datos
    if (!global.db.data.settings) global.db.data.settings = {};
    if (!global.db.data.settings[conn.user.jid]) global.db.data.settings[conn.user.jid] = {};
    
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
