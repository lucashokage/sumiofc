let users = {};

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let [eleccion, cantidad] = text.split(' ');
    if (!eleccion || !cantidad) {
        return m.reply(`${global.emoji} Por favor, elige cara o cruz y una cantidad de ${global.moneda} para apostar.\nEjemplo: *${usedPrefix + command} cara 50*`);
    }

    eleccion = eleccion.toLowerCase();
    cantidad = parseInt(cantidad);
    if (eleccion !== 'cara' && eleccion !== 'cruz') {
        return m.reply(`${global.emoji2} Elección no válida. Por favor, elige cara o cruz.\nEjemplo: *${usedPrefix + command} cara*`);
    }

    if (isNaN(cantidad) || cantidad <= 0) {
        return m.reply(`${global.emoji2} Cantidad no válida. Por favor, elige una cantidad de ${global.moneda}⛀ para apostar.\nEjemplo: *${usedPrefix + command} cara 50*`);
    }

    let userId = m.sender;
    if (!users[userId]) users[userId] = { coin: 100 };
    let user = global.db.data.users[m.sender];
    if (user.coin < cantidad) {
        return m.reply(`${global.emoji2} No tienes suficientes ${global.moneda} para apostar. Tienes ${user.coin} ${global.moneda}⛀.`);
    }

    let resultado = Math.random() < 0.5 ? 'cara' : 'cruz';
    let mensaje = `${global.emoji} La moneda ha caído en `
    if (resultado === eleccion) {
        user.coin += cantidad; 
        mensaje += `*${resultado}* y has ganado *${cantidad} ${global.moneda}⛀*!`;
    } else {
        user.coin -= cantidad;
        mensaje += `*${resultado}* y has perdido *${cantidad} ${global.moneda}⛀*!`;
    }

    await conn.reply(m.chat, mensaje, m);
};

handler.help = ['cf'];
handler.tags = ['economy'];
handler.command = ['cf', 'suerte', 'caracruz'];
handler.group = true;
handler.register = true;

export default handler;