const axios = require('axios');
const R = require('ramda');

const getPageHtml = async (url) => {
    let response;
    try {
        response = await axios.get(url);
    } catch(error) {
        throw new Error('Error Fetching HTML Content', error);
    }
    
    return R.prop('data', response);
};

module.exports = {
    getPageHtml,
};