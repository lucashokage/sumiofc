import {googleImage} from '@bochilteam/scraper';

const handler = async (m, {conn, text, usedPrefix, command}) => {
  if (!text) return conn.reply(m.chat, `${emoji} Por favor, ingresa un término de búsqueda.`, m);
  
  await m.react(rwait);
  conn.reply(m.chat, '❀ Descargando su imagen, espere un momento...', m);
  
  try {
    const res = await googleImage(text);
    
    for (let i = 0; i < 4; i++) {
      const image = await res.getRandom();
      await conn.sendFile(m.chat, image, 'imagen.jpg', `✦ Resultado ${i+1} de: ${text}`, m);
    }
    
    await m.react(done);
  } catch (e) {
    console.error(e);
    await conn.reply(m.chat, '❌ Error al buscar las imágenes', m);
    await m.react(error);
  }
};

handler.help = ['imagen'];
handler.tags = ['buscador', 'tools', 'descargas'];
handler.command = ['image', 'imagen'];
handler.register = true;

export default handler;
