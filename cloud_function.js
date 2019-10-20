const nlp = require('compromise');
const main = require('./index');

exports.homeworkFetcher = (req, res) => {
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
    output += `# Homework for the week of ${date.format('MM/DD/YYYY')}`;

    const sections = parseSections(text);
    for( let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const title = nlp(section.title).toUpperCase().out('text');
        output += `## ${title}`;
        output += section.content.join('');
        output += '\n';
    }

    return res
        .status(200)
        .send(output);
};