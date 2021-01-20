let apiCalls = {
    config: {},
    dataRequestArray: [],
    liveRequestArray: [],

    initAxiosSettings: async () => {
        const AUTH_TOKEN = await getToken();
        return {
            headers: {
                'Client-ID': APP_TOKEN,
                'Authorization': `Bearer ${AUTH_TOKEN}`
            }
        }
    },

    isStreamer: async (id) => {
        if (Object.keys(apiCalls.config).length <= 0) {
            apiCalls.config = await apiCalls.initAxiosSettings();
        }
        let isStream = await axios.get('https://api.twitch.tv/helix/users?login=' + id, apiCalls.config);
        return isStream.data.data[0];
    },

    isStreamLive: async (id) => {
        if (Object.keys(apiCalls.config).length <= 0) {
            apiCalls.config = await apiCalls.initAxiosSettings();
        }
        let live = await axios.get('https://api.twitch.tv/helix/streams?user_login=' + id, apiCalls.config);
        return live = live.data.data[0] ? true : false;
    },

    getStreamer: async (id) => {
        //If config is empty set config
        if (Object.keys(apiCalls.config).length <= 0) {
            apiCalls.config = await apiCalls.initAxiosSettings();
        }
        return apiCalls.createDataRequestArray(axios.get('https://api.twitch.tv/helix/users?login=' + id, apiCalls.config));
    },

    checkStreamLive: async (id) => {
        if (Object.keys(apiCalls.config).length <= 0) {
            apiCalls.config = await apiCalls.initAxiosSettings();
        }
        return apiCalls.createLiveRequestArray(axios.get('https://api.twitch.tv/helix/streams?user_login=' + id, apiCalls.config));
    },

    createDataRequestArray: (call) => {
        apiCalls.dataRequestArray.push(call);
    },

    createLiveRequestArray: (call) => {
        apiCalls.liveRequestArray.push(call);
    },

    startDataCalls: () => {
        Promise.all(apiCalls.dataRequestArray)
            .then((res) => {
                for(info of res) {
                    loadStreams.updateTile(info.data.data[0]);
                }
            })
            apiCalls.dataRequestArray = [];
    },

    startLiveCalls: () => {
        Promise.all(apiCalls.liveRequestArray)
            .then((res) => {
                for(info of res) {
                    let index = info.config.url.lastIndexOf('=');
                    let name = info.config.url.slice(index+1);
                    let val = info.data.data[0] ? true : false;
                    loadStreams.updateLiveState(name, val);
                }
            })
        apiCalls.liveRequestArray = []
    }
}