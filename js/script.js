// Set global variables
let dataset
let simulation, nodes
let views = {} //dictionary to store view objects

// --------------------------------------------
        // Import the data
// --------------------------------------------

loadData().then(data => {
    dataset = data
    
    setTimeout(setup_page(), 100) 
 })
 
 async function loadData() {
    try {
        const stateData = await d3.csv('./data/LanguageData_States.csv', function (d){ 
            return {
                Group: d.Group,
                Subgroup: d.Subgroup,
                Language: d.Language,
                State: d.State,
                Speakers: +d.Speakers.replace(/["',]/g ,""),
                nonEnglishSpeakers: +d.nonEnglishSpeakers.replace(/["',]/g ,"")
            }
        });
        console.log('State Data Loaded:', stateData);
        const nationalData = await d3.csv('./data/National_Languages.csv', function(d){
            return {
                Group: d.Group,
                Subgroup: d.Subgroup,
                Language: d.Language,
                Speakers: +d.Speakers.replace(/,/g ,""),
                nonEnglishSpeakers: +d.nonEnglishSpeakers.replace(/,/g ,""),
                r: d3.randomUniform(100, 400)
            }
        });
        console.log('National Data Loaded');
        return [stateData, nationalData];
    }
    catch{
        console.log("Data not loaded");
    }
 }

// --------------------------------------------
        // Setup the scales 
// --------------------------------------------

    // Viz #1 - Megacluster scales --------------------------------
    function colorScale(input){
        // Get distinct values, taken from: https://codeburst.io/javascript-array-distinct-5edc93501dc4
        const distinct = (value, index, self) => {
            return self.indexOf(value) === index;
        }
            
        let my_categories = dataset[1].map(x => x.Group).filter(distinct);
        const colors = ["#1b9e77","#6a3d9a","#ff7f00","#e7298a","#66a61e"];
        
        // Color scale
        let my_colorScale = d3.scaleOrdinal() 
            .domain(my_categories)
            .range(colors)
        
        return my_colorScale(input)
    } 
    
    function scaleSize(input){ 
        
        let my_scaleSize = d3.scaleSymlog() 
            .domain([1, 232000000])
            .range([1,20])
            .nice()
        return my_scaleSize(input)
    }
    // ----------------------------------------------------------------

// --------------------------------------------
        // Setup the page 
// --------------------------------------------

    // Setup the page 
    function setup_page(){

        // Create the SVG
        let svg = d3.select("#vis")
            .style('margin-left', '500px')
            .append('svg')
            .attr('width', 1000)
            .attr('height', 1000)
            .attr('opacity', 1)
            // .attr('position', 'relative')

        // Viz #2 - Map
        d3.select("#map").style('opacity',0)
        
        // Simulation setup
        simulation = d3.forceSimulation(dataset[1])

          .force("center", d3.forceCenter(500,500))
        //   .force('charge', d3.forceManyBody().strength(2))
        //   .force("cluster", clustering)
          .force("collide", d3.forceCollide().radius(function(d){
              return scaleSize(d.Speakers)
          }))

        
        // Define each tick of simulation
       simulation.on('tick', () => {
           nodes
               .attr('cx', d => d.x)
               .attr('cy', d => d.y)
    }) 
    simulation.alpha(0.9).restart()

     

        // Viz #4 Bar Graph setup
        views['bar2'] = new BarChart2(dataset[1], svg);
        views['bar2'].clearEventHandlers();

        // Viz #3 Bar Graph setup
        views['bar1'] = new Barchart(dataset[0], svg);

        // Viz #2 Map
        views['map'] = new US_Map(dataset[0]);
        
        // Viz #1 Megacluster setup
        views['cluster'] = new cluster(svg);




    } // End setup_page function


// --------------------------------------------
        // Control the opacity
// --------------------------------------------    
    function clean(chartType){
        let svg = d3.select('#vis').select('svg')
        if (chartType !== "cluster"){
            //svg.selectAll('circle').transition().style('opacity',0)
            d3.select("#cluster").transition().style('opacity', 0)
            views['cluster'].clearEventHandlers();

        } // End cluster if statement
        if (chartType !== "bar1"){
            d3.select('#barchart1').transition().style('opacity',0)
            views['bar1'].clearEventHandlers();
            d3.select("#tooltip-bar2").style('visibility', 'hidden');
    
            
        } // End bar1 if statement
        if (chartType !== "bar2"){
            d3.select('#barchart2').transition().style('opacity',0)
            views['bar2'].clearEventHandlers();
            d3.select("#tooltip-bar2").style('visibility', 'hidden');

        } // End bar2 if statement
        if (chartType !== "map"){
            d3.select('#map').transition().style('opacity',0)
        } // End map if statement
    } // End function clean()


// --------------------------------------------
        // Draw the visualizations
// --------------------------------------------

    //First Viz
    function draw_cluster(){
        // console.log("CAN YOU SEE THIS YET?")
        //Stop simulation
        simulation.stop()
        
        clean('cluster') // Turns off opacity for all other charts
        
        // let svg = d3.select("#vis")
        //     .select('svg')
        
        //svg.selectAll('circle')
        d3.select("#cluster").raise();
        d3.select("#cluster")
            .transition()
            .style('opacity',1)
    
        simulation.alpha(0.9).restart()
        // views['cluster'].tooltip()

        simulation.force("cluster", clustering)

           // Define clustering simulation function
           function clustering(alpha){
            nodes.forEach(function(d){
                
                let cluster = d.Group
                let x = d.x - cluster.x,
                    y = d.y - cluster.y,
                    l = Math.sqrt(x * x + y * y),
                    r = d.r + cluster.r;
                if (l !== r) {
                    l = (l - r) / l * alpha;
                    d.x -= x *= l;
                    d.y -= y *= l;
                    cluster.x += x;
                    cluster.y += y;
                }

            })
        }
    
    } // end draw0 function

    function draw_map(){

        clean('map')
        d3.select("#map").raise();
        d3.select("#map").style('opacity',1)
        
    } // end draw1 function  

    // Draw 2nd Viz
    function draw_bar1(){
    
        //Stop simulation
        simulation.stop()
        
        clean('bar1')
        console.log('Check')

        d3.select("#barchart1").raise();
        d3.select('#barchart1')
            .transition()
            .style('opacity',.8)
        views['bar1'].attachEventHandlers();

        simulation.alpha(0.9).restart()

    } // end draw2 function    

    function draw_bar2(){
    
        clean('bar2')
        d3.select("#barchart2").raise();
        d3.select('#barchart2')
            .style('margin-left', '500px')
            .style('opacity',.8)
        views['bar2'].attachEventHandlers();
        
    } // end draw3 function   

 

// --------------------------------------------
        // Run the scrolling functions
// --------------------------------------------
    let activationFunctions = [
        draw_cluster,
        draw_map,
        draw_bar1,
        draw_bar2,
    ]
    
    //All the scrolling function
    //Will draw a new graph based on the index provided by the scroll    
    let scroll = scroller()
        .container(d3.select('#graphic'))
    scroll()
    
    let lastIndex, activeIndex = 0
    
    scroll.on('active', function(index){
        d3.selectAll('.step') // Control opacity of the titles
            .transition().duration(500)
            .style('opacity', function (d, i) {return i === index ? 1 : 0.1;});
        
        activeIndex = index
        let sign = (activeIndex - lastIndex) < 0 ? -1 : 1; 
        let scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
        scrolledSections.forEach(i => {
            activationFunctions[i]();
        })
        lastIndex = activeIndex;
    
    })
    
    scroll.on('progress', function(index, progress){
        if (index == 2 & progress > 0.7){
    
        }
    })
      
      
