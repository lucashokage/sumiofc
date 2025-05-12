import fetch from 'node-fetch';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    try {
        if (!text) throw new Error(`❀ Por favor, ingresa el nombre de una canción de Spotify.\nEjemplo: *${usedPrefix + command}* Believer`);
        
        await m.react('🕒');
        
        const apiUrl = `https://api.nekorinn.my.id/downloader/spotifyplay?q=${encodeURIComponent(text)}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) throw new Error(`❀ Error en la API: ${response.status} ${response.statusText}`);
        
        const data = await response.json();
        
        if (!data?.result?.downloadUrl) throw new Error('❀ No se encontró la canción o no está disponible para descarga.');
        
        await conn.sendMessage(
            m.chat, 
            { 
                audio: { 
                    url: data.result.downloadUrl 
                }, 
                mimetype: 'audio/mpeg',
                contextInfo: {
                    externalAdReply: {
                        title: `🎵 ${text}`,
                        body: 'Descargado usando Spotify Downloader',
                        thumbnail: (data.result.thumbnail || 'https://i.imgur.com/7eR7NiM.jpeg')
                    }
                }
            }, 
            { quoted: m }
        );
        
        await m.react('✅');
        
    } catch (error) {
        console.error('Error en el comando spotify:', error);
        await m.react('❌');
        await m.reply(`❀ Ocurrió un error al procesar tu solicitud:\n${error.message}\n\nPor favor, intenta con otro nombre o más tarde.`);
    }
};

handler.help = ['spotify <nombre de la canción>'];
handler.tags = ['descargas', 'audio'];
handler.command = /^(spotify|music)$/i;
handler.limit = true;
handler.register = true;

export default handler;
