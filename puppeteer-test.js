const puppeteer = require('puppeteer');
const clustering = require('density-clustering');
const dotenv = require('dotenv');

dotenv.config();

const { getSettings } = require('./settings');

const main = async () => {
    const settings = getSettings();

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(settings.url);

    const element = await page.$$(settings.selector + ' span span div');

    const elements = [];
    for( let i = 0; i < element.length; i++) {
        const box = await element[i].boundingBox();
        const text = await element[i].evaluate(node => node.innerText);

        if (text.trim()) {
            elements.push({
                box,
                text: text,
            });
        }
    }
    console.log(elements);

    await browser.close();
};


main();