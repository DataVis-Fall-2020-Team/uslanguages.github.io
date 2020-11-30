//TODO: Finish writing blurb
//TODO: Maybe: add some storytelling?
//TODO: Add a toggle button to display bubble speaker values without hover
class US_Map{
    // Creates a US_Map object showing language distribution
    constructor(data, svg){
        //console.log(data); //355 languages, 51 states/territories
        //Get and Modify Data
        this.data=data[0];
        this.stateData = data[1];
        this.stateCenters=data[2];
        this.lines=[[785, 705, 260, 225],[805, 753, 260, 200],[804,894,285,225],[814,858,298,289],[797,895,303,346],
                    [777,827,340,360],[770,882,370,427],[750,810,370,430],[744,815,376,508]];

        //console.log(this.stateCenters);
        //Add centers and languages per state to the data
        let that = this;
        this.mapData = this.data.map((d,i)=>{
            if(d.Speakers > 0){
                d.StateCenter = [
                    scaleCentersX_map(that.stateCenters[d.State][0]),
                    scaleCentersY_map(that.stateCenters[d.State][1])
                ],
                d.StateLanguages = that.getLanguagesPerState(d.State),
                d.LanguageIndex = that.getLanguageIndexPerState(d.State, d.Language);
                return d;
            }
            return "";
        });

        // https://appdividend.com/2019/04/11/how-to-get-distinct-values-from-array-in-javascript/
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
        let uniqueLanguages = new Set(d3.map(this.mapData, d=>d.Language));
        this.AllLanguages = Array.from(uniqueLanguages);

        this.svg=svg.append("g").attr("id", "us_map");

        //this.createSimulation();
        this.drawStates();
        this.drawBubbles("none");//["Cajun","French"]);
    }

    getLanguagesPerState(state){
        return this.data.filter(d=>d.State == state);
    }

    getLanguageIndexPerState(state, language){
        let languages = this.getLanguagesPerState(state);
        return languages.findIndex(a=>a.Language==language);
    }

    //used to draw the states if they aren't hard-coded
    drawStates(){
        projection = d3.geoAlbersUsa()
            .translate([1000/2-50,410]) // this centers the map in the SVG element
            .scale([1200]); // this specifies how much to zoom

        path = d3.geoPath()
            .projection(projection);

        this.stateMap = this.svg.append("g")
            .attr("id", "map_states");

        this.stateMap.selectAll("path")
            .data(this.stateData.features)
            .join("path")
            .attr("d", path)
            .classed("states", true)
            .attr("id", d=>d.properties.name);

        //for some reason AlbersUsa projection filters out Puerto Rico
        this.stateMap.append("path")
            .attr("d", "M569.2,530.2l0.9-2.1l1.7,0.4l1.7,1.3l7.3,0.9l7.3-0.4h3l2.6,0.9l1.7-1.3h2.1l5.1, " +
                "0.4l5.1,1.3 l1.7,1.7h3l0.4,2.6l-0.4,1.7l-3.4,0.4l-2.1,0.9l-0.9,2.1l-1.3,2.1l-2.6, " +
                "1.3h-5.1h-4.3l-2.1-0.9h-4.3l-2.1-0.9l-3.4,0.9h-4.3 l-2.1-1.7l-2.6,0.9l-3.4, " +
                "0.4l-0.4-2.1l0.9-1.3l0.9-2.1l-0.9-2.6l-3.4-2.6l1.3-0.9L569.2,530.2z M615.9, " +
                "541.8l-1.9,0.6l3.7,1.2 l5-1.2l1.2-1.9l-3.1,0.6L615.9,541.8z M624.6, " +
                "537.5l-1.5-0.9l2.2-1.5l0.6,1.5L624.6,537.5z")
            .attr("transform", "translate(-35,120)")
            .classed("states", true);

        //Draw lines group for smaller states to link bubbles to
        let linesGroup = this.svg.append("g")
            .attr("id", "lines_group");
    }

