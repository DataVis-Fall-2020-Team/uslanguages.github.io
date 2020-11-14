class cluster {
    constructor(svg){
        this.svg = svg
        
        this.draw_circles() 
        this.tooltip() 
    } // End constructor call

    draw_circles(){
        nodes = this.svg
          .selectAll('circle')
          .data(dataset[1])
          .join('circle')
          .attr('r',d => scaleSize(d.Speakers))
          .attr('fill',d => colorScale(d.Group))
          .attr('opacity', 0.8)
    }

    tooltip() {
        
        // Create tooltip    
        let tooltip = d3.select('#vis').append('div') 
                        .attr('id','tooltip')
                        .style('visibility', 'hidden')

        // Mouse over
        d3.selectAll('circle').on('mouseover.cluster', function(d){
            tooltip
            .style('visibility', 'visible')
            .style("top", d3.event.pageY -10 + 'px')
            .style("left", d3.event.pageX + 25 + 'px')
            
            .html("<p style=font-size:20px>" + d.Group + "</p> \
                   <p>" + d.Subgroup + "</p> \
                   <p>" + d.Language + ": " + d.Speakers +"</p>"
                   
            )    
                
        }) // End mouseover listener

        // Mouse move
        d3.selectAll('circle').on('mousemove.cluster', () => {
            tooltip
            .style("top", d3.event.pageY -10 + 'px')
            .style("left", d3.event.pageX -300 + 'px')
        }) // End mousemove listener

        // Mouse out
        d3.selectAll('circle').on('mouseout.cluster', () => {
            tooltip.style('visibility', 'hidden')
        }) // End mouseout listener

    } // End of tooltip function

} // End cluster class