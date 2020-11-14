loadData_National().then(data => {
    console.log("HERE IS THE DATA", data)

   //let megacluster = new cluster(data)
   //megacluster.draw_circles()
})

// Import the JSON file
async function loadData_National() {
    try {
        console.log('Load Data')
        const data = await d3.csv('./data/National_Languages.csv')
        console.log('Data Loaded')
        return data
    }
    catch (error) {
        console.log(error)
    }
}

//State Data
loadData_State().then(data => {
    console.log(data);

    let map = new US_Map(data);
    map.drawBubbles();
});

async function loadData_State() {
    try {
        const data = await d3.csv('./data/LanguageData_States.csv');
        return data;
    }
    catch (error) {
        console.log(error);
    }
}
