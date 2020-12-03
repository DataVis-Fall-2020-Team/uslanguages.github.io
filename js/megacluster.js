let selected_circle // This is here to add a stroke line to circles later on

    /*
    * Class that creates the first view of the clustered circles, as well as the circles on the top of the 
    * visualiation for the second view
    */
class cluster {

     /**
     * @param {element} svg - svg defined in the script file
     */
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

    /**
     * This function draws the circles for the view
     */
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

    /**
     * This function creates the tooltip containing national language data for the circles 
     */
    tooltip() {
        
        // Create tooltip    
        let tooltip = d3.select('#tooltip')

        // --------------------------------------------
        // Tooltip for the cluster
        // --------------------------------------------  

        // Mouse over

        // Capitalize first letter code taken from: https://stackoverflow.com/questions/1026069/how-do-i-make-the-first-letter-of-a-string-uppercase-in-javascript
        function capitalizeFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
          }
          
          console.log(capitalizeFirstLetter('foo'));
        d3.selectAll('.cluster_circles')
            .on('mouseover.cluster', function(d){
                let x_pos = parseInt(d3.event.target.attributes['cx'].value) > 700 ? parseInt(d3.event.target.attributes['cx'].value) - 150 : parseInt(d3.event.target.attributes['cx'].value)
                let y_pos = parseInt(d3.event.target.attributes['cy'].value) > 400 ? parseInt(d3.event.target.attributes['cy'].value) - 300 : parseInt(d3.event.target.attributes['cy'].value)

				tooltip
					.style("top",y_pos + 'px')
					.style("left", x_pos + 'px')
					.style('visibility', 'visible')
                    .html("<h2>" + d.Language + "</h2>" +
                            "</br><strong>Language Group: </strong>" + capitalizeFirstLetter(d.Group.toLowerCase()) + 
                            "</br><strong>Subgroup: </strong>" + d.Subgroup + 
                            "</br><strong> Number of Speakers: </strong>" + numberWithCommas(d.Speakers)
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
                let y_pos = parseInt(d3.event.target.attributes['cy'].value) > 400 ? parseInt(d3.event.target.attributes['cy'].value) - 300 : parseInt(d3.event.target.attributes['cy'].value)
                
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

    /**
     * This function adds listeners for the circles on the map (2nd view)
     */
    attach_maplisteners(){

    // Controlling what circles show up when a state is selected
    let circle_click = d3.selectAll('.cluster_circles')
    circle_click.on('click.cluster', function(d){
            if (mapview){
            updateOtherViews(d.Language, "brush");
            }
        })
    } // End circle click function

    /**
     * This function clears event listeners 
     */
    clearEventHandlers(){
        d3.selectAll('.cluster_circles').on('mousemove.cluster', null);
        d3.selectAll('.cluster_circles').on('mouseover.cluster', null);
        d3.selectAll('.cluster_circles').on('mouseout.cluster', null);
		
        d3.selectAll('cluster_circles').on('click.cluster', null);
    }

    /**
     * @param {boolean} active - Removes brush and class names if set to false
     * This function clears event listeners 
     */
    map_brush(active){
        let that = this;
        let height = 200;
        let width = 900;
        let marginX = 0;
        let marginY = 0;

        if(!active){
            d3.selectAll(".brush").remove();
            d3.selectAll(".cluster_circles")
                .classed("regular", false);
        }
        else{
            const brushGroup = d3.select("#cluster").append("g")
                .classed("brush", true);

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

