<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    export let setting: {
        label: string,
        name: string,
        value: string[]
    }
    console.log(setting);

    const dispatch = createEventDispatcher();

    //Handle  Shortcut Input
    let shortcutInput;
    let shortcutVal = [];
    function focusInput() {
        shortcutVal = [];
        document.addEventListener("keydown", processShortcut);
        document.addEventListener("keyup", confirmShortcut);
    }

    function processShortcut(e) {
        e.preventDefault();
        let newKey = e.key;
        if(e.code == "Space") {
            newKey = e.code;
        } else if(e.key == "Control") {
            newKey = "Ctrl";
        } else if(e.key.indexOf('Arrow') > -1) {
            newKey = e.key.slice(5);
        }

        if(newKey.length == 1) {
            newKey = newKey.toUpperCase();
        }

        if(!shortcutVal.includes(newKey)) {
            shortcutVal.push(newKey);
            shortcutVal = [...shortcutVal];
        }
    }

    function confirmShortcut() {
        let shortcutCheck = shortcutVal.filter(key => {
            if(key != 'Ctrl' && key != 'Shift' && key != 'Alt') {
                return true;
            } else {
                return false
            }
        });
        if(shortcutCheck.length == 0) {
            shortcutVal = [];
        } else {
            changeSetting(shortcutVal)
        }
        shortcutInput.blur();
    }

    function blurShortcutInput() {
        document.removeEventListener("keydown", processShortcut);
        document.addEventListener("keyup", confirmShortcut);
    }


    function changeSetting(val) {
        setting.value = val;
        dispatch('newsetting', setting);
    }

    function clearShortcut() {
        shortcutInput = '';
        changeSetting([]);
    }
</script>

<style>
    div {
        padding: 5px;
        display: flex;
        align-items: center;
    }

    input {
        border: 2px solid #00000000;
        outline: none;
        border-radius: 4px 0 0 4px;
        background-color: #0f0f0f;
        margin-left: 5px;
        color: white;
        padding-left: 3.3px;
        font-size: 1em;
        line-height: 1.5rem;
        width: 50%;
    }

    input:focus {
        border: 2px solid white;
        caret-color: #00000000;
    }
    button {
        border: none;
        margin: 0;
        padding: 0;
        height: 30px;
        border-radius: 0 4px 4px 0;
        background-color: #0F0F0F;
        cursor: pointer;
        transition: all 0.2s ease-in-out;
        outline: none;
    }

    button:hover {
        background-color: #7e7e7e;
    }

    svg {
        fill: white;
        stroke-width: 0;
        transform: rotate(45deg);
    }
</style>

<div>
    <label for={setting.name}>{setting.label}</label>
    <input bind:this={shortcutInput} id={setting.name} name={setting.name} on:focus={focusInput} value={shortcutVal.length > 0 ? shortcutVal.join('+') : setting.value.join('+')} on:blur={blurShortcutInput}>
    <button on:click={clearShortcut}>
        <svg width="30px" viewBox="0 0 10 10">
            <rect x="4.5" y="2" width="1" height="6" />
            <rect y="4.5" x="2" height="1" width="6" />
        </svg>
    </button>
</div>