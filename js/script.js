// Set global variables
let dataset, dataset_updated
let simulation, nodes, clusters
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
        dataset_updated = nationalData.filter(d => d.Group != 'Total')

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
        const colors = ["#6a3d9a","#ff7f00","#e7298a","#66a61e","#1b9e77"];
        
        // Color scale
        let my_colorScale = d3.scaleOrdinal() 
            .domain(my_categories)
            .range(colors)
        
        return my_colorScale(input)
    } 
    
    function scaleSize(input){ 
        
        let my_scaleSize = d3.scalePow() 
            .exponent(.15) // Smaller exponent = bigger circles
            .domain([1, 232000000])
            .range([1,65])
            .nice()
        return my_scaleSize(input)
    }

    function scaleSize_map(input){ 
        
        let my_scaleSize_map = d3.scalePow() 
            .exponent(.2) // Smaller = bigger
            .domain([1, 232000000])
            .range([1,30])
            .nice()
        return my_scaleSize_map(input)
    }
    // ----------------------------------------------------------------

// --------------------------------------------
        // Setup the page 
// --------------------------------------------

    // Setup the page 
    function setup_page(){
        
        
        console.log("here is the national dataset", dataset_updated)
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
        simulation = d3.forceSimulation(dataset_updated)

        //   .force("center", d3.forceCenter(500,500))
        //   .force('charge', d3.forceManyBody().distanceMin(20))
          .force("cluster", clustering)
          .force("gravity", d3.forceManyBody(30))
          .force("collide", d3.forceCollide().radius(function(d){
              return scaleSize(d.Speakers) + 3
          }))
        //   .velocityDecay(.7)
        // .alphaDecay(.05) // Speed of cooling the simulation
        

          clusters = [{'Group': "ASIAN AND PACIFIC ISLAND LANGUAGES", number: 0, x:100, y:110}
          , {'Group':"OTHER INDO-EUROPEAN LANGUAGES", number:1, x:120, y:120}
          , {'Group':"SPANISH AND SPANISH CREOLE", number:2, x:140, y:130}
          , {'Group':"English",number:3, x:160, y:140}
          , {'Group':"ALL OTHER LANGUAGES", number:4, x: 180, y:150}
        ]

        for (i of dataset_updated){
            for (n of clusters){
                if (i.Group == n.Group){
                    i.number = n.number
                }
            }
        }

        // This clustering code is taken from: https://bl.ocks.org/pbogden/854425acb57b4e5a4fdf4242c068a127
        function clustering(alpha) {
            for (let i = 0, n = dataset_updated.length, node, cluster, k = alpha * 1; i < n; ++i) {
                node = dataset_updated[i];
                cluster = clusters[node.number];
                node.vx -= (node.x - cluster.x) * k;
                node.vy -= (node.y - cluster.y) * k;
                }
            }

        // Viz #4 Bar Graph setup
        views['bar2'] = new BarChart2(dataset[1], svg);
        views['bar2'].clearEventHandlers();

        // Viz #3 Bar Graph setup
        views['bar1'] = new Barchart(dataset[0], svg);

        // Viz #2 Map
        views['map'] = new US_Map(dataset[0]);
        
        // Viz #1 Megacluster setup
        views['cluster'] = new cluster(svg);

        // Define each tick of simulation
        simulation.on('tick', () => {
            d3.selectAll('.cluster_circles')
                .attr('cx', (d) => d.x + 300)
                .attr('cy', (d) => d.y + 300)
     }) 

    } // End setup_page function


// --------------------------------------------
        // Control the opacity
// --------------------------------------------    
    function clean(chartType){
        let svg = d3.select('#vis').select('svg')
        if (chartType !== "cluster"){
            if (chartType !== "map"){
            //svg.selectAll('circle').transition().style('opacity',0)
            d3.select("#cluster").transition().style('opacity', 0)
            views['cluster'].clearEventHandlers();
            } 
        } // End cluster if statement

        if (chartType !== "bar1"){
            d3.select('#barchart1').transition().style('opacity',0)
            views['bar1'].clearEventHandlers();
            d3.select("#tooltip-bar2").style('visibility', 'hidden');
        } // End bar1 if statement

        if (chartType !== "bar2"){
            d3.select('#barchart2').transition().style('opacity',0)
            views['bar2'].clearEventHandlers();
            d3.select("#tooltip-bar2").style('visibility', 'hidden')
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
        
        d3.selectAll('.cluster_circles')
            .attr('r',d=> scaleSize(d.Speakers))

        simulation.alpha(0.9).restart()
        views['cluster'].tooltip()

        simulation.force("cluster", clustering)
        .force("collide", d3.forceCollide().radius(function(d){
            return scaleSize(d.Speakers) + 3
        }))
        .alphaDecay(.05)


        clusters = [{'Group': "ASIAN AND PACIFIC ISLAND LANGUAGES", number: 0, x:100, y:110}
        , {'Group':"OTHER INDO-EUROPEAN LANGUAGES", number:1, x:120, y:120}
        , {'Group':"SPANISH AND SPANISH CREOLE", number:2, x:140, y:130}
        , {'Group':"English",number:3, x:160, y:140}
        , {'Group':"ALL OTHER LANGUAGES", number:4, x: 180, y:150}
      ]

      // This clustering code is taken from: https://bl.ocks.org/pbogden/854425acb57b4e5a4fdf4242c068a127
      function clustering(alpha) {
          for (let i = 0, n = dataset_updated.length, node, cluster, k = alpha * 1; i < n; ++i) {
              node = dataset_updated[i];
              cluster = clusters[node.number];
              node.vx -= (node.x - cluster.x) * k;
              node.vy -= (node.y - cluster.y) * k;
              }
          }

        // simulation.force("cluster", clustering)

           // Define clustering simulation function

        // clustering()

    
    } // end draw0 function

    function draw_map(){
        simulation.stop()

        // Draw the map
        clean('map')
        d3.select("#map").raise();

        d3.select("#map").style('opacity',1)

        //Move the bubbles

        // views['cluster'].tooltip()  // Doesn't put tooltip back

        d3.select("#cluster")
            .transition()
            .style('opacity',1)

        d3.selectAll('.cluster_circles')
            .attr('r',d=> scaleSize_map(d.Speakers))

        simulation.alpha(0.9).restart()

        simulation
            .force("cluster", clustering)
            .force("collide", d3.forceCollide().radius(function(d){
                return scaleSize_map(d.Speakers)
            }))
            .alphaDecay(.1)

        let clusters = [{'Group': "ASIAN AND PACIFIC ISLAND LANGUAGES", number: 0, x:-100, y:-200}
        , {'Group':"OTHER INDO-EUROPEAN LANGUAGES", number:1, x:50, y:-200}
        , {'Group':"SPANISH AND SPANISH CREOLE", number:2, x:200, y:-200}
        , {'Group':"English",number:3, x:350, y:-200}
        , {'Group':"ALL OTHER LANGUAGES", number:4, x: 500, y:-200}
      ]

      // This clustering code is taken from: https://bl.ocks.org/pbogden/854425acb57b4e5a4fdf4242c068a127
      function clustering(alpha) {
          for (let i = 0, n = dataset_updated.length, node, cluster, k = alpha * 1; i < n; ++i) {
              node = dataset_updated[i];
              cluster = clusters[node.number];
              node.vx -= (node.x - cluster.x) * k;
              node.vy -= (node.y - cluster.y) * k;
              }
          }

    } // end draw_map function  

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
            .transition()
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
      
      
