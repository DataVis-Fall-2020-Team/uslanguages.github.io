class US_Map {
    constructor(data, json){
        this.data = data
        this.json = json

    this.draw_map()
    }
    
    draw_map(){
    projection = d3.geoAlbersUsa()
    .translate([1000 / 2, 500]) // this centers the map in our SVG element
    .scale([1200]); // this specifies how much to zoom

    path = d3.geoPath()
    .projection(projection);

    let map = d3.select('#vis').select('svg').append('g').attr('id','map')
    .style('opacity',0);

    // Bind data and create one path per GeoJSON feature
    map.selectAll("path")
        .data(this.json.features)
        .join("path")
        // here we use the familiar d attribute again to define the path
        .attr("d", path)
        .attr('fill', '#d9d9d9')
        .attr('stroke', 'gray')
        .classed('map_paths', true)
// ======================================= Rachel's Code =====================================
//     //Draws the language bubbles
//     drawBubbles(languages){
//         // Filter Data based on selected language(s)
//         if(languages == "all"){
//             languages=this.AllLanguages; //["English", "Spanish", "French Creole"];
//         }
//         else if(languages == "none"){
//             languages="";
//         }

//         let dataF = this.mapData.filter(d=>languages.includes(d.Language));

//         let stateMap = this.svg.append("g")
//             .attr("id", "map_circles");

//         let mapBubbles = stateMap.selectAll("circle")
//             .data(dataF)
//             .join("circle")
//             .attr("fill", d=>colorScale(d.Group))
//             .attr("stroke", "black")
//             .attr("r", d=>scaleSize_map(d.Speakers))
//             .attr("cx", d=>d.StateCenter[0])
//             .attr("cy", d=>d.StateCenter[1])
//             .attr("transform", "translate(0,140)")
//             .attr("class", d=>d.StateId)
//             .classed("state_bubbles", true);
//     }

//     tooltip() {

//         // Create tooltip
//         let tooltip = d3.select('#tooltip-bar2')

//         // Mouse over
//         d3.selectAll('.state_bubbles').on('mouseover', function(d){
//             console.log("mouseover in map")
//             tooltip
//                 .style('visibility', 'visible')
//                 .style("top", d3.event.pageY -10 + 'px')
//                 .style("left", d3.event.pageX + 25 + 'px')

//                 .html("<p style=font-size:20px>" + d.Group + "</p> \
//                        <p>" + d.Subgroup + "</p> \
//                        <p>" + d.Language + ": " + d.Speakers +"</p>"
//                 )

//         }) // End mouseover listener

//         // Mouse move
//         d3.selectAll('.state_bubbles')
//         .on('mousemove', () => {
//             tooltip
//             .style("top", d3.event.pageY -10 + 'px')
//             .style("left", d3.event.pageX -300 + 'px')
//         }) // End mousemove listener

//         // Mouse out
//         d3.selectAll('.state_bubbles').on('mouseout', () => {
//             tooltip.style('visibility', 'hidden')
//         }) // End mouseout listener
//     }

//     clearEventHandlers(){
//         d3.selectAll('.state_bubbles').on('mousemove', null);
//         d3.selectAll('.state_bubbles').on('mouseover', null);
//         d3.selectAll('.state_bubbles').on('mouseout', null);
//     }

//     updateView(selectedPoints){
//         //get languages from points
//         if(selectedPoints.length > 0){
//             let selectedData = dataset_updated.filter((d,i)=>selectedPoints.includes(i));
//             let languages = [... new Set(selectedData.map(d=>d.Language))];
//             this.drawBubbles(languages);
//         }
//         else{
//             //doesn't work...Why?
//             this.drawBubbles("none");
//         }
//     }

//     GetBubbleTranslation(d){
//         let radius = 2;
//         let degree = 20/3.14;
//         let modulus = 4;

//         let newX = radius^(d.LanguageIndex%modulus) * Math.cos(degree*d.LanguageIndex)*10;
//         let newY = radius^(d.LanguageIndex%modulus) * Math.sin(degree*d.LanguageIndex)*10;

//         return [newX, newY];
//     }

//     /*
//         Calculate center of states. This isn't used in real time,
//         as it takes too long, but it was used to calculate the
//         centers of the states that are saved in StateInfo.
//     */
//     getStateLocation(stateName, valType){
//         let state = StateInfo.find(d=>d.name == stateName);
//         let stateId = "#"+state.postal_code;
//         let stateGroup = d3.selectAll(stateId)._groups[0][0];

//         //https://stackoverflow.com/questions/40268326/find-center-of-svg-shape
//         //https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getBBox
//         let stateBounds = stateGroup.getBBox();
//         let center = [stateBounds.width/2, stateBounds.height/2];

//         if(center){
//             if(valType == "x") return stateBounds.x + center[0];
//             else if (valType == "y") return stateBounds.y + center[1];
//         }
//         return 500;
// ======================================= Rachel's Code =====================================
    }
    // clearEventHandlers(){
    //     d3.selectAll('circle').on('mousemove.cluster', null);
    //     d3.selectAll('circle').on('mouseover.cluster', null);
    //     d3.selectAll('circle').on('mouseout.cluster', null);
    // }

}