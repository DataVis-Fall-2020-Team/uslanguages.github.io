class cluster {
    constructor(svg){
        this.svg = svg
        
        

        this.svg
            .append("g")
            .attr("id", "cluster")
            .style('opacity', 1)


        this.draw_circles() 
        this.tooltip() 

    } // End constructor call

    draw_circles(){
        nodes = d3.select("#cluster")
          .selectAll('circle')
          .data(dataset[1])
          .join('circle')
          .attr('r',d => scaleSize(d.Speakers))
          .attr('fill',d => colorScale(d.Group))
          .style('opacity', 0.8)
          .classed('cluster_circles', true)
    }

    tooltip() {
        
        // Create tooltip    
        let tooltip = d3.select('#tooltip-bar2')

        // Mouse over
        d3.selectAll('circle')
            .on('mouseover.cluster', function(d){
                console.log("mouseover in cluster")
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
        d3.selectAll('circle')
        .on('mousemove.cluster', () => {
            tooltip
            .style("top", d3.event.pageY -10 + 'px')
            .style("left", d3.event.pageX -300 + 'px')
        }) // End mousemove listener

        // Mouse out
        d3.selectAll('circle').on('mouseout.cluster', () => {
            tooltip.style('visibility', 'hidden')
        }) // End mouseout listener

    } // End of tooltip function

    clearEventHandlers(){
        d3.selectAll('circle').on('mousemove.cluster', null);
        d3.selectAll('circle').on('mouseover.cluster', null);
        d3.selectAll('circle').on('mouseout.cluster', null);
    }

} // End cluster class