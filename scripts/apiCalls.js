let apiCalls = {
    config: {},

    initAxiosSettings: async () => {
        const AUTH_TOKEN = await getToken();
        return {
            headers: {
                'Client-ID': APP_TOKEN,
                'Authorization': `Bearer ${AUTH_TOKEN}`
            }
        }
    },

    getStreamer: async (id) => {
        if (Object.keys(apiCalls.config).length <= 0) {
            apiCalls.config = await apiCalls.initAxiosSettings();
        }
        try {
            let res = await axios.get('https://api.twitch.tv/helix/users?login=' + id, apiCalls.config);
            return res.data.data[0];
        } catch(err) {
            console.log(err);
            return undefined;
        }
    },

    checkStreamLive: async (id) => {
        let res = await axios.get('https://api.twitch.tv/helix/streams?user_login=' + id, apiCalls.config);
        return res.data.data[0] ? true : false;
    }
}