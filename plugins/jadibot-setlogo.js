import fs from "fs";
import path from "path";
import crypto from "crypto";
import fetch from "node-fetch";
import FormData from "form-data";

let handler = async (m, { conn, args, text, command, usedPrefix, isOwner }) => {
    let isSubbotOwner = conn.user.jid === m.sender;
    if (!isSubbotOwner && !isOwner) {
        return m.reply("⚠️ Solo el owner del bot o el número asociado a este subbot pueden usar este comando.");
    }

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

    let fileUrl;
    try {
        fileUrl = await uploadToServer(filePath);
        if (!fileUrl) {
            fileUrl = await uploadToAlternativeServer(filePath);
        }
    } catch (e) {
        console.error(e);
    } finally {
        fs.unlinkSync(filePath);
    }

    if (!fileUrl) return m.reply("Error al subir el archivo a ningún servidor.");

    let isWel = /wel|welcome$/.test(args[0]?.toLowerCase() || "");
    let cap = `≡ 🌴 Se ha cambiado con éxito la imagen ${isWel ? "de la bienvenida" : "del menú"} para @${conn.user.jid.split("@")[0]}`;

    if (!global.db.data.settings) global.db.data.settings = {};
    if (!global.db.data.settings[conn.user.jid]) global.db.data.settings[conn.user.jid] = {};
    if (!global.db.data.settings[conn.user.jid].logo) global.db.data.settings[conn.user.jid].logo = {};

    if (args[0] === "banner" || args[0] === "welcome") {
        global.db.data.settings[conn.user.jid].logo[args[0]] = fileUrl;
        conn.sendMessage(m.chat, { image: { url: fileUrl }, caption: cap, mentions: conn.parseMention(cap) }, { quoted: m });
    } else {
        return m.reply("No coincide con ninguna opción de la lista.");
    }
}

handler.tags = ["serbot"];
handler.help = handler.command = ["setlogo"];
export default handler;

async function uploadToServer(filePath) {
    try {
        const formData = new FormData();
        formData.append("file", fs.createReadStream(filePath));

        const response = await fetch("https://telegra.ph/upload", {
            method: "POST",
            body: formData,
            headers: formData.getHeaders()
        });

        const result = await response.json();
        if (Array.isArray(result) && result[0]?.src) {
            return `https://telegra.ph${result[0].src}`;
        }
        return null;
    } catch (error) {
        console.error(error);
        return null;
    }
}

async function uploadToAlternativeServer(filePath) {
    try {
        const formData = new FormData();
        formData.append("file", fs.createReadStream(filePath));

        const response = await fetch("https://file.io", {
            method: "POST",
            body: formData,
            headers: formData.getHeaders()
        });

        const result = await response.json();
        if (result.success) {
            return result.link;
        }
        return null;
    } catch (error) {
        console.error(error);
        return null;
    }
}
