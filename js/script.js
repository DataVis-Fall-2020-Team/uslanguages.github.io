loadData().then(data => {
    console.log("HERE IS THE DATA", data)

   let megacluster = new cluster(data)
   megacluster.draw_circles()
    
})



// Import the JSON file
async function loadData() {
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