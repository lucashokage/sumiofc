import { createCanvas, registerFont } from 'canvas';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fontsDir = join(__dirname, '../src/font');

const registerAppFonts = () => {
  const results = {
    success: [],
    failed: []
  };

  try {
    const fontFiles = readdirSync(fontsDir).filter(file => 
      file.endsWith('.ttf') || 
      file.endsWith('.otf') ||
      file.endsWith('.woff')
    );

    if (fontFiles.length === 0) {
      console.warn('No se encontraron archivos de fuentes en la carpeta fonts');
      return results;
    }

    for (const file of fontFiles) {
      try {
        const fontPath = join(fontsDir, file);
        const fontName = file.replace(/\.[^/.]+$/, '');
        
        const fontConfig = {
          family: fontName,
          weight: 'normal',
          style: 'normal'
        };

        if (file.toLowerCase().includes('italic')) {
          fontConfig.style = 'italic';
        }
        if (file.toLowerCase().includes('bold')) {
          fontConfig.weight = 'bold';
        }

        registerFont(fontPath, fontConfig);
        results.success.push(file);
        console.log(`Fuente registrada: ${file} como ${fontName}`);
      } catch (e) {
        console.error(`Error al registrar fuente ${file}:`, e.message);
        results.failed.push(file);
      }
    }

    return results;
  } catch (error) {
    console.error('Error crítico al registrar fuentes:', error);
    return results;
  }
};

const fontStatus = registerAppFonts();

let canvasLib;
const loadCanvas = async () => {
  if (!canvasLib) {
    canvasLib = await import('canvas');
  }
  return canvasLib;
};

const flagMap = [
  ['598', '🇺🇾'], ['595', '🇵🇾'], ['593', '🇪🇨'], ['591', '🇧🇴'],
  ['590', '🇧🇶'], ['509', '🇭🇹'], ['507', '🇵🇦'], ['506', '🇨🇷'],
  ['505', '🇳🇮'], ['504', '🇭🇳'], ['503', '🇸🇻'], ['502', '🇬🇹'],
  ['501', '🇧🇿'], ['599', '🇨🇼'], ['597', '🇸🇷'], ['596', '🇬🇫'],
  ['594', '🇬🇫'], ['592', '🇬🇾'], ['590', '🇬🇵'], ['549', '🇦🇷'],
  ['58', '🇻🇪'], ['57', '🇨🇴'], ['56', '🇨🇱'], ['55', '🇧🇷'],
  ['54', '🇦🇷'], ['53', '🇨🇺'], ['52', '🇲🇽'], ['51', '🇵🇪'],
  ['34', '🇪🇸'], ['1', '🇺🇸']
];

const colores = {
  rojo: ['#F44336', '#FFCDD2'],
  azul: ['#00B4DB', '#0083B0'],
  verde: ['#4CAF50', '#C8E6C9'],
  rosa: ['#E91E63', '#F8BBD0'],
  morado: ['#9C27B0', '#E1BEE7'],
  negro: ['#212121', '#9E9E9E'],
  naranja: ['#FF9800', '#FFE0B2'],
  gris: ['#607D8B', '#CFD8DC'],
  celeste: ['#00FFFF', '#E0FFFF']
};

function numberWithFlag(num) {
  const clean = num.replace(/[^0-9]/g, '');
  for (const [code, flag] of flagMap) {
    if (clean.startsWith(code)) return `${num} ${flag}`;
  }
  return num;
}

const quotedPush = q => (q?.pushName || q?.sender?.pushName || '');

