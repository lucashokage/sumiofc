let handler = async (m, { conn, usedPrefix, command, text }) => {
  if (!text) return m.reply(`❀ Ingresa un texto para buscar en YouTube.\n> *Ejemplo:* ${usedPrefix + command} Shakira`);

  try {
    const searchApis = [
      async () => {
        const url = `https://delirius-apiofc.vercel.app/search/ytsearch?q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data?.data?.length > 0) return data.data[0];
      },
      async () => {
        const url = `https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data?.result?.length > 0) return {
          title: data.result[0].title,
          author: { name: data.result[0].channel },
          duration: data.result[0].duration,
          views: data.result[0].views,
          publishedAt: data.result[0].uploaded,
          url: data.result[0].url,
          image: data.result[0].thumbnail
        };
      }
    ];

    let video;
    for (const api of searchApis) {
      try {
        video = await api();
        if (video) break;
      } catch (e) {}
    }

    if (!video) return m.reply(`⚠️ No se encontraron resultados para "${text}".`);

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

    const downloadApis = [
      async () => {
        const url = `https://api.vreden.my.id/api/ytmp3?url=${video.url}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data?.result?.download?.url) return data.result.download.url;
      },
      async () => {
        const url = `https://api.siputzx.my.id/api/d/ytmp3?url=${video.url}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data?.result?.url) return data.result.url;
      },
      async () => {
        const url = `https://api.siputzx.my.id/api/dl/youtube/mp3?url=${video.url}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data?.url) return data.url;
      },
      async () => {
        const url = `https://delirius-apiofc.vercel.app/download/ytmp3?url=${video.url}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data?.result?.url) return data.result.url;
      }
    ];

    let audioUrl;
    for (const api of downloadApis) {
      try {
        audioUrl = await api();
        if (audioUrl) break;
      } catch (e) {}
    }

    if (!audioUrl) return m.reply("❌ No se pudo obtener el audio del video.");

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

handler.command = ['playaudio', 'playadmp3'];
handler.help = ['play <texto>', 'playaudio <texto>'];
handler.tags = ['media'];

export default handler;
