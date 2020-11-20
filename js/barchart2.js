/**
 * Class that renders the bar chart containing the percentage of speakers who speak English well.
 */
class BarChart2{

    /**
     * Creates a BarChart2 object
     * @param {array} data - array that contains the national language data
     */
    constructor(data, svg){
        
        this.tree = new Tree(data);
        this.svg = svg;
        this.direction = "down";
        console.log("Tree: ", this.tree);
        this.currentData = this.tree.treeSelectionToArray(this.tree.root, this.direction);

        this.margin = { top: 20, right: 50, bottom: 20, left: 10};
        this.width = 1000 - this.margin.right - this.margin.left;
        this.height = 750 - this.margin.top - this.margin.bottom;
        this.barWidth = {group: 100, subgroup: 30, language: 20, gap: 2};
            
        this.scale = d3.scaleLinear().domain([0, 1]).range([0, this.height]);
        
        this.currentLevel = "group";    
        this.drawChart();
        this.updateBarChart();
    }

    /**
     * Function that sets up the barchart
     */
    drawChart(){
        let chart = this.svg.append('g')
            .attr("id", "barchart2")
            .style('margin-left', '500px')
            .style('opacity', 0);

        d3.select("#vis")
            .append("div")
            .attr("id","tooltip-bar2");
        
        //draw axis
        let yScale = d3.scaleLinear().domain([0, 1]).range([this.height, 0]);

        let formatAsPercentage = d3.format(".0%");
        let axis = d3.axisLeft()
                    .scale(yScale)
                    .tickFormat(formatAsPercentage);
        d3.select("#barchart2").append("g")
            .attr("transform", "translate(40," + this.margin.top + ")")      
            .call(axis)
            .call(g => g.select(".domain").remove());
        
        //draw label
        d3.select("#barchart2").append("text")
            .attr("transform", "translate(300, 50)")
            .attr("y", 0)
            .attr("x",0)
            .style("text-anchor", "middle")
            .style("font-size", "1.1em")
            .text("Percentage of Speakers that Speak English 'Very Well'");  
    }      

    /**
     * Function that renders the barchart.  This function is called everytime
     * something changes with a mouseclick or doubleclick.
     */
    updateBarChart(){
        let that = this;

        //calculate x values for bars
        let x = this.margin.right;
        for (let d of this.currentData){
            d.x = x;
            x += this.getBarWidth(d) + this.barWidth["gap"];
        }
        
        d3.select("#barchart2").selectAll("rect")
            .data(this.currentData)
            .join("rect")
            .transition()
            .attr("x", d => d.x)
            .attr("y", d => this.height + this.margin.top - this.scale(d.percentage))
            .attr("width", d => this.getBarWidth(d))
            .attr("height", d => this.scale(d.percentage))
            .attr("id", d=>d.name.replace(/[\s,\)\(.]/g, ""))
            .attr('fill',function (d){
                if (d.level != that.currentLevel)
                        return "grey";
                else return colorScale(d.grouping) })
            .style("opacity", function(d){
                if (d.level != that.currentLevel)
                    return 0.2;
                else return 1.0});

        //These must be attached after every update so that each rect has an 
        //event handler attached to it
        this.attachMouseEventHandlers();
    }

    /**
     * Helper function that updates this.currentData after each click or doubleclick
     * @param {Node} selection - the Node that is currently selected by a click or doubleclick
     */
    updateData(selection){
        let node = selection.data()[0];
        let newData = this.tree.treeSelectionToArray(node, this.direction);
        this.currentLevel = newData[0].level;

        //going down the tree
        if (this.direction === "down"){
            if (node.level === "language")
                return;

            //expand node selected
            let selectedGroup = this.currentData.filter(obj => obj.grouping === node.grouping);
            let index = selectedGroup.indexOf(node);
            selectedGroup.splice(index, 1, ...newData);

            //consolidate nodes not selected
            this.currentData = this.tree.treeSelectionToArray(this.tree.root, "down");
            let selection = this.currentData.find(obj=>obj.grouping === node.grouping);
            index = this.currentData.indexOf(selection);
            this.currentData.splice(index, 1, ...selectedGroup);
        }

        //going up in the tree
        else {
            if (node.level === "group")
                return;
            
            //go back to the original top-level grouping
            if (node.level === "subgroup"){
                this.currentData = this.tree.treeSelectionToArray(this.tree.root, "down");
            }

            //consolidate node selected into subgroups
            else if (node.level === "language"){
                this.currentData = this.tree.treeSelectionToArray(this.tree.root, "down");
                let index = this.currentData.findIndex(
                    obj => obj.grouping === node.grouping);
                let expandedGroup = this.tree.treeSelectionToArray(this.currentData[index], "down");
                this.currentData.splice(index, 1, ...expandedGroup);
            }
        }
        
        this.updateBarChart();
    }

    /**
     * Updates the current level after a mouse click
     * @param {Node} node - the node selected by click or doubleclick
     */
    updateLevel(node){
        if (this.direction === "up"){
            switch(node.level){
                case "subgroup":
                    return "group";
                case "language":
                    return "subgroup";
            }
        }
        else{
            switch(node.level){
                case "group":
                    return "subgroup";
                case "subgroup":
                    return "language";
            }
        }
    }

