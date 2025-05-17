import { spawn } from 'child_process';
import { format } from 'util';

let handler = async (m, { conn, usedPrefix, command }) => {
    // Verificar soporte para conversión de imágenes
    if (!global.support.convert && !global.support.magick && !global.support.gm) {
        handler.disabled = true;
        return m.reply(`${emoji} El comando no está disponible. Falta soporte para conversión de imágenes.`);
    }
    
    // Verificar si se citó un mensaje
    if (!m.quoted) {
        throw `${emoji} Debes citar un sticker para convertir a imagen.\n\nEjemplo: ${usedPrefix + command}`;
    }
    
    let q = m.quoted;
    
    // Verificar si el mensaje citado es un sticker
    if (!/sticker/.test(q.mediaType)) {
        throw `${emoji} El mensaje citado no es un sticker.`;
    }
    
    try {
        let sticker = await q.download();
        if (!sticker) throw new Error('No se pudo descargar el sticker');
        
        let bufs = [];
        const args = [
            ...(global.support.gm ? ['gm'] : global.support.magick ? ['magick'] : []),
            'convert', 'webp:-', 'png:-'
        ];
        
        const im = spawn(args[0], args.slice(1));
        
        im.on('error', e => {
            console.error(e);
            m.reply(`${emoji} Ocurrió un error al procesar la imagen: ${format(e)}`);
        });
        
        im.stdout.on('data', chunk => bufs.push(chunk));
        
        im.stdin.write(sticker);
        im.stdin.end();
        
        im.on('exit', (code) => {
            if (code !== 0) {
                return m.reply(`${emoji} La conversión falló con código ${code}`);
            }
            
            if (bufs.length === 0) {
                return m.reply(`${emoji} No se generó ninguna imagen.`);
            }
            
            conn.sendFile(
                m.chat, 
                Buffer.concat(bufs), 
                'sticker.png', 
                `✅ *Sticker convertido a imagen*`, 
                m
            );
        });
        
    } catch (error) {
        console.error(error);
        m.reply(`${emoji} Ocurrió un error: ${error.message}`);
    }
};

handler.help = ['toimg <sticker>'];
handler.tags = ['sticker'];
handler.command = ['toimg', 'jpg', 'aimg', 'img']; 

export default handler;
