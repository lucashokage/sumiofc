import { smsg } from "./lib/simple.js"
import { format } from "util"
import { fileURLToPath } from "url"
import path, { join } from "path"
import { unwatchFile, watchFile } from "fs"
import chalk from "chalk"

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

// Declarations for missing variables
global.opts = global.opts || {}
global.conn = global.conn || {}
global.loadDatabase = global.loadDatabase || (() => {})
global.API = global.API || (() => {})
global.mssg = global.mssg || {}

export async function handler(chatUpdate) {
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
        if (!("detect" in chat)) chat.detect = false
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
      } else
        global.db.data.chats[m.chat] = {
          isBanned: false,
          welcome: false,
          detect: false,
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
      console.error(e)
    }
    if (opts["nyimak"]) return
    if (!m.fromMe && opts["self"]) return
    if (global.db.data.settings[this.user.jid].solopv && m.chat.endsWith("g.us")) return
    if (
      global.db.data.settings[this.user.jid].sologp &&
      !m.chat.endsWith("g.us") &&
      !/jadibot|code|getcode|serbot|bots|stop|support|donate|off|on|s|tiktok|code|newcode|join/gim.test(m.text)
    )
      return

    if (opts["swonly"] && m.chat !== "status@broadcast") return
    if (typeof m.text !== "string") m.text = ""

    const _user = global.db.data && global.db.data.users && global.db.data.users[m.sender]

    const isROwner = [conn.decodeJid(global.conn.user.id), ...global.owner.map(([number]) => number)]
      .map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net")
      .includes(m.sender)
    const isOwner = isROwner || m.fromMe
    const isMods = isOwner || global.mods.map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(m.sender)
    const isPrems =
      isROwner ||
      global.prems.map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(m.sender) ||
      _user.prem == true

    if (opts["queque"] && m.text && !(isMods || isPrems)) {
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

    const groupMetadata =
      (m.isGroup ? (conn.chats[m.chat] || {}).metadata || (await this.groupMetadata(m.chat).catch((_) => null)) : {}) ||
      {}
    const participants = (m.isGroup ? groupMetadata.participants : []) || []
    const user = (m.isGroup ? participants.find((u) => conn.decodeJid(u.id) === m.sender) : {}) || {}
    const bot = (m.isGroup ? participants.find((u) => conn.decodeJid(u.id) == this.user.jid) : {}) || {}
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
          console.error(e)
        }
      }
      if (!opts["restrict"])
        if (plugin.tags && plugin.tags.includes("admin")) {
          continue
        }
      const str2Regex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")
      const _prefix = plugin.customPrefix ? plugin.customPrefix : conn.prefix ? conn.prefix : global.prefix
      const match = (
        _prefix instanceof RegExp
          ? [[_prefix.exec(m.text), _prefix]]
          : Array.isArray(_prefix)
            ? _prefix.map((p) => {
                const re = p instanceof RegExp ? p : new RegExp(str2Regex(p))
                return [re.exec(m.text), re]
              })
            : typeof _prefix === "string"
              ? [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]]
              : [[[], new RegExp()]]
      ).find((p) => p[1])
      if (typeof plugin.before === "function") {
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
      }
      if (typeof plugin !== "function") continue
      if ((usedPrefix = (match[0] || "")[0])) {
        const noPrefix = m.text.replace(usedPrefix, "")
        let [command, ...args] = noPrefix.trim().split` `.filter((v) => v)
        args = args || []
        const _args = noPrefix.trim().split` `.slice(1)
        const text = _args.join` `
        command = (command || "").toLowerCase()
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
            `=͟͟͞❀ 💎 𝙏𝙪𝙨 𝙙𝙞𝙖𝙢𝙖𝙣𝙩𝙚𝙨 𝙨𝙚 𝙖𝙜𝙤𝙩𝙖𝙧𝙤𝙣 ⏤͟͟͞͞★\n𝙐𝙨𝙖 𝙚𝙡 𝙨𝙞𝙜𝙪𝙞𝙚𝙣𝙩𝙚 𝙘𝙤𝙢𝙖𝙣𝙙𝙤 𝙥𝙖𝙧𝙖 𝙘𝙤𝙢𝙥𝙧𝙖𝙧 𝙢á𝙨 𝙙𝙞𝙖𝙢𝙖𝙣𝙩𝙚𝙨\n\n*${usedPrefix}buy*`,
            m,
          )
          continue
        }
        if (plugin.level > _user.level) {
          this.reply(
            m.chat,
            `=͟͟͞❀ ⚠️ 𝙉𝙞𝙫𝙚𝙡 𝙧𝙚𝙦𝙪𝙚𝙧𝙞𝙙𝙤 ${plugin.level} 𝙥𝙖𝙧𝙖 𝙪𝙨𝙖𝙧 𝙚𝙨𝙩𝙚 𝙘𝙤𝙢𝙖𝙣𝙙𝙤 ⏤͟͟͞͞★\n𝙏𝙪 𝙣𝙞𝙫𝙚𝙡 𝙖𝙘𝙩𝙪𝙖𝙡: ${_user.level}`,
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
          console.error(e)
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
              console.error(e)
            }
          }
          if (m.diamond) m.reply(`=͟͟͞❀ 𝙐𝙩𝙞𝙡𝙞𝙯𝙖𝙨𝙩𝙚 *${+m.diamond}* 💎 ⏤͟͟͞͞★`)
        }
        break
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    if (opts["queque"] && m.text) {
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
      if (!opts["noprint"]) await (await import(`./lib/print.js`)).default(m, this)
    } catch (e) {
      console.log(m, m.quoted, e)
    }
    if (opts["autoread"])
      await this.chatRead(m.chat, m.isGroup ? m.sender : undefined, m.id || m.key.id).catch(() => {})
  }
}

