import { smsg } from "./lib/simple.js"
import { format } from "util"
import { fileURLToPath } from "url"
import path, { join } from "path"
import { unwatchFile, watchFile } from "fs"
import chalk from "chalk"
import { WebSocket } from "ws"
const ws = WebSocket

const { proto } = (await import("@whiskeysockets/baileys")).default
const isNumber = (x) => typeof x === "number" && !isNaN(x)
const delay = (ms) =>
  isNumber(ms) &&
  new Promise((resolve) =>
    setTimeout(function () {
      clearTimeout(this)
      resolve()
    }, ms),
  )

global.opts = global.opts || {}
global.conn = global.conn || {}
global.loadDatabase = global.loadDatabase || (() => {})
global.API = global.API || (() => {})
global.mssg = global.mssg || {}

// Rate limiting configuration
const RATE_LIMIT = {
  METADATA_CACHE_DURATION: 30 * 60 * 1000, // 30 minutes
  METADATA_CACHE: new Map(),
  QUEUE_DELAY: 3000, // 3 seconds between requests
  requestQueue: [],
  processing: false,
}

// Add a function to process the queue
async function processQueue() {
  if (RATE_LIMIT.processing || RATE_LIMIT.requestQueue.length === 0) return

  RATE_LIMIT.processing = true
  const { jid, resolve, reject } = RATE_LIMIT.requestQueue.shift()

  try {
    const result = await this.groupMetadata(jid)
    resolve(result)
  } catch (error) {
    reject(error)
  } finally {
    RATE_LIMIT.processing = false
    if (RATE_LIMIT.requestQueue.length > 0) {
      setTimeout(() => processQueue.call(this), RATE_LIMIT.QUEUE_DELAY)
    }
  }
}

// Add a function to safely get group metadata with caching
async function safeGroupMetadata(jid) {
  // Check cache first
  if (RATE_LIMIT.METADATA_CACHE.has(jid)) {
    const { data, timestamp } = RATE_LIMIT.METADATA_CACHE.get(jid)
    if (Date.now() - timestamp < RATE_LIMIT.METADATA_CACHE_DURATION) {
      return data
    }
  }

  // If not in cache or expired, queue the request
  return new Promise((resolve, reject) => {
    RATE_LIMIT.requestQueue.push({ jid, resolve, reject })
    if (!RATE_LIMIT.processing) {
      processQueue.call(this)
    }
  }).then((result) => {
    // Cache the result
    RATE_LIMIT.METADATA_CACHE.set(jid, {
      data: result,
      timestamp: Date.now(),
    })
    return result
  })
}

// Safe string comparison function to avoid using regex with startsWith
function safeStartsWith(text, prefix) {
  if (!text || !prefix) return false
  if (typeof text !== "string" || typeof prefix !== "string") return false
  return text.indexOf(prefix) === 0
}

