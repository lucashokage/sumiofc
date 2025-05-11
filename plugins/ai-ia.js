import axios from 'axios';
import fetch from 'node-fetch';

const botname = 'Luminai';
const etiqueta = 'Lumina Team';
const vs = '2.0';
const emoji = '❀';
const emoji2 = '⏳';
const rwait = '🕒';
const done = '✅';
const error = '❌';
const msm = '[!]';

const handler = async (m, { conn, usedPrefix, command, text }) => {
    const username = conn.getName(m.sender);
    const basePrompt = `Eres ${botname}, creado por ${etiqueta} (v${vs}). Hablas español. Usa el nombre "${username}" al responder. Sé amable, divertido y educativo.`;

    if (m.quoted?.mimetype?.startsWith('image/')) {
        try {
            await m.react(rwait);
            const img = await m.quoted.download();
            if (!img) throw new Error('No se pudo descargar la imagen');
            
            const imageAnalysis = await analyzeImage(img);
            const response = await generateResponse(
                `Describe esta imagen en detalle: ${imageAnalysis}`,
                username,
                `${basePrompt} Eres experto en análisis visual.`
            );
            
            await conn.reply(m.chat, `${emoji} Descripción:\n${response}`, m);
            await m.react(done);
        } catch (e) {
            console.error(msm, e);
            await m.react(error);
            await conn.reply(m.chat, 'Error al analizar la imagen', m);
        }
    } else if (text) {
        try {
            await m.react(rwait);
            const { key } = await conn.sendMessage(
                m.chat, 
                { text: `${emoji2} Procesando tu consulta...` }, 
                { quoted: m }
            );
            
            const response = await generateResponse(text, username, basePrompt);
            
            await conn.sendMessage(
                m.chat, 
                { text: `${emoji} ${response}`, edit: key }
            );
            await m.react(done);
        } catch (e) {
            console.error(msm, e);
            await m.react(error);
            await conn.reply(m.chat, 'Error al generar respuesta', m);
        }
    } else {
        await conn.reply(
            m.chat, 
            `${emoji} Usa:\n${usedPrefix}${command} [texto]\nO responde a una imagen`, 
            m
        );
    }
};

async function analyzeImage(imageBuffer) {
    const response = await axios.post('https://api.luminai.ai/analyze', {
        image: imageBuffer.toString('base64')
    }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
    });
    return response.data?.result || 'No se pudo analizar la imagen';
}

async function generateResponse(query, user, context) {
    const response = await axios.post('https://api.luminai.ai/chat', {
        query,
        user,
        context,
        options: { webSearch: false }
    }, {
        timeout: 30000
    });
    return response.data?.result || 'No se pudo generar respuesta';
}

handler.help = ['ia <texto>', 'chatgpt <texto>'];
handler.tags = ['ai'];
handler.command = ['ia', 'chatgpt', 'luminai'];
handler.group = true;
handler.register = true;

export default handler;
