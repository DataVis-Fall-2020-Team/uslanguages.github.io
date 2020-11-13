
class BarChart2{

    /**
     * @param data array that contains the state language data
     */
    
        constructor(data){
            
            this.tree = new Tree(data);
            this.direction = "down";
            console.log("Tree: ", this.tree);
            this.currentData = this.tree.treeSelectionToArray(this.tree.root, this.direction);


            this.margin = { top: 20, right: 10, bottom: 20, left: 10};
            this.width = 1000;
            this.height = 750;
            this.barWidth = {group: 100, subgroup: 30, language: 40};
            this.gap = {large: 30, small: 2};
                
            this.scale = function (max){
                return d3.scaleLinear().domain([0, max]).range([0, 750]);
            }
            this.max = d3.max(this.currentData, d=>d.totalSpeakers);
            this.currentLevel = "group";
            this.currentGrouping = "Total"

            this.groupMap = {
                "ENGLISH": "english",
                "SPANISH AND SPANISH CREOLE": "spanish",
                "OTHER INDO-EUROPEAN LANGUAGES": "europe",
                "ASIAN AND PACIFIC ISLAND LANGUAGES": "asian",
                "ALL OTHER LANGUAGES": "other",
            }
            
        
            this.drawChart();
            this.updateBarChart();
            //this.attachClickHandlers();
        }

        drawChart(){

            let svg = d3.select(".divchart2").append("svg")
                .attr("id", "divchart2-svg")
                .attr("height", this.height + this.margin.top + this.margin.bottom)
                .attr("width", this.width + this.margin.left + this.margin.right);
            svg.append("g").attr("class", "speakerBars");
            svg.append("g").attr("class", "englishBars");
            svg.append("g").attr("class", "labels");

            d3.select(".divchart2")
                .append("div")
                .attr("class","tooltip hidden")
        }

        updateBarChart(){
            let that = this;

            //calculate x values for bars
            let x = this.margin.left;
            let priorNodeLevel = this.currentData[0].level;
            for(let d of this.currentData){
                
                if (d.level != priorNodeLevel)
                    x += this.gap.large;
                else    
                    x += this.gap.small;
                d.x = x;
                x += this.getBarWidth(d);
                priorNodeLevel = d.level
            }
            
            d3.select(".speakerBars").selectAll("rect")
                .data(this.currentData)
                .join("rect")
                .on("mouseover", function(d) {
                    d3.select(this).classed("hover", true);
                    that.tooltipRender(d, this); })
                .on("mouseout", function(d) {
                    d3.select(".hover").classed("hover", false)
                    d3.select(".tooltip").classed("hidden", true)
                    d3.selectAll(".pLabels")
                        .classed("hidden", true);
                        ;})
                .on("click", function(d){
                        that.updateData(d3.select(this))})
                //.transition()
                .attr("x", d => d.x)
                .attr("y", d => 750 - this.getScale(d)(d.totalSpeakers))
                .attr("width", d => this.getBarWidth(d))
                .attr("height", d => this.getScale(d)(d.totalSpeakers))
                .attr("class", d => this.groupMap[d.grouping.toUpperCase()])
                .style("fill", function(d){
                    if (d.level != that.currentLevel)
                        return "lightgrey";
                })
                .style("opacity", function(d){
                    if (d.level != that.currentLevel)
                        return 0.2;
                    else return 0.6});
                
            d3.select(".englishBars").selectAll("rect")
                .data(this.currentData)
                .join("rect")
                .on("click", function(d) {
                    that.updateData(d3.select(this))})
                //.transition()
                .attr("x", d => d.x)
                .attr("y", d => 750 - this.getScale(d)(d.englishSpeakers))
                .attr("width", d => this.getBarWidth(d))
                .attr("height", d => this.getScale(d)(d.englishSpeakers))
                //.style("fill", "grey")
                .style("fill", function(d){
                    if (d.level != that.currentLevel)
                        return "lightgrey";
                })
                .style("opacity", function(d){
                    if (d.level != that.currentLevel)
                        return 0.4;
                    else return 1.0})

                .attr("class", d => this.groupMap[d.grouping.toUpperCase()]);

            d3.select(".labels").selectAll("text")
                .data(this.currentData)
                .join("text")
                .attr("class", "pLabels")
                .attr("x", d=>d.x + this.getBarWidth(d)/4)
                .attr("y", d => 750 - this.getScale(d)(d.englishSpeakers) - 15)
                .classed("hidden", function(d){
                    if (that.currentGrouping === "Total" || d.level === "language")
                        return false;
                    else return true;
                })
                .attr("id", d=>d.name.replace(/\s/g, "").replace(/,/g, '').replace(/\)/g, '').replace(/\(/g,''))
                .text( d => parseFloat(d.englishSpeakers/d.totalSpeakers * 100).toFixed(2) + "%");
                
        }

