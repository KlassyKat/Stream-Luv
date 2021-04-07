<script lang="ts">
    export let title: string;
    export let descr: string;
</script>

<style>
    div {
        background-color: #222222;
        padding: 8px 20px;
        margin-bottom: 10px;
    }

    h2 {
        padding: 0 0 8px 0;
        margin: 0;
    }

    p {
        margin: 0;
        color: #B9BBBE;
        font-size: 13px;
    }
</style>

<div>
    <h2><strong>{title}</strong></h2>
    <p>{descr}</p>
</div>