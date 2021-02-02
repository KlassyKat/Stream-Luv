let tileFactory = {
    //DOM Element wrapping all stream tiles
    list: document.getElementById('tile-wrapper'),
    //DOM Element acting as a template for all stream tiles
    tile: document.getElementById('place-holder'),

    //Creates a list of streams as either an array of stream names of tile elements
    //Can probably replace with streamers and list.children in some manner
    makeArray: (type) => {
        let tileList = [];
        for(let item of tileFactory.list.children) {
            if(item.id == 'place-holder') {
                continue;
            }
            if(type == 'id') {
                tileList.push(item.id);
            } else if(type == 'element') {
                tileList.push(item);
            }
        }
        return tileList;
    }
}