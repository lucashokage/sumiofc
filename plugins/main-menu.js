const handler = async (m, { conn, usedPrefix, command }) => {
  try {
    const userId = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender
    const user = global.db.data.users[userId] || {}
    const name = conn.getName(userId)
    const _uptime = process.uptime() * 1000
    const uptime = clockString(_uptime)
    const totalreg = Object.keys(global.db.data.users).length
    const pluginsCount = Object.keys(global.plugins || {}).length
    const botType = conn.user.jid == global.conn.user.jid ? "official" : "subbot"

    // Obtener el nombre correcto para el bot
    let displayBotName
    if (botType === "official") {
      displayBotName = "✦⏤͟͟͞͞ sumi sakurasawa ⏤͟͟͞͞✦"
    } else {
      // Para subbots, usar el nombre personalizado con .setname o el nombre de WhatsApp
      displayBotName = user.namebebot || conn.getName(conn.user.jid) || "Bot"
    }

    const bot = global.db.data.settings[conn.user.jid] || {}

    const date = new Date()
    const options = {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
    const currentDate = date.toLocaleDateString("es-ES", options)

    const country = getCountryFromNumber(m.sender.split("@")[0])

    // Construir el menú
    let menu = `ׄ  ᷼ᮬ︵۪۪۪۪۪᷼⏜ᩘ۪۪۪᷼⏜  ׅ   ׄ🍁ᩧ᳞ ׄ   ׅ  ⏜᷼ᩘ۪۪۪۪⏜۪۪۪۪۪᷼︵᷼  

> _Hola @${userId.split("@")[0]}, bienvenido/a al menú de ${displayBotName}_

╭┈ ↷
│➮ *Tipo ›* ${botType === "official" ? "Principal 🅥" : "Sub Bot 🅑"}
│✧ *Versión ›* ^1.0.0
│❖ *Plugins ›* ${pluginsCount}
│🜸 https://bit.ly/sumioficial
│
│• *Fecha ›* ${currentDate}
│• *Pais ›* ${country}
│• *Usuarios ›* ${totalreg.toLocaleString()}
│• *Activada ›* ${uptime}
╰╶͜─ׄ͜─ׄ֟፝͜─ׄ͜─ׄ͜╴✧╶͜─ׄ͜─ׄ֟፝͜─ׄ͜─ׄ͜╴✧╶͜─ׄ͜─ׄ֟፝͜

✐; *❀*→ ᴘᴀʀᴀ ᴄʀᴇᴀʀ ᴜɴ sᴜʙ-ʙᴏᴛ ᴄᴏɴ ᴛᴜ ɴᴜᴍᴇʀᴏ ᴜᴛɪʟɪᴢᴀ *#code*`

    menu += `

ᥫ᭡ 𝐍𝐮𝐞𝐯𝐨𝐬 𝐂𝐨𝐦𝐚𝐧𝐝𝐨𝐬
> Comandos para Cambiar logos e imformacion del perfil de los subbots
─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─
 ᳯ⃞ 𑪏𑪋ᩧ❀ *#setlogo banner*
> cambia tu foto de menú
 ᳯ⃞ 𑪏𑪋ᩧ❀ *#setlogo welcome*
> Cambia tu imagen de bienvenida
 ᳯ⃞ 𑪏𑪋ᩧ❀ *#setname texto>*
> cambia el nombre de tu subbot
 ᳯ⃞ 𑪏𑪋ᩧ❀ *#setprofile*
> Cambia la imagen de tu perfil de whatsapp.
╰━━━━━━━━━━━━━

╭ׅׄ̇─ׅ̻ׄ╮۪̇߭︹ׅ *PRINCIPALES*╭ׅׄ̇─ׅ̻ׄ
> Comandos para ver estado e información del bot.
╚━━━━━━━━━━━
*#help #menu*
> Ver la lista de comandos del bot.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕ *#uptime* *#runtime*
> Ver el tiempo activo de ese bot.

 ᳯ⃞ 𑪏𑪋ᩧ❀﹕ *#bots #sockets*
> Ver la lista de los Subbots conectados.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕ *#owner #creador*
> Envia el número de teléfono del creador del bot.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕ *#status #estado*
> Ver el estado actual del bot.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕ *#sug* #newcomand
> Suguierenos un comando para añadirlo al bot.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕ *#sitema #system*
> Ver el estado del sistema del bot
 ᳯ⃞ 𑪏𑪋ᩧ❀  *#funciones#totalfunciones*
> Ver cuanto comandos ne el bot.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#p           #ping
> Ver cuantos mini segundos tarda el bot en responder a los comandos.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#speed #speedtest
> Ver las estadísticas de velocidad del bot.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#viws #usuarios
> Ver la cantidad de usuarios registrados en la base de datos del bot.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#reportar #reporte
> Envía un reporte al creador sobre cualquier error en el bot.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#infobot
> Ver toda la información del bot.
╰━─━─━─☞︎︎︎✰☜︎︎︎─━─━─━╯

╭ׅׄ̇─ׅ̻ׄ╮۪̇߭︹ׅ *BUSCADORES*╭ׅׄ̇─ׅ̻ׄ╮۪̇߭︹ׅ̟ׄ̇︹ׅ۪ׄ̇߭
> Comandos para realizar búsquedas en distintas plataformas.
╚━━━━━━━━━━━━╝
ᳯ⃞ 𑪏𑪋ᩧ❀﹕#tiktoksearch #tiktoks
> Buscador de videos de tiktok.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#tweetposts
> Buscador de posts de Twitter/X.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#ytsearch #yts
> Realiza Búsquedas de YouTube.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#gitthubsearch
> Buscador de usuarios de Gittub.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#cuevana #cuevanasearch
> Buscador de películas y series de Cuevana.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#google
> Realiza Búsquedas de Google.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#pin #pinterest
> Buscador de imágenes de Pinterest.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#imagen #image
> Buscador de imágenes de Google.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#infoanime
> Buscador de información de anime y manga.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#hentaisearch #searhhentai
> Buscador de capítulos de hentai.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#npmjs
> Buscador de npmjs.
╰━─━─━─☞︎︎︎✰☜︎︎︎─━─━─━╯

╭ׅׄ̇─ׅ̻ׄ╮۪̇߭︹ׅ *DESCARGAS*╭ׅׄ̇─ׅ̻ׄ╮۪̇߭︹ׅ̟ׄ̇︹ׅ۪ׄ̇߭
> Comandos de descargas en el bot.
╚━━━━━━━━━━━━╝
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#tiktok #tt
> Descarga videos de TikTok.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#mediafire #mf
> Descargar cualquier archivo de MediaFire.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#pinvid #pinvideo [enlace]
> Descargar videos de Pinterest.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#mega #mg [enlace]
> Descargar archivos de Mega.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#play #play2 #playaudio #playvideo
> Descarga musicas o videos de YouTube.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#ytmp3 #ytmp4
> Descarga musicas y videos de YouTube mediante URL.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#fb #facebook
> Descarga videos de Facebook.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#twitter #x [enlace]
> Descarga videos de Twitter.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#ig #instagram
> Descarga videos de Instagram.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#tts #tiktoks [URL]
> Descarga videos de TikTok.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#terabox #tb [enlace]
> Descarga archivos de Terabox.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#ttimg #ttmp3 [URL]
> Descarga fotos y audios de TikTok.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#gitclone [URL]
> Descarga un repositorio de GitHub.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#apk #modapk
> Descarga APK de Aptoide.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#tiktokrandom #ttrandom
> Descarga un video aleatorio de TikTok.
 ᳯ⃞ 𑪏𑪋ᩧ❀﹕#npmdl #npmdowloander
> Descarga paquetes de NPMJS.
╰━─━─━─☞︎︎︎✰☜︎︎︎─━─━─━╯

╭ׅׄ̇─ׅ̻ׄ╮۪̇߭︹ׅ *ECONOMIA*╭ׅׄ̇─ׅ̻ׄ╮۪̇߭︹ׅ̟ׄ̇︹ׅ۪ׄ̇߭
> Comandos de economía y RPG para ganar dinero y otras cosas más con el bot.
╚━━━━━━━━━━━━╝
 ᳯ⃞ 𑪏𑪋ᩧ✿𝆬﹕#w #work #trabajar
> Trabaja para ganar Diamantes.
 ᳯ⃞ 𑪏𑪋ᩧ✿𝆬﹕#slut #prostituirse
> Trabaja como prostituta para ganar Diamantes.
 ᳯ⃞ 𑪏𑪋ᩧ✿𝆬﹕#cf #suerte 
> Apuesta tus Diamantes en cara o cruz.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#crime #crimen
> Comete un crimen y gana Diamantes.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#ruleta #roulette #rt
> Apuesta tus diamantes al color rojo o azul.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#casino #apostar
> Apuesta tus Diamantes en el casino.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#slot
> Apuesta tus Diamantes en la ruleta y prueba tu suerte.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#cartera #wallet
> Ver tus diamantes en la cartera.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#bank #banco
> Ver tus diamantes en el banco.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#deposit #depositar #d [cantidad]
> Deposita tus diamantes al banco.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#with #retirar #withdraw
> Retira tus diamantes del banco.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#transfer #pay
> Transfiere tus Diamantes a un usuario [ Solo en grupos ]
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#miming #minar #mine
> Mina para ganar recursos con el bot.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#buyall #buy
> Cambia tu XP por dinero.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#daily #diario
> Reclama tu recompensa diaria.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#cofre
> Reclama un cofre diario lleno de recursos.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#weekly #semanal
> Reclama tu recompensa semanal
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#monthly #mensual
> Reclama tu recompensa mensual.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#steal #robar #rob
> Intenta robarle diamantes a otros usuarios.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#robarxp #robxp
> Robale el XP a otros usuarios.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#eboard #baltop
> Ver el ranking de usuarios con más Diamantes.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#aventura #adventure
> Aventúrate en un nuevo reino y reclama Diamantes.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#curar #heal
> Cura tu salud para volverte a aventurar.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#cazar #hunt #berburu
> Aventúrate en una caza de animales.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#inv #inventario #bal
> Ver tu inventario y todos tus intems.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#halloween
> Reclama tu dulce o truco [ Solo en Halloween ]
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#christmas #navidad 
> Reclama tu regalo navideño [ Solo en navidad ]
╰━─━─━─☞︎︎︎✰☜︎︎︎─━─━─━╯

╭ׅׄ̇─ׅ̻ׄ╮۪̇߭︹ׅ *GACHA*╭ׅׄ̇─ׅ̻ׄ╮۪̇߭︹ׅ̟ׄ̇︹ׅ۪ׄ̇߭
> Comandos de gacha para reclamar y recolectar personajes.
╚━━━━━━━━━━━━╝
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#vender Nombre de la waifu y tu precio
> vender los waifu de tu harem

 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#rollwaifu #rw #roll
> Envía  Waifu o husbando aleatorio 
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#claim #c #reclamar 
> Reclama tu personaje.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#harem #waifus #claims 
> Ver tus personajes e waifus reclamados.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#charimage #waifuimage #wimage
> Ver una imagen aleatoria de un personaje.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#givechar #givewaifu #reglar 
> Regala tus personajes.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#vote #votar 
> Votar tus personajes por un mayor valor.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#waifuboard #waifutop #topwaifus
> Ver el top de personajes.
╰━─━─━─☞︎︎︎✰☜︎︎︎─━─━─━╯

╭ׅׄ̇─ׅ̻ׄ╮۪̇߭︹ׅ STICKERS╭ׅׄ̇─ׅ̻ׄ╮۪̇߭︹ׅ̟ׄ̇︹ׅ۪ׄ̇߭
> Comandos para crear stickers con el bot.
╚━━━━━━━━━━━━╝
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#s #sticker 
> Crea stickers de imagen o videos.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#setmeta 
> Establece un pack y autor para los stickers.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#delmeta 
> Elimina tu pack de stickers.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#qc 
> Crea stickers con textos de usuarios.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#toimg #img
> Convierte stickers en imagen.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#brat #ttp #attp
> Crea stickers con textos.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#emojimix
> Funciona 2 emojis para crear stickers.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#wm
> Cambia el nombre de los stickers.
╰━─━─━─☞︎︎︎✰☜︎︎︎─━─━─━╯

╭ׅׄ̇─ׅ̻ׄ╮۪̇߭︹ׅ *HERRAMIENTAS*╭ׅׄ̇─ׅ̻ׄ╮۪̇߭︹ׅ̟ׄ̇︹ׅ۪ׄ̇߭
> Comandos de herramientas con muchas funciones.
╚━━━━━━━━━━━━╝
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#calcular #cal
> Calcular todo tipo de ecuaciones.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#tiempo #clima
> Ver el clima de un país.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#horario
> Ver el horario global de los países.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#fake #fakeply
> Crea un mensaje falso de un usuario.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#letra 
> Cambia las fuentes de las letras.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#read #readviwonce #ver
> Ver imágenes de una sola vista.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#whatmusic #shazam
> Descubre el nombre de canciones o vídeos.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#ss #ssweb
> Ver el estado de una página.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#length #tamaño.
> Cambia el tamaño de una imagenes o videos.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#say #decir [texto]
> Repetir un mensaje.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#todoc #document
> Crea documentos de audio imágenes y vídeos.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#translate #traducir #trad
> Traduce palabras en otros idiomas.
╰━─━─━─☞︎︎︎✰☜︎︎︎─━─━─━╯

╭ׅׄ̇─ׅ̻ׄ╮۪̇߭︹ׅ̟ׄ̇ *PERFIL*︹
> Comandos para ver contratar y configurar estados de tu perfil.
╚━━━━━━━━━━━━╝
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#reg #verificar #register
> Regístrate en la base de datos del bot.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#unreg 
> Elimina tu registro de la base de datos del bot.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#profile 
> Mira tu perfil.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#marry [tag / responder]
> Casate con una persona en juegos del bot.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#divorce 
> Divórciate con la persona que te casate.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#setgenre #setgenero
> Edita tu género en el perfil del bot.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#delgenre #delgenero
> Elimina tu género del perfil del bot.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#setbirth #setnacimiento
> Edita tu nacimiento en el perfil del bot.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#delbirth #delnacimiento 
> Elimina tu nacimiento del perfil del bot.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#setdescripcion #setdesc
> Edita una descripción para ver en el perfil del bot.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#deldescripcion #deldesc
> Elimina tu descripción del perfil del bot.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#lb #lboard [página]
> Top de usuarios con más experiencia o nivel.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#level #lvl
> Ver tu nivel y experiecia actual.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#comprarpremium #premium 
> Comprar un pase premium para usar el bot sin límites.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#confesiones #confesar
> Confiesa tus sentimientos a alguien de manera anónima.
╰━─━─━─☞︎︎︎✰☜︎︎︎─━─━─━╯

╭ׅׄ̇─ׅ̻ׄ╮۪̇߭︹ׅ̟ׄ̇ *JUEGOS*︹ׅ۪ׄ̇߭︹ׅ̟ׄ̇⊹۪̇߭︹ׅ̟ׄ̇︹ׅ۪ׄ̇߭︹ׅ̟ׄ̇
> Comandos de juegos para jugar con tus amigos.
╚━━━━━━━━━━━━╝
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#amistaf #amigorandom
> Hacer amigos con un juego.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#chaqueta
> Hacerte una chaqueta.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#chiste
> El bot te cuenta un chiste.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#consejo 
> El bot te da un consejo.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#dexeo #dexear [mensionar]
> Simular un deseo falso.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#facto
> Tirar un facto.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#formaroareja
> Forma una pareja.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#formarpareja5
> Forma 5 parejas diferentes.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#frase
> El bot da una frase.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#huevo
> Agarrarle el huevo a alguien.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#chupalo [mensionar]
> Hacer que un usuario te la chupe
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#aplauso
> Aplaudirle a alguien.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#marron [mensionar]
> Burlarte del color de piel de alguien.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#suicidar 
> Suicidate.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#iq #iqtest
> Calcular el IQ de una persona.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#meme
> El bot envía un meme.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#morse
> Convierte un texto en código morse.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#nombreninja
> Busca un nombre ninja aleatorio.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#paja #pajeame
> El bot te hace una paja.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#personalidad [mensionar]
> El bot busca tu personalidad.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#piropo 
> Lanza un piropo.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#pregunta
> Hazle una pregunta al bot.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#ship #pareja 
> El bot te da la probabilidad de enamorarte de alguien.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#sorteo
> Empieza un sorteo.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#top
> Empieza un top de personas 
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#formartrio [mension]
> Forma un trio.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#ahorcado 
> Diviertete con el bot jugando el juego ahorcado.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#mates #matematicas 
> Responde las preguntas de matemáticas para ganar recompensas
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#ppt 
> Juego piedra papel l tijeras con el bot.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#sopa #buscarpalabra
> Juega el famoso juego de sopas de letras.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#pvp #suit [mensionar]
> Juega un PvP contra otro usuario.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#ttt
> Crea una sala de juego.
╰━─━─━─☞︎︎︎✰☜︎︎︎─━─━─━╯

╭ׅׄ̇─ׅ̻ׄ╮۪̇߭︹ׅ̟ׄ̇ *NSFW*︹ׅ۪ׄ̇߭︹ׅ̟ׄ̇⊹۪̇߭︹ׅ̟ׄ̇︹ׅ۪ׄ̇߭︹ׅ̟ׄ̇
> Comandos de NSFW (Contenido para adultos)
╚━━━━━━━━━━━━╝
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#anal [mensionar]
> Hacer un anal.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#waifu
> Busca una waifu.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#bath [mensionar]
> Bañarse.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#blowjob #mamada #bj [MENSIONAR]
> Dar una mamada.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#boobjob [mensionar]
> Hacer una rusa.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#cum [MENSIONAR]
> Venirse en alguien.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#fap [mensionar]
> Hacerte una paja.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#footjob [mensionar]
> Hacerte una paja con los pies.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#fuck #coger #fuck2 [MENSIONAR]
> Follarte a alguien.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#cafe #coffe
> Tomarte un cafesito.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#violar #perra [mensionar]
> Viola a alguien.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#grabboobs [mensionar]
> Agarrar tetas.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#grop [mensionar]
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#lickpussy [MENSIONAR]
> Lamer un toto 
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#rule34 #r34 [tag]
> Buscar imágenes en Rule34
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#sixnine #69 [mensionar]
> Haz un 69 con alguien.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#spank #nalgada [mensionar]
> Dar una nalgada.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#suckboobs [mensionar]
> Chupar tetas.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#undress #encuerar [mensionar]
> Desnudar a alguien.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#yuri #tijeras [mensionar]
> Hacer tijeras.
╰━─━─━─☞︎︎︎✰☜︎︎︎─━─━─━╯

╭ׅׄ̇─ׅ̻ׄ╮۪̇߭︹ׅ̟ׄ̇ *ANIME*︹ׅ۪ׄ̇߭︹ׅ̟ׄ̇⊹۪̇߭︹ׅ̟ׄ̇︹ׅ۪ׄ̇߭︹ׅ̟ׄ̇
> Comandos de reacciones de anime.
╚━━━━━━━━━━━━╝
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#angry #enojado [MENSIONAR]
> Estar enojado gay si lo lees.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#bite [mensionar]
> Muerde a alguien.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#bleh [mensionar]
> Sacar lengua.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#blush [mensionar]
> Sonrojarse.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#bored #aburrido [mensionar]
> Estar aburrido.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#cry [mensionar]
> Llorar por alguien o algo.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#cuddle [mensionar]
> Acurrucarse en alguien.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#dance [MENSIONAR]
> Sacar los pasos prohibidos de gays.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#drunk [mensionar]
> Estar borracho.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#eat #comer [mensionar]
> Comer algo delicioso.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#facepalm [mensionar]
> Darte una palmada en la cara.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#happy #feliz [mensionar]
> Salta de felicidad.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#hug [mensionar]
> Dar un abrazo.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#impregnate #preg #embarazar [mensionar]
> Embarazar a alguien.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#kill [mensionar]
> Toma tu arma y mata a alguien.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#kiss #besar #kiss2 [mensionar]
> Besar a alguien.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#laugh [mensionar]
> Reírte de algo o alguien.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#lick [mensionar]
> Lamer q alguien.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#love #amor [mensionar]
> Sentirse enamorado.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#pat #acariciar [mensionar]
> Acaricia a alguien.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#poke [mensionar]
> Picar a alguien.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#pout [mensionar]
> Hacer pucheros.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#punch #golpear [mensionar]
> Dar puñetazo.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#run [mensionar]
> Correr de alguien.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#sad #triste [mensionar]
> Estar triste por alguien o que alguien está triste .
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#scared [mensionar]
> Estar asustado (solo los gays se asustan, el susto es para mujeres, si te asustas eres gay .
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#seduce [mensionar]
> Seducir a alguien.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#shy #timido
> Estar tímido.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#slap [mensionar]
> Dar una bofetada.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#dias days 
> Darle los buenos días a alguien.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#noches #nights
> Darle las buenas noches a alguien.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#sleep [mensionar]
> Hechar una fiesta y cuidado si te roban por gay XD.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#smoke [mensionar]
> Fumar.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#think [mensionar]
> Pensar en algo o alguien.
╰━─━─━─☞︎︎︎✰☜︎︎︎─━─━─━╯

╭ׅׄ̇─ׅ̻ׄ╮۪̇߭︹ׅ̟ׄ̇ *𝐆𝐑𝐔𝐏𝐎𝐒*︹ׅ۪ׄ̇߭︹ׅ̟ׄ̇⊹۪̇߭︹ׅ̟ׄ̇︹ׅ۪ׄ̇߭︹ׅ̟ׄ̇
> 𝐂𝚘𝚖𝚊𝚗𝚍𝚘𝚜 𝚙𝚊𝚛𝚊 𝚚𝚞𝚎 𝚜𝚎𝚊 𝚖𝚎𝚓𝚘𝚛 𝚎𝚕 𝚖𝚊𝚗𝚎𝚓𝚘 𝚢 𝚊𝚍𝚖𝚒𝚗𝚒𝚜𝚝𝚛𝚊𝚌𝚒𝚘́𝚗 𝚎𝚗 𝚝𝚞𝚜 𝚐𝚛𝚞𝚙𝚘𝚜.
╚━━━━━━━━━━━━╝
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#hidetag #tag #notify
> Envia un mensaje mensionando a todos los usuarios del grupo.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#gp #infogrupo
> Ver toda la información del grupo.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#lenea #listonline
> Ver una lista de todas las personas que están en linea y no quieren hablar en el grupo por gays.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#setwelcome 
> Personaliza el mensaje de bienvenida para el bot.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#setbye
> Personaliza un mensaje de despedida para el bot.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#link
> El bot envía el enlace del grupo [el bot tiene que ser admin para poder ejecutar el comando]
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#restablecer #revoke
> El bot restablece el mensaje del grupo.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#grupo #group [abrir o cerrar]
> Cambia ajustes del grupo para que hablen solo admins o todos los usuarios. 
ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#kick [número o mensionar]
> Elimina a una persona de tu grupo.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#add #añadir #agregar [número]
> El bot envía el enlace del grupo al usuauario para que se una.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#promote 
> El bot promueve a u a persona para que sea admin de tu grupo.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#demote 
> El bot promueve a una persona para que deje de ser admin de tu grupo.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#gpbanner #groupimg
> Cambia la foto del perfil del grupo [el bot debe ser admin para ejecutar ese comando]
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#gpdesc #groupdesc [texto]
> El bot cambia la descripción del grupo [el bot debe ser admin para ejecutar ese comando]
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#gpname #groupname [texto]
> El bot cambia el nombre del grupo [el bot debe ser admin para ejecutar ese comando]
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#advertir #warn #warning [tag]
> Darle una advertencia a un usuario.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#delwarn #unwarn [tag]
> El bot le quita la advertencia al usuario.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#listadv #advlist
> Ver la lista de los usuarios advertidos.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#mute [mensionar]
> El bot elimina los mensajes del usuario.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#unmute [mensionar]
> El bot le quita el mute a las personas.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#encuesta #poll [texto]
> El bot hace una encuesta.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#del #delete
> El bot elimina mensajes.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#fantasmas
> Ver la lista de inactivos en el grupo.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#kickfantasmas
> El bot elimina a todos los que no están activos en el grupo.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#invocar #tagall #todos [texto]
> El bot envía un mensaje donde están los tags de todos los usuarios para que se conecten.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#setemoji #setemo
> Cambia el emoji que se usa en la invocación del grupo.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#kicknum #listnum
> Elimina un usuario por el prefijo del país.
╰━─━─━─☞︎︎︎✰☜︎︎︎─━─━─━╯

╭ׅׄ̇─ׅ̻ׄ╮۪̇߭︹ׅ̟ׄ̇ *CONFIGURACIÓN*︹ׅ۪ׄ̇߭︹ׅ̟ׄ̇⊹۪̇߭︹ׅ̟ׄ̇︹ׅ۪ׄ̇߭︹ׅ̟ׄ̇
> Opciones de configuración del grupo.
╚━━━━━━━━━━━━╝
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#bot [on/off]
> Activa o desactiva al bot en tu grupo.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#antilink [on/off]
> Activa o desactiva el anti enlaces en tu grupo.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#antibot [on/off]
> Si el bot detecta otro bot que no sea admin lo elimina automáticamente si está opción está activa.
 ᳯ⃞ 𑪏𑪋ᩧ✿monic﹕#antisubbots
> Si hay algún SubBot de M500 ULTRA BOT, sale del grupo automáticamente para evitar el spam.
╰━─━─━─☞︎︎︎✰☜︎︎︎─━─━─━╯
`
    const channelId = "120363324350463849@newsletter"
    const channelName = "❤️̶۫̄͟Ⓢ︎𓏲S͟u͟m͟m͟i͟𓍲̈͜𝗨̴ᥣ̥𝗍̈rᥲ̄𓊓̵̬𝐁o̸t̸❤️̶۫̄͟─"

    const channelForwardedMessage = {
      key: {
        remoteJid: "120363324350463849@newsletter",
        fromMe: false,
        id: "1234567890",
      },
      message: {
        conversation: menu,
      },
      messageTimestamp: Date.now(),
      isForwarded: true,
      forwardingScore: 999,
      forwardedFromChannel: true,
    }

    await conn.sendMessage(m.chat, channelForwardedMessage, { quoted: m })
  } catch (e) {
    console.error(e)
    await conn.sendMessage(m.chat, { text: "Error al generar el menú." }, { quoted: m })
  }
}

// Function declarations for undeclared variables
function clockString(ms) {
  const h = Math.floor(ms / (3600 * 1000))
  const m = Math.floor((ms % (3600 * 1000)) / (60 * 1000))
  const s = Math.floor((ms % (60 * 1000)) / 1000)
  return `${h}h ${m}m ${s}s`
}

function getCountryFromNumber(number) {
  // Implement country detection logic here
  return "Unknown"
}

handler.help = ["menu", "help", "comandos"]
handler.tags = ["main"]
handler.command = /^(menu|help|comandos|cmd)$/i

export default handler
