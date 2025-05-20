import { watchFile, unwatchFile } from 'fs' 
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import fs from 'fs'
import cheerio from 'cheerio'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone' 

global.botNumberCode = ''
global.confirmCode = ''

global.owner = [
   ['5493876639332', 'Ian', true],
   ['526561105057', 'AxelOfc', true],
]

global.mods = []
global.prems = []

global.isBaileysFail = false
global.libreria = 'Baileys'
global.baileys = 'V 6.7.8'
global.vs = '1.0.1'
global.languaje = 'Español'
global.nameqr = 'Frieren-AI'
global.sessions = 'BotSession'
global.jadi = 'JadiBot'

global.banner = 'https://qu.ax/zNqAj.jpg'
global.botname = 'Frieren-AI'
global.author = 'Dev-AxelOfc'
global.dev = 'AxelOfc'
global.currency = 'Yenes'
global.botStatus = true;
global.welcome = '*Bienvenido al grupo* 👋🏻\n> *Utilice .menu*\n*Para ver el menu del bot*'

global.image = fs.readFileSync('./src/img/imagen.jpeg')
global.avatar = fs.readFileSync('./src/img/avatar_contact.jpeg')

global.grupo = 'https://chat.whatsapp.com/KiJY7gZS17aLcP6qaGatFX'
global.channel = 'https://whatsapp.com/channel/0029VajkZ6bIXnlwPZmbuH1u'

global.cheerio = cheerio
global.fs = fs
global.fetch = fetch
global.axios = axios
global.moment = moment        

global.multiplier = 69
global.maxwarn = '3'

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'settings.js'"))
  import(`${file}?update=${Date.now()}`)
})
