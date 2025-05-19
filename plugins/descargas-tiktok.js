import axios from 'axios';
import cheerio from 'cheieio';
import { tiktokdl } from '@bochilteam/scraper';
import { tiktok } from "@xct007/frieren-scraper";

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
  if (!text) return conn.reply(m.chat, `❀ Ingrese una url de TikTok`, m);

  if (!/(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(text)) {
    return conn.reply(m.chat, '❀ Url inválida', m);
  }

  m.react('⏳');

  try {
    try {
      const dataF = await tiktok.v1(args[0]);
      const videoData = {
        title: dataF.description || 'Sin título',
        author: { nickname: dataF.author?.nickname || 'Desconocido' },
        duration: dataF.duration ? `${dataF.duration}s` : 'No especificado',
        like: dataF.likes || 0,
        comment: dataF.comments || 0
      };
      
      let txt = `「✦」Título: ${videoData.title}\n\n> ✦ Autor: » ${videoData.author.nickname}\n> ⴵ Duración: » ${videoData.duration}\n> 🜸 Likes: » ${videoData.like}\n> ✎ Comentarios: » ${videoData.comment}`;
      await conn.sendFile(m.chat, dataF.play, 'tiktok.mp4', txt, m);
      return m.react('✅');
    } catch (e1) {
      console.error('Error con frieren-scraper:', e1);
    }

    try {
      const { author, video, description } = await tiktokdl(args[0]);
      const url = video.no_watermark2 || video.no_watermark || 'https://tikcdn.net' + video.no_watermark_raw || video.no_watermark_hd;
      let txt = `「✦」Título: ${description || 'Sin título'}\n\n> ✦ Autor: » ${author.nickname}\n> ⴵ Duración: » No especificado\n> 🜸 Likes: » 0\n> ✎ Comentarios: » 0`;
      await conn.sendFile(m.chat, url, 'tiktok.mp4', txt, m);
      return m.react('✅');
    } catch (e2) {
      console.error('Error con bochilteam-scraper:', e2);
    }

    try {
      const tiktokData = await tiktokdlF(args[0]);
      if (tiktokData.status) {
        let txt = `「✦」Título: Video de TikTok\n\n> ✦ Autor: » ${tiktokData.author?.nickname || 'Desconocido'}\n> ⴵ Duración: » No especificado\n> 🜸 Likes: » 0\n> ✎ Comentarios: » 0`;
        await conn.sendFile(m.chat, tiktokData.video, 'tiktok.mp4', txt, m);
        return m.react('✅');
      }
    } catch (e3) {
      console.error('Error con tikdown.org:', e3);
    }

    m.react('❌');
    await conn.reply(m.chat, '❌ *No se pudo descargar el video de TikTok. Todos los métodos fallaron.*', m);
  } catch (e) {
    m.react('❌');
    await conn.reply(m.chat, '❌ *Ocurrió un error al procesar la solicitud.*', m);
    console.error(`Error en el comando ${command}:`, e);
  }
};

handler.help = ['tiktok'];
handler.tags = ['dl'];
handler.command = /^(tt|tiktok)(dl|nowm)?$/i;
export default handler;

async function tiktokdlF(url) {
  if (!/tiktok/.test(url)) return { status: false };
  
  try {
    const gettoken = await axios.get("https://tikdown.org/id");
    const $ = cheerio.load(gettoken.data);
    const token = $("#download-form > input[type=hidden]:nth-child(2)").attr("value");
    const param = { url: url, _token: token };
    
    const { data } = await axios.post("https://tikdown.org/getAjax?", new URLSearchParams(param), {
      headers: {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36"
      },
    });
    
    const getdata = cheerio.load(data.html);
    if (data.status) {
      return {
        status: true,
        video: getdata("div.download-links > div:nth-child(1) > a").attr("href"),
        author: { nickname: "TikDown" }
      };
    }
    return { status: false };
  } catch (e) {
    console.error('Error en tiktokdlF:', e);
    return { status: false };
  }
}
