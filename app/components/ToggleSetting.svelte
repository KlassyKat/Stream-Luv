<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    export let setting: {
        name: string,
        value: boolean
    };

    const dispatch = createEventDispatcher();

    function changeSetting(e) {
        setting.value = e.target.checked
        dispatch('newsetting', setting);
    }
</script>

<style>
    div {
        display: grid;
        grid-template-columns: min-content auto;
        align-items: center;
    }

    label {
        top: 0;
        left: 0;
        margin: 5px 8px;
        position: relative;
        display: inline-block;
        width: 36px;
        height: 22px;
    }

    label > span:hover,
    label > span:focus {
        background-color: #fff;
    }

    input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    label > span {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        background-color: #181818;
        transition: 0.4s ease-in-out;
        border-radius: 3px;
    }

    label > span:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 15px;
        left: 2px;
        bottom: 2px;
        background-color: #5c5c5c;
        transition: 0.4s ease-in-out;
        border-radius: 3px;
    }

    input:checked + span {
        background-color: #ff8000;
    }

    input + span:hover, 
    input + span:focus {
        background-color: #8d5012;
    }

    input:checked + span:before {
        transform: translateX(17px);
        outline: none;
    }

    div>span {
        display: flex;
        align-items: center;
    }


</style>

<div>
    <label>
        <input type="checkbox" checked={setting.value} on:change={changeSetting}>
        <span></span>
    </label>
    <span>{setting.value ? "On" : "Off"}</span>
</div>