        updateData(selection){
            let node = selection.data()[0];
            let newData = this.tree.treeSelectionToArray(node, this.direction);
            if (this.direction === "down"){
                
                //if at leaf node, start going up
                if (node.level === "language"){
                    this.direction = "up";
                    this.updateData(selection);
                    return;
                }
                let index = this.currentData.indexOf(node);
                this.currentData.splice(index, 1, ...newData);
            }

            //going up in the tree
            else {

                //at group level, start going down
                if (node.level === "group"){
                    this.direction = "down";
                    this.updateData(selection);
                    return;
                }

                let index = this.currentData.findIndex(
                    obj => obj.grouping === node.grouping && obj.level === node.level);
                let removeLength = node.parent.children.length;
                this.currentData.splice(index, removeLength, ...newData);

            }
            
                if (node.level === "subgroup" && this.direction === "up"){
                    this.currentData = this.tree.treeSelectionToArray(this.tree.root, "down");
                    this.currentGrouping = "Total";
                }
                else
                    this.currentGrouping = node.grouping;
            this.currentLevel = this.updateLevel(node);
            //this.max = d3.max(this.currentData, d=>d.totalSpeakers);
            this.updateBarChart();
        }

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

        getScale(node){
            let max;
            if (this.currentGrouping === "Total")
                max = d3.max(this.currentData, d=>d.totalSpeakers);

            else if (node.level != this.currentLevel)
                max = d3.max(this.currentData, d=>d.totalSpeakers);
            else{
                let maxData = this.currentData.filter(obj => obj.level === node.level);
                max = d3.max(maxData, d=>d.totalSpeakers) * 1.25;
            }

            let scale = function (max){
                return d3.scaleLinear().domain([0, max]).range([0, 750]);
            }

            return scale(max);
        }

        getBarWidth(node){
            if (this.currentGrouping === "Total")
                return this.barWidth["group"];
            else if (node.level === "group")
                return this.barWidth["group"] * 0.6;

            let numGroups = this.currentData.filter(obj => obj.level === "group").length;
            let numSubgroups = this.currentData.filter(obj => obj.level === "subgroup").length; 
            let numLanguages = this.currentData.filter(obj => obj.level === "language").length; 

            if (this.currentLevel === "subgroup"){
                let subgroupWidth = (this.width - 60 * numGroups - 2 * this.gap.large) / numSubgroups - this.gap.small;
                
                return Math.min(subgroupWidth, this.barWidth["subgroup"]);
            }
           
            if (this.currentLevel === "language"){
                if (node.level === "language")
                    return this.barWidth["language"];
                else{
                    let subgroupWidth = (this.width - 60 * numGroups - this.barWidth["language"] * numLanguages - 4 * this.gap.large) / numSubgroups - this.gap.small;
                    return Math.min(subgroupWidth, this.barWidth["subgroup"]);
                }
            }

        }

        tooltipRender(data, rect) {
            let xCoord = parseFloat(d3.select(rect).attr("x"));
            let yCoord = parseFloat(d3.select(rect).attr("y")) + 20;
            let inner = "<h1>" + data.name + "</h1>";
            d3.select(".tooltip")
                .html(inner)
                .style("left", xCoord + "px")
                .style("top", yCoord + "px")
                .classed("hidden", false)
                .style("opacity", 1);
            let selection = "#" + data.name.replace(/\s/g, "").replace(/,/g, '').replace(/\)/g,'').replace(/\(/g,'');
            d3.select(selection).classed("hidden", false);
                
        }

        
    }