export async function handler(chatUpdate) {
  try {
    this.msgqueque = this.msgqueque || []
    if (!chatUpdate) return
    this.pushMessage(chatUpdate.messages).catch(console.error)
    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m) return
    if (global.db.data == null) await global.loadDatabase()

    try {
      m = smsg(this, m) || m
      if (!m) return
      m.exp = 0
      m.coin = 0
      m.diamond = false

      // Add additional logging to debug command processing
      if (m.text) {
        console.log(`Received message: ${m.text.substring(0, 50)}${m.text.length > 50 ? "..." : ""}`)
      }

      try {
        const user = global.db.data.users[m.sender]
        if (typeof user !== "object") global.db.data.users[m.sender] = {}
        if (user) {
          if (!isNumber(user.exp)) user.exp = 0
          if (!isNumber(user.coin)) user.coin = 0
          if (!isNumber(user.diamond)) user.diamond = 20
          if (!isNumber(user.bank)) user.bank = 0
          if (!isNumber(user.lastclaim)) user.lastclaim = 0
          if (!("registered" in user)) user.registered = false
          if (!user.registered) {
            if (!("name" in user)) user.name = m.name
            if (!isNumber(user.age)) user.age = -1
            if (!isNumber(user.regTime)) user.regTime = -1
          }
          if (!isNumber(user.afk)) user.afk = -1
          if (!("afkReason" in user)) user.afkReason = ""
          if (!("banned" in user)) user.banned = false
          if (!isNumber(user.warn)) user.warn = 0
          if (!isNumber(user.level)) user.level = 0
          if (!("role" in user)) user.role = "Novato"
          if (!("autolevelup" in user)) user.autolevelup = false
          if (!("chatbot" in user)) user.chatbot = false
          if (!("genero" in user)) user.genero = "Indeciso"
          if (!("language" in user)) user.language = "es"
          if (!("prem" in user)) user.prem = false
          if (!user.premiumTime) user.premiumTime = 0
          if (!("namebebot" in user)) user.namebebot = ""
          if (!("isbebot" in user)) user.isbebot = false
        } else
          global.db.data.users[m.sender] = {
            exp: 0,
            coin: 0,
            diamond: 20,
            bank: 0,
            lastclaim: 0,
            registered: false,
            name: m.name,
            age: -1,
            regTime: -1,
            afk: -1,
            afkReason: "",
            banned: false,
            warn: 0,
            level: 0,
            role: "Novato",
            autolevelup: false,
            chatbot: false,
            genero: "Indeciso",
            language: "es",
            prem: false,
            premiumTime: 0,
            namebebot: "",
            isbebot: false,
          }

        const chat = global.db.data.chats[m.chat]
        if (typeof chat !== "object") global.db.data.chats[m.chat] = {}
        if (chat) {
          if (!("isBanned" in chat)) chat.isBanned = false
          if (!("welcome" in chat)) chat.welcome = false
          if (!("detect" in chat)) chat.detect = true
          if (!("sWelcome" in chat)) chat.sWelcome = ""
          if (!("sBye" in chat)) chat.sBye = ""
          if (!("sPromote" in chat)) chat.sPromote = ""
          if (!("sDemote" in chat)) chat.sDemote = ""
          if (!("delete" in chat)) chat.delete = false
          if (!("antiLink" in chat)) chat.antiLink = false
          if (!("viewonce" in chat)) chat.viewonce = false
          if (!("captcha" in chat)) chat.captcha = false
          if (!("antiBotClone" in chat)) chat.antiBotClone = false
          if (!("nsfw" in chat)) chat.nsfw = false
          if (!isNumber(chat.expired)) chat.expired = 0
          if (!("rules" in chat)) chat.rules = ""
          if (!("antiLag" in chat)) chat.antiLag = true
        } else
          global.db.data.chats[m.chat] = {
            isBanned: false,
            welcome: false,
            detect: true,
            sWelcome: "",
            sBye: "",
            sPromote: "",
            sDemote: "",
            delete: false,
            antiLink: false,
            viewonce: false,
            useDocument: true,
            captcha: false,
            antiBotClone: false,
            nsfw: false,
            expired: 0,
            rules: "",
            antiLag: true,
          }

        if (!global.db) global.db = {}
        if (!global.db.data) global.db.data = {}
        if (!global.db.data.settings) global.db.data.settings = {}

        if (this.user && this.user.jid) {
          var settings = global.db.data.settings[this.user.jid]

          if (typeof settings !== "object" || settings === null) {
            global.db.data.settings[this.user.jid] = {}
            settings = global.db.data.settings[this.user.jid]
          }

          if (!("self" in settings)) settings.self = false
          if (!("autoread" in settings)) settings.autoread = false
          if (!("restrict" in settings)) settings.restrict = false
          if (!("status" in settings)) settings.status = 0
          if (!("solopv" in settings)) settings.solopv = false
          if (!("sologp" in settings)) settings.sologp = false
        } else {
          console.error("🌿 this.user.jid no está definido.")
        }
      } catch (e) {
        console.error("Error in user/chat data setup:", e)
      }

      try {
        const mainBot = global.conn?.user?.jid
        if (!mainBot) {
          console.error("Error: No se pudo obtener el JID del bot principal")
          return
        }

        const chat = global.db?.data?.chats?.[m.chat] || {}
        const isAntiLag = chat.antiLag === true

        let groupMetadata = null

        if (m.isGroup) {
          try {
            groupMetadata = await safeGroupMetadata.call(this, m.chat)
          } catch (error) {
            console.error("Error al obtener metadata del grupo:", error)
          }
        }

        const botIsInGroup = groupMetadata?.participants?.some((p) => p.id === mainBot) || false

        if (isAntiLag && botIsInGroup && this.user.jid !== mainBot) return
      } catch (e) {
        console.error("Error en handler:", e)
      }

      if (global.opts["nyimak"]) return
      if (!m.fromMe && global.opts["self"]) return
      if (global.db.data.settings[this.user.jid].solopv && m.chat.endsWith("g.us")) return

      // Use safe string comparison instead of regex
      if (
        global.db.data.settings[this.user.jid].sologp &&
        !m.chat.endsWith("g.us") &&
        !(
          safeStartsWith(m.text, "jadibot") ||
          safeStartsWith(m.text, "code") ||
          safeStartsWith(m.text, "getcode") ||
          safeStartsWith(m.text, "serbot") ||
          safeStartsWith(m.text, "bots") ||
          safeStartsWith(m.text, "stop") ||
          safeStartsWith(m.text, "support") ||
          safeStartsWith(m.text, "donate") ||
          safeStartsWith(m.text, "off") ||
          safeStartsWith(m.text, "on") ||
          safeStartsWith(m.text, "s") ||
          safeStartsWith(m.text, "tiktok") ||
          safeStartsWith(m.text, "newcode") ||
          safeStartsWith(m.text, "join")
        )
      ) {
        return
      }

      if (global.opts["swonly"] && m.chat !== "status@broadcast") return
      if (typeof m.text !== "string") m.text = ""

      const _user = global.db.data && global.db.data.users && global.db.data.users[m.sender]

      const isROwner = [global.conn.decodeJid(global.conn.user.id), ...global.owner.map(([number]) => number)]
        .map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net")
        .includes(m.sender)
      const isOwner = isROwner || m.fromMe
      const isMods = isOwner || global.mods.map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(m.sender)
      const isPrems =
        isROwner ||
        global.prems.map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(m.sender) ||
        _user.prem == true

      if (global.opts["queque"] && m.text && !(isMods || isPrems)) {
        const queque = this.msgqueque,
          time = 1000 * 5
        const previousID = queque[queque.length - 1]
        queque.push(m.id || m.key.id)
        setInterval(async function () {
          if (queque.indexOf(previousID) === -1) clearInterval(this)
          await delay(time)
        }, time)
      }

      if (m.isBaileys) return
      m.exp += Math.ceil(Math.random() * 10)

      let usedPrefix

      let groupMetadata = null
      if (m.isGroup) {
        try {
          groupMetadata = await safeGroupMetadata.call(this, m.chat)
        } catch (error) {
          console.error("Error fetching group metadata:", error)
        }
      }

      const participants = m.isGroup && groupMetadata ? groupMetadata.participants : []
      const user = (m.isGroup ? participants.find((u) => this.decodeJid(u.id) === m.sender) : {}) || {}
      const bot = (m.isGroup ? participants.find((u) => this.decodeJid(u.id) == this.user.jid) : {}) || {}
      const isRAdmin = user?.admin == "superadmin" || false
      const isAdmin = isRAdmin || user?.admin == "admin" || false
      const isBotAdmin = bot?.admin || false

      const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), "./plugins")
      for (const name in global.plugins) {
        const plugin = global.plugins[name]
        if (!plugin) continue
        if (plugin.disabled) continue
        const __filename = join(___dirname, name)
        if (typeof plugin.all === "function") {
          try {
            await plugin.all.call(this, m, {
              chatUpdate,
              __dirname: ___dirname,
              __filename,
            })
          } catch (e) {
            console.error(`Error in plugin ${name} (all):`, e)
          }
        }
        if (!global.opts["restrict"])
          if (plugin.tags && plugin.tags.includes("admin")) {
            continue
          }
        const str2Regex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")
        const _prefix = plugin.customPrefix
          ? plugin.customPrefix
          : global.conn.prefix
            ? global.conn.prefix
            : global.prefix

        // Handle prefix matching safely
        let match = null
        if (_prefix instanceof RegExp) {
          try {
            const exec = _prefix.exec(m.text)
            match = exec ? [[exec, _prefix]] : null
          } catch (e) {
            console.error("Error with RegExp prefix:", e)
          }
        } else if (Array.isArray(_prefix)) {
          match = _prefix
            .map((p) => {
              let re
              if (p instanceof RegExp) {
                re = p
              } else {
                re = new RegExp(str2Regex(p))
              }
              try {
                return [re.exec(m.text), re]
              } catch (e) {
                console.error(`Error with prefix ${p}:`, e)
                return [null, re]
              }
            })
            .find((p) => p[0])
        } else if (typeof _prefix === "string") {
          try {
            const re = new RegExp(str2Regex(_prefix))
            const exec = re.exec(m.text)
            match = exec ? [[exec, re]] : null
          } catch (e) {
            console.error("Error with string prefix:", e)
          }
        } else {
          match = [[[], new RegExp()]]
        }

        if (!match) continue

        if (typeof plugin.before === "function") {
          try {
            if (
              await plugin.before.call(this, m, {
                match,
                conn: this,
                participants,
                groupMetadata,
                user,
                bot,
                isROwner,
                isOwner,
                isRAdmin,
                isAdmin,
                isBotAdmin,
                isPrems,
                chatUpdate,
                __dirname: ___dirname,
                __filename,
              })
            )
              continue
          } catch (e) {
            console.error(`Error in plugin ${name} (before):`, e)
          }
        }
        if (typeof plugin !== "function") continue

        // Extract prefix and command safely
        if (match[0] && match[0][0]) {
          const usedPrefix = match[0][0]

          try {
            const noPrefix = m.text.replace(usedPrefix, "")
            let [command, ...args] = noPrefix.trim().split` `.filter((v) => v)
            args = args || []
            const _args = noPrefix.trim().split` `.slice(1)
            const text = _args.join` `
            command = (command || "").toLowerCase()

            console.log(`Command detected: ${command} with args: ${args.join(", ")}`)

            const fail = plugin.fail || global.dfail
            const isAccept =
              plugin.command instanceof RegExp
                ? plugin.command.test(command)
                : Array.isArray(plugin.command)
                  ? plugin.command.some((cmd) => (cmd instanceof RegExp ? cmd.test(command) : cmd === command))
                  : typeof plugin.command === "string"
                    ? plugin.command === command
                    : false

            if (!isAccept) continue
            m.plugin = name
            if (m.chat in global.db.data.chats || m.sender in global.db.data.users) {
              const chat = global.db.data.chats[m.chat]
              const user = global.db.data.users[m.sender]
              if (name != "owner-unbanchat.js" && chat?.isBanned) return
              if (name != "owner-unbanuser.js" && user?.banned) return
            }
            if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) {
              fail("owner", m, this)
              continue
            }
            if (plugin.rowner && !isROwner) {
              fail("rowner", m, this)
              continue
            }
            if (plugin.owner && !isOwner) {
              fail("owner", m, this)
              continue
            }
            if (plugin.mods && !isMods) {
              fail("mods", m, this)
              continue
            }
            if (plugin.premium && !isPrems) {
              fail("premium", m, this)
              continue
            }
            if (plugin.group && !m.isGroup) {
              fail("group", m, this)
              continue
            } else if (plugin.botAdmin && !isBotAdmin) {
              fail("botAdmin", m, this)
              continue
            } else if (plugin.admin && !isAdmin) {
              fail("admin", m, this)
              continue
            }
            if (plugin.private && m.isGroup) {
              fail("private", m, this)
              continue
            }
            if (plugin.register == true && _user.registered == false) {
              fail("unreg", m, this)
              continue
            }
            m.isCommand = true
            const xp = "exp" in plugin ? Number.parseInt(plugin.exp) : 17
            if (xp > 200) m.reply("chirrido -_-")
            else m.exp += xp
            if (!isPrems && plugin.diamond && global.db.data.users[m.sender].diamond < plugin.diamond * 1) {
              this.reply(
                m.chat,
                `=͟͟͞❀ 💎 𝙏𝙪𝙨 𝙙𝙞𝙖𝗺𝗮𝗻𝘁𝗲𝘀 𝘀𝗲 𝗮𝗴𝗼𝘁𝗮𝗿𝗼𝗻 ⏤͟͟͞͞★\n𝙐𝘀𝗮 𝗲𝗹 𝘀𝗶𝗴𝘂𝗶𝗲𝗻𝘁𝗲 𝗰𝗼𝗺𝗮𝗻𝗱𝗼 𝗽𝗮𝗿𝗮 𝗰𝗼𝗺𝗽𝗿𝗮𝗿 𝗺á𝘀 𝗱𝗶𝗮𝗺𝗮𝗻𝘁𝗲𝘀\n\n*${usedPrefix}buy*`,
                m,
              )
              continue
            }
            if (plugin.level > _user.level) {
              this.reply(
                m.chat,
                `=͟͟͞❀ ⚠️ 𝙉𝙞𝙫𝙚𝙡 𝗿𝗲𝗾𝘂𝗲𝗿𝗶𝗱𝗼 ${plugin.level} 𝗽𝗮𝗿𝗮 𝘂𝘀𝗮𝗿 𝗲𝘀𝘁𝗲 𝗰𝗼𝗺𝗮𝗻𝗱𝗼 ⏤͟͟͞͞★\n𝙏𝙪 𝗻𝗶𝘃𝗲𝗹 𝗮𝗰𝘁𝘂𝗮𝗹: ${_user.level}`,
                m,
              )
              continue
            }
            const extra = {
              match,
              usedPrefix,
              noPrefix,
              _args,
              args,
              command,
              text,
              conn: this,
              participants,
              groupMetadata,
              user,
              bot,
              isROwner,
              isOwner,
              isRAdmin,
              isAdmin,
              isBotAdmin,
              isPrems,
              chatUpdate,
              __dirname: ___dirname,
              __filename,
            }
            try {
              await plugin.call(this, m, extra)
              if (!isPrems) m.diamond = m.diamond || plugin.diamond || false
            } catch (e) {
              m.error = e
              console.error(`Error in plugin ${name}:`, e)
              if (e) {
                let text = format(e)
                for (const key of Object.values(global.APIKeys)) text = text.replace(new RegExp(key, "g"), "#HIDDEN#")
                m.reply(text)
              }
            } finally {
              if (typeof plugin.after === "function") {
                try {
                  await plugin.after.call(this, m, extra)
                } catch (e) {
                  console.error(`Error in plugin ${name} (after):`, e)
                }
              }
              if (m.diamond) m.reply(`=͟͟͞❀ 𝙐𝙩𝙞𝙡𝙞𝙯𝙖𝙨𝙩𝙚 *${+m.diamond}* 💎 ⏤͟͟͞͞★`)
            }
            break
          } catch (e) {
            console.error("Error processing command:", e)
          }
        }
      }
    } catch (e) {
      console.error("Error processing message:", e)
    } finally {
      if (global.opts["queque"] && m.text) {
        const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
        if (quequeIndex !== -1) this.msgqueque.splice(quequeIndex, 1)
      }
      let user,
        stats = global.db.data.stats
      if (m) {
        if (m.sender && (user = global.db.data.users[m.sender])) {
          user.exp += m.exp
          user.diamond -= m.diamond * 1
        }

        let stat
        if (m.plugin) {
          const now = +new Date()
          if (m.plugin in stats) {
            stat = stats[m.plugin]
            if (!isNumber(stat.total)) stat.total = 1
            if (!isNumber(stat.success)) stat.success = m.error != null ? 0 : 1
            if (!isNumber(stat.last)) stat.last = now
            if (!isNumber(stat.lastSuccess)) stat.lastSuccess = m.error != null ? 0 : now
          } else
            stat = stats[m.plugin] = {
              total: 1,
              success: m.error != null ? 0 : 1,
              last: now,
              lastSuccess: m.error != null ? 0 : now,
            }
          stat.total += 1
          stat.last = now
          if (m.error == null) {
            stat.success += 1
            stat.lastSuccess = now
          }
        }
      }

      try {
        if (!global.opts["noprint"]) await (await import(`./lib/print.js`)).default(m, this)
      } catch (e) {
        console.log(m, m.quoted, e)
      }
      if (global.opts["autoread"])
        await this.chatRead(m.chat, m.isGroup ? m.sender : undefined, m.id || m.key.id).catch(() => {})
    }
  } catch (err) {
    console.error("Critical error in handler:", err)
  }
}

