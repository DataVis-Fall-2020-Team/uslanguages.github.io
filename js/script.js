// Set global variables
let dataset, dataset_updated
let simulation, nodes, clusters
let map_data, map_center_data, path, projection
let map_simulation, map_nodes, map_clusters, dataset0_updated
let MapData, map_speaker_total
let views = {} //dictionary to store view objects
let toggle_object, toggle_tracker = false
let map_circles_same = true;
// --------------------------------------------
        // Import the data
// --------------------------------------------

loadData().then(function(data){
    dataset = data
    
    setTimeout(setup_page(), 100)
 })
 
 async function loadData() {
    try {
        // State Data
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

        // National Data
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
        // Mapping Data
        // JSON taken from: https://github.com/DataVis-Fall-2020-Team/MappingAPI/tree/master/data/geojson
        map_data = await d3.json("data/us-states.json");
        map_center_data = await d3.json("data/state-centers.json");
        dataset0_updated = [];
        //console.log('Map Data Loaded');
        const compareData = await d3.csv('./data/language_compare.csv');
        const percentageData = await d3.csv('./data/language_percentages.csv');
        const languageMap = await d3.csv('./data/language_map.csv');

        return [stateData, nationalData, compareData, percentageData, languageMap];
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
        const colors = ["#e7298a","#66a61e","#1b9e77", "#6a3d9a", "#ff7f00"];
        
        // Color scale
        let my_colorScale = d3.scaleOrdinal() 
            .domain(my_categories)
            .range(colors)
        
        return my_colorScale(input)
    } 
    
    function scaleSize(input){ 
        
        let my_scaleSize = d3.scalePow() 
            .exponent(.4) // Smaller exponent = bigger circles
            .domain([1, 232000000])
            .range([1,250])
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

    function scaleCentersY_map(input){
        let scaleCenters = d3.scaleLinear()
            .domain([0,1000])
            .range([0,940]);
        return scaleCenters(input);
    }

    function scaleCentersX_map(input){
        let scaleCenters=d3.scaleLinear()
            .domain([0,1000])
            .range([0,927]);
        return scaleCenters(input);
    }

    function scaleSelection_map(input, min, max){
        let scaleBubbles = d3.scaleLinear()
            .domain([min,max])
            .range([6,35]);

        return scaleBubbles(input);
    }

    // Create a scale for all of the bubbles for multi-select
    function scale_multiselect_bubble(input){
        let scale = d3.scaleLinear()
            .domain([0,d3.max(map_speaker_total)])
            .range([6,35]);
        return scale(input);
    }

    function scale_singleselect_bubble(input, data){
        let scale = d3.scaleLinear()
            .domain([0,d3.max(data.map(d => d.Speakers))])
            .range([6,35]);
        return scale(input);
    }
    // ----------------------------------------------------------------

// --------------------------------------------
        // Setup the page 
// --------------------------------------------

    // Setup the page 
    function setup_page(){
        
        // Create the SVG
        let svg = d3.select("#vis")
            .style('margin-left', '450px')
            .append('svg')
            .attr('width', 1050)
            .attr('height', 1000)
            .attr('opacity', 1)

        // Simulation setup
        simulation = d3.forceSimulation(dataset_updated)
          .force("cluster", clustering)
          .force("gravity", d3.forceManyBody(30))
          .force("collide", d3.forceCollide().radius(function(d){
              return scaleSize(d.Speakers) + 3
          }))

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

        // Map Simulation Prep
        map_clusters = [];
        let ind = 0;
        d3.keys(map_center_data).forEach((d,i)=>{
            if(d!="Notes"){
                map_clusters[ind] = {
                    'State': d,
                    'x': d3.values(map_center_data)[i][0],
                    'y': d3.values(map_center_data)[i][1],
                };
                ind++;
            }
        });

        //Viz #5 Stacked Area Chart
        views['area'] = new AreaChart(dataset[2], dataset[3], dataset[4], svg);

        // Viz #4 Bar Graph setup
        views['bar2'] = new BarChart2(dataset[1], svg);
        views['bar2'].clearEventHandlers();

        // Viz #3 Bar Graph setup
        views['bar1'] = new Barchart(dataset[0], svg);

        // Viz #2 Map
        views['map'] = new US_Map([dataset[0],map_data,map_center_data, dataset[1]], svg);
        views['map'].updateStateOpacity(0);

        // Viz #1 Megacluster setup
        views['cluster'] = new cluster(svg);

        // Define each tick of simulation
        simulation.on('tick', () => {
            d3.selectAll('.cluster_circles')
                .attr('cx', (d) => d.x + 275)
                .attr('cy', (d) => d.y + 250)


     }) 

     // Render Toggle - Taken from Homework 6 solution
     let toggle_div = d3.select('#map_section').append('div').attr('id','toggle_map')

     toggle_object = renderToggle(toggle_div, 'Merge Speakers')

     // Render Language Info Div in Panel - Replacement for tooltip because of clutter
     d3.select("#map_section").append("div").attr("id", "LanguageInfo");

    } // End setup_page function


// --------------------------------------------
        // Control the opacity
// --------------------------------------------    
    function clean(chartType){
        let svg = d3.select('#vis').select('svg')
        if (chartType !== "cluster"){
            if (chartType !== "map"){
                d3.select("#cluster").transition().style('opacity', 0)
                views['cluster'].clearEventHandlers();
            }
        } // End cluster if statement

        if (chartType !== "bar1"){
            d3.select('#barchart1').transition(300).style('opacity',0)
            views['bar1'].clearEventHandlers();
            d3.select("#tooltip-bar2").style('visibility', 'hidden');
        } // End bar1 if statement

        if (chartType !== "bar2"){
            d3.select('#barchart2').transition().style('opacity',0)
            views['bar2'].clearEventHandlers();
            d3.select("#tooltip-bar2").style('visibility', 'hidden')
        } // End bar2 if statement

        if (chartType !== "map"){
            d3.select("#us_map").transition().style('opacity',0);
            views['map'].clearEventHandlers();
            views['cluster'].map_brush(false);
        }
        else{
            //Reset Map
            updateOtherViews([]); //Clear out selection
            views['cluster'].map_brush(false); // Clear brush selection
            views['cluster'].map_brush(true) //bring back brush
            d3.select("#cluster_group").raise();
        }// End map if statement

        if (chartType !== "area"){
            d3.select('#area').transition().style('opacity',0)
            views['area'].drawChart();
            views['area'].clearEventHandlers();
        } //End area if statement

    } // End function clean()

// --------------------------------------------
        // Update Other Views
// --------------------------------------------

    function updateOtherViews(newData){
        views['map'].updateView(newData);
    }

// --------------------------------------------
        // Draw the visualizations
// --------------------------------------------

    //First Viz
    function draw_cluster(){
        // console.log("CAN YOU SEE THIS YET?")
        //Stop simulation
        // simulation.stop()
        
        clean('cluster') // Turns off opacity for all other charts

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
        .alphaDecay(0.0228)
        .velocityDecay(.4)


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
      d3.select("#cluster").raise();

        // simulation.force("cluster", clustering)

           // Define clustering simulation function

        // clustering()

    } // end draw0 function

    function draw_map(){
        // TOGGLE
        toggle_object.on('click.toggle', function(d){
            if (toggle_object.node().checked){
                clean('map');
            }
            else {
                clean('map');
            }
        })

        simulation.stop()

        // Draw the map
        clean('map');

        //Draw Bubble Filters
        //Move the bubbles
        d3.selectAll('.cluster_circles')
            .transition()
            .duration(1000)
            .attr('r',d=> scaleSize_map(d.Speakers))

        d3.select('#cluster')
            .style('opacity',1)

        simulation.alpha(1).restart()

        simulation
            .force("cluster", clustering)
            .force("collide", d3.forceCollide().radius(function(d){
                return scaleSize_map(d.Speakers)
            }))
            .alphaDecay(.01)
            .velocityDecay(.9)

            let clusters = [{'Group': "ASIAN AND PACIFIC ISLAND LANGUAGES", number: 0, x:-100, y:-160}
                , {'Group':"OTHER INDO-EUROPEAN LANGUAGES", number:1, x:30, y:-150}
                , {'Group':"SPANISH AND SPANISH CREOLE", number:2, x:170, y:-150}
                , {'Group':"English",number:3, x:300, y:-142}
                , {'Group':"ALL OTHER LANGUAGES", number:4, x: 430, y:-140}
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

        //Draw Brush
        views['cluster'].map_brush(true);


        //Raise these views so that there's no fighting with the bar charts or the brush
        d3.select("#cluster_group").raise();
        d3.select("#us_map").raise();

        //Attach Tooltips, Events, and Update Opacity
        views['cluster'].tooltip();
        views['cluster'].attach_maplisteners();

        d3.select("#us_map").style('opacity',1);
        views['map'].updateStateOpacity(1);
        views['map'].attachEventHandlers();

    } // end draw_map function  

    // Sub-function to Map, is called when map bubbles are drawn
    function clusterMapBubbles(){
        if(dataset0_updated.length > 0){
            //console.log("Clustering Map!");

            map_simulation = d3.forceSimulation(dataset0_updated)
                .force("cluster", map_clustering)
                .force("collide", d3.forceCollide().radius(function(d){
                    return 2.2;
                }))
                .alphaDecay(.09)
                .velocityDecay(.7)

            map_simulation.on('tick', () => {
                d3.selectAll('.state_bubbles')
                    .attr("cx", (d) => d.x + 0)
                    .attr("cy", (d) => d.y + 140)
            })

            // This clustering code is taken from: https://bl.ocks.org/pbogden/854425acb57b4e5a4fdf4242c068a127
            function map_clustering(alpha) {
                for (let i = 0, n = dataset0_updated.length, map_node, map_cluster, k = alpha * 1; i < n; ++i) {
                    map_node = dataset0_updated[i];
                    map_node.vx -= (map_node.x - map_node.StateCenter[0]) * k;
                    map_node.vy -= (map_node.y - map_node.StateCenter[1]) * k;
                }
            }
        }
    } // end clusterMapBubbles function  

    // Draw Horizontal Barchart
    function draw_bar1(){
    
        //Stop simulation
        simulation.stop()
        
        clean('bar1')

        d3.select("#barchart1").raise();
        d3.select('#barchart1')
            .transition()
            .style('opacity',.8)
        views['bar1'].attachEventHandlers();

    } // end draw horizontal barchart function    

    // Draw Vertical Barchart
    function draw_bar2(){
        d3.select("#tooltip-bar2")
            .style("opacity", 0);
        clean('bar2')
        d3.select("#barchart2").raise();
        d3.select("#barchart2").attr("pointer-events", "none");
        
        views['bar2'].reset();
        d3.select('#barchart2')
                .transition()
                .style('margin-left', '500px')
                .style('opacity',1);
        d3.select("#bar-rects")
            .style("opacity", 0);
        

        let data = views['bar1'].getDataForTransition().filter(obj=>obj.group != "ENGLISH");

        let map = [{group: "ASIAN AND PACIFIC ISLAND LANGUAGES", number: 0, x: 254, y:360}
            , {group: "OTHER INDO-EUROPEAN LANGUAGES", number:1, x:152, y:246}
            , {group: "SPANISH AND SPANISH CREOLE", number:2, x:50, y:330}
            , {group: "ENGLISH",number:3, x:0, y:200}
            , {group: "ALL OTHER LANGUAGES", number:4, x: 356, y:240}
        ]
    
        let rects = d3.select("#barchart2").append("g").attr("class", "simRects");

        //draw the transition rects in barchart2 view
        rects.selectAll("rect")
            .data(data)
            .join("rect")
            .attr("x", d=>d.startX)
            .attr("y", d=>d.startY)
            .attr("height", d=>d.height)
            .attr("width", d=>d.width)
            .attr('fill',d => colorScale(d.group));
        
        let count = 0;
        let callbackFunction = function(){
            count++;
            if (count === 130){
                d3.select(".simRects")
                    .style("opacity", 0)
                d3.select("#bar-rects")
                    .style("opacity", 1)
                d3.select(".simRects").remove();
                d3.select("#barchart2").attr("pointer-events", "auto");
                views['bar2'].attachEventHandlers();
            }
        }   

        rects.selectAll("rect")
                .transition()
                .delay(500)
                .duration(800)
                //move bars to the left
                .attr("x", function(d){
                    let object = map.filter(obj => obj.group === d.group);
                    return object[0].x;})
                .transition()
                .duration(800)
                //adjust width to match bar width in view 2
                .attr("width", 100)
                //drop into bars
                .transition()
                .delay(function(d,i) {
                    if (i < 100) return i * 10;
                    else return 0;})
                .duration(100)
                .attr("y", function(d,i){
                    let object = map.filter(obj => obj.group === d.group);
                    if (d.startY < object[0].y)
                        return d.startY + object[0].y
                    else return d.startY;
                })
                .on("end", callbackFunction);
    
    } // end draw vertial barchcart function   

    // Draw Area Chart
    function draw_area(){
    
        //Stop simulation
        simulation.stop()
        
        clean('area')

        d3.select("#area").raise();
        d3.select('#area')
            .transition()
            .style('opacity',1)
        views['area'].attachEventHandlers();

    } // end draw area chart function 

 

// --------------------------------------------
        // Run the scrolling functions
// --------------------------------------------
    let activationFunctions = [
        draw_cluster,
        draw_map,
        draw_bar1,
        draw_bar2,
        draw_area,
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
      
      
