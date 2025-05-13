import fetch from 'node-fetch';

let handler = async (m, { conn, text }) => {
    if (!text) throw new Error('🔹 *Por favor, ingresa un enlace de MediaFire.*\n\nEjemplo: `.mediafire https://www.mediafire.com/...`');
    
    try {
        // Reacción de espera ⏳
        await conn.sendMessage(m.chat, { react: { text: '🕒', key: m.key } });

        // 1. Obtener datos de la API
        const apiUrl = `https://api.agatz.xyz/api/mediafire?url=${encodeURIComponent(text)}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) throw new Error(`❌ La API falló (${response.status})`);
        
        const data = await response.json();
        
        // 2. Verificar si la respuesta es válida
        if (!data?.data?.[0]?.link) throw new Error('🔹 No se encontró ningún archivo en el enlace proporcionado.');

        const fileInfo = data.data[0];
        
        // 3. Enviar el archivo con manejo de errores
        await conn.sendFile(
            m.chat,
            fileInfo.link,
            fileInfo.nama || 'archivo_descargado',
            `📥 *DESCARGA DE MEDIAFIRE*\n\n` +
            `🔹 *Nombre:* ${fileInfo.nama || 'Sin nombre'}\n` +
            `📦 *Tamaño:* ${fileInfo.size || 'Desconocido'}\n` +
            `📄 *Tipo:* ${fileInfo.mime || 'No especificado'}\n\n` +
            `⚡ *Enviado por:* ${conn.user.name}`,
            m
        ).catch(async (err) => {
            console.error('Error al enviar el archivo:', err);
            await m.reply('❌ *No se pudo enviar el archivo.*\nPosiblemente es demasiado grande o el enlace está roto.');
        });

        // 4. Reacción de éxito ✅
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error('Error en el comando mediafire:', error);
        await m.reply(`❌ *Ocurrió un error:*\n${error.message}`);
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    }
};

handler.help = ['mediafire <url>'];
handler.tags = ['descargas'];
handler.command = ['mediafire', 'mf'];
handler.coin = 10;
handler.register = true;
handler.group = true;

export default handler;
