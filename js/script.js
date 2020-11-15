
// --------------------------------------------
        // Import the data
// --------------------------------------------

// Set global variables
// let dataset
// let simulation, nodes

// // Import the data
// d3.csv('data/National_Languages.csv', function(d){
//     return {
//         Group: d.Group,
//         Subgroup: d.Subgroup,
//         Language: d.Language,
//         NumberofSpeakers: +(d['Speakers'].replace(/,/g, '')),
//         SpeaksEnglishPoorly: +(d['nonEnglishSpeakers'].replace(/,/g, '')),
//     };
// }).then(data => {
//     dataset = data
//     console.log("This is the dataset", dataset)
    
//     setTimeout(setup_page(), 100)
//     }) // end then function

// // --------------------------------------------
//         // Setup the scales 
// // --------------------------------------------


//     function colorScale(input){
//         // Get distinct values, taken from: https://codeburst.io/javascript-array-distinct-5edc93501dc4
//         const distinct = (value, index, self) => {
//             return self.indexOf(value) === index;
//         }
            
//         let my_categories = dataset.map(x => x.Group).filter(distinct);
    
//         // Color scale
//         let my_colorScale = d3.scaleOrdinal() 
//             .domain(my_categories)
//             .range(d3.schemeCategory10.slice(0,5))
        
//         return my_colorScale(input)
//     }
    
//     function scaleSize(input){ 
        
//         let my_scaleSize = d3.scaleSymlog() 
//             .domain([1, 232000000])
//             .range([1,20])
//             .nice()
//         return my_scaleSize(input)
//     }

// // --------------------------------------------
//         // Setup the page 
// // --------------------------------------------
//     // Setup the page 
//     function setup_page(){

//         // Create the SVG
//         let svg = d3.select("#vis")
//             .append('svg')
//             .attr('width', 1000)
//             .attr('height', 950)
//             .attr('opacity', 1)
        
//         // Simulation setup
//         simulation = d3.forceSimulation(dataset)
//           .force("center", d3.forceCenter(500,500))
        
//         // Define each tick of simulation
//        simulation.on('tick', () => {
//            nodes
//                .attr('cx', d => d.x)
//                .attr('cy', d => d.y)
//     })
    
//         // Viz #1 Megacluster setup
//         nodes = svg
//           .selectAll('circle')
//           .data(dataset)
//           .join('circle')
//           .attr('r',d => scaleSize(d.NumberofSpeakers))
//           .attr('fill',d => colorScale(d.Group))
//           .attr('opacity', 0.8)

//         // Stop the simulation until later
//         // simulation.stop()
      
//     } // End setup_page function
    
//     function clean(chartType){
//         let svg = d3.select('#vis').select('svg')
//         if (chartType !== "isFirst"){
//             svg.selectAll('circle').transition().attr('opacity',0)
    

//         } // End if statement
//     } // End function clean()


// // --------------------------------------------
//         // Draw the visualizations
// // --------------------------------------------

//     //First Viz
//     function draw0(){
        
//         //Stop simulation
//         simulation.stop()
        
//         clean('isFirst') // Turns off opacity for all other charts
        
//         let svg = d3.select("#vis")
//             .select('svg')
        
//         svg.selectAll('circle')
//             .transition()
//             .attr('opacity',0)
//             .attr('r',d => scaleSize(d.NumberofSpeakers))
//             .attr('fill',d => colorScale(d.Group))
//             .attr('opacity',.8)
    
//         simulation.alpha(0.9).restart()
    
//     } // end draw0 function

//     // Draw 2nd Viz
//     function draw1(){
    
//     clean('none')
//     console.log('Check')
    
//     } // end draw1 function    

//     function draw2(){
    
//         clean('none')
//         console.log('Check')
        
//     } // end draw1 function   

//     function draw3(){

//         clean('none')
//         console.log('Check')
        
//     } // end draw1 function   

// // --------------------------------------------
//         // Run the scrolling functions
// // --------------------------------------------
//     let activationFunctions = [
//         draw0,
//         draw1,
//         draw2,
//         draw3,
//     ]
    
//     //All the scrolling function
//     //Will draw a new graph based on the index provided by the scroll    
//     let scroll = scroller()
//         .container(d3.select('#graphic'))
//     scroll()
    
//     let lastIndex, activeIndex = 0
    
//     scroll.on('active', function(index){
//         d3.selectAll('.step') // Control opacity of the titles
//             .transition().duration(500)
//             .style('opacity', function (d, i) {return i === index ? 1 : 0.1;});
        
//         activeIndex = index
//         let sign = (activeIndex - lastIndex) < 0 ? -1 : 1; 
//         let scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
//         scrolledSections.forEach(i => {
//             activationFunctions[i]();
//         })
//         lastIndex = activeIndex;
    
//     })
    
//     scroll.on('progress', function(index, progress){
//         if (index == 2 & progress > 0.7){
    
//         }
//     })
      
//Janaan's merged information:
loadData().then(data => {
   console.log("HERE IS THE DATA", data)
   for (let d of data[0]){
       d.Speakers = +d.Speakers.replace(/,/g ,"");
   }
   for (let d of data[1]){
       d.Speakers = +d.Speakers.replace(/,/g ,"");
       d.nonEnglishSpeakers = +d.nonEnglishSpeakers.replace(/,/g ,"");
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
   catch{
       console.log("Data not loaded");
   }
}

      
      
