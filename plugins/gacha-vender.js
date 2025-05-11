import { promises as fs } from "fs"

const charactersFilePath = "./src/database/characters.json"
const haremFilePath = "./src/database/harem.json"
const pendingSales = new Map()
const cooldownTime = 3600000

async function loadCharacters() {
  try {
    const data = await fs.readFile(charactersFilePath, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error al cargar personajes:", error)
    return []
  }
}

async function saveCharacters(characters) {
  try {
    await fs.writeFile(charactersFilePath, JSON.stringify(characters, null, 2), "utf-8")
  } catch (error) {
    console.error("Error al guardar personajes:", error)
  }
}

async function loadHarem() {
  try {
    const data = await fs.readFile(haremFilePath, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error al cargar harem:", error)
    return []
  }
}

async function saveHarem(harem) {
  try {
    await fs.writeFile(haremFilePath, JSON.stringify(harem, null, 2), "utf-8")
  } catch (error) {
    console.error("Error al guardar harem:", error)
  }
}

function calculateMaxPrice(basePrice, votes) {
  if (!votes) votes = 0
  const baseValue = Number.parseInt(basePrice)
  if (isNaN(baseValue)) return 1000

  if (votes === 0) {
    return Math.round(baseValue * 1.05)
  }
  const maxIncreasePercentage = 0.3
  const maxPrice = baseValue * (1 + maxIncreasePercentage * votes)
  return Math.round(maxPrice)
}

function calculateMinPrice(basePrice) {
  const baseValue = Number.parseInt(basePrice)
  if (isNaN(baseValue)) return 950
  return Math.round(baseValue * 0.95)
}

const handler = async (m, { conn, args, usedPrefix, command }) => {
  const characters = await loadCharacters()
  const harem = await loadHarem()

  if (args.length < 2) {
    const userCharacters = characters.filter((c) => c.user === m.sender)

    if (userCharacters.length === 0)
      return conn.reply(m.chat, "⚠️ No tienes personajes reclamados. Reclama uno primero.", m)
    let characterList = "Lista de tus personajes:\n"

    userCharacters.forEach((character, index) => {
      characterList += `${index + 1}. ${character.name} - ${character.value} coin\n`
    })

    return conn.reply(
      m.chat,
      `*⚠️ Usa el comando de la siguiente manera:*\n\n• Puedes vender un personaje a un usuario con:\n${usedPrefix + command} <nombre del personaje> <precio> @tag\n\n• O puedes poner tu personaje en el mercado:\nEj: ${usedPrefix + command} goku 9500\n\n${characterList}`,
      m,
    )
  }

  const mentioned = m.mentionedJid[0] || null
  const mentionIndex = args.findIndex((arg) => arg.startsWith("@"))
  let price = args[args.length - 1]
  if (mentioned && mentionIndex !== -1) {
    price = args[args.length - 2]
  }

  price = Number.parseInt(price)
  if (isNaN(price) || price <= 0)
    return conn.reply(m.chat, "⚠️ Por favor, especifica un precio válido para tu personaje.", m)

  const nameParts = args.slice(0, mentioned ? -2 : -1)
  const characterName = nameParts.join(" ").trim()
  if (!characterName)
    return conn.reply(m.chat, "⚠️ No se encontró el nombre del personaje. Verifica e intenta nuevamente.", m)

  const characterToSell = characters.find(
    (c) => c.name.toLowerCase() === characterName.toLowerCase() && c.user === m.sender,
  )

  if (!characterToSell) return conn.reply(m.chat, "⚠️ No se encontró el personaje que intentas vender.", m)
  if (characterToSell.forSale)
    return conn.reply(
      m.chat,
      "⚠️ Este personaje ya está en venta. Usa el comando `.retirar` para retirarlo antes de volver a publicarlo.",
      m,
    )

  if (characterToSell.lastRemovedTime) {
    const timeSinceRemoval = Date.now() - characterToSell.lastRemovedTime
    if (timeSinceRemoval < cooldownTime) {
      const remainingTime = Math.ceil((cooldownTime - timeSinceRemoval) / 60000)
      return conn.reply(
        m.chat,
        `⚠️ Debes esperar ${remainingTime} minutos antes de volver a publicar a *${characterToSell.name}*.`,
        m,
      )
    }
  }

  const minPrice = calculateMinPrice(characterToSell.value)
  const maxPrice = calculateMaxPrice(characterToSell.value, characterToSell.votes || 0)
  if (price < minPrice)
    return conn.reply(m.chat, `⚠️ El precio mínimo permitido para ${characterToSell.name} es ${minPrice} coin.`, m)
  if (price > maxPrice)
    return conn.reply(m.chat, `⚠️ El precio máximo permitido para ${characterToSell.name} es ${maxPrice} coin.`, m)

  if (mentioned) {
    if (pendingSales.has(mentioned))
      return conn.reply(m.chat, "⚠️ El comprador ya tiene una solicitud pendiente. Por favor, espera.", m)

    pendingSales.set(mentioned, {
      seller: m.sender,
      buyer: mentioned,
      character: characterToSell,
      price,
      timer: setTimeout(() => {
        pendingSales.delete(mentioned)
        conn.reply(
          m.chat,
          `⏰ @${mentioned.split("@")[0]} no respondió a la oferta de *${characterToSell.name}*. La solicitud fue cancelada.`,
          m,
          {
            mentions: [mentioned],
          },
        )
      }, 60000),
    })

    conn.reply(
      m.chat,
      `📜 @${mentioned.split("@")[0]}, el usuario @${m.sender.split("@")[0]} quiere venderte *${characterToSell.name}* por ${price} coin.\n\nResponde con:\n- *Aceptar* para comprar.\n- *Rechazar* para cancelar.`,
      m,
      {
        mentions: [mentioned, m.sender],
      },
    )
  } else {
    const previousPrice = characterToSell.value
    characterToSell.price = price
    characterToSell.forSale = true
    characterToSell.seller = m.sender
    characterToSell.previousPrice = previousPrice

    await saveCharacters(characters)

    conn.reply(
      m.chat,
      `✅ Has puesto a la venta *${characterToSell.name}* en el mercado por ${price} coin.\n\n> Para retirarlo usa: .retirar ${characterToSell.name}`,
      m,
    )
  }
}

handler.before = async (m, { conn }) => {
  const buyerId = m.sender
  const sale = pendingSales.get(buyerId)
  if (!sale) return

  const response = m.text.toLowerCase()
  if (response === "aceptar") {
    const { seller, buyer, character, price } = sale
    const characters = await loadCharacters()
    const harem = await loadHarem()

    const updatedCharacter = characters.find((c) => c.id === character.id)

    if (!updatedCharacter || updatedCharacter.user !== seller) {
      pendingSales.delete(buyerId)
      return conn.reply(m.chat, "⚠️ El personaje ya no está disponible para la venta.", m)
    }

    if (!global.db.data.users[buyer].coin || global.db.data.users[buyer].coin < price) {
      pendingSales.delete(buyerId)
      return conn.reply(m.chat, "⚠️ No tienes suficiente coin para comprar este personaje.", m)
    }

    const sellerCoin = Math.floor(price * 0.75)

    global.db.data.users[buyer].coin -= price
    global.db.data.users[seller].coin += sellerCoin

    updatedCharacter.user = buyer
    updatedCharacter.price = price
    updatedCharacter.forSale = false

    const sellerEntryIndex = harem.findIndex((entry) => entry.userId === seller && entry.characterId === character.id)
    if (sellerEntryIndex !== -1) {
      harem.splice(sellerEntryIndex, 1)
    }

    const buyerEntryIndex = harem.findIndex((entry) => entry.userId === buyer)
    if (buyerEntryIndex !== -1) {
      harem[buyerEntryIndex].characterId = character.id
      harem[buyerEntryIndex].lastClaimTime = Date.now()
    } else {
      harem.push({
        userId: buyer,
        characterId: character.id,
        lastClaimTime: Date.now(),
      })
    }

    await saveCharacters(characters)
    await saveHarem(harem)

    clearTimeout(sale.timer)
    pendingSales.delete(buyerId)

    conn.reply(
      m.chat,
      `❀ @${buyer.split("@")[0]} ha comprado *${character.name}* de @${seller.split("@")[0]} por ${price} coin.`,
      m,
      {
        mentions: [buyer, seller],
      },
    )
  } else if (response === "rechazar") {
    clearTimeout(sale.timer)
    pendingSales.delete(buyerId)
    conn.reply(m.chat, `《✧》Has rechazado la oferta de compra para *${sale.character.name}*.`, m)
  }
}

handler.help = ["vender"]
handler.tags = ["gacha"]
handler.command = ["vender"]
handler.group = true
handler.register = true

export default handler
