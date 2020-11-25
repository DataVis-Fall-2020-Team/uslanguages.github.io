async function usMap(){

    let width = 1000
    let height = 500
    let projection = d3.geoAlbersUsa()
    .translate([width / 2, height / 1.5]) // this centers the map in our SVG element
    .scale([1200]); // this specifies how much to zoom

let path = d3.geoPath()
.projection(projection);

let json = await d3.json("data/us-states.json");

let map = d3.select('.us_map').append('svg').attr('height', height).attr('width',width).attr('id','map').style('opacity',0);

// Bind data and create one path per GeoJSON feature
map.selectAll("path")
    .data(json.features)
    .join("path")
    // here we use the familiar d attribute again to define the path
    .attr("d", path)
    .attr('fill', '#d9d9d9')
    .attr('stroke', 'gray')
    .classed('map_paths', true)

}

usMap()

class US_Map {
    constructor(data){
        this.data = data
    }
}