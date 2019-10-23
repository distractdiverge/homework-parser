const R = require('ramda');
const puppeteer = require('puppeteer');
const clustering = require('density-clustering');
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

const main = async () => {
    const settings = getSettings();

    let elements;
    try {
        elements = await getTextChunks(
            R.path(['selectors', 'innerContent'], settings),
            R.prop('url', settings),
        );
    } catch (error) {
        console.error(`Error Getting Bounding Boxes: ${error.message}`);
    }

    // console.log(elements);

    // detectClusters(elements);

    // TODO: Detect using HAC ALgorithm
    const points = makePoints(elements);
    function distance(a, b) {
        var d = 0;
        for (var i = 0; i < a.length; i++) {
          d += Math.pow(a[i] - b[i], 2);
        }
        return Math.sqrt(d);
      }
       
      // Single-linkage clustering
      function linkage(distances) {
        return Math.min.apply(null, distances);
      }
       
      const levels = hac({
        input: points,
        distance: distance,
        linkage: linkage,
        minClusters: 5, // only want two clusters
      });

      var clusters = levels[levels.length - 1].clusters;
        console.log(clusters);
        // => [ [ 2 ], [ 3, 1, 0 ] ]
        clusters = clusters.map(function (cluster) {
            return cluster.map(function (index) {
                return elements[index].text;
            });
        });

        console.log(clusters);
};

const makePoints = R.map(
        element => ([
            R.path(['boundingBox', 'x'], element),
            R.path(['boundingBox', 'y'], element),
        ])
);

const detctClusters = (elements) => {
    const points = makePoints(elements)

    let maxClusters = 0;
    let finalClusters = [];
    let finalR = 0;
    let finalP = 0;
    for( let r = 0; r < 20; r++) {
        for (let p = 0; p < 20; p++) {
            console.log (`Using Neighborhood Radius = ${r}; Points in Neighborhood Cluster = ${p}`);
            const scanner = new clustering.DBSCAN();
            const clusters = scanner.run(points, r, p);
            console.log(`Detected ${clusters.length} clusters`);
            // console.log(`Detected ${scanner.noise.length} noise`);

            if (clusters.length > maxClusters) {
                finalR = r;
                finalP = p;
                finalClusters = clusters;
                maxClusters = clusters.length;
            }
        }
    }

    for( let i = 0; i < finalClusters.length; i++) {
        console.log(`# Section ${i}`);
        const cluster = finalClusters[i];
        for( let j = 0; j < cluster.length; j++) {
            console.log(`Line[${j}]: ${elements[j].text}`);
        }
        console.log('\n');
    }

    console.log (`Best Values: r = ${finalR}; p = ${finalP}; #Clusters = ${maxClusters}`);
}

main();