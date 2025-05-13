import fetch from 'node-fetch';

let handler = async (m, { conn, text }) => {
    if (!text) {
        await m.reply(`${emoji} Por favor, ingresa el link de un video/imagen de Pinterest.`);
        return;
    }

    try {
        await conn.sendMessage(m.chat, { react: { text: "🕒", key: m.key } });

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000); // 20 segundos timeout

        const apiResponse = await fetch(`https://api.agatz.xyz/api/pinterest?url=${encodeURIComponent(text)}`, {
            signal: controller.signal
        }).finally(() => clearTimeout(timeout));

        if (!apiResponse.ok) {
            throw new Error(`Error en la API: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        if (!data?.data?.result) {
            throw new Error('No se encontró contenido descargable en el enlace');
        }
        try {
            await conn.sendFile(
                m.chat, 
                data.data.result, 
                'pinvideo.mp4', 
                `${emoji} *Contenido de Pinterest*\n\n🔗 *Url:* ${data.data.url || text}`,
                m
            );
        } catch (sendError) {
            console.error('Error al enviar archivo:', sendError);
            throw new Error('No se pudo enviar el archivo. Puede ser muy grande o el formato no es compatible');
        }
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error('Error en comando Pinterest:', error);
        let errorMessage = '❌ Error al procesar el enlace';
        if (error.name === 'AbortError') {
            errorMessage = '⌛ Tiempo de espera agotado. Intenta nuevamente';
        }
        
        await m.reply(`${errorMessage}\n${error.message}`);
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    }
};

handler.help = ['pinvid <link>'];
handler.tags = ['descargas'];
handler.command = ['pinvideo', 'pinvid'];
handler.premium = false;
handler.group = true;
handler.register = true;
handler.coin = 2;

export default handler;