    updateStateOpacity(opacity){
        this.stateMap.style("opacity", opacity);
    }

    //Draws the language bubbles
    drawBubbles(languages){
        //this.map_simulation.stop();

        // Filter Data based on selected language(s)
        if(languages == "all"){
            languages=this.AllLanguages; //["English", "Spanish", "French Creole"];
        }
        else if(languages == "none"){
            languages="";
        }

        dataset0_updated = this.mapData.filter(d=>languages.includes(d.Language));
        if(this.svg.select("#map_circles").empty()){
            this.svg.append("g")
                .attr("id", "map_circles");
        }

        // Draw Bubbles
        let bubbleGroup = this.svg.select("#map_circles");

        let that = this;
        let mapBubbles = bubbleGroup.selectAll("circle")
            .data(dataset0_updated)
            .join("circle")
            .attr("fill", d=>colorScale(d.Group))
            .attr("stroke", "black")
            //.style("opacity", 0.5)
            //.attr("r", d=>scaleSize_map(d.Speakers))
            .attr("r", 2)
            /*.attr("cx", d=>d.StateCenter[0]+10)
            .attr("cy", d=>d.StateCenter[1]+140)
            .attr("transform", d=>{
                let pos = [0,0];//that.GetBubbleTranslation(d);
                return "translate("+(pos[0]+10)+","+(pos[1]+140)+")";
            })*/
            .attr("class", d=>d.Language.replaceAll(" ",'_')
                .replaceAll(",", "")
                .replaceAll("'", "-")
                .toLowerCase())
            .classed("state_bubbles", true);


         //Draw lines for smaller states to link bubbles to
        let linesGroup = d3.select("#lines_group");
        if(languages.length > 0){
            linesGroup.selectAll("line")
                .data(this.lines)
                .join("line")
                .attr("x1", d=>d[0]+20)
                .attr("x2", d=>d[1]+20)
                .attr("y1", d=>d[2])
                .attr("y2", d=>d[3])
                .classed("state_lines");
        }
        else{
            linesGroup.selectAll("line")
                .data(d=>[])
                .join("line");
        }

        //Has to always be created after bubbles are created
        this.attachEventHandlers();
        //this.startSimulation();
        clusterMapBubbles();
    }

    /* Create Event Handlers and make language of circles grow */
    attachEventHandlers() {
        let that = this;

        // Create info box in side panel
        let infoBox = d3.select('#LanguageInfo')

        // Mouse over
        d3.selectAll('.state_bubbles').on('mouseover.map', function(d){
            console.log("mouseover in map");
            infoBox.html("<p style=font-size:20px>" + d.Group + "</p> \
                       <p>" + d.Subgroup + "</p> \
                       <p>" + d.Language + ": " + d.Speakers +"</p>"
                );

            // Grow Circle
            let hovered_class = d.Language.replaceAll(" ",'_')
                .replaceAll(",", "")
                .replaceAll("'", "-")
                .toLowerCase();
            console.log(d.Language, hovered_class);

            let selection = d3.map(that.data.filter(e=>e.Language == d.Language), e=>e.Speakers);
            console.log(selection);
            let min = d3.min(selection);
            let max = d3.max(selection);

            d3.selectAll(".state_bubbles")
                .attr("r", 2);

            let circles = d3.selectAll("."+hovered_class)
                .attr("r", function(d1){
                    return scaleSelection_map(d1.Speakers, min, max);
                })
                .style("opacity", .9);

            // Bring language circles to front
            circles.raise();

        }) // End mouseover listener

        // Mouse out
        d3.selectAll('.state_bubbles').on('mouseout.map', () => {
            infoBox.html("");
            d3.selectAll(".state_bubbles")
                .attr("r", 2);
        }) // End mouseout listener
    }

    clearEventHandlers(){
        d3.selectAll('.state_bubbles').on('mousemove.map', null);
        d3.selectAll('.state_bubbles').on('mouseover.map', null);
        d3.selectAll('.state_bubbles').on('mouseout.map', null);
    }

