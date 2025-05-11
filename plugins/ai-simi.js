import translate from '@vitalets/google-translate-api';
import axios from 'axios';

const handler = async (m, { conn, text }) => {
    const emoji = '❀';
    const msm = '[!]';
    
    if (!text) {
        return conn.reply(m.chat, `${emoji} Ingresa un texto para hablar con la *Bot*`, m);
    }

    try {
        await m.react('🕒');
        const resSimi = await simitalk(text);
        
        if (!resSimi.status) {
            throw new Error(resSimi.resultado.msg || 'Error desconocido');
        }

        await conn.sendMessage(
            m.chat,
            { text: resSimi.resultado.simsimi },
            { quoted: m }
        );
        await m.react('✅');
    } catch (error) {
        console.error(msm, error);
        await m.react('❌');
        await conn.reply(
            m.chat,
            `${emoji} Ocurrió un error al procesar tu solicitud. Intenta nuevamente.`,
            m
        );
    }
};

async function simitalk(ask, apikey = "iJ6FxuA9vxlvz5cKQCt3", language = "es") {
    if (!ask) return { 
        status: false, 
        resultado: { 
            msg: "Debes ingresar un texto para hablar con simsimi." 
        }
    };

    const apis = [
        {
            url: `https://delirius-apiofc.vercel.app/tools/simi?text=${encodeURIComponent(ask)}`,
            handler: async (response) => {
                const trad = await translate(response.data.data.message, {
                    to: language,
                    autoCorrect: true
                });
                return trad.text;
            }
        },
        {
            url: `https://anbusec.xyz/api/v1/simitalk?apikey=${apikey}&ask=${ask}&lc=${language}`,
            handler: (response) => response.data.message
        }
    ];

    for (const api of apis) {
        try {
            const response = await axios.get(api.url, { timeout: 10000 });
            const result = await api.handler(response);
            
            if (result && result !== 'indefinida') {
                return { 
                    status: true, 
                    resultado: { 
                        simsimi: result 
                    } 
                };
            }
        } catch (error) {
            console.error(`Error en API ${api.url}:`, error.message);
            continue;
        }
    }

    return {
        status: false,
        resultado: {
            msg: "Todas las APIs fallaron. Inténtalo de nuevo más tarde."
        }
    };
}

handler.help = ['simi <texto>', 'bot <texto>'];
handler.tags = ['fun'];
handler.command = ['sumi', 'simi'];
handler.group = true;
handler.register = true;

export default handler;
