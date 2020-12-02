// Set global variables
let dataset, dataset_updated
let simulation, nodes, clusters
let map_data, map_center_data, path, projection, MapData, map_speaker_total, mapview = false
let views = {} //dictionary to store view objects
let toggle_object, toggle_tracker = false
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

        dataset_updated = nationalData.filter(d => d.Group != 'Total' && d.Speakers > 0)
        // Mapping Data
        // JSON taken from: https://github.com/DataVis-Fall-2020-Team/MappingAPI/tree/master/data/geojson
        map_data = await d3.json("data/us-states.json");
        map_center_data = await d3.json("data/state-centers.json");
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
        //const colors = ["#e7298a","#66a61e","#1b9e77", "#6a3d9a", "#ff7f00",'#e41a1c'];
        const colors = ['#377eb8','#984ea3','#4daf4a',"#e7298a",'#ff7f00'];
        
        // Color scale
        let my_colorScale = d3.scaleOrdinal() 
            .domain(my_categories)
            .range(colors)
        
        return my_colorScale(input)
    } 
    
    function scaleSize(input){ 
        
        let my_scaleSize = d3.scalePow() 
            .exponent(.3) // Smaller exponent = bigger circles
            .domain([1, d3.max(dataset_updated.map(d => d.Speakers))])
            .range([1,225])
            .nice()
        return my_scaleSize(input)
    }

    function scaleSize_map(input){ 
        
        let my_scaleSize_map = d3.scalePow() 
            .exponent(.2) // Smaller = bigger
            .domain([1, d3.max(dataset_updated.map(d => d.Speakers))])
            .range([1,30])
            .nice()
        return my_scaleSize_map(input)
    }

    function scaleCentersY_map(input){
        let scaleCenters = d3.scaleLinear()
            .domain([0,1000])
            .range([0,900]);
        return scaleCenters(input);
    }

    function scaleCentersX_map(input){
        let scaleCenters=d3.scaleLinear()
            .domain([0,1000])
            .range([0,895]);
        return scaleCenters(input);
    }

    // Create a scale for all of the bubbles for multi-select
    function scale_multiselect_bubble(input){
        let scale = d3.scaleLinear()
            .domain([0,d3.max(map_speaker_total)])
            .range([2,25]);
        return scale(input);
    }

    function scale_singleselect_bubble(input, data){
        let scale = d3.scaleLinear()
            .domain([0,d3.max(data.map(d => d.Speakers))])
            .range([2,25]);
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
            .style('margin-left', '500px')
            .append('svg')
            .attr('width', 1000)
            .attr('height', 1000)
            .attr('opacity', 1)
            // .attr('position', 'relative')

        //Create the tooltip
        d3.select("#vis")
            .append("div")
            .attr("id","tooltip");
    
        // Simulation setup
        simulation = d3.forceSimulation(dataset_updated)

        //   .force("center", d3.forceCenter(500,500))
        //   .force('charge', d3.forceManyBody().distanceMin(20))
          .force("cluster", clustering)
        //   .force("gravity", d3.forceManyBody())
          .force("charge", d3.forceManyBody().strength(-100).distanceMin(20))

          .force("collide", d3.forceCollide().radius(function(d){
              return scaleSize(d.Speakers) + 3
          }))
        //   .velocityDecay(.7)
        // .alphaDecay(.05) // Speed of cooling the simulation

          clusters = [{'Group': "ASIAN AND PACIFIC ISLAND LANGUAGES", number: 0, x:0, y:0} //Top left
          , {'Group':"OTHER INDO-EUROPEAN LANGUAGES", number:1, x:250, y:100} // Furthest right, below English
          , {'Group':"SPANISH AND SPANISH CREOLE", number:2, x:0, y:250} // Bottom left
          , {'Group':"English",number:3, x:250, y:0} // Furthest right
          , {'Group':"ALL OTHER LANGUAGES", number:4, x: 180, y:180}
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

        //Draws the various legends for each of the sections
        function drawLegend(name, groups){
            let svg = d3.select(name).append("svg")
            .attr("width", 400)
            .attr("height", 200);

        let legend = svg.selectAll("g")
             .data(groups)
             .join("g")
    	    .attr("class","legend")
            .attr("transform", "translate(20, 10)");

        legend.append("rect")
            .attr("x", 0) 
            .attr("y", function(d, i) { return 40 * i; })
            .attr("width", 30)
            .attr("height", 30)
            .attr('fill',d => colorScale(d));

        legend.append("text")
            .attr("x", 50) 
            .attr("dy", "0.75em")
            .attr("y", function(d, i) { return 40 * i + 10; })
            .style("font-size", "15px")
            .text(function(d) {return d.toUpperCase()});
        }
    
        // Get distinct values, taken from: https://codeburst.io/javascript-array-distinct-5edc93501dc4
        const distinct = (value, index, self) => {
            return self.indexOf(value) === index;
        }
    
        let my_categories = dataset[1].map(x => x.Group).filter(distinct);

        //Viz #5 Stacked Area Chart
        views['area'] = new AreaChart(dataset[2], dataset[3], dataset[4], svg);
        drawLegend("#legendAreachart", my_categories.slice(2));


        // Viz #4 Bar Graph setup
        views['bar2'] = new BarChart2(dataset[1], svg);
        views['bar2'].clearEventHandlers();

        // Viz #3 Bar Graph setup
        views['bar1'] = new Barchart(dataset[0], svg);
        drawLegend("#legendBarchart1", my_categories.slice(1));

        // Viz #2 Map
        views['map'] = new US_Map([dataset[0],map_data,map_center_data, dataset[1]], svg);
        views['map'].updateStateOpacity(0);
        
        // Viz #1 Megacluster setup
        views['cluster'] = new cluster(svg);
        drawLegend("#legendCluster", my_categories.slice(1));

        // Define each tick of simulation
        simulation.on('tick', () => {
            d3.selectAll('.cluster_circles')
                .attr('cx', (d) => d.x + 350)
                .attr('cy', (d) => d.y + 400)
     }) 

     // Render Toggle - Taken from Homework 6 solution
     let toggle_div = d3.select('#map_section').append('div').attr('id','toggle_map')

     toggle_object = renderToggle(toggle_div, 'Multi-select') 

    } // End setup_page function

    //https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
    function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
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
                //d3.select("#us_map").transition().style('opacity',0);
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
            mapview = false
        } // End map if statement

        if (chartType !== "area"){
            d3.select('#area').transition().style('opacity',0)
            views['area'].drawChart();
            views['area'].clearEventHandlers();
        } //End area if statement

    } // End function clean()