    updateView(selectedPoints){
        //get languages from points
        if(selectedPoints.length > 0){
            let selectedData = dataset_updated.filter((d,i)=>selectedPoints.includes(i));
            let languages = [... new Set(selectedData.map(d=>d.Language))];
            this.drawBubbles(languages);
        }
        else{
            //doesn't work...Why?
            this.drawBubbles("none");
        }
    }

    createSimulation(){
        // **** Map Simulation **** /
        let that = this;

        this.map_simulation = d3.forceSimulation(that.data)
          .force("cluster", map_clustering)
          .force("gravity", d3.forceManyBody(30))
          .force("collide", d3.forceCollide().radius(function(d){
              return 2; //scaleSize(d.Speakers) + 3
          }))

        this.map_clusters = [];
        let ind = 0;
        d3.keys(map_center_data).forEach((d,i)=>{
            if(d!="Notes"){
                map_clusters[ind] = {
                    'Group': d,
                    'number': ind,
                    'x': scaleCentersX_map(d3.values(map_center_data)[i][0]),
                    'y': scaleCentersY_map(d3.values(map_center_data)[i][1]),
                };
                ind++;
            }
        });
        //console.log(map_clusters);

        // This clustering code is taken from: https://bl.ocks.org/pbogden/854425acb57b4e5a4fdf4242c068a127
        function map_clustering(alpha) {
            //console.log("DATA");
            for (let i = 0, n = that.data.length, map_node, map_cluster, k = alpha * 1; i < n; ++i) {
                map_node = that.data[i];
                map_cluster = map_clusters[map_node.index];
                if(map_cluster){
                    //console.log(map_cluster);
                    map_node.vx -= (map_node.x - map_cluster.x) * k;
                    map_node.vy -= (map_node.y - map_cluster.y) * k;
                }
            }
        }
    }

    startSimulation(){
        // **** Map Simulation **** /
        let that = this;
        this.map_simulation.alpha(1).restart();
        this.map_simulation
            .force("cluster", map_clustering)
            .force("collide", d3.forceCollide().radius(function(d){
                return 2; //scaleSize_map(d.Speakers)
            }))
            .alphaDecay(.01)
            .velocityDecay(.9)

        function map_clustering(alpha) {
            //console.log("DATA");
            for (let i = 0, n = that.data.length, map_node, map_cluster, k = alpha * 1; i < n; ++i) {
                map_node = that.data[i];
                map_cluster = map_clusters[map_node.index];
                if(map_cluster){
                    //console.log(map_cluster);
                    map_node.vx -= (map_node.x - map_cluster.x) * k;
                    map_node.vy -= (map_node.y - map_cluster.y) * k;
                }
            }
        }
    }

    GetBubbleTranslation(d){
        let radius = 2;
        let degree = 15/3.14;
        let modulus = 4;

        let newX = radius^(d.LanguageIndex%modulus) * Math.cos(degree*d.LanguageIndex)*8;
        let newY = radius^(d.LanguageIndex%modulus) * Math.sin(degree*d.LanguageIndex)*8;

        return [newX, newY];
    }

    /*
        Calculate center of states. This isn't used in real time,
        as it takes too long, but it was used to calculate the
        centers of the states that are saved in StateInfo.
    */
    getStateLocation(stateName, valType){
        let state = StateInfo.find(d=>d.name == stateName);
        let stateId = "#"+state.postal_code;
        let stateGroup = d3.selectAll(stateId)._groups[0][0];

        //https://stackoverflow.com/questions/40268326/find-center-of-svg-shape
        //https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getBBox
        let stateBounds = stateGroup.getBBox();
        let center = [stateBounds.width/2, stateBounds.height/2];

        if(center){
            if(valType == "x") return stateBounds.x + center[0];
            else if (valType == "y") return stateBounds.y + center[1];
        }
        return 500;
    }
}
