<script lang="ts">
    import TopBar from './components/TopBar.svelte';
	import Message from './components/Message.svelte';
    import { SearchResult, Stream, ControlBtn } from './types/types';
    const { remote, ipcRenderer } = require('electron');
    const fuzzysort = require('fuzzysort');

    let search = "";
    let results: SearchResult[];

    async function fetchStreams() {
        if (search.length > 2) {
            fetch(`https://api.twitch.tv/helix/search/channels?query=${search}`, {
                    method: "GET",
                    headers: {
                        'Content-Type': 'application/json',
                        'client-id': 'hmwwy19mo3zzxu17lmualmudycyora',
                        'Authorization': `Bearer ${localStorage.getItem("access_token")}`
                    }
                }).then(res => res.json())
                .then(json => {
                    let sorted = fuzzysort.go(search, json.data, {key: "display_name"});
                    sorted = sorted.map(item => {
                        return item.obj
                    });
                    results = <SearchResult[]> sorted;
                })
        }
    }

    function addStream(stream: SearchResult) {
        console.log(stream);
        let newStream: Stream = {
            id: stream.broadcaster_login,
            name: stream.display_name,
            img: stream.thumbnail_url,
            autoopen: false,
            autocollect: false,
            live: false,
            streamopen: false
        };
        ipcRenderer.send("add-stream", newStream);
        addMessage(`${stream.display_name} has been added.`);
    };

    let windowControls: ControlBtn[] = [
        {
            svg: `<svg viewBox="0 0 32 32" style="stroke-width:5">
                    <line x1="2" y1="2" x2="30" y2="30" />
                    <line x1="2" y1="30" x2="30" y2="2" />
                </svg>`,
            control: () => {
                console.log('close');
                remote.getCurrentWindow().close();
            }
	    }
    ];

    //Mesages 
    let messages = [];
    function addMessage(message) {
        messages.pop();
        messages.push(message);
        messages = messages;
        setTimeout(removeMessage, 5000, message);

        function removeMessage(val) {
            messages = messages.filter(item => {
                if(item != val) {
                    return item;
                }
            });
        }
    }
</script>

<style>
    .add-window {
        width: 100%;
        height: 100%;
        background-color: #1c1c1c;
        display: grid;
        grid-template-rows: 32px auto;
    }

    .search-wrapper {
        margin-top: 35px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    #url-input {
        height: 30px;
        width: 80%;
        padding-left: 3px;
        font-family: 'Montserrat', sans-serif;
        font-weight: 500;
        font-size: 15px;
        border-radius: 3px 3px 0 0;
        color: white;
        outline: none;
        border-color: #000000;
        background-color: #141414;
        margin-top: 4px;
    }

    #search-results-list {
        list-style: none;
        height: 270px;
        overflow-y: scroll;
        background-color: #050505;
        width: 80%;
        padding: 0;
    }

    .search-result {
        display: grid;
        grid-template-columns: auto 1fr auto;
        width: 100%;
        height: 50px;
        align-items: center;
        background-color: #222222;
        margin: 2px 0;
        color: white;
        font-weight: 500;
    }

    .search-result:hover {
        background-color: #414141;
        cursor: pointer;
    }

    .search-result > img {
        width: 45px;
        border-radius: 999px;
        margin: 0 10px 0 5px;
    }

    .stream-add {
        background-color: #ff8000;
        outline: none;
        border-radius: 10px;
        border: none;
        width: 30px;
        height: 30px;
        color: white;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 10px;
        cursor: pointer;
    }

    .stream-add:hover {
        background-color: #994d00;
    }


</style>

<div class="add-window">
    <TopBar name={''} buttons={windowControls} />
    <Message messages={messages}/>
    <section class="search-wrapper">
        <input type="text" id="url-input" placeholder="Search..." bind:value={search} on:input="{fetchStreams}" autofocus>
        <ul id="search-results-list">
            {#if results}
            {#each results as result}
                <li class="search-result" id="placeholder">
                    <img src="{result.thumbnail_url}" alt="Thumbnail" class="thumbnail">
                    <span class="name">{ result.display_name }</span>
                    <button class="stream-add" on:click="{() => addStream(result)}">
                        <svg viewBox="0 0 30 30" width="30px" height="30px">
                            <rect x="12" width="6" height="30"/>
                            <rect y="12" width="30" height="6"/>
                        </svg>
                    </button>
                </li>
            {/each}
            {/if}
        </ul>
    </section>
</div>