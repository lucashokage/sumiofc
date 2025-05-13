import fetch from 'node-fetch';

let handler = async (m, { conn, text }) => {
    if (!text) throw m.reply(`${emoji} Por favor, ingresa un link de MediaFire.`);
    
    try {
        // Reacción de espera ⏳
        await conn.sendMessage(m.chat, { react: { text: "🕒", key: m.key } });

        // 1. Obtener datos de la API
        const apiResponse = await fetch(`https://api.agatz.xyz/api/mediafire?url=${encodeURIComponent(text)}`);
        if (!apiResponse.ok) throw new Error('❌ La API no respondió correctamente.');

        const data = await apiResponse.json();
        if (!data?.data?.[0]?.link) throw new Error('🔹 No se encontró ningún archivo en el enlace.');

        const fileData = data.data[0];

        // 2. Enviar el archivo (con manejo de errores)
        await conn.sendFile(
            m.chat,
            fileData.link,
            fileData.nama || 'archivo_descargado',
            `乂  *¡MEDIAFIRE - DESCARGAS!*  乂\n\n✩ *Nombre* : ${fileData.nama}\n✩ *Peso* : ${fileData.size}\n✩ *MimeType* : ${fileData.mime}\n> ${dev}`,
            m
        ).catch(() => m.reply('❌ No se pudo enviar el archivo. ¿Tal vez es muy grande?'));

        // 3. Reacción de éxito ✅
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error(error);
        await m.reply(`❌ *Error al descargar:* ${error.message}`);
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
