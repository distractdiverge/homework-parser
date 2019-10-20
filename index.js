const axios = require('axios');
const chalk = require('chalk');
const cheerio = require('cheerio');
const nlp = require('compromise');
const R = require('ramda');
const turndown = require('turndown');
const moment = require('moment');

if (R.path(['env', 'NODE_ENV'], process) !== 'production') {
    const dotenv = require('dotenv');
    dotenv.config();
}

const getErrorMessage = R.prop('message');

const getSettings = () => ({
    url: R.path(['env', 'HOMEWORK_URL'], process),
    selector: R.path(['env', 'CONTENT_SELECTOR'], process),
});

const getPageHtml = async (url) => {
    let response;
    try {
        response = await axios.get(url);
    } catch(error) {
        console.error(`Error fetching page: ${getErrorMessage(error)}`);
        return null;
    }
    
    return R.prop('data', response);
};

const parsePageHtml = (html, selector) => {
    const $ = cheerio.load(html);
    const text = $(selector).text().trim();
    return text;
};

const htmlToMarkdown = (html, selector) => {
    const $ = cheerio.load(html);
    const text = $(selector).html();
    const turndownService = new turndown();
    return turndownService.turndown(text);
};

const parseSections = (text) => {

    // Skip First Sentence
    const sections = [
        {
            title: 'reading',
            content: [],
        },
        {
            title: 'math', 
            content: [],
        },
        {
            title: 'social studies',
            content: [],
        },
        {
            title: 'spelling', 
            content: [],
        },
    ];

    const sectionTitles = R.map(R.prop('title'), sections);

    const sentences = nlp(text).sentences();


    for (let i = 0; i < sentences.length; i++) {
        let sentence = sentences.list[i];

        // If we found the 'Reading' section; sub-iterate and get all 
        // the reading sentences, until we find a new section

        if (sentence.match('reading').found) {
            const content = [];
            while(sentence && !sentence.match('math').found) {
                content.push(sentence.out('text'));
                i++;
                sentence = sentences.list[i];
            }
            sections[0].content = content;
        }

        if (sentence.match('math').found) {
            const content = [];
            while(sentence && !sentence.match('social studies').found) {
                content.push(sentence.out('text'));
                i++;
                sentence = sentences.list[i];
            }
            sections[1].content = content;
        }

        if (sentence.match('social studies').found) {
            const content = [];
            while(sentence && !sentence.match('spelling').found) {
                content.push(sentence.out('text'));
                i++;
                sentence = sentences.list[i];
            }
            sections[2].content = content;
        }

        if (sentence.match('spelling').found) {
            const content = [];
            while(sentence && i < sentences.length) {
                content.push(sentence.out('text'));
                i++;
                sentence = sentences.list[i];
            }
            sections[3].content = content;
        }
    }

    console.log(JSON.stringify(sections));

    return sections;
};

const parseDate = (input) => {
    const date = R.head(input.dates().list);
    
    // Get the Month
    const month = date.month.out('normal');
    
    const numericTerms = R.filter(term => 
        R.propEq('NumericValue', true, term.tags),
        date.terms);
    
    const normalWithLength = R.pathEq(['normal', 'length']);
    // Get the day
    const dayTerm = R.find(normalWithLength(2), numericTerms);
    const day = dayTerm.normal;

    // Get the year
    const yearTerm = R.find(normalWithLength(4), numericTerms);
    const year = yearTerm.normal;

    return moment(`${month} ${day} ${year}`, 'MMM DD yyyy');
};

const main = async () => {
    const settings = getSettings();

    let html;
    try {
        html = await getPageHtml(R.prop('url', settings));
    } catch (error) {
        console.error(`Error getting page HTML: ${getErrorMessage(error)}`)
        return;
    }
    
    const text = parsePageHtml(html, R.prop('selector', settings));
    const date = parseDate(nlp(text).match('Homework for the week of #Date+'));
    console.log(chalk.blue(`# Homework for the week of ${date.format('MM/DD/YYYY')}`));

    const sections = parseSections(text);
    for( let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const title = nlp(section.title).toUpperCase().out('text');
        console.log(chalk.green(`## ${title}`));
        console.log(section.content.join(''));
        console.log('\n');
    }
    
    // const markdown = htmlToMarkdown(html, R.prop('selector', settings));
    // console.log('# Markdown Text');
    // console.log(markdown);
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
};