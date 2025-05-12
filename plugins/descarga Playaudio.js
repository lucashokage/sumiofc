let handler = async (m, { conn, usedPrefix, command, text }) => {
  if (!text) return m.reply(`❀ Ingresa un texto para buscar en YouTube.\n> *Ejemplo:* ${usedPrefix + command} Shakira`);

  try {
    // Búsqueda (manteniendo tu API original)
    const searchApi = `https://delirius-apiofc.vercel.app/search/ytsearch?q=${encodeURIComponent(text)}`;
    const searchResponse = await fetch(searchApi);
    const searchData = await searchResponse.json();

    if (!searchData?.data || searchData.data.length === 0) {
      return m.reply(`⚠️ No se encontraron resultados para "${text}".`);
    }

    const video = searchData.data[0];
    const videoDetails = ` *「✦」 ${video.title}*

> ✦ *Canal:* » ${video.author.name}
> ⴵ *Duración:* » ${video.duration}
> ✰ *Vistas:* » ${video.views}
> ✐ *Publicado:* » ${video.publishedAt}
> 🜸 *Enlace:* » ${video.url}
`;

    await conn.sendMessage(m.chat, {
      image: { url: video.image },
      caption: videoDetails.trim()
    }, { quoted: m });

    // Función mejorada para descargar audio con múltiples APIs de respaldo
    const getAudioUrl = async (videoUrl) => {
      const apis = [
        {
          url: `https://api.vreden.my.id/api/ytmp3?url=${videoUrl}`,
          extract: data => data?.result?.download?.url
        },
        {
          url: `https://api.siputzx.my.id/api/d/ytmp3?url=${videoUrl}`,
          extract: data => data?.result?.url
        },
        {
          url: `https://api.siputzx.my.id/api/dl/youtube/mp3?url=${videoUrl}`,
          extract: data => data?.url
        },
        {
          url: `https://delirius-apiofc.vercel.app/download/ytmp3?url=${videoUrl}`,
          extract: data => data?.result?.url
        }
      ];

      for (const api of apis) {
        try {
          const response = await fetch(api.url);
          const data = await response.json();
          const audioUrl = api.extract(data);
          if (audioUrl) return audioUrl;
        } catch (e) {
          console.log(`Error con API ${api.url}:`, e.message);
        }
      }
      return null;
    };

    const audioUrl = await getAudioUrl(video.url);

    if (!audioUrl) {
      return m.reply("❌ No se pudo obtener el audio del video.");
    }

    await conn.sendMessage(m.chat, {
      audio: { url: audioUrl },
      mimetype: 'audio/mpeg',
      fileName: `${video.title.replace(/[^\w\s]/gi, '')}.mp3`
    }, { quoted: m });

    await m.react("✅");
  } catch (error) {
    console.error(error);
    m.reply(`❌ Error al procesar la solicitud:\n${error.message}`);
    await m.react("✖️");
  }
};

handler.command = ['playaudio', 'play'];
handler.help = ['play <texto>', 'playaudio <texto>'];
handler.tags = ['media'];

export default handler;