// --------------------------------------------
        // Update Other Views
// --------------------------------------------

    function updateOtherViews(selectedPoints){
        views['map'].updateView(selectedPoints);
    }

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
            .transition(1000)
            .attr('r',d=> scaleSize(d.Speakers))

        views['cluster'].tooltip()

        simulation.force("cluster", clustering)
        .force("charge", d3.forceManyBody())
        .force("collide", d3.forceCollide().radius(function(d){
            return scaleSize(d.Speakers) + 3
        }))
        .alphaDecay(0.0228)
        .velocityDecay(.4)


        clusters = [{'Group': "ASIAN AND PACIFIC ISLAND LANGUAGES", number: 0, x:0, y:0} //Top left
        , {'Group':"OTHER INDO-EUROPEAN LANGUAGES", number:1, x:250, y:100} // Furthest right, below English
        , {'Group':"SPANISH AND SPANISH CREOLE", number:2, x:0, y:250} // Bottom left
        , {'Group':"English",number:3, x:250, y:0} // Furthest right
        , {'Group':"ALL OTHER LANGUAGES", number:4, x: 180, y:180}
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
      simulation.alpha(0.9).restart()


        // simulation.force("cluster", clustering)

           // Define clustering simulation function

        // clustering()

    } // end draw0 function

    function draw_map(){


        mapview = true
        // TOGGLE
        toggle_object.on('click.toggle', function(d){
            if (toggle_object.node().checked){
                views['cluster'].map_brush(true)
                d3.select("#cluster_group").raise();

    
            }
            else {
                views['cluster'].map_brush(false)
                views['cluster'].attach_maplisteners();
                d3.select("#cluster_group").raise();

            }
        })
        views['cluster'].tooltip();
        views['cluster'].attach_maplisteners()

        simulation.stop()
        // Draw the map
        clean('map')
        d3.select("#cluster").raise();


        // d3.select("#us_map").raise();
        d3.select("#us_map").style('opacity',1);
        views['map'].updateStateOpacity(1);
		
        //Move the bubbles

        d3.selectAll('.cluster_circles')
            .transition()
            .duration(1000)
            .attr('r',d=> scaleSize_map(d.Speakers) + 1)

        d3.select('#cluster')
            .style('opacity',1)


        simulation.alpha(1).restart()

        simulation
            // .transition()
            .force("cluster", clustering)
            .force("charge", d3.forceManyBody().strength(-5))
            .force("collide", d3.forceCollide().radius(function(d){
                return scaleSize_map(d.Speakers) + 2.5
            }))
            // .alphaDecay(.01)
            .velocityDecay(.9)

            let clusters = [{'Group': "ASIAN AND PACIFIC ISLAND LANGUAGES", number: 0, x:50, y:-300}
            , {'Group':"OTHER INDO-EUROPEAN LANGUAGES", number:1, x:220, y:-300}
            , {'Group':"SPANISH AND SPANISH CREOLE", number:2, x:-100, y:-300}
            , {'Group':"English",number:3, x:-220, y:-300}
            , {'Group':"ALL OTHER LANGUAGES", number:4, x: 400, y:-310}
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

    // Draw Horizontal Barchart
    function draw_bar1(){
    
        //Stop simulation
        simulation.stop()
        
        clean('bar1')

        d3.select("#barchart1").raise();
        d3.select('#barchart1')
            .transition()
            .style('opacity',.8);
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
                .style('opacity',0.8);
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
                .delay(300)
                .duration(400)
                //move bars to the left
                .attr("x", function(d){
                    let object = map.filter(obj => obj.group === d.group);
                    return object[0].x;})
                .transition()
                .duration(400)
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
            .style('opacity',0.8)
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
        draw_cluster
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
      
      
