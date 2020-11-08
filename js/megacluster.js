// TO DO 
//      x Add color 
//      x Scale the dot radii
//      Add tooltips
//      Get all dots in the view
//      Get better at using the force layout

class cluster {

    constructor(data){
        this.data = data

    // Adjust this.data

    this.data = this.data.filter(d => d.Group != 'Total')
    
    // Get distinct values, taken from: https://codeburst.io/javascript-array-distinct-5edc93501dc4
    const distinct = (value, index, self) => {
        return self.indexOf(value) === index;
    }
        
    this.categories = this.data.map(x => x.Group).filter(distinct);

    // Color scale
    this.colorScale = d3.scaleOrdinal() 
        .domain(this.categories)
        .range(d3.schemeCategory10.slice(0,5))

    this.scaleSize = d3.scaleSymlog() 
        .domain([1, 232000000])
        .range([1,20])
        .nice()
        
    //SVG params
    this.svg_height = 800
    this.svg_width = 800

    } // end constructor



    draw_circles(){
            
        // let data = this.data.filter(d => d.Group === 'English')
        // console.log(data)
        // console.log(data[0]['Number of speakers'])
        // console.log(parseFloat(data[0]['Number of speakers'].replace(/,/g, '')))

        // Add the simulation - taken from https://observablehq.com/@rocss/test
        d3.forceSimulation()
        .force("collide", d3.forceCollide(d => d.radius).iterations(2))
        .force("charge", d3.forceManyBody())
        // .velocityDecay(0.75)
        // .alphaDecay(0.006)
        .force("center", d3.forceCenter(this.svg_width / 2, this.svg_height / 2).strength(.5))
        .force("y", d3.forceY(0))
        .force("x", d3.forceX(0))
        .nodes(this.data)
        .on('tick', ticked);

        // Draw the svg 
        d3.select('body').append('svg')
            .attr('width',this.svg_width)
            .attr('height',this.svg_height)
            .attr('id', 'svg_circles')
            .attr('position','relative')
        // Draw the circles
        let node = d3.select('#svg_circles').selectAll('circle')
            .data(this.data)
            .join('circle')
            .attr('r',d => this.scaleSize(+(d['Number of speakers'].replace(/,/g, ''))))
            .attr('fill',d => this.colorScale(d.Group))
            .classed('circle', true)

        // Run the update location function
        function ticked() {
            node.attr('cx', d => d.x );
            node.attr('cy', d => d.y );
        }

        // Add tooltips
        this.tooltip()


    } // end of draw circles function


    tooltip() {
        
        // Create tooltip    
        let tooltip = d3.select('body').append('div') 
                        .attr('id','tooltip')
                        .style('visibility', 'hidden')

        // Mouse over
        d3.selectAll('.circle').on('mouseover', function(d){
            tooltip
            .style('visibility', 'visible')
            .style("top", d3.event.pageY -10 + 'px')
            .style("left", d3.event.pageX + 25 + 'px')
            
            .html("<p style=font-size:20px>" + d.Group + "</p> \
                   <p>" + d.Subgroup + "</p> \
                   <p>" + d.Language + ": " + d['Number of speakers'] +"</p>"
                   
            )    
                
        }) // End mouseover listener

        // Mouse move
        d3.selectAll('.circle').on('mousemove', () => {
            tooltip
            .style("top", d3.event.pageY -10 + 'px')
            .style("left", d3.event.pageX + 25 + 'px')
        }) // End mousemove listener

        // Mouse out
        d3.selectAll('.circle').on('mouseout', () => {
            tooltip.style('visibility', 'hidden')
        }) // End mouseout listener

    } // End of tooltip function

} // end cluster class