class cluster {
    constructor(svg){
        this.svg = svg
        this.svg
            .append("g")
            .attr("id", "cluster")
            .style('opacity', 1)

        this.draw_circles()
        this.map_brush()
        this.tooltip()

    } // End constructor call

    draw_circles(){
        nodes = d3.select("#cluster").append("g")
          .attr('id','cluster_group')
          .selectAll('circle')
          .data(dataset_updated)
          .join('circle')
          .attr('r',d => scaleSize(d.Speakers))
          .attr('fill',d => colorScale(d.Group))
          .style('opacity', .8)
          .classed('cluster_circles', true)
    }

    tooltip() {
        
        // Create tooltip    
        let tooltip = d3.select('#tooltip-bar2')

        // Mouse over
        d3.selectAll('.cluster_circles')
            .on('mouseover', function(d){
                console.log("mouseover in cluster")
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
        d3.selectAll('.cluster_circles')
        .on('mousemove', () => {
            tooltip
            .style("top", d3.event.target.attributes['cy'].value+ 'px')
            .style("left", d3.event.target.attributes['cx'].value+ 'px')
        }) // End mousemove listener

        // Mouse out
        d3.selectAll('.cluster_circles').on('mouseout', () => {
            tooltip.style('visibility', 'hidden')
        }) // End mouseout listener

    } // End of tooltip function

    clearEventHandlers(){
        d3.selectAll('circle').on('mousemove.cluster', null);
        d3.selectAll('circle').on('mouseover.cluster', null);
        d3.selectAll('circle').on('mouseout.cluster', null);
    }

    map_brush(){
        let that = this;
        let height = 200;
        let width = 900;
        let marginX = 230;
        let marginY = 225;

        const brushGroup = d3.select("#cluster").append("g")
            .classed("brush", true);

        //console.log(dataset_updated);
        const brush = d3.brush()
            .extent([[0,0], [width, height]])
            .on("start", function(){
                nodes
                    .classed("regular", false);
            })
            .on("brush end", function(){
                const selection = d3.brushSelection(this);
                const selectedPoints = [];
                if(selection){
                    const [[left, top], [right, bottom]] = selection;
                    dataset_updated.forEach((d, i) => {
                        if (
                            d.x >= left-marginX &&
                            d.x <= right-marginX &&
                            d.y <= bottom-marginY &&
                            d.y >= top-marginY
                        ) {
                            selectedPoints.push(i);
                        }
                    });
                    nodes.classed("regular", true);
                    updateOtherViews(selectedPoints);
                    if (selectedPoints.length > 0) {
                        nodes
                            .filter((d, i) => selectedPoints.includes(d.index))
                            .classed("regular", false);
                    }
                }
            });
        brushGroup.call(brush);
    }
} // End cluster class
