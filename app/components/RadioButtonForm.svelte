<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    interface Option {
        name: string,
        value: any
    }
    export let setting: {
        name: string,
        options: Option[],
        value: string
    };

    const dispatch = createEventDispatcher();

    function changeSettings(e) {
        console.log(e);
        setting.value = e.target.value;
        dispatch('newsetting', setting);
    }
</script>

<style>
    form {
        padding-left: 10px;
    }
    label {
        display: flex;
        position: relative;
        cursor: pointer;
        padding-left: 35px;
        width: fit-content;
        margin-bottom: 10px;
        line-height: 26px;
        vertical-align: middle;
    }

    input {
        position: absolute;
        top: -4;
        left: -6;
        z-index: 99;
        opacity: 0;
        cursor: pointer;
        height: 28px;
        width: 28px;
    }

    span {
        position: absolute;
        top: 0;
        left: 0;
        height: 26px;
        width: 26px;
        background-color: #00000000;
        border: 3px solid #E0961F;
        border-radius: 50%;
        transition: 0.2s;
    }

    label:hover input ~ span,
    label:focus input ~ span {
        background-color: #ffffff;
    }

    span:after {
        content: "";
        position: absolute;
        opacity: 0;
        transition: 0.2s;
    }

    label input:checked ~ span:after {
        display: block;
        opacity: 1;
        transition: 0.2s;
    }

    label span:after {
        top: 3px;
        left: 3px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #E0961F;
        transition: 0.2s;
    }

</style>

<form>
    {#each setting.options as option}
    <label>{option.name}
        <input type="radio" value={option.value} name={'radio'} checked={setting.value == option.value} on:input={changeSettings}>
        <span></span>
    </label>
    {/each}
</form>