function setDraggables() {
    const draggables = document.querySelectorAll('.draggable');
    const container = document.getElementById('tile-wrapper');

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', () => {
            draggable.classList.add('dragging');
        });

        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');
            sortStreamers();
        });
    });

    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        console.log(e)
        const afterElement = getAfterElement(container, e.clientY);
        const draggable = document.querySelector('.dragging');
        if (afterElement == null) {
            container.appendChild(draggable);
        } else {
            container.insertBefore(draggable, afterElement);
        }
    });
    document.querySelector("body").addEventListener('dragover', (e) => {
        e.preventDefault();
    })


    function getAfterElement(wrapper, y) {
        const draggableElements = [...wrapper.querySelectorAll('.draggable:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return {
                    offset: offset,
                    element: child
                };
            } else {
                return closest;
            }
        }, {
            offset: Number.NEGATIVE_INFINITY
        }).element;
    }

    function sortStreamers() {
        let streamOrderElements = [...document.querySelectorAll('.stream-item')];
        let streamOrder = {};
        for(element of streamOrderElements) {
            if(streamers[element.id]) {
                streamOrder[element.id] = (streamers[element.id]);
            }
        }
        localStorage.setItem('streamers', JSON.stringify(streamOrder));
        streamers = JSON.parse(localStorage.getItem('streamers'));
    }
}



module.exports = {
    setDraggables
}