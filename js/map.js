//TODO: Maybe: add some storytelling?
//TODO: Javascript Style Guides (clean up code)
//TODO: write mini blurb 20-25 seconds/section

class US_Map{
    // Creates a US_Map object showing language distribution
    constructor(data, svg){
        //Get and Modify Data
        this.data=data[0];
        this.stateData = data[1]; // map_data - this is the U.S. states json file
        this.stateCenters=data[2]; // map_center_data - this is a json file with state center locations
        this.lines=[[785, 705, 260, 225],[805, 753, 260, 200],[804,894,285,225],[814,858,298,289],[797,895,303,346],
                    [777,827,340,360],[770,882,370,427],[750,810,370,430],[744,815,376,508]];
        this.lineStates = ["Vermont", "New Hampshire", "Massachusetts", "Rhode Island", "Connecticut",
            "New Jersey", "Delaware", "Maryland", "District of Columbia"]

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
        MapData = this.mapData

        // https://appdividend.com/2019/04/11/how-to-get-distinct-values-from-array-in-javascript/
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
        let uniqueLanguages = new Set(d3.map(this.mapData, d=>d.Language));
        this.AllLanguages = Array.from(uniqueLanguages);

        this.svg=svg.append("g").attr("id", "us_map");

        this.drawStates();
        this.drawBubbles("none"); // Input a list of languages to view
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
        /*.translate([1000/2-75,400]) // this centers the map in the SVG element
        .scale([1150]); // this specifies how much to zoom*/

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
        //Prepare Vis for Drawing
        if(this.svg.select("#map_circles").empty()){
            this.svg.append("g")
                .attr("id", "map_circles");
        }
        let bubbleGroup = this.svg.select("#map_circles");

        // Filter Data based on selected language(s)
        if(languages == "all"){
            languages=this.AllLanguages;
        }
        else if(languages == "none"){
            languages="";
        }

        //get individual language info
        dataset0_updated = this.mapData.filter(d=>languages.includes(d.Language));

        if(dataset0_updated.length == 0){
            //Clear out all bubbles and lines
            //This removes whatever bug is in the code that makes the
            //  program freak out about no circle cx's and cy's.
            bubbleGroup.selectAll("circle")
                .data(d=>[])
                .join("circle");

            d3.select("#lines_group").selectAll("line")
                .data(d=>[])
                .join("line")
            return;
        }

        // Turn off flag for resizing bubbles if there's only one language
        if(languages.length==1 || toggle_object.node().checked){
            map_circles_same = false;
        }
        else{
            map_circles_same = true;
        }

        //Draw bubbles based on whether they're merged or not
        if(!toggle_object.node().checked){
            //Draw bubbles based on updated dataset
            let mapBubbles = bubbleGroup.selectAll("circle")
                .data(dataset0_updated)
                .join("circle")
                .attr("fill", d=>colorScale(d.Group))
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .style("opacity", 0.8)
                .attr("r", d=>{
                    if(map_circles_same){
                        return 2;
                    }
                    else{
                        return scale_singleselect_bubble(d.Speakers, dataset0_updated);
                    }
                })
                .attr("cx", d=>d.StateCenter[0])
                .attr("cy", d=>d.StateCenter[1])
                .attr("class", d=>d.Language.replaceAll(" ",'_')
                    .replaceAll(",", "")
                    .replaceAll("'", "-")
                    .toLowerCase())
                .classed("state_bubbles", true);

        }
        else{
            /////////////////////////////////////////////////////////////////////////////////////////////////////
            // Consolidate number of speakers so there is 1 bubble per state on multi-select
            /////////////////////////////////////////////////////////////////////////////////////////////////////

            // Create a list of all of the states
            let uniqueStates = new Set(d3.map(this.mapData, d=>d.State));

            // Create empty array for new values
            let state_list = []
            let group_list = []

            // Create new state list with objects
            uniqueStates.forEach((state) => {
                // Filter out undefined values (aka states that are undefined)
                // https://www.techiedelight.com/remove-falsy-values-from-an-array-in-javascript/
                if(state != undefined){
                    state_list.push({State: state, Speakers_Total: 0, StateCenter: [0,0], Group: ""})
                }
            })

            // Consolidate number of speakers so there is one bubble per state
            if (dataset0_updated.length > 0){
                state_list.forEach((g) => {
                    dataset0_updated.forEach((d) => {
                        if (d.State === g.State){
                            g.Speakers_Total += d.Speakers // Add up the speakers
                            g.StateCenter[0] = d.StateCenter[0] // Add state center coordinate
                            g.StateCenter[1] = d.StateCenter[1] // Add state center coordinate
                            g.Group = d.Group
                            group_list.push(d.Group)
                        }
                    })
                })
            }

            // Count the number of groups. If group_ct > 1, then change the color of the circles
            let group_ct
            group_ct = new Set(group_list)
            group_ct = group_ct.size

            // Create an array of all the speaker counts
            map_speaker_total =  state_list.map(d => d.Speakers_Total)

            let mapBubbles = bubbleGroup.selectAll("circle")
                .data(state_list)
                .join("circle")
                .attr("fill", d=> {
                    if (group_ct > 1){
                        return 'rgb(220,220,220)'
                    }
                    else {
                        return colorScale(d.Group)
                    }
                })
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .style("opacity", d => {
                    if (group_ct == 0){
                        return 0
                    }
                    else {
                        return 1
                    }
                })
                .attr("r", d=>scale_multiselect_bubble(d.Speakers_Total))
                .attr("cx", d=>d.StateCenter[0])
                .attr("cy", d=>d.StateCenter[1])
                .attr("transform", "translate(0,140)")
                .attr("class", "") // Clear out all the classes
                .classed("state_bubbles", true);

            console.log(mapBubbles);
        }

         //Draw lines for smaller states to organize bubbles to
        let linesGroup = d3.select("#lines_group");
        if(languages.length > 0){
            let linePoints = [];
            let j = 0;
            for(let i = 0; i<this.lines.length; i++){
                if(dataset0_updated.find(d=>this.lineStates[i] == d.State)){
                    linePoints[j] = this.lines[i];
                    j++;
                }
            }

            if(linePoints.length > 0){
                linesGroup.selectAll("line")
                    .data(linePoints)
                    .join("line")
                    .attr("x1", d=>d[0]+20)
                    .attr("x2", d=>d[1]+20)
                    .attr("y1", d=>d[2])
                    .attr("y2", d=>d[3])
                    .classed("state_lines");
            }
        }
        else{
            linesGroup.selectAll("line")
                .data(d=>[])
                .join("line");
        }

        //Has to always be created after bubbles are created
        this.attachEventHandlers();
        if(!toggle_object.node().checked){
            clusterMapBubbles();
        }

        if(map_circles_same && dataset0_updated.length > 1){
            let infoBox = d3.select('#LanguageInfo');
            let htmlText = "<p>Hover over the bubbles to compare languages in each states!</p>";
            infoBox.html(htmlText);
        }
    }

