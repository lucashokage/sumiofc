import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk' 
import { fileURLToPath } from 'url'
import fs from 'fs'

global.owner = [
  ['393715279301', 'leonel', true],
  ['573161325891']
]

global.mods = [''] 
global.prems = ['']
global.botNumber = [''] 
global.APIs = { 
   
  nrtm: 'https://fg-nrtm.ddns.net',
  fgmods: 'https://api.fgmods.xyz'
}
global.APIKeys = { 
  'https://api.fgmods.xyz': 'fg_9XdnzCdQ'
}

global.packname = '✦⏤͟͟͞͞ sumi sakurasawa ⏤͟͟͞͞✦' 
global.author = '✦⏤͟͟͞͞ sumi sakurasawa ⏤͟͟͞͞✦' 

global.botName = '✦⏤͟͟͞͞ sumi sakurasawa ⏤͟͟͞͞✦'
global.fgig = 'https://instagram.com/' 
global.fgsc = 'https://github.com/' 
global.fgyt = 'https://youtube.com/'
global.fgpyp = 'https://paypal.me/'
global.fglog = 'https://files.catbox.moe/o24klh.png' 

global.id_canal = '120363324350463849@newsletter'
global.fgcanal = 'https://whatsapp.com/channel/0029Vagdmfv1SWt5nfdR4z3w'
global.bgp = 'https://chat.whatsapp.com/D9hmosKv0924sPqyXeu1CU'
global.bgp2 = 'https://chat.whatsapp.com/'
global.bgp3 = 'https://chat.whatsapp.com/' 

global.wait = '⌛ _Cargando..._\n*▬▬▬▭*'
global.rwait = '⌛'
global.dmoji = '🤭'
global.done = '✅'
global.error = '❌' 
global.xmoji = '🔥' 
global.moneda = 'coin'
global.txt = 'sumi sakurasawa'

global.multiplier = 69 
global.maxwarn = '2' 
global.creador = 'Wa.me/2348030943459'

const getRandomChannel = async () => {
  return {
    id: global.canalIdM[0],
    name: global.canalNombreM[0]
  }
}

if (!Array.prototype.getRandom) {
  Array.prototype.getRandom = function() {
    return this[Math.floor(Math.random() * this.length)]
  }
}

const conn = { user: { jid: 'bot@s.whatsapp.net' } }
const m = { 
  sender: '0@s.whatsapp.net',
  pushName: 'User',
  chat: '0@s.whatsapp.net'
}

global.ofcbot = `${conn.user.jid.split('@')[0]}`
global.asistencia = 'Wa.me/2348030943459'
global.namechannel = '=͟͟͞❀ sᥙmі - sᥲkᥙrᥲsᥲᥕᥲ  ⏤͟͟͞͞★'
global.namechannel2 = '=͟͟͞❀ sᥙmі - sᥲkᥙrᥲsᥲᥕᥲ ⏤͟͟͞͞★'
global.namegrupo = 'ᰔᩚ ᥡᥙkі sᥙ᥆ᥙ • ᥆𝖿іᥴіᥲᥣ ❀'
global.namecomu = 'ᰔᩚ ᥡᥙkіᑲ᥆𝗍-mძ • ᥴ᥆mᥙᥒі𝗍ᥡ ❀'
global.listo = '❀ *Aquí tienes ฅ^•ﻌ•^ฅ*'

const profilePictureUrl = async (jid, type) => 'https://files.catbox.moe/xr2m6u.jpg'
global.fotoperfil = await profilePictureUrl(m.sender, 'image').catch(_ => 'https://files.catbox.moe/xr2m6u.jpg')

global.canalIdM = ["120363401646371525@newsletter", "120363401646371525@newsletter"]
global.canalNombreM = ["⏤͟͟͞͞❀ sᥙmі sᥲkᥙrᥲsᥲᥕᥲ • ᥲ᥎іs᥆ ⏤͟͟͞͞❀", "⏤͟͟͞͞❀ sᥙmі sᥲkᥙrᥲsᥲᥕᥲ • ᥲ᥎іs᥆s ⏤͟͟͞͞❀"]
global.channelRD = await getRandomChannel()

global.d = new Date(new Date + 3600000)
global.locale = 'es'
global.dia = d.toLocaleDateString(locale, {weekday: 'long'})
global.fecha = d.toLocaleDateString('es', {day: 'numeric', month: 'numeric', year: 'numeric'})
global.mes = d.toLocaleDateString('es', {month: 'long'})
global.año = d.toLocaleDateString('es', {year: 'numeric'})
global.tiempo = d.toLocaleString('en-US', {hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true})

global.rwait = '🕒'
global.done = '✅'
global.error = '✖️'
global.msm = '⚠︎'
global.etiqueta = 'sumi sakurasawa'

global.emoji = '❀'
global.emoji2 = '✧'
global.emoji3 = '✦'
global.emoji4 = '❍'
global.emoji5 = '✰'
global.emojis = [global.emoji, global.emoji2, global.emoji3, global.emoji4].getRandom()

global.wait = '❍ Espera un momento, soy lenta...';
global.waitt = '❍ Espera un momento, soy lenta...';
global.waittt = '❍ Espera un momento, soy lenta...';
global.waitttt = '❍ Espera un momento, soy lenta...';

var canal = 'https://whatsapp.com/channel/0029Vagdmfv1SWt5nfdR4z3w'  
var comunidad = 'https://chat.whatsapp.com/I0dMp2fEle7L6RaWBmwlAa'
var git = 'https://github.com/The-King-Destroy'
var github = 'https://github.com/The-King-Destroy/Yuki_Suou-Bot' 
let correo = 'thekingdestroy507@gmail.com'
global.redes = [canal, comunidad, git, github, correo].getRandom()

