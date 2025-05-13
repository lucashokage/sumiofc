import fetch from 'node-fetch';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) throw m.reply(`${emoji} Por favor, ingresa un link de MediaFire.`);
    
    try {
        // Reacción de espera
        await conn.sendMessage(m.chat, { react: { text: "🕒", key: m.key } });
        
        // Fetch a la API
        let apiUrl = `https://api.agatz.xyz/api/mediafire?url=${encodeURIComponent(text)}`;
        let response = await fetch(apiUrl);
        
        if (!response.ok) throw new Error(`Error en la API: ${response.statusText}`);
        
        let data = await response.json();
        
        // Verificar si hay datos válidos
        if (!data?.data?.[0]?.link) throw new Error('No se pudo obtener el enlace de descarga');
        
        // Enviar el archivo
        await conn.sendFile(
            m.chat, 
            data.data[0].link, 
            data.data[0].nama || 'file', 
            `乂  *¡MEDIAFIRE - DESCARGAS!*  乂\n\n✩ *Nombre* : ${data.data[0].nama}\n✩ *Peso* : ${data.data[0].size}\n✩ *MimeType* : ${data.data[0].mime}\n> ${dev}`, 
            m
        );
        
        // Reacción de éxito
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        
    } catch (error) {
        console.error('Error en mediafire:', error);
        await m.reply(`❌ Error al descargar el archivo:\n${error.message}`);
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    }
};

handler.help = ['mediafire <url>'];
handler.tags = ['descargas'];
handler.command = ['mf', 'mediafire'];
handler.coin = 10;
handler.register = true;
handler.group = true;

export default handler;