    /* Create Event Handlers and make language of circles grow */
    attachEventHandlers() {
        let that = this;

        // Create info box in side panel
        let infoBox = d3.select('#LanguageInfo')

        // Mouse over
        d3.selectAll('.state_bubbles').on('mouseover.map', function(d){
            if(!toggle_object.node().checked && map_circles_same){
                // Grow Circle
                let hovered_class = d.Language.replaceAll(" ",'_')
                    .replaceAll(",", "")
                    .replaceAll("'", "-")
                    .toLowerCase();

                let selection = d3.map(that.data.filter(e=>e.Language == d.Language), e=>e.Speakers);
                let min = d3.min(selection);
                let max = d3.max(selection);

                d3.selectAll(".state_bubbles")
                    .attr("r", 2);

                let circles = d3.selectAll("."+hovered_class)
                    .attr("r", function(c){
                        return scaleSelection_map(c.Speakers, min, max);
                    })
                    .style("opacity", 1);

                // Bring language circles to front
                circles.raise();
            }

            // Print Info to Side-Panel
            let htmlText = "<p style=font-size:20px><b>Language:</b> " + (d.Language ? d.Language : "Multiple")
                            + "</p><p><b>Sub-group:</b> " + (d.Subgroup ? d.Subgroup : "Multiple")
                            + "</p><p style=text-transform:capitalize><b>Group:</b> "
                            + (d.Group ? d.Group.toLowerCase() : "Multiple") + "</p>";

            if(!map_circles_same){
                htmlText += "<p><b>Number of Speakers:</b> " + (d.Speakers ? numberWithCommas(d.Speakers) : numberWithCommas(d.Speakers_Total)) +"</p>";
            }

            d3.select(this)
                    .attr("stroke", "black")
                    .attr("stroke-width", 3);

            let color = d3.select(this).attr("fill");
            d3.select("#LanguageInfo")
                .style("border-color", color)
                //.style("background-color", color)
                //.style("opacity", 0.5)
                .classed("notice", true);

            infoBox.html(htmlText);
            console.log(d);

        }) // End mouseover listener

        // Mouse out
        d3.selectAll('.state_bubbles').on('mouseout.map', () => {
            infoBox.html("");
            if(map_circles_same){
                d3.selectAll(".state_bubbles")
                    .attr("r", 2)
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)
                    .style("opacity", .8);
            }
            else{
                d3.selectAll(".state_bubbles")
                    .attr("stroke", "black")
                    .attr("stroke-width", 1);
            }

            d3.select("#LanguageInfo")
                .classed("notice", false);
        }) // End mouseout listener
    }

    clearEventHandlers(){
        d3.selectAll('.state_bubbles').on('mouseover.map', null);
        d3.selectAll('.state_bubbles').on('mouseout.map', null);
    }

    updateView(selectedPoints){
        //get languages from points
       if(selectedPoints.length > 0){
            if(!Number.isInteger(selectedPoints[0])){
                if(selectedPoints[0].length > 1){
                    // The Toggle Switch changed
                    this.drawBubbles(selectedPoints);
                }
                else{
                    // This is a click-select input
                    this.drawBubbles([selectedPoints]);
                }
            }
            else{
                // This is a brush-select input
                let selectedData = dataset_updated.filter((d,i)=>selectedPoints.includes(i));
                let languages = [... new Set(selectedData.map(d=>d.Language))];
                this.drawBubbles(languages);
            }
        }
        else{
            this.drawBubbles("none");
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