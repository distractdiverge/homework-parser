const printTitle = (date, headerFormatter = header => header) =>
    `# Homework for the week of ${date.format('MM/DD/YYYY')}`;

const printSections = (sections) => {
    let output = '';
    const sections = parseSections(text);
    for( let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const title = nlp(section.title).toUpperCase().out('text');
        output += headerFormatter(`## ${title}`);
        output += section.content.join('');
        output += '\n';
    }
    return output;
};

module.exports = {
    printTitle,
    printSections,
};