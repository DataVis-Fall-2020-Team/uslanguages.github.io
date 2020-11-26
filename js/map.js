let StateInfo = [
    {
        name:"Hawaii",
        center:[331.911, 567.387] //original center: [289.911, 546.387],
	},
	{
	    name: "Alaska",
        center:[115.548, 484.984] //original center: [110.548, 510.984],
	},
	{
	    name:"Florida",
        center: [762.812, 485.401] //original center: [722.812, 505.401],
	},
	{
	    name: "New Hampshire",
        center:[865.846, 127.021] //original center: [868.846, 122.021],
	},
	{
	    name:"Michigan",
        center:[657.837, 168.537] //Original Center: [632.837, 143.537],
	},
	{
	    name:"Vermont",
        center:[846.906, 126.772]
	},
	{
	    name:"Maine",
        center:[890.337, 85.265]  //original center: [895.337, 88.265],
	},
    {
        name:"Rhode Island",
        center:[877.601, 170.494]
    },
    {
        name:"New York",
        center:[809.729, 154.751]
        },
    {
        name:"Pennsylvania",
        center:[785.098, 209.203]
    },
    {
        name:"New Jersey",
        center:[836.423, 215.782]
    },
    {
        name:"Delaware",
        center:[830.352, 239.108]
    },
    {
        name:"Maryland",
        center:[810.702, 237.322] //original center: [800.702, 247.322],
    },
    {
        name:"Virginia",
        center:[785.713, 284.294] //original center: [770.713, 279.294],
    },
    {
        name:"West Virginia",
        center:[742.922, 271.184] //original center: [752.922, 261.184],
    },
    {
        name:"Ohio",
        center:[702.439, 234.482]
     },
    {
        name:"Indiana",
        center:[645.523, 254.627]
     },
    {
        name:"Illinois",
        center:[591.947, 259.189]
    },
    {
        name:"Connecticut",
        center:[859.256, 178.603]
     },
    {
        name:"Wisconsin",
        center:[576.466, 151.859]
     },
    {
        name:"North Carolina",
        center:[770.255, 328.158]
    },
    {
        name:"District of Columbia",
        center:[799.894, 250.577] //original center: [804.894, 248.577],
     },
    {
        name:"Massachusetts",
        center:[864.017, 157.664] //original center: [874.017, 158.644],
    },
    {
        name:"Tennessee",
        center:[659.663, 337.782]
     },
    {
        name:"Arkansas",
        center:[551.327, 369.690]
    },
    {
        name:"Missouri",
        center:[545.071, 293.211]
     },
    {
        name:"Georgia",
        center:[718.981, 399.656]
    },
    {
        name:"South Carolina",
        center:[755.853, 375.702]
    },
    {
        name:"Kentucky",
        center:[661.591, 298.384]
     },
    {
        name:"Alabama",
        center:[659.505, 409.437]
    },
    {
        name:"Louisiana",
        center:[551.886, 449.477] //Original Center: [571.886, 449.477],
      },
    {
        name:"Mississippi",
        center:[600.787, 412.370]
     },
    {
        name:"Iowa",
        center:[525.556, 213.824]
     },
    {
        name:"Minnesota",
        center:[507.431, 116.889] //original center: [523.431, 116.889],
     },
    {
        name:"Oklahoma",
        center:[457.603, 359.267] //original center: [437.603, 359.267],
     },
    {
        name:"Texas",
        center:[419.099, 437.545] //original center: [409.099, 447.545],
      },
    {
        name:"New Mexico",
        center:[302.917, 369.994]
      },
    {
        name:"Kansas",
        center:[443.933, 290.401]
     },
    {
        name:"Nebraska",
        center:[423.970, 223.233]
    },
    {
        name:"South Dakota",
        center:[417.283, 164.198]
     },
    {
        name:"North Dakota",
        center:[418.804, 90.965]
    },
    {
        name:"Wyoming",
        center:[299.963, 180.840]
    },
    {
        name:"Montana",
        center:[280.629, 87.084]
     },
    {
        name:"Colorado",
        center:[322.134, 271.480]
     },
    {
        name:"Idaho",
        center:[200.151, 151.528] //Original Center: [200.151, 111.528],

    },
    {
        name:"Utah",
        center:[223.747, 247.898]
    },
    {
        name:"Arizona",
        center:[200.731, 363.678]
     },
    {
        name:"Nevada",
        center:[140.352, 231.339] //original center: [140.352, 251.339],
    },
    {
        name:"Oregon",
        center:[105.020, 117.957]
    },
    {
        name:"Washington",
        center:[124.881, 49.738]
     },
    {
        name:"California",
        center:[71.416, 265.706] //original center: [91.416, 265.706],
    },
    {
        name:"Puerto Rico",
        center:[585.700, 536.250] //original center: [595.700, 536.250],
    }
];