async function niceName(jid, conn, chatId, qPush, fallback = '') {
  if (qPush?.trim() && !/^\d+$/.test(qPush)) return qPush;
  
  if (chatId.endsWith('@g.us')) {
    try {
      const meta = await conn.groupMetadata(chatId);
      const p = meta.participants.find(p => p.id === jid);
      const n = p?.notify || p?.name;
      if (n?.trim() && !/^\d+$/.test(n)) return n;
    } catch {}
  }

  try {
    const g = await conn.getName(jid);
    if (g?.trim() && !/^\d+$/.test(g) && !g.includes('@')) return g;
  } catch {}

  const c = conn.contacts?.[jid];
  if (c?.notify && !/^\d+$/.test(c.notify)) return c.notify;
  if (c?.name && !/^\d+$/.test(c.name)) return c.name;
  if (fallback?.trim() && !/^\d+$/.test(fallback)) return fallback;
  
  return numberWithFlag(jid.split('@')[0]);
}

function splitTextWithEmojis(text, maxWidth, ctx) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

const handler = async (msg, { conn, args }) => {
  const { createCanvas, loadImage } = await loadCanvas();

  const { remoteJid: chatId } = msg.key;
  const context = msg.message?.extendedTextMessage?.contextInfo;
  const quotedMsg = context?.quotedMessage;

  let targetJid = msg.key.participant || chatId;
  let fallbackPN = msg.pushName || '';
  let quotedName = '';
  let quotedText = '';

  if (quotedMsg && context?.participant) {
    targetJid = context.participant;
    quotedText = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || '';
    quotedName = quotedPush(quotedMsg);
    fallbackPN = '';
  }

  const contentFull = args.join(' ').trim() || '';
  const firstWord = contentFull.split(' ')[0]?.toLowerCase();
  const gradColors = colores[firstWord] || colores.azul;

  let content = colores[firstWord] 
    ? contentFull.split(' ').slice(1).join(' ').trim() || quotedText || '' 
    : contentFull || quotedText || '';

  if (!content) {
    return conn.sendMessage(chatId, { 
      text: `✏️ Uso: *.texto [color] mensaje*\n\nColores disponibles: ${Object.keys(colores).join(', ')}` 
    }, { quoted: msg });
  }

  const displayName = await niceName(targetJid, conn, chatId, quotedName, fallbackPN);
  
  let avatarUrl = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
  try {
    avatarUrl = await conn.profilePictureUrl(targetJid, 'image');
  } catch {
    console.log('Usando avatar por defecto');
  }

  await conn.sendMessage(chatId, { react: { text: '🖼️', key: msg.key } });

  const canvas = createCanvas(1080, 1080);
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
  gradient.addColorStop(0, gradColors[0]);
  gradient.addColorStop(1, gradColors[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1080);

  try {
    const avatar = await loadImage(avatarUrl);
    ctx.save();
    ctx.beginPath();
    ctx.arc(100, 100, 80, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, 20, 20, 160, 160);
    ctx.restore();
  } catch (error) {
    console.error('Error al cargar avatar:', error);
  }

  const titleFont = fontStatus.success.length > 0 
    ? 'bold 40px "Noto Color Emoji", "Noto Sans", sans-serif'
    : 'bold 40px system-ui, -apple-system, "Segoe UI Emoji", sans-serif';

  const contentFont = fontStatus.success.length > 0
    ? 'bold 60px "Noto Color Emoji", "Noto Sans", sans-serif'
    : 'bold 60px system-ui, -apple-system, "Segoe UI Emoji", sans-serif';

  ctx.font = titleFont;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(displayName, 220, 100);

  ctx.font = contentFont;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';

  const lines = splitTextWithEmojis(content, 900, ctx);
  const startY = 550 - (lines.length * 35);
  
  lines.forEach((line, i) => {
    ctx.fillText(line, 540, startY + (i * 80));
  });

  try {
    const logo = await loadImage('https://files.catbox.moe/2oxo4b.jpg');
    ctx.drawImage(logo, 1080 - 180, 1080 - 180, 140, 140);
  } catch (error) {
    console.error('Error al cargar logo:', error);
  }

  await conn.sendMessage(chatId, { 
    image: canvas.toBuffer('image/png'),
    caption: '🖼 Imagen generada con emojis'
  }, { quoted: msg });
};

handler.command = ['texto'];
handler.tags = ['tools'];
handler.help = ['texto <mensaje> - Genera una imagen con tu texto'];
export default handler;
