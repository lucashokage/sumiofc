let handler = async (m, { args }) => {
let user = global.db.data.users[m.sender]
if (!args[0]) return m.reply(`${global.emoji} Ingresa la cantidad de *${global.moneda}⛀* que deseas Depositar.`)
if (args[0] == 'all') {
let count = parseInt(user.coin)
user.coin -= count * 1
user.bank += count * 1
await m.reply(`${global.emoji} Depositaste *${count} ${global.moneda}⛀* en el banco, ahora estarán seguros y no podrán robartelos.`)
return !0
}
if (!Number(args[0])) return m.reply(`${global.emoji2} Debes depositar una cantidad válida.
> Ejemplo 1 » *#depositar 25000*
> Ejemplo 2 » *#depositar all*`)
let count = parseInt(args[0])
if (!user.coin) return m.reply(`${global.emoji2} No tienes suficientes *${global.moneda}⛀* para depositar.`)
if (user.coin < count) return m.reply(`${global.emoji2} Solo tienes *${user.coin} ${global.moneda}⛀* para depositar.`)
user.coin -= count * 1
user.bank += count * 1
await m.reply(`${global.emoji} Depositaste *${count} ${global.moneda}⛀* en el banco, ahora estarán seguros y no podrán robartelos.`)}

handler.help = ['depositar']
handler.tags = ['rpg']
handler.command = ['deposit', 'd', 'depositar', 'dep']
handler.group = true
handler.register = true

export default handler
