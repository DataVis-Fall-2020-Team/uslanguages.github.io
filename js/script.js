loadData().then(data => {
    console.log("HERE IS THE DATA", data)
    for (let d of data[0]){
        d.Speakers = +d.Speakers.replace(/,/g ,"");
    }
    for (let d of data[1]){
        d.Speakers = +d.Speakers.replace(/,/g ,"");
        d.EnglishSpeakers = +d.EnglishSpeakers.replace(/,/g ,"");
    }
    let barChart = new Barchart(data[0]);
    let divChart2 = new BarChart2(data[1]);
    
})



// Import the JSON file
async function loadData() {
    try {
        const stateData = await d3.csv('./data/LanguageData_States.csv');
        console.log('State Data Loaded');
        const nationalData = await d3.csv('./data/National_Languages.csv');
        console.log('National Data Loaded');
        return [stateData, nationalData];
    }
    catch (error) {
        console.log(error)
    }
}