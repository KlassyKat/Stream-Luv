let loadStreams =  {
    initilize: async (streams) => {
        console.log('init')
        for(stream in streams) {
            stream = streams[stream];
            loadStreams.createStreamTile(tileWrapper, streamTile, stream);
        }
        for(stream in streams) {
            stream = streams[stream];
            await loadStreams.getStreamInfo(stream.name);
            await loadStreams.getLiveState(stream.name);
        }
        apiCalls.startDataCalls();
        apiCalls.startLiveCalls();
        loadStreams.createDragMenu(tileWrapper);
    },


    //Create HTML Nodes
    createStreamTile: (container, el, stream) => {
        if(container.querySelector(`#${stream.name}`)) {
            return;
        }
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
        let tile = tileWrapper.querySelector(`#${info.login}`);
        tile.querySelector('img').src = info.profile_image_url;
        tile.querySelector('.stream-name-text').innerHTML = info.display_name;
    },

    updateLiveState: (name, val) => {
        let tile = tileWrapper.querySelector('#'+name);
        let indicator = tile.querySelector('.live-indicator');
        let word = tile.querySelector('.live');
        if(val) {
            if(streamers[name].autoopen && !streamers[name].streamopen) {
                openStream(name);
            }
            indicator.classList.add('live-indicator_on');
            word.classList.remove('live-state_off');
            word.classList.add('live-state_on');
            word.classList.add('live_on');
            streamers[name].live = true;
        } else {
            indicator.classList.remove('live-indicator_on');
            word.classList.add('live-state_off');
            word.classList.remove('live-state_on');
            word.classList.remove('live_on');
            //Switches from live to offline
            if(streamers[name].live) {
                streamers[name].live = false;
                console.log('Prepare to turn off stream open')
                setTimeout(setOffline.bind(null, name), 600000);
            } else if(streamers[name]) {
                streamers[name].live = false;
            }
        } 
        saveStreamerFile(streamers);
    },

    createDragMenu: (container) => {
        new Sortable(container, {
            animation: 150,
            ghostClass: 'ghost-class',
            //Save order on sort
            onEnd: () => {
                let newStreamers = {};
                for(el of container.children) {
                    if(el.id != 'place-holder') {
                        newStreamers[el.id] = streamers[el.id];
                    }
                }
                streamers = newStreamers;
                saveStreamerFile(streamers);
                loadStreamerFile();
            }
        });
    }
}
    