export async function participantsUpdate({ id, participants, action }) {
  if (opts["self"]) return
  if (global.db.data == null) await loadDatabase()
  const chat = global.db.data.chats[id] || {}
  
  if (chat.welcome) {
    const groupMetadata = (await this.groupMetadata(id)) || (conn.chats[id] || {}).metadata
    
    for (const user of participants) {
      // Only use the welcome plugin for add/remove actions
      if (action === "add" || action === "remove") {
        try {
          // Import and use only the welcome plugin
          const welcomePlugin = await import("./plugins/_welcome.js")
          if (welcomePlugin && typeof welcomePlugin.before === "function") {
            await welcomePlugin.before.call(
              this,
              {
                messageStubType: action === "add" ? 27 : 28,
                messageStubParameters: [user],
                isGroup: true,
                chat: id,
              },
              {
                conn: this,
                participants: groupMetadata.participants,
                groupMetadata: groupMetadata,
              },
            )
          }
        } catch (e) {
          console.error("Error in welcome plugin:", e)
        }
      }
    }
  }
  
  // Handle promote/demote actions
  if (action === "promote" || action === "demote") {
    let text = ""
    if (action === "promote") {
      text = chat.sPromote || this.spromote || conn.spromote || "=͟͟͞❀ @user 𝙖𝙝𝙤𝙧𝙖 𝙚𝙨 𝙖𝙙𝙢𝙞𝙣𝙞𝙨𝙩𝙧𝙖𝙙𝙤𝙧 ⏤͟͟͞͞★"
    } else {
      text = chat.sDemote || this.sdemote || conn.sdemote || "=͟͟͞❀ @user 𝙮𝙖 𝙣𝙤 𝙚𝙨 𝙖𝙙𝙢𝙞𝙣𝙞𝙨𝙩𝙧𝙖𝙙𝙤𝙧 ⏤͟͟͞͞★"
    }
    
    const pp = await this.profilePictureUrl(participants[0], "image").catch((_) => "./media/avatar.jpg")
    text = text.replace("@user", "@" + participants[0].split("@")[0])
    if (chat.detect) this.sendFile(id, pp, "pp.jpg", text, null, false, { mentions: this.parseMention(text) })
  }
}

