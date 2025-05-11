import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk' 
import { fileURLToPath } from 'url' 

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

global.multiplier = 69 
global.maxwarn = '2' 

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  import(`${file}?update=${Date.now()}`)
})
