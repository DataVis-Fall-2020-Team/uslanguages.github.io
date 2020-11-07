// TO DO 
//      Add color
//      Get better at using the force layout

class cluster {

    constructor(data){
        this.data = data
    }

    draw_circles(){

        for (let i of this.data){
            i.x = Math.random()
            i.y = Math.random()
        }
        // Add the simulation
        let simulation = d3.forceSimulation(this.data)
        // .force('charge', d3.forceManyBody().strength(.5))
        .force('center', d3.forceCenter(200/2, 200/ 2))
        .force('collision', d3.forceCollide().radius(function(d){
            return 3
        }) )
        .on('tick', ticked);

        d3.select('body').append('svg')
            .attr('width',1000)
            .attr('height',1000)
            .attr('id', 'svg_circles')
        let node = d3.select('#svg_circles').selectAll('circle')
            .data(this.data)
            .join('circle')
            .attr('r',10)
            .attr('fill', d => d.Group)

        // Draw the circles
        function ticked() {
            node.attr('cx', d => d.x * 6);
            node.attr('cy', d => d.y * 6);
        }

    } // end of draw circles function



} // end cluster class