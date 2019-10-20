const chalk = require('chalk');
const nlp = require('compromise');
const R = require('ramda');

const { getPageHtml } = require('./fetchers');
const {
    parsePageHtml,
    parseSections,
    parseDate,
} = require('./parsers');
const { printTitle, printSections, } = require('./output');

if (R.path(['env', 'NODE_ENV'], process) !== 'production') {
    const dotenv = require('dotenv');
    dotenv.config();
}

const getErrorMessage = R.prop('message');

const getSettings = () => ({
    url: R.path(['env', 'HOMEWORK_URL'], process),
    selector: R.path(['env', 'CONTENT_SELECTOR'], process),
});

const main = async () => {
    const settings = getSettings();

    let html;
    try {
        html = await getPageHtml(R.prop('url', settings));
    } catch (error) {
        console.error(`Error getting page HTML: ${getErrorMessage(error)}`)
        return;
    }
    
    const text = main.parsePageHtml(html, R.prop('selector', settings));
    const date = main.parseDate(nlp(text).match('Homework for the week of #Date+'));
    console.log(chalk.blue(printTitle(date)));

    const sections = parseSections(text);
    console.log(printSections(sections, (header) => chalk.green(header)));
};

if (require.main === module) {
    try {
        main();
    } catch(error) {
        console.error(error.message);
    }
}

module.exports = {
    getErrorMessage,
    getSettings,
    getPageHtml,
    parsePageHtml,
    parseDate,
    parseSections,
    main,
    homeworkFetcher: async (req, res) => {
        const settings = main.getSettings();
    
        let output;
    
        let html;
        try {
            html = await main.getPageHtml(R.prop('url', settings));
        } catch (error) {
            return res
                .status(500)
                .json({
                    message: `Error getting page HTML: ${main.getErrorMessage(error)}`
                });
        }
        
        const text = main.parsePageHtml(html, R.prop('selector', settings));
        const date = main.parseDate(nlp(text).match('Homework for the week of #Date+'));
        output += printTitle(date);

        const sections = parseSections(text);
        output += printSections(sections);
    
        return res
            .status(200)
            .send(output);
    };
};