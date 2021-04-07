<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
    let timer = 300000;
    let mm: string = '5';
    let ss: string = '00';
    setTimeout(timerCountdown, 1000);
    function timerCountdown() {
        let minutes = Math.floor(timer/60000);
        let seconds = Math.floor((timer%60000)/1000);
        mm = minutes.toString();
        ss = seconds.toString().padStart(2, "0");
        if(timer == 0) {
            dispatch('zero');
            return;
        }
        timer -= 1000;
        setTimeout(timerCountdown, 1000);
    }

</script>
<style>

</style>
<div id="countdown">
    <span>{mm}:{ss}</span>
</div>
