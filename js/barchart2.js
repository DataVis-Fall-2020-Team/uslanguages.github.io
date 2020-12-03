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
        this.currentData = this.tree.treeSelectionToArray(this.tree.root, this.direction);

        this.margin = { top: 40, right: 50, bottom: 20, left: 10};
        this.width = 450 - this.margin.right - this.margin.left;
        this.height = 750 - this.margin.top - this.margin.bottom;
        this.barWidth = {group: 100, subgroup: 30, language: 20, gap: 2};
            
        this.scale = d3.scaleLinear().domain([0, 1]).range([0, this.height]);
        
        this.currentLevel = "group";  
        this.isSorted = false;  
        this.drawChart();
        this.updateBarChart();
    }

    /**
     * Function that sets up the barchart
     */
    drawChart(){
        let that = this;
        this.svg.attr("xmlns", "http://www.w3.org/2000/svg");
        let chart = this.svg.append('g')
            .attr("id", "barchart2")
            .style('margin-left', '500px')
            .style('opacity', 0);

        // d3.select("#vis")
        //     .append("div")
        //     .attr("id","tooltip");

        //setup grouping for rects
        d3.select("#barchart2").append("g")
            .attr("id", "bar-rects");
        
        //draw axis
        let yScale = d3.scaleLinear().domain([0, 1]).range([this.height, 0]);
        let formatAsPercentage = d3.format(".0%");
        let axis = d3.axisLeft()
                    .scale(yScale)
                    .tickFormat(formatAsPercentage);
        d3.select("#barchart2").append("g")
            .attr("transform", "translate(50," + this.margin.top + ")") 
            .attr("class", "yAxis")     
            .call(axis)
            .call(g => g.select(".domain").remove());
        
        //draw text labels
        d3.select("#barchart2").append("text")
            .attr("transform", "translate(375, 30)")
            .attr("y", 0)
            .attr("x",0)
            .style("text-anchor", "middle")
            .style("font-size", "1.4em")
            .text("Percentage of Speakers that Speak English 'Very Well'");  
        
        d3.select("#barchart2").append("text")
        .attr("transform", "translate(375, 60)")
        .attr("x", 0)
            .attr("y", 0)
            .attr("id", "levelLabel")
            .style("text-anchor", "middle")
            .style("font-size", "1.2em")
            .text("Level: Groups");
        
        //draw sort button
        d3.select("#barchart2").append("foreignObject")
            .attr("transform", "translate(650, 50)")
            .attr("width", 100)
            .attr("height", 50)
            .append('xhtml:div')
            .append('div')
            .html('<button id="sortButton" class="button">Sort</button>');
        
        //draw home button
        d3.select("#barchart2").append("foreignObject")
            .attr("transform", "translate(650, 110)")
            .attr("width", 100)
            .attr("height", 50)
            .append('xhtml:div')
            .append('div')
            .html('<button id="homeButton" class="button">Home</button>');
   }      

    /**
     * Function that renders the barchart.  This function is called everytime
     * something changes with a mouseclick or doubleclick.
     */
    updateBarChart(){
        let that = this;
        that.clearStorytelling();

        //calculate x values for bars
        let x = this.margin.right;
        for (let d of this.currentData){
            d.x = x;
            x += this.getBarWidth(d) + this.barWidth["gap"];
        }
        
        d3.select("#bar-rects").selectAll("rect")
            .data(this.currentData)
            .join("rect")
            .transition()
            .attr("x", d => d.x)
            .attr("y", d => this.height + this.margin.top - this.scale(d.percentage))
            .attr("width", d => this.getBarWidth(d))
            .attr("height", d => this.scale(d.percentage))
            .attr("id", d=>(d.name + d.level).replace(/[\s,\)\(.]/g, ""))
            .attr('fill',function (d){
                if (d.level != that.currentLevel)
                        return "grey";
                else return colorScale(d.grouping) })
            .style("opacity", function(d){
                if (d.level != that.currentLevel)
                    return 0.2;
                else return 1.0});

        d3.select("#levelLabel")
            .text("Level: " + that.currentLevel.charAt(0).toUpperCase() + that.currentLevel.slice(1) + "s");

        //These must be attached after every update so that each rect has an 
        //event handler attached to it
        this.attachMouseEventHandlers();
    }

    /**
     * Helper function that updates this.currentData after each click or doubleclick
     * @param {Node} selection - the currently selected node
     */
    updateData(node){
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
                    this.currentLevel =  "group";
                    break;
                case "language":
                    this.currentLevel =  "subgroup";
                    break;
            }
        }
        else{
            switch(node.level){
                case "group":
                    this.currentLevel = "subgroup";
                    break;
                case "subgroup":
                    this.currentLevel = "language";
                    break;
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
        let barWidth;

        //calculate language width first
        if (this.currentLevel === "language"){

            barWidth = (this.width - (groupWidth + this.barWidth["gap"]) * numGroups  
                - (subgroupWidth + this.barWidth["gap"]) * numSubgroups) / numLanguages;
            
            while(barWidth < 2 && this.isSorted === false){
                groupWidth = groupWidth * 0.75;
                subgroupWidth = subgroupWidth * 0.75;
                barWidth = (this.width - (groupWidth +this.barWidth["gap"]) * numGroups  
                    - (subgroupWidth  + this.barWidth["gap"]) * numSubgroups) / numLanguages;
                }
            languageWidth = Math.min(barWidth, this.barWidth["language"]);
        }

        //next calculate subgroup width
        else if (this.currentLevel === "subgroup"){
        
            barWidth = (this.width - (groupWidth + this.barWidth["gap"]) * numGroups  
                - (languageWidth + this.barWidth["gap"]) * numLanguages) / numSubgroups;   
            
            while(barWidth < 10){
                groupWidth = groupWidth * 0.75;
                barWidth = (this.width - (groupWidth + this.barWidth["gap"]) * numGroups  
                    - (languageWidth + this.barWidth["gap"]) * numLanguages) / numSubgroups; 
            }
            subgroupWidth = Math.min(barWidth, this.barWidth["subgroup"]);
        }

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
    * Function that sorts the nodes given the curent level
    */
    sortLevel(){
        this.isSorted = true;

        //get all the nodes in the tree at specified level
        this.currentData = this.tree.returnAll(this.currentLevel);
        
        let sortDescending = function (a,b){
            if (b.percentage > a.percentage) return 1;
                else return -1;
        };

        this.currentData.sort(sortDescending);
        this.updateBarChart();
    }
    
    
    /**
     * Function that renders the tooltip
     * @param {selection} selection - the d3 selection
     * @param {*} d - data object bound to d3 selection
     */
    renderTooltip(selection, d){
        let that = this;
        //https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
        function numberWithCommas(x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        let level = d.level;

        let x = parseInt(selection.attr("x")) + 20;
        let y = parseInt(selection.attr("y")) - 50;
        if (x > 350)
            x -= 150;
        if (y > 650)
            y -= 150;
        if (y < 100)
            y += 150;
        d3.select("#tooltip")
            .style("left", x + "px")
            .style("top", y + "px")
            .style('visibility', 'visible')
            .style("opacity", function(){
                if (level != that.currentLevel)
                    return 0.2;
                else return 1.0})
            .html(`<h2>${d.name}</h2> 
                <strong>Percentage:</strong> ${d3.format(",.2r")(d.percentage * 100)}%
                <br> <strong>Total Speakers:</strong> ${numberWithCommas(d.totalSpeakers)}`);
        }

    /**
     * Function that attaches the mouse event handlers for the tooltips and hovering
     */
    attachMouseEventHandlers(){
        let that = this;
        d3.select("#bar-rects").selectAll("rect")
            .on("mouseover", function(d) {
                that.clearStorytelling();
                d3.select(this).classed("hover", true);
                that.renderTooltip(d3.select(this), d);
             })
            .on("mouseout", function(d) {
                d3.select(".hover").classed("hover", false)
                d3.select("#tooltip")
                    .style('visibility', 'hidden');
            });
    }

    /**
     * Function that attaches the click handlers for the click and doubleclick events
     * Taken from http://bl.ocks.org/couchand/6394506
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

        cc.on('click', function(d, index) {
            that.clearStorytelling();
            if (this !== null && this.srcElement.id !== "") {
                let id = this.srcElement.id;
                
                //sort button handler
                if (id === "sortButton"){
                    if(that.isSorted)
                        return;
                    that.isSorted = true;
                    that.sortLevel();
                    d3.select("#sortButton").classed("button", false).classed("button active", true);
                }

                //home button handler
                else if (id === "homeButton"){
                    that.reset();
                }

                //rects handler
                else {
                    that.direction = "down";
                    d3.select("#tooltip").style('visibility', 'hidden');
                    let node = d3.select("#" + id).data()[0];
                    if (that.isSorted){
    
                        if (node.level === "language")
                            return;
                        else {
                            that.updateLevel(node);
                            that.sortLevel();
                        }
                    }
                    else {
                        that.updateData(node);
                    }
                }
             }    
        });
        
        cc.on('dblclick', function(d, index) {
            that.clearStorytelling();
            if (this !== null && this.srcElement.id !== ""){
                that.direction = "up";  
                d3.select("#tooltip")
                    .style('visibility', 'hidden');
                let node = d3.select("#" + this.srcElement.id).data()[0];
                if (that.isSorted){
                    if (node.level === "group")
                        return;
                    else {
                        that.updateLevel(node);
                        that.sortLevel();
                    }
                }
                else {
                    that.updateData(node);
                }
            }
        });
    }

    /**
     * Function that attaches the handlers to the "click" buttons in the storytelling
     * section of the barchart
     */
    attachStorytellingHandlers(){
        let that = this;

        function sortAndHighlight(subgroup){
            that.clearStorytelling();
            that.currentLevel = "subgroup";
            that.isSorted = true;
            d3.select("#sortButton").classed("button active", true);
            that.sortLevel();
            setTimeout(function(){
                let selection = d3.select(subgroup)
                    .classed("highlighted", true);
                let data = selection.data()[0];
                that.renderTooltip(selection, data);
            }, 200);
        }

        d3.select("#showScandinavianSubgroup")
            .on("click", function(){
                sortAndHighlight("#Scandinavianlanguagessubgroup");
            });
        d3.select("#showNativeAmericanSubgroup")
            .on("click", function(){
                sortAndHighlight("#OtherNativeNorthAmericanlanguagessubgroup");
            });
        d3.select("#showVietnameseSubgroup")
            .on("click", function(){
                sortAndHighlight("#Vietnamesesubgroup");
            });
        d3.select("#showKoreanSubgroup")
            .on("click", function(){
                sortAndHighlight("#Koreansubgroup");
            });
        
        d3.select("#showNativeAmerican")
            .on("click", function(){
                that.clearStorytelling();
                if (that.isSorted){
                    that.isSorted = false;
                    d3.select("#sortButton").classed("button active", false).classed("button", true);
                }
                that.currentLevel = "language";
                that.currentDirection = "down";
                that.currentData = that.tree.treeSelectionToArray(that.tree.root, that.direction);
                let node = that.tree.getNode("ALL OTHER LANGUAGES", "group", that.tree.root);
                that.updateData(node);
                node = that.tree.getNode("Other Native North American languages", "subgroup", node);
                that.updateData(node);
            });
    }

    /**
     * Function that attaches all the event handlers for the barchart2
     */
    attachEventHandlers(){
        this.attachMouseEventHandlers();
        this.attachClickHandlers();
        this.attachStorytellingHandlers();
    }

    /**
     * Function that clears all the event handlers for the barchart2
     */
    clearEventHandlers(){
        d3.select("#barchart2").selectAll("rect")
            .on("mouseover", null) 
            .on("mouseout", null);
        
        d3.select("#sortButton").on("click", null);
        d3.select("#homeButton").on("click", null);
        
        let event = d3.dispatch('click', 'dblclick');
        event.on('click', null);
        event.on('dblclick', null);
    }   
    
    /**
     * Function that clears all highlighted bars and tooltips from storytelling events
     */
    clearStorytelling(){
        d3.selectAll('.highlighted').classed('highlighted', false);
        d3.select("#tooltip").style('visibility', 'hidden');
    }

   /**
    * Function that resets the view to the original view
    * (Grouping level)
    */
    reset(){
        this.direction = "down";
        this.currentLevel = "group";  
        this.isSorted = false;  
        this.currentData = this.tree.treeSelectionToArray(this.tree.root, this.direction);
        d3.select("#sortButton").classed("button active", false).classed("button", true);
        this.updateBarChart();
   }

   /**
     * Function that returns the data bound to the group-level view.
     * This is the view that is shown when the barchart is first rendered.
     */
    getBasicData(){
        return this.tree.treeSelectionToArray(this.tree.root, "down");

    }

}