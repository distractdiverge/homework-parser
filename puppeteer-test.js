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

    const element = await page.$(settings.selector);

    const box = await element.boundingBox();

    console.log(box);

    await browser.close();
};


main();