export async function groupsUpdate(groupsUpdate) {
  if (opts["self"]) return
  for (const groupUpdate of groupsUpdate) {
    const id = groupUpdate.id
    if (!id) continue
    let chats = global.db.data.chats[id],
      text = ""
    if (!chats?.detect) continue
    if (groupUpdate.desc)
      text = (chats.sDesc || this.sDesc || conn.sDesc || "=͟͟͞❀ 𝘿𝙚𝙨𝙘𝙧𝙞𝙥𝙘𝙞ó𝙣 𝙘𝙖𝙢𝙗𝙞𝙖𝙙𝙖 𝙖 \n@desc ⏤͟͟͞͞★").replace(
        "@desc",
        groupUpdate.desc,
      )
    if (groupUpdate.subject)
      text = (
        chats.sSubject ||
        this.sSubject ||
        conn.sSubject ||
        "=͟͟͞❀ 𝙀𝙡 𝙣𝙤𝙢𝙗𝙧𝙚 𝙙𝙚𝙡 𝙜𝙧𝙪𝙥𝙤 𝙘𝙖𝙢𝙗𝙞ó 𝙖 \n@group ⏤͟͟͞͞★"
      ).replace("@group", groupUpdate.subject)
    if (groupUpdate.icon)
      text = (chats.sIcon || this.sIcon || conn.sIcon || "=͟͟͞❀ 𝙀𝙡 𝙞𝙘𝙤𝙣𝙤 𝙙𝙚𝙡 𝙜𝙧𝙪𝙥𝙤 𝙘𝙖𝙢𝙗𝙞ó ⏤͟͟͞͞★").replace(
        "@icon",
        groupUpdate.icon,
      )
    if (groupUpdate.revoke)
      text = (chats.sRevoke || this.sRevoke || conn.sRevoke || "=͟͟͞❀ 𝙀𝙡 𝙚𝙣𝙡𝙖𝙘𝙚 𝙙𝙚𝙡 𝙜𝙧𝙪𝙥𝙤 𝙘𝙖𝙢𝙗𝙞ó 𝙖\n@revoke ⏤͟͟͞͞★").replace(
        "@revoke",
        groupUpdate.revoke,
      )
    if (!text) continue
    await this.sendMessage(id, { text, mentions: this.parseMention(text) })
  }
}

global.dfail = (type, m, conn) => {
  const msg = {
    rowner: `=͟͟͞❀ 👑 ${mssg.rownerH} ⏤͟͟͞͞★`,
    owner: `=͟͟͞❀ 🔱 ${mssg.ownerH} ⏤͟͟͞͞★`,
    mods: `=͟͟͞❀ 🔰 ${mssg.modsH} ⏤͟͟͞͞★`,
    premium: `=͟͟͞❀ 💠 ${mssg.premH} ⏤͟͟͞͞★`,
    group: `=͟͟͞❀ ⚙️ ${mssg.groupH} ⏤͟͟͞͞★`,
    private: `=͟͟͞❀ 📮 ${mssg.privateH} ⏤͟͟͞͞★`,
    admin: `=͟͟͞❀ 🛡️ ${mssg.adminH} ⏤͟͟͞͞★`,
    botAdmin: `=͟͟͞❀ 💥 ${mssg.botAdmin} ⏤͟͟͞͞★`,
    unreg: `=͟͟͞❀ 📇 ${mssg.unregH} ⏤͟͟͞͞★`,
    restrict: "=͟͟͞❀ 🔐 𝙀𝙨𝙩𝙖 𝙘𝙖𝙧𝙖𝙘𝙩𝙚𝙧í𝙨𝙩𝙞𝙘𝙖 𝙚𝙨𝙩á *𝙙𝙚𝙨𝙝𝙖𝙗𝙞𝙡𝙞𝙩𝙖𝙙𝙖* ⏤͟͟͞͞★",
  }[type]
  if (msg) return m.reply(msg)
}

const file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
  unwatchFile(file)
  console.log(chalk.magenta("✅  Se actualizo 'handler.js'"))
  if (global.reloadHandler) console.log(await global.reloadHandler())
})
