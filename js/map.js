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
    }
// usMap()

}