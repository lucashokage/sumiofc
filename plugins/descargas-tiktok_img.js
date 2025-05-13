import axios from 'axios';
import cheerio from 'cheerio';

let handler = async (m, { conn, text }) => {
    // Verificación inicial
    if (!text) {
        await m.reply(`${emoji} Por favor, ingresa el link de la imagen de TikTok a descargar.`);
        return;
    }

    try {
        // Configuración de URLs y headers
        const mainUrl = `https://dlpanda.com/id?url=${encodeURIComponent(text)}&token=G7eRpMaa`;
        const backupUrl = `https://dlpanda.com/id?url=${encodeURIComponent(text)}&token51=G32254GLM09MN89Maa`;
        const creator = 'KenisawaDev';
        
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/117.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'id,en-US;q=0.7,en;q=0.3',
            'Connection': 'keep-alive'
        };

        // Paso 1: Intentar con la URL principal
        let response;
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000);
            
            response = await axios.get(mainUrl, {
                headers,
                signal: controller.signal
            }).finally(() => clearTimeout(timeout));
        } catch (mainError) {
            console.log('Fallando a backup URL:', mainError.message);
            
            // Paso 2: Intentar con la URL de respaldo
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000);
            
            response = await axios.get(backupUrl, {
                headers,
                signal: controller.signal
            }).finally(() => clearTimeout(timeout));
        }

        // Procesar el HTML
        const $ = cheerio.load(response.data);
        const imgElements = $('div.col-md-12 > img');
        
        if (imgElements.length === 0) {
            throw new Error(`${emoji2} No se encontraron imágenes en el enlace proporcionado`);
        }

        // Extraer URLs de imágenes
        const imgUrls = imgElements.map((i, el) => $(el).attr('src')).get();
        
        // Enviar imágenes una por una
        for (const imgUrl of imgUrls) {
            try {
                await conn.sendFile(m.chat, imgUrl, 'tiktok_image.jpg', '', m);
                await m.react('✅');
            } catch (sendError) {
                console.error('Error al enviar imagen:', sendError);
                await m.react('❌');
            }
        }

    } catch (error) {
        console.error('Error en el comando tiktokimg:', error);
        await m.reply(`${emoji2} Error al procesar el enlace: ${error.message}`);
        await m.react('✖️');
    }
};

handler.help = ['tiktokimg <url>'];
handler.tags = ['descargas'];
handler.command = ['tiktokimg', 'ttimg'];
handler.group = true;
handler.register = true;
handler.coin = 2;

export default handler;
