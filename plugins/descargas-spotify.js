import fetch from 'node-fetch';
import { fileTypeFromBuffer } from 'file-type';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    try {
        if (!text) {
            await m.react('❌');
            return m.reply(`✖ Debes ingresar un nombre de canción\n\nEjemplo: *${usedPrefix + command}* Believer`);
        }

        await m.react('🕒');
        
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

        const [audioResponse, imageResponse] = await Promise.all([
            fetch(songData.result.downloadUrl),
            songData.result.thumbnail ? fetch(songData.result.thumbnail) : Promise.resolve(null)
        ]);

        const audioBuffer = await audioResponse.arrayBuffer();
        const buffer = Buffer.from(audioBuffer);
        
        let thumbnailBuffer = null;
        if (imageResponse && imageResponse.ok) {
            try {
                const imageBuffer = await imageResponse.arrayBuffer();
                thumbnailBuffer = Buffer.from(imageBuffer);
            } catch (e) {
                console.error('Error al procesar imagen:', e);
            }
        }

        const fileType = await fileTypeFromBuffer(buffer);
        if (!fileType || !fileType.mime.startsWith('audio/')) {
            await m.react('❌');
            return m.reply('✖ El archivo no es un audio válido');
        }

        // Enviar primero la información con imagen
        await conn.sendMessage(m.chat, {
            image: thumbnailBuffer || 'https://i.imgur.com/7eR7NiM.jpeg',
            caption: `🎵 *${songData.result.title || text}*\n👤 Artista: ${songData.result.artist || 'Desconocido'}\n\n🔍 Búsqueda: ${text}`,
            footer: 'Powered by Spotify Downloader',
            templateButtons: [{
                urlButton: {
                    displayText: '🔗 Ver en Spotify',
                    url: songData.result.url || ''
                }
            }]
        }, { quoted: m });

        // Enviar luego el audio por separado
        await conn.sendMessage(m.chat, { 
            audio: buffer,
            mimetype: fileType.mime,
            fileName: `${(songData.result.title || text).substring(0, 64)}.${fileType.ext}`
        }, { quoted: m });
        
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
