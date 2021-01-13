let loadStreams =  {
    initilize: async (streams) => {
        for(stream in streams) {
            stream = streams[stream];
            loadStreams.createStreamTile(tileWrapper, streamTile, stream);
            await loadStreams.getStreamInfo(stream.name);
            await loadStreams.getLiveState(stream.name);
        }
        apiCalls.startDataCalls();
        apiCalls.startLiveCalls();
    },


    //Create HTML Nodes
    createStreamTile: (container, el, stream) => {
        el = el.cloneNode(true);
        el.id = stream.name;
        if(stream.autocollect) {
            el.querySelector('#collect-state').innerHTML = 'Toggle auto collect <br> Off';
            el.classList.add('auto-collect_on');
        }
        el.querySelector('input').checked = stream.autoopen;
        el.querySelector('.stream-name-text').innerHTML = stream.name;
        container.lastChild.after(el);
        addRightClickMenu(el);
    },
    
    //Handle api calls
    getStreamInfo: (name) => {
        return apiCalls.getStreamer(name);
    },

    getLiveState: (name) => {
        return apiCalls.checkStreamLive(name);
    },

    //Update tile info
    updateTile: (info) => {
        console.log(info)
        let tile = tileWrapper.querySelector(`#${info.login}`);
        tile.querySelector('img').src = info.profile_image_url;
        tile.querySelector('.stream-name-text').innerHTML = info.display_name;
    },

    updateLiveState(name, val) {
        let tile = tileWrapper.querySelector('#'+name);
        let indicator = tile.querySelector('.live-indicator');
        let word = tile.querySelector('.live');
        if(val) {
            indicator.classList.add('live-indicator_on');
            word.classList.remove('live-state_off');
            word.classList.add('live-state_on');
            word.classList.add('live_on');
        } else {
            indicator.classList.remove('live-indicator_on');
            word.classList.add('live-state_off');
            word.classList.remove('live-state_on');
            word.classList.remove('live_on');
        }
    }
}
    