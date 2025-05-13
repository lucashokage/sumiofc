import axios from 'axios';
import cheerio from 'cheerio';

const searchAnime = async (query) => {
    const url = `https://tioanime.com/directorio?q=${encodeURIComponent(query)}`;

    try {
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);
        const results = [];

        $('ul.animes li').each((_, element) => {
            const name = $(element).find('h3.title').text().trim();
            const id = $(element).find('a').attr('href').split('/').pop();
            const image = $(element).find('img').attr('src');
            const animeUrl = `https://tioanime.com${$(element).find('a').attr('href')}`; 

            results.push({
                name,
                id,
                image: `https://tioanime.com${image}`,
                url: animeUrl
            });
        });

        return results;
    } catch (error) {
        console.error('Error al buscar el anime:', error.message);
        return { error: 'No se pudieron obtener los resultados' };
    }
};

let handler = async (m, { conn, command, args, text, usedPrefix }) => {
    if (!args[0]) {
        return conn.reply(m.chat, `${emoji} Por favor, ingresa el nombre de un anime para buscar.`, m);
    }

    const results = await searchAnime(args[0]);
    if (results.error || results.length === 0) {
        return conn.reply(m.chat, `${emoji2} No se encontraron resultados.`, m);
    }

    let message = `*Resultados de búsqueda para* "${args[0]}"\n\n`;
    results.forEach((anime, index) => {
        message += `*${index + 1}. ${anime.name}*\n`;
        message += `🔖 ID: ${anime.id}\n`;
        message += `🌐 URL: ${anime.url}\n\n`;
    });
    message += `*Usa el ID o la URL para obtener más información sobre el anime.*\n`;
    message += `Ejemplo: ${usedPrefix}animeinfo [ID o URL]`;

    await conn.reply(m.chat, message, m);
}

handler.help = ['animes', 'animesearch', 'animess'];
handler.command = ['animes', 'animesearch', 'animess'];
handler.tags = ['buscador'];
handler.premium = true;
handler.register = true;
handler.group = true;

export default handler;
