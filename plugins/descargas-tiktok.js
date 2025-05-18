import fg from 'api-dylux';
import axios from 'axios';
import cheerio from 'cheerio';
import { tiktok } from "@xct007/frieren-scraper";
let generateWAMessageFromContent = (await import(global.baileys)).default;
import { tiktokdl } from '@bochilteam/scraper';

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
  if (!text) return conn.reply(m.chat, `❀ Ingrese una url de TikTok`, m);

  if (!/(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(text)) {
    return conn.reply(m.chat, '❀ Url inválida', m);
  }

  m.react('⏳');

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
    conn.sendFile(m.chat, dataF.play, 'tiktok.mp4', txt, m);
    m.react('✅');
  } catch (e1) {
    try {
      const tTiktok = await tiktokdlF(args[0]);
      let txt = `「✦」Título: Video de TikTok\n\n> ✦ Autor: » ${tTiktok.author?.nickname || 'Desconocido'}\n> ⴵ Duración: » No especificado\n> 🜸 Likes: » 0\n> ✎ Comentarios: » 0`;
      conn.sendFile(m.chat, tTiktok.video, 'tiktok.mp4', txt, m);
      m.react('✅');
    } catch (e2) {
      try {
        let p = await fg.tiktok(args[0]);
        let txt = `「✦」Título: Video de TikTok\n\n> ✦ Autor: » ${p.author?.nickname || 'Desconocido'}\n> ⴵ Duración: » No especificado\n> 🜸 Likes: » 0\n> ✎ Comentarios: » 0`;
        conn.sendFile(m.chat, p.nowm, 'tiktok.mp4', txt, m);
        m.react('✅');
      } catch (e3) {
        try {
          const { author: { nickname }, video, description } = await tiktokdl(args[0]);
          const url = video.no_watermark2 || video.no_watermark || 'https://tikcdn.net' + video.no_watermark_raw || video.no_watermark_hd;
          let txt = `「✦」Título: ${description || 'Sin título'}\n\n> ✦ Autor: » ${nickname}\n> ⴵ Duración: » No especificado\n> 🜸 Likes: » 0\n> ✎ Comentarios: » 0`;
          conn.sendFile(m.chat, url, 'tiktok.mp4', txt, m);
          m.react('✅');
        } catch (e4) {
          try {
            const response = await fetch(`${apis}/download/tiktok?url=${args[0]}`);
            const dataR = await response.json();
            const { author, title, meta } = dataR.data;
            let txt = `「✦」Título: ${title || 'Sin título'}\n\n> ✦ Autor: » ${author.nickname}\n> ⴵ Duración: » No especificado\n> 🜸 Likes: » 0\n> ✎ Comentarios: » 0`;
            conn.sendFile(m.chat, meta.media[0].org, 'tiktok.mp4', txt, m);
            m.react('✅');
          } catch (e5) {
            try {
              const response = await fetch(`https://deliriusapi-official.vercel.app/download/tiktok?&query=${text}`);
              const dataR = await response.json();
              let txt = `「✦」Título: Video de TikTok\n\n> ✦ Autor: » ${dataR.result.author?.username || 'Desconocido'}\n> ⴵ Duración: » No especificado\n> 🜸 Likes: » 0\n> ✎ Comentarios: » 0`;
              conn.sendFile(m.chat, dataR.result.link, 'tiktok.mp4', txt, m);
              m.react('✅');
            } catch (e) {
              m.react('❌');
              await conn.reply(m.chat, '❌ *Ocurrió un error al descargar el video.*', m);
              console.error(`Error en el comando ${command}:`, e);
            }
          }
        }
      }
    }
  }
};

handler.help = ['tiktok'];
handler.tags = ['dl'];
handler.command = /^(tt|tiktok)(dl|nowm)?$/i;
export default handler;

async function tiktokdlF(url) {
  if (!/tiktok/.test(url)) return 'Enlace incorrecto';
  const gettoken = await axios.get("https://tikdown.org/id");
  const $ = cheerio.load(gettoken.data);
  const token = $("#download-form > input[type=hidden]:nth-child(2)").attr("value");
  const param = { url: url, _token: token };
  const { data } = await axios.request("https://tikdown.org/getAjax?", {
    method: "post",
    data: new URLSearchParams(Object.entries(param)),
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "user-agent": "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36"
    },
  });
  var getdata = cheerio.load(data.html);
  if (data.status) {
    return {
      status: true,
      thumbnail: getdata("img").attr("src"),
      video: getdata("div.download-links > div:nth-child(1) > a").attr("href"),
      audio: getdata("div.download-links > div:nth-child(2) > a").attr("href"),
      author: { nickname: "TikDown" }
    };
  } else {
    return { status: false };
  }
}
