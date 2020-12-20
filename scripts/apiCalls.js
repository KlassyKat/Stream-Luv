{
    const axios = require('axios');
    const {
        APP_TOKEN,
        getToken,
    } = require('../secret.js');

    function getStreamer(id) {
        let AUTH_TOKEN = await getToken();
        let config = {
            headers: {
                'Client-ID': 
            }
        }
    }
}