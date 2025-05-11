import fs from "fs";
import path from "path";
import crypto from "crypto";
import fetch from "node-fetch";
import FormData from "form-data";
import ws from "ws";

let handler = async (m, { conn, args, text, command, usedPrefix, isOwner }) => {
    const users = [...new Set(
        global.conns
            .filter(conn => conn.user && conn.ws?.socket && conn.ws.socket.readyState !== ws.CLOSED)
            .map(conn => conn.user.jid)
    )];

    let isSubbot = users.includes(m.sender);
    if (!isSubbot && !isOwner) return m.reply("⚠️ Solo un subbot autorizado puede usar este comando.");

    if (!args[0]) {
        return m.reply(`🌲 Por favor especifica la categoría en la que desea cambiar la imagen. Lista :

- welcome -> Cambia la imagen del welcome.
- banner -> Cambia la imagen del menú.

## Ejemplo :
${usedPrefix + command} welcome
`);
    }

    let q = m.quoted ? m.quoted : m;
    if (!q) return m.reply(`🌱 Responde a una imagen para cambiar el logo del bot.`);

    let buffer;
    try {
        buffer = await q.download();
    } catch (e) {
        if (q.url) {
            buffer = await fetch(q.url).then(res => res.buffer());
        }
    }
    if (!buffer) return m.reply("No se pudo descargar el archivo, intenta responder a una imagen primero.");

    let mimeType = q.mimetype || "application/octet-stream";
    let ext = mimeType.includes("/") ? mimeType.split("/")[1] : "bin";
    let name = crypto.randomBytes(5).toString("hex") + "." + ext;
    let filePath = `./${name}`;
    fs.writeFileSync(filePath, buffer);

    let file = await upload(filePath);
    fs.unlinkSync(filePath);

    if (!file || !file[0]?.url) return m.reply("Error al subir el archivo.");

    let isWel = /wel|welcome$/.test(args[0]?.toLowerCase() || "");
    let cap = `
≡ 🌴 Se ha cambiado con éxito la imagen ${isWel ? "de la bienvenida" : "del menú"} para @${conn.user.jid.split("@")[0]}
`;

    // Inicialización segura de la estructura de datos
    if (!global.db.data.settings) global.db.data.settings = {};
    if (!global.db.data.settings[conn.user.jid]) global.db.data.settings[conn.user.jid] = {};
    if (!global.db.data.settings[conn.user.jid].logo) global.db.data.settings[conn.user.jid].logo = {};

    if (args[0] === "banner" || args[0] === "welcome") {
        global.db.data.settings[conn.user.jid].logo[args[0]] = file[0].url;
        conn.sendMessage(m.chat, { image: { url: file[0].url }, caption: cap, mentions: conn.parseMention(cap) }, { quoted: m });
    } else {
        return m.reply("No coincide con ninguna opción de la lista.");
    }
}
handler.tags = ["serbot"];
handler.help = handler.command = ["setlogo"];
export default handler;

async function upload(filePath) {
    try {
        const formData = new FormData();
        formData.append("file", fs.createReadStream(filePath));

        const response = await fetch("https://cdnmega.vercel.app/upload", {
            method: "POST",
            body: formData,
            headers: formData.getHeaders()
        });

        const result = await response.json();
        return result.success ? result.files : null;
    } catch (error) {
        console.error("Error al subir archivo:", error);
        return null;
    }
}