class US_Map{
    // Creates a US_Map object showing language distribution
    constructor(data, json, svg){
        //console.log(data); //355 languages, 51 states/territories
        //Get and Modify Data
        this.data=data;
        this.stateData = json; //data[1];

        //Add centers and languages per state to the data
        let that = this;
        this.mapData = this.data.map((d,i)=>{
            d.StateCenter = StateInfo.find(a=>a.name==d.State).center,
            d.StateLanguages = that.getLanguagesPerState(d.State),
            d.LanguageIndex = that.getLanguageIndexPerState(d.State, d.Language);
            return d;
        });

        // https://appdividend.com/2019/04/11/how-to-get-distinct-values-from-array-in-javascript/
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
        let uniqueLanguages = new Set(d3.map(this.mapData, d=>d.Language));
        this.AllLanguages = Array.from(uniqueLanguages);

        this.svg=svg.append("g").attr("id", "us_map");

        this.drawStates();
        this.drawBubbles("none");//["Cajun","French"]);
        this.tooltip();
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
            .translate([1000/2-75,400]) // this centers the map in the SVG element
            .scale([1150]); // this specifies how much to zoom

        path = d3.geoPath()
            .projection(projection);

        this.stateMap = this.svg.append("g")
            .attr("id", "map_states");

        console.log(this.stateData.features);
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
            .attr("transform", "translate(-65,85)")
            .classed("states", true);
    }

    updateStateOpacity(opacity){
        this.stateMap.style("opacity", opacity);
    }

    //Draws the language bubbles
    drawBubbles(languages){
        // Filter Data based on selected language(s)
        if(languages == "all"){
            languages=this.AllLanguages; //["English", "Spanish", "French Creole"];
        }
        else if(languages == "none"){
            languages="";
        }

        let dataF = this.mapData.filter(d=>languages.includes(d.Language));
        if(this.svg.select("#map_circles").empty()){
            this.svg.append("g")
                .attr("id", "map_circles");
        }

        // Draw Bubbles
        let bubbleGroup = this.svg.select("#map_circles");

        let mapBubbles = bubbleGroup.selectAll("circle")
            .data(dataF)
            .join("circle")
            .attr("fill", d=>colorScale(d.Group))
            .attr("stroke", "black")
            .attr("r", d=>scaleSize_map(d.Speakers))
            .attr("cx", d=>scaleCentersX_map(d.StateCenter[0]))
            .attr("cy", d=>scaleCentersY_map(d.StateCenter[1]))
            .attr("transform", "translate(0,140)")
            .classed("state_bubbles", true);
    }

    tooltip() {

        // Create tooltip
        let tooltip = d3.select('#tooltip-bar2')

        // Mouse over
        d3.selectAll('.state_bubbles').on('mouseover', function(d){
            console.log("mouseover in map")
            tooltip
                .style('visibility', 'visible')
                .style("top", d3.event.target.attributes['cy'].value+ 'px')
                .style("left", d3.event.target.attributes['cx'].value+ 'px')

                .html("<p style=font-size:20px>" + d.Group + "</p> \
                       <p>" + d.Subgroup + "</p> \
                       <p>" + d.Language + ": " + d.Speakers +"</p>"
                )

        }) // End mouseover listener

        // Mouse move
        d3.selectAll('.state_bubbles')
        .on('mousemove', () => {
            tooltip
                .style("top", d3.event.target.attributes['cy'].value+ 'px')
                .style("left", d3.event.target.attributes['cx'].value+ 'px')
        }) // End mousemove listener

        // Mouse out
        d3.selectAll('.state_bubbles').on('mouseout', () => {
            tooltip.style('visibility', 'hidden')
        }) // End mouseout listener
    }

    clearEventHandlers(){
        d3.selectAll('.state_bubbles').on('mousemove', null);
        d3.selectAll('.state_bubbles').on('mouseover', null);
        d3.selectAll('.state_bubbles').on('mouseout', null);
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

    GetBubbleTranslation(d){
        let radius = 2;
        let degree = 20/3.14;
        let modulus = 4;

        let newX = radius^(d.LanguageIndex%modulus) * Math.cos(degree*d.LanguageIndex)*10;
        let newY = radius^(d.LanguageIndex%modulus) * Math.sin(degree*d.LanguageIndex)*10;

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