let category = "imagen"
// Placeholder for database operations
const db = './src/database/db.json'
let db_ = { links: { imagen: ['https://example.com/image.jpg'] } }
try {
  db_ = JSON.parse(fs.readFileSync(db))
} catch (e) {
  console.error('Error reading database:', e)
}
const random = Math.floor(Math.random() * db_.links[category].length)
const randomlink = db_.links[category][random]

// Placeholder for fetch
const fetch = async (url) => {
  return {
    buffer: async () => Buffer.from([])
  }
}
const response = await fetch(randomlink)
const rimg = await response.buffer()
global.icons = rimg

var ase = new Date(); 
var hour = ase.getHours(); 
switch(hour){ 
  case 0: hour = 'Lɪɴᴅᴀ Nᴏᴄʜᴇ 🌃'; break; 
  case 1: hour = 'Lɪɴᴅᴀ Nᴏᴄʜᴇ 🌃'; break; 
  case 2: hour = 'Lɪɴᴅᴀ Nᴏᴄʜᴇ 🌃'; break; 
  case 3: hour = 'Lɪɴᴅᴀ Mᴀɴ̃ᴀɴᴀ 🌄'; break; 
  case 4: hour = 'Lɪɴᴅᴀ Mᴀɴ̃ᴀɴᴀ 🌄'; break; 
  case 5: hour = 'Lɪɴᴅᴀ Mᴀɴ̃ᴀɴᴀ 🌄'; break; 
  case 6: hour = 'Lɪɴᴅᴀ Mᴀɴ̃ᴀɴᴀ 🌄'; break; 
  case 7: hour = 'Lɪɴᴅᴀ Mᴀɴ̃ᴀɴᴀ 🌅'; break; 
  case 8: hour = 'Lɪɴᴅᴀ Mᴀɴ̃ᴀɴᴀ 🌄'; break; 
  case 9: hour = 'Lɪɴᴅᴀ Mᴀɴ̃ᴀɴᴀ 🌄'; break; 
  case 10: hour = 'Lɪɴᴅᴏ Dɪᴀ 🌤'; break; 
  case 11: hour = 'Lɪɴᴅᴏ Dɪᴀ 🌤'; break; 
  case 12: hour = 'Lɪɴᴅᴏ Dɪᴀ 🌤'; break; 
  case 13: hour = 'Lɪɴᴅᴏ Dɪᴀ 🌤'; break; 
  case 14: hour = 'Lɪɴᴅᴀ Tᴀʀᴅᴇ 🌆'; break; 
  case 15: hour = 'Lɪɴᴅᴀ Tᴀʀᴅᴇ 🌆'; break; 
  case 16: hour = 'Lɪɴᴅᴀ Tᴀʀᴅᴇ 🌆'; break; 
  case 17: hour = 'Lɪɴᴅᴀ Tᴀʀᴅᴇ 🌆'; break; 
  case 18: hour = 'Lɪɴᴅᴀ Nᴏᴄʜᴇ 🌃'; break; 
  case 19: hour = 'Lɪɴᴅᴀ Nᴏᴄʜᴇ 🌃'; break; 
  case 20: hour = 'Lɪɴᴅᴀ Nᴏᴄʜᴇ 🌃'; break; 
  case 21: hour = 'Lɪɴᴅᴀ Nᴏᴄʜᴇ 🌃'; break; 
  case 22: hour = 'Lɪɴᴅᴀ Nᴏᴄʜᴇ 🌃'; break; 
  case 23: hour = 'Lɪɴᴅᴀ Nᴏᴄʜᴇ 🌃'; break;
}
global.saludo = hour;

global.nombre = m.pushName || 'Anónimo'
global.taguser = '@' + m.sender.split("@s.whatsapp.net")[0]
var more = String.fromCharCode(8206)
global.readMore = more.repeat(850)

global.packsticker = `┆❀channelsumi❀
   ╰https:sumi.online
┊info:❀
 ╰➺https://channelsumi.like\n`
global.packsticker2 = `┊👑Bot: ${global.botName}\n👑 Usuario: ${global.nombre}\n✦ Fecha: ${global.fecha}\nⴵ Hora: ${global.tiempo}`
  
global.fkontak = { 
  key: {
    participant: `0@s.whatsapp.net`, 
    ...(m.chat ? { remoteJid: `6285600793871-1614953337@g.us` } : {}) 
  }, 
  message: { 
    'contactMessage': { 
      'displayName': `${global.nombre}`, 
      'vcard': `BEGIN:VCARD\nVERSION:3.0\nN:XL;${global.nombre},;;;\nFN:${global.nombre},\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`, 
      'jpegThumbnail': null, 
      thumbnail: null,
      sendEphemeral: true
    }
  }
}

global.fake = { 
  contextInfo: { 
    isForwarded: true, 
    forwardedNewsletterMessageInfo: { 
      newsletterJid: global.channelRD.id, 
      newsletterName: global.channelRD.name, 
      serverMessageId: -1 
    }
  }
}

global.icono = [
  'https://tinyurl.com/285a5ejf',
].getRandom()

global.rcanal = { 
  contextInfo: { 
    isForwarded: true, 
    forwardedNewsletterMessageInfo: { 
      newsletterJid: global.channelRD.id, 
      serverMessageId: 100, 
      newsletterName: global.channelRD.name
    }, 
    externalAdReply: { 
      showAdAttribution: true, 
      title: global.packname, 
      body: 'dev', 
      mediaUrl: null, 
      description: null, 
      previewType: "PHOTO", 
      thumbnailUrl: global.icono, 
      sourceUrl: global.redes, 
      mediaType: 1, 
      renderLargerThumbnail: false 
    }
  }
}

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  import(`${file}?update=${Date.now()}`)
})
