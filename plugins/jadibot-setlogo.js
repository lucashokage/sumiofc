import fs from "fs";
import path from "path";
import crypto from "crypto";
import fetch from "node-fetch";
import { FormData, Blob } from "formdata-node";
import { fileTypeFromBuffer } from "file-type";

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

    // Validar que sea una imagen
    if (!isImageValid(buffer)) {
        return m.reply("El archivo enviado no es una imagen válida.");
    }

    let link;
    try {
        link = await catbox(buffer);
    } catch (e) {
        console.error(e);
        return m.reply("Error al subir la imagen a catbox.");
    }

    let isWel = /wel|welcome$/.test(args[0]?.toLowerCase() || "");
    let cap = `≡ 🌴 Se ha cambiado con éxito la imagen ${isWel ? "de la bienvenida" : "del menú"} para @${conn.user.jid.split("@")[0]}`;

    // Inicialización segura de la estructura de datos
    if (!global.db.data.settings) global.db.data.settings = {};
    if (!global.db.data.settings[conn.user.jid]) global.db.data.settings[conn.user.jid] = {};
    if (!global.db.data.settings[conn.user.jid].logo) global.db.data.settings[conn.user.jid].logo = {};

    if (args[0] === "banner" || args[0] === "welcome") {
        global.db.data.settings[conn.user.jid].logo[args[0]] = link;
        await conn.sendMessage(m.chat, { 
            image: { url: link }, 
            caption: cap, 
            mentions: conn.parseMention(cap) 
        }, { quoted: m });
    } else {
        return m.reply("No coincide con ninguna opción de la lista.");
    }
}

const isImageValid = (buffer) => {
    const magicBytes = buffer.slice(0, 4).toString('hex');

    // JPEG
    if (magicBytes === 'ffd8ffe0' || magicBytes === 'ffd8ffe1' || magicBytes === 'ffd8ffe2') {
        return true;
    }

    // PNG
    if (magicBytes === '89504e47') {
        return true;
    }

    // GIF
    if (magicBytes === '47494638') {
        return true;
    }

    return false;
};

handler.tags = ["serbot"];
handler.help = handler.command = ["setlogo"];
export default handler;

async function catbox(content) {
    const { ext, mime } = (await fileTypeFromBuffer(content)) || {};
    const blob = new Blob([content.toArrayBuffer()], { type: mime });
    const formData = new FormData();
    const randomBytes = crypto.randomBytes(5).toString("hex");
    formData.append("reqtype", "fileupload");
    formData.append("fileToUpload", blob, randomBytes + "." + ext);

    const response = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: formData,
        headers: {
            "User-Agent":
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36",
        },
    });

    return await response.text();
}
