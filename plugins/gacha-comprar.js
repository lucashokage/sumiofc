import { promises as fs } from "fs"

const charactersFilePath = "./src/database/characters.json"
const haremFilePath = "./src/database/harem.json"

async function loadCharacters() {
  try {
    const data = await fs.readFile(charactersFilePath, "utf-8")
    return JSON.parse(data)
  } catch (error) {
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

const handler = async (m, { conn, args, text }) => {
  if (!text) return conn.reply(m.chat, "《✧》Por favor, especifica el nombre del personaje que deseas comprar.", m)

  const characterName = text.trim()
  const buyer = m.sender

  try {
    const characters = await loadCharacters()
    const harem = await loadHarem()

    const characterToBuy = characters.find(
      (c) => c.name.toLowerCase() === characterName.toLowerCase() && c.forSale === true,
    )

    if (!characterToBuy) {
      return conn.reply(m.chat, `《✧》No se encontró el personaje *${characterName}* en el mercado.`, m)
    }

    if (characterToBuy.seller === buyer) {
      return conn.reply(m.chat, "《✧》No puedes comprar tu propio personaje.", m)
    }

    const price = characterToBuy.price

    if (!global.db.data.users[buyer].coin || global.db.data.users[buyer].coin < price) {
      return conn.reply(
        m.chat,
        `《✧》No tienes suficiente coin para comprar a *${characterToBuy.name}*. Necesitas *${price}* coin.`,
        m,
      )
    }

    const sellerCoin = Math.floor(price * 0.75)

    global.db.data.users[buyer].coin -= price
    global.db.data.users[characterToBuy.seller].coin += sellerCoin

    const seller = characterToBuy.seller
    characterToBuy.user = buyer
    characterToBuy.forSale = false
    delete characterToBuy.price
    delete characterToBuy.seller

    const sellerEntryIndex = harem.findIndex(
      (entry) => entry.userId === seller && entry.characterId === characterToBuy.id,
    )
    if (sellerEntryIndex !== -1) {
      harem.splice(sellerEntryIndex, 1)
    }

    const buyerEntryIndex = harem.findIndex((entry) => entry.userId === buyer)
    if (buyerEntryIndex !== -1) {
      harem[buyerEntryIndex].characterId = characterToBuy.id
      harem[buyerEntryIndex].lastClaimTime = Date.now()
    } else {
      harem.push({
        userId: buyer,
        characterId: characterToBuy.id,
        lastClaimTime: Date.now(),
      })
    }

    await saveCharacters(characters)
    await saveHarem(harem)

    conn.reply(
      m.chat,
      `❀ Has comprado a *${characterToBuy.name}* por *${price}* coin.\n\n> El vendedor @${seller.split("@")[0]} ha recibido *${sellerCoin}* coin (comisión del 25%).`,
      m,
      {
        mentions: [seller],
      },
    )
  } catch (error) {
    conn.reply(m.chat, `✘ Error al comprar el personaje: ${error.message}`, m)
  }
}

handler.help = ["comprar <nombre>"]
handler.tags = ["gacha"]
handler.command = ["comprar", "buy"]
handler.group = true
handler.register = true

export default handler
