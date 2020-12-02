let selected_circle

class cluster {
    constructor(svg){
        this.svg = svg
        this.svg
            .append("g")
            .attr("id", "cluster")
            .style('opacity', 1)

        this.draw_circles()
        this.map_brush()
        this.attach_maplisteners()
        this.tooltip()
        this.toggle_tracker = false
        this.brush;

    } // End constructor call

    draw_circles(){
        nodes = d3.select("#cluster")
          .append("g")
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
        let tooltip = d3.select('#tooltip')
        //tooltip.attr('transform','translate(0, -300)')

        
        // --------------------------------------------
        // Tooltip for the cluster
        // --------------------------------------------  
        // Mouse over
        d3.selectAll('.cluster_circles')



            .on('mouseover.cluster', function(d){

                let x_pos = parseInt(d3.event.target.attributes['cx'].value) > 700 ? parseInt(d3.event.target.attributes['cx'].value) - 150 : parseInt(d3.event.target.attributes['cx'].value)
                let y_pos = parseInt(d3.event.target.attributes['cy'].value) > 600 ? parseInt(d3.event.target.attributes['cy'].value) - 200 : parseInt(d3.event.target.attributes['cy'].value)

				tooltip
					.style("top",y_pos + 'px')
					.style("left", x_pos + 'px')
					.style('visibility', 'visible')
					.html("<p style=font-size:20px>" + d.Group + "</p> \
						   <p>" + d.Subgroup + "</p> \
						   <p>" + d.Language + ": " + d.Speakers +"</p>"
					)
					
				selected_circle = this
				d3.select(this)
					.attr('stroke', 'black')   
					.attr('stroke-width', 2)
        }) // End mouseover listener

        // Mouse move
        d3.selectAll('.cluster_circles')

			.on('mousemove.cluster', () => {
                let x_pos = parseInt(d3.event.target.attributes['cx'].value) > 700 ? parseInt(d3.event.target.attributes['cx'].value) - 150 : parseInt(d3.event.target.attributes['cx'].value)
                let y_pos = parseInt(d3.event.target.attributes['cy'].value) > 600 ? parseInt(d3.event.target.attributes['cy'].value) - 200 : parseInt(d3.event.target.attributes['cy'].value)
                
				tooltip
                    .style("top",y_pos + 'px')
                    .style("left", x_pos + 'px')
			}) // End mousemove listener

        // Mouse out
		
        d3.selectAll('.cluster_circles')
			.on('mouseout.cluster', () => {
				tooltip.style('visibility', 'hidden')
                d3.event.target.attributes.stroke.value = null
			}) // End mouseout listener

    } // End of tooltip function

    attach_maplisteners(){
    // Controlling what circles show up when a state is selected
    let circle_click = d3.selectAll('.cluster_circles')
    let tooltip = d3.select('#tooltip')


    circle_click.on('click.cluster', function(d){
            updateOtherViews(d.Language, "brush");
        })
        /*// --------------------------------------------
        // Tooltip for the map circles
        // --------------------------------------------  
            d3.selectAll('.state_bubbles')
                .on('mouseover.map', function(d){

                    tooltip
                        .style("top", d3.event.target.attributes['cy'].value+ 'px')
                        .style("left", d3.event.target.attributes['cx'].value+ 'px')
                        .style('visibility', 'visible')
                        .html("<p style=font-size:20px>" + d.Group + "</p> \
                            <p>" + d.State + "</p> \
                            <p>" + d.Language + ": " + d.Speakers +"</p>"
                            )
                }) // End mouseover listener

            // Mouse move
            d3.selectAll('.state_bubbles')
            .on('mousemove.map', (d) => {
                tooltip
                .style("top", d3.event.target.attributes['cy'].value+ 'px')
                .style("left", d3.event.target.attributes['cx'].value+ 'px')
                // console.log(d.Language)
            }) // End mousemove listener

            // Mouse out
            d3.selectAll('.state_bubbles')
                .on('mouseout.map', () => {
                    tooltip.style('visibility', 'hidden')
            }) // End mouseout listener

        })      */
    } // End circle click function

    clearEventHandlers(){
        d3.selectAll('.cluster_circles').on('mousemove.cluster', null);
        d3.selectAll('.cluster_circles').on('mouseover.cluster', null);
        d3.selectAll('.cluster_circles').on('mouseout.cluster', null);
		
		d3.selectAll('cluster_circles').on('mousemove.map', null);
        d3.selectAll('cluster_circles').on('mouseover.map', null);
        d3.selectAll('cluster_circles').on('mouseout.map', null);
		
        d3.selectAll('cluster_circles').on('click.cluster', null);
    }

    map_brush(active){
        let that = this;
        let height = 200;
        let width = 900;
        let marginX = 280;
        let marginY = 250;

        if(!active){
            d3.selectAll(".brush").remove();
            d3.selectAll(".cluster_circles")
                .classed("regular", false);
        }
        else{
            const brushGroup = d3.select("#cluster").append("g")
                .classed("brush", true);

            //console.log(dataset_updated);
            const brush = d3.brush()
                .extent([[0,0], [width, height]])
                .on("start", function(){
                    nodes.classed("regular", false);
                    updateOtherViews([]);
                })
                .on("brush", function(){
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
                        if (selectedPoints.length > 0) {
                            nodes
                                .filter((d, i) => selectedPoints.includes(d.index))
                                .classed("regular", false);
                        }
                    }
                })
                .on("end", function(){
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
                        //Update Other Views here to not bog down brush
                        updateOtherViews(selectedPoints);
                        if (selectedPoints.length > 0) {
                            nodes
                                .filter((d, i) => selectedPoints.includes(d.index))
                                .classed("regular", false);
                        }
                    }
                });
            this.brush = brush;
            brushGroup.call(this.brush);
        }
    }
} //End class

