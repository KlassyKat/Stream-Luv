// If you keep your auth token hosted
const axios = require('axios');
const APP_TOKEN = 'YOUR_APP_TOKEN';

const config = {
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
}

//Store your key 
function getToken() {
    return axios.get('host-location', config)
        .then(res => {
            return res.data.token;
        })
}

//Have auth token in app
const APP_TOKEN = 'CLIENT_ID';

function getToken() {
    return 'YOUR_AUTH_TOKEN';
}
