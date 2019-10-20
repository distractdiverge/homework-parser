const cheerio = require('cheerio');
const moment = require('moment');
const nlp = require('compromise');
const R = require('ramda');

const parsePageHtml = (html, selector) => {
    const $ = cheerio.load(html);
    const text = $(selector).text().trim();
    return text;
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

module.exports = {
    parsePageHtml,
    parseSections,
    parseDate,
};