    /**
     * Function that calculates the width of the bars.  The bar width is adjusted so
     * that all bars can fit in the screen.
     * @param {Node} node 
     */
    getBarWidth(node){
        
        let numGroups = this.currentData.filter(obj => obj.level === "group").length;
        let numSubgroups = this.currentData.filter(obj => obj.level === "subgroup").length; 
        let numLanguages = this.currentData.filter(obj => obj.level === "language").length; 

        let groupWidth = this.barWidth["group"];
        let subgroupWidth = this.barWidth["subgroup"];
        let languageWidth = this.barWidth["language"];

        //calculate language width first
        let barWidth = (this.width - (groupWidth + this.barWidth["gap"]) * numGroups  
            - (subgroupWidth + this.barWidth["gap"]) * numSubgroups) / numLanguages;
        console.log("barwidth: ", barWidth);
            
            while(barWidth < 5){
                console.log("Recalculating the other bar widths");
                groupWidth = groupWidth * 0.75;
                subgroupWidth = subgroupWidth * 0.75;
                barWidth = (this.width - (groupWidth +this.barWidth["gap"]) * numGroups  
                    - (subgroupWidth  + this.barWidth["gap"]) * numSubgroups) / numLanguages;
            }
            languageWidth = Math.min(barWidth, this.barWidth["language"]);
        
        //Next calculate subgroup width
        barWidth = (this.width - (groupWidth + this.barWidth["gap"]) * numGroups  
            - (languageWidth + this.barWidth["gap"]) * numLanguages) / numSubgroups;   
                
            while(barWidth < 10){
                groupWidth = groupWidth * 0.75;
                barWidth = (this.width - (groupWidth + this.barWidth["gap"]) * numGroups  
                    - (languageWidth + this.barWidth["gap"]) * numLanguages) / numSubgroups; 
            }
            subgroupWidth = Math.min(barWidth, this.barWidth["subgroup"]);
        
        //Lastly calculate the group width
        groupWidth = Math.min(groupWidth, this.barWidth["group"]);

        switch(node.level){
            case "group" :
                return groupWidth;
            case "subgroup":
                return subgroupWidth;
            case "language":
                return languageWidth;
        }
    }

    /**
     * Function that attaches the mouse event handlers for the tooltips and hovering
     */
    attachMouseEventHandlers(){
        let that = this;
        
        //https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
        function numberWithCommas(x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        d3.select("#barchart2").selectAll("rect")
            .on("mouseover", function(d) {
                console.log("mouseover in barchart2");
                d3.select(this).classed("hover", true);
                let level = d3.select(this).data()[0]["level"];
                let xCoord = parseInt(d3.select(this).attr("x")) + 20;
                let yCoord = parseInt(d3.select(this).attr("y")) - 50;
                if (yCoord > 650)
                    yCoord -= 100;
                d3.select("#tooltip-bar2")
                    .style("left", xCoord + "px")
                    .style("top", yCoord + "px")
                    .style('visibility', 'visible')
                    .style("opacity", function(){
                        if (level != that.currentLevel)
                            return 0.2;
                        else return 1.0})
                    .html(`<h2>${d.name}</h2> 
                        <strong>Percentage:</strong> ${d3.format(",.2r")(d.percentage * 100)}%
                        <br> <strong>Total Speakers:</strong> ${numberWithCommas(d.totalSpeakers)}`);
            })
            .on("mouseout", function(d) {
                d3.select(".hover").classed("hover", false)
                d3.select("#tooltip-bar2")
                    .style('visibility', 'hidden');
            });
    }

    /**
     * Function that attaches the click handlers for the click and doubleclick events
     */
    attachClickHandlers(){
        let that = this;
        function clickcancel() {
            event = d3.dispatch('click', 'dblclick');
            
            function cc(selection) {
                var down,
                tolerance = 5,
                last,
                wait = null;
                // euclidean distance
                function dist(a, b) {
                return Math.sqrt(Math.pow(a[0] - b[0], 2), Math.pow(a[1] - b[1], 2));
                }
                selection.on('mousedown', function() {
                down = d3.mouse(document.body);
                last = +new Date();
                });
                selection.on('mouseup', function() {
                if (dist(down, d3.mouse(document.body)) > tolerance) {
                    return;
                } else {
                    if (wait) {
                    window.clearTimeout(wait);
                    wait = null;
                    event.call('dblclick', d3.event);
                } else {
                    wait = window.setTimeout((function(e) {
                    return function() {
                        event.call('click', e);
                        wait = null;
                    };
                    })(d3.event), 300);
                    }
                }
            });
        };
        
            cc.on = function() {
                var value = event.on.apply(event, arguments);
                return value === event ? cc : value;
            };
        return cc;
        }
    
        var cc = clickcancel();
        d3.select("#barchart2").call(cc);
        //d3.select("#vis").select("svg").call(cc);

        cc.on('click', function(d, index) {
            that.direction = "down";
            d3.select("#tooltip-bar2")
                .style('visibility', 'hidden');
            let id = this.srcElement.id;
            let selection = d3.select("#" + id);
            that.updateData(selection);
        });

        cc.on('dblclick', function(d, index) {
            that.direction = "up";  
            d3.select("#tooltip-bar2")
                .style('visibility', 'hidden');
            let id = this.srcElement.id;
            let selection = d3.select("#" + id);
            that.updateData(selection);
        });
    }

    /**
     * Function that attaches all the event handlers for the barchart2
     */
    attachEventHandlers(){
        this.attachMouseEventHandlers();
        this.attachClickHandlers();
    }

    /**
     * Function that clears all the event handlers for the barchart2
     */
    clearEventHandlers(){
        d3.select("#barchart2").selectAll("rect")
            .on("mouseover", null) 
            .on("mouseout", null);
        
        let event = d3.dispatch('click', 'dblclick');
        event.on('click', null);
        event.on('dblclick', null);
   }   
}