export async function participantsUpdate({ id, participants, action }) {
  if (global.opts["self"]) return
  if (global.db.data == null) await global.loadDatabase()

  try {
  } catch (error) {
    console.error(error)
  }
}

export async function groupsUpdate(groupsUpdate) {
  if (global.opts["self"]) return
}

global.dfail = (type, m, conn) => {
  const comando = m.plugin || "desconocido"

  const msg = {
    rowner: `《✧》El comando solo puede ser usado por los creadores del bot.`,
    owner: `《✧》El comando solo puede ser usado por los desarrolladores del bot.`,
    mods: `《✧》El comando solo puede ser usado por los moderadores del bot.`,
    premium: `《✧》El comando solo puede ser usado por los usuarios premium.`,
    group: `《✧》El comando solo puede ser usado en grupos.`,
    private: `《✧》El comando solo puede ser usado al chat privado del bot.`,
    admin: `《✧》El comando solo puede ser usado por los administradores del grupo.`,
    botAdmin: `《✧》Para ejecutar el comando debo ser administrador del grupo.`,
    unreg: `《✧》El comando solo puede ser usado por los usuarios registrado, registrate usando:\n> » #reg nombre.edad`,
    restrict: `《✧》Esta caracteristica está desactivada.`,
  }[type]
  if (msg) return m.reply(msg).then((_) => m.react("✖️"))
}

const file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
  unwatchFile(file)
  console.log(chalk.magenta("Se actualizo 'handler.js'"))

  if (global.conns && global.conns.length > 0) {
    const users = [
      ...new Set([
        ...global.conns
          .filter((conn) => conn.user && conn.ws.socket && conn.ws.socket.readyState !== ws.CLOSED)
          .map((conn) => conn),
      ]),
    ]
    for (const userr of users) {
      userr.subreloadHandler(false)
    }
  }
})
