{
    let messageContainer = document.getElementById('message-container');
    let message = document.getElementById('message');
    let setFadeMessageTimeout;
    let fadeMessageTimeout;
    function addMessage(msg) {
        if(setFadeMessageTimeout) clearTimeout(setFadeMessageTimeout);
        if(fadeMessageTimeout) clearTimeout(fadeMessageTimeout);
        messageContainer.classList.remove('message-fade');
        message.innerText = msg;
        messageContainer.style.display = 'flex';
        setFadeMessageTimeout = setTimeout(fadeMessage, 2000);
    }
    
    function fadeMessage() {
        messageContainer.classList.add('message-fade');
        fadeMessageTimeout = setTimeout(() => {
            messageContainer.style.display = 'none';
            messageContainer.classList.remove('message-fade');
        }, 800);
    }
    
    function closeMessage() {
        messageContainer.style.display = 'none';
    }
}