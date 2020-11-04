loadData().then(data => {
    console.log("HERE IS THE DATA", data)

   
    
})



// Import the JSON file
async function loadData() {
    try {
        console.log('Load Data')
        const data = await d3.csv('data/LanguageData_States.csv')
        console.log('Data Loaded')
        return data
    }
    catch (error) {
        console.log(error)
    }
}