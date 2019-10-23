const R = require('ramda');

const getEnvVariable = (name) => R.path(['env', name], process);

const loadEnvFile = () =>
    (getEnvVariable('NODE_ENV') !== 'production')
        ? require('dotenv').config()
        : R.identity();

const makeSettings = () => ({
    url: getEnvVariable('HOMEWORK_URL'),
    selectors: {
        container: getEnvVariable('CONTAINER_CONTENT_SELECTOR'),
        innerContent: getEnvVariable('INNER_CONTENT_SELECTOR'),
    },
})

const getSettings = R.pipe(
    loadEnvFile,
    makeSettings,
);

module.exports = {
    getEnvVariable,
    getSettings,
};