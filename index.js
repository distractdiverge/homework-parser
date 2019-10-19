const dotenv = require('dotenv');
const axios = require('axios');
const cheerio = require('cheerio');

dotenv.config();

const getSettings = () => ({
    url: process.env.HOMEWORK_URL,
    selector: process.env.CONTENT_SELECTOR,
});

const getPage = async (url, selector) => {
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    const text = $(selector).text().trim();
    console.log(text);
};

const main = async () => {
    const settings = getSettings();
    await getPage(settings.url, settings.selector);
};


if (require.main === module) {
    try {
        main();
    } catch(error) {
        console.error(error.message);
    }
}