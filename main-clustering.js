const chalk = require('chalk');
const R = require('ramda');
const puppeteer = require('puppeteer');
const hac = require('hierarchical-clustering');
const { getSettings } = require('./settings');

const getTextChunks = async (selector, url) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    const elements = await page.$$(selector);

    const output = [];
    for( let i = 0; i < elements.length; i++) {
        const boundingBox = await elements[i].boundingBox();
        const boxModel = await elements[i].boxModel();
        const text = await elements[i].evaluate(node => node.innerText);
        const cleanedText = text.trim();

        if (cleanedText) {
            output.push({
                boundingBox,
                boxModel,
                text: cleanedText,
            });
        }
    }

    await browser.close();

    return output;
};

const makePoints = R.map(
        textChunk => ([
            R.path(['boundingBox', 'x'], textChunk),
            R.path(['boundingBox', 'y'], textChunk),
        ])
);

const _square = R.curry(Math.pow)(R.__, 2);
const findDistance = R.pipe(
    R.zipWith(R.pipe(R.subtract, _square)),
    R.sum,
    Math.sqrt,
);

const findClusters = (textChunks, minClusters = 5) => {
    const points = makePoints(textChunks);
       
    // Single-linkage clustering
    function linkage(distances) {
        return Math.min.apply(null, distances);
    }
       
    const levels = hac({
        input: points,
        distance: findDistance,
        linkage: linkage,
        minClusters: minClusters, // TODO: how to pick this?
        // TODO: Test out 'maxLinkage'
    });

    const clusters = R.prop('clusters', R.last(levels));
    
    const getTextClusters = R.map(
        cluster => R.map(
            index => R.prop('text', textChunks[index]),
            R.reverse(cluster),
        ),
    );
    
    return getTextClusters(clusters);
};

const printTextClusters = 
    R.forEach(
        cluster => {
            console.log(chalk.green('# Section'));
            R.forEach(
                line => {
                    console.log(line);
                },
                cluster
            );
            console.log('\n');
        }
    );

const main = async () => {
    const settings = getSettings();

    let textChunks;
    try {
        // TODO: Reach cache or fetch
        textChunks = await getTextChunks(
            R.path(['selectors', 'innerContent'], settings),
            R.prop('url', settings),
        );
    } catch (error) {
        console.error(`Error Getting Bounding Boxes: ${error.message}`);
        process.exit(-1);
    }

    const textClusters = findClusters(textChunks);
    printTextClusters(textClusters);
};


if (require.main == module) {
    main();
}

module.exports = {
    findClusters,
    findDistance,
    getTextChunks,
    main,
    makePoints,

}