import fetch from 'node-fetch';
import { fileTypeFromBuffer } from 'file-type';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    try {
        if (!text) {
            await m.react('❌');
            return m.reply(`✖ Debes ingresar un nombre de canción\n\nEjemplo: *${usedPrefix + command}* Flowers`);
        }

        await m.react('🕒');
        
        // Obtener datos de la canción
        const apiUrl = `https://api.nekorinn.my.id/downloader/spotifyplay?q=${encodeURIComponent(text)}`;
        const songResponse = await fetch(apiUrl);
        
        if (!songResponse.ok) {
            await m.react('❌');
            return m.reply(`✖ Error al buscar la canción (${songResponse.status})`);
        }
        
        const songData = await songResponse.json();
        
        if (!songData?.result?.downloadUrl) {
            await m.react('❌');
            return m.reply(`✖ No se encontró "${text}" en Spotify`);
        }

        // Descargar el audio
        const audioResponse = await fetch(songData.result.downloadUrl);
        const audioBuffer = await audioResponse.arrayBuffer();
        const buffer = Buffer.from(audioBuffer);
        
        // Detectar tipo de archivo
        const fileType = await fileTypeFromBuffer(buffer);
        if (!fileType || !fileType.mime.startsWith('audio/')) {
            await m.react('❌');
            return m.reply('✖ El archivo no es un audio válido');
        }

        // Enviar el audio
        await conn.sendMessage(
            m.chat, 
            { 
                audio: buffer,
                mimetype: fileType.mime,
                fileName: `${text.substring(0, 64)}.${fileType.ext}`,
                contextInfo: {
                    externalAdReply: {
                        title: text.substring(0, 32),
                        body: 'sumi sakurasawa • Powered By ৎ୭࠭͢𓆩𝕷͢𝖊𝖔፝֟፝֟፝֟፝֟፝֟፝֟𝖓𝖊𝖑𓆪',
                        thumbnailUrl: songData.result.thumbnail || null
                    }
                }
            }, 
            { quoted: m }
        );
        
        await m.react('✅');
        
    } catch (error) {
        console.error('Error:', error);
        await m.react('❌');
        return m.reply('✖ Ocurrió un error. Intenta nuevamente');
    }
};

handler.help = ['spotify <canción>'];
handler.tags = ['descargas'];
handler.command = /^(spotify|sp)$/i;
handler.limit = true;

export default handler;
