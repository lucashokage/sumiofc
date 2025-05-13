import fetch from 'node-fetch';

let handler = async (m, { conn, text }) => {
    // Verificación inicial
    if (!text) {
        await m.reply(`${emoji} Por favor, ingresa un link de MediaFire.`);
        return;
    }

    try {
        // Paso 1: Indicador de procesamiento
        await conn.sendMessage(m.chat, { react: { text: "🕒", key: m.key } });

        // Paso 2: Obtención de datos con timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
        
        const apiResponse = await fetch(`https://api.agatz.xyz/api/mediafire?url=${encodeURIComponent(text)}`, {
            signal: controller.signal
        }).finally(() => clearTimeout(timeout));

        if (!apiResponse.ok) {
            throw new Error(`Error en la API: ${apiResponse.status} ${apiResponse.statusText}`);
        }

        const data = await apiResponse.json();
        
        // Validación estricta de datos
        if (!data?.data?.[0]?.link) {
            throw new Error('La API no devolvió un enlace válido');
        }

        const fileData = data.data[0];

        // Paso 3: Envío del archivo con verificación
        try {
            await conn.sendFile(
                m.chat,
                fileData.link,
                fileData.nama || 'archivo_descargado',
                `乂  *¡MEDIAFIRE - DESCARGAS!*  乂\n\n✩ *Nombre* : ${fileData.nama}\n✩ *Peso* : ${fileData.size}\n✩ *MimeType* : ${fileData.mime}\n> ${dev}`,
                m
            );
        } catch (sendError) {
            console.error('Error al enviar archivo:', sendError);
            throw new Error('No se pudo enviar el archivo. Puede ser muy grande o el formato no es compatible');
        }

        // Confirmación de éxito
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error('Error en comando mediafire:', error);
        
        // Manejo de errores específicos
        let errorMessage = '❌ Ocurrió un error';
        if (error.name === 'AbortError') {
            errorMessage = '⌛ La solicitud tardó demasiado. Intenta nuevamente';
        } else if (error.message.includes('tamaño')) {
            errorMessage = '📁 El archivo es demasiado grande para enviar por WhatsApp';
        }
        
        await m.reply(`${errorMessage}\nDetalle: ${error.message}`);
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
