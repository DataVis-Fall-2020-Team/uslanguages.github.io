
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
            this.barWidth = {group: 100, subgroup: 30, language: 20};
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
            this.attachClickHandlers();
        }

        drawChart(){

            let svg = d3.select(".divchart2").append("svg")
                .attr("id", "divchart2-svg")
                .attr("height", this.height + this.margin.top + this.margin.bottom)
                .attr("width", this.width + this.margin.left + this.margin.right);
            svg.append("g").attr("class", "speakerBars");
            svg.append("g").attr("class", "nonEnglishBars");
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
            for (let d of this.currentData){
                d.x = x;
                x += this.barWidth[d.level] + this.gap.small;
            }
            // for(let d of this.currentData){
                
            //     if (d.level != priorNodeLevel)
            //         x += this.gap.large;
            //     else    
            //         x += this.gap.small;
            //     d.x = x;
            //     x += this.getBarWidth(d);
            //     console.log("BarWidth: ", this.getBarWidth(d));
            //     priorNodeLevel = d.level
            // }
            
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
  
                .transition()
                .attr("x", d => d.x)
                .attr("y", d => 750 - this.getScale(d)(d.totalSpeakers))
                .attr("width", d => this.getBarWidth(d))
                .attr("height", d => this.getScale(d)(d.totalSpeakers))
                .attr("class", d => this.groupMap[d.grouping.toUpperCase()])
                .attr("id", d=>d.name.replace(/[\s,\)\(.]/g, ""))
                .style("fill", function(d){
                    if (d.level != that.currentLevel)
                        return "lightgrey";
                })
                .style("opacity", function(d){
                    if (d.level != that.currentLevel)
                        return 0.2;
                    else return 0.6});
                
            d3.select(".nonEnglishBars").selectAll("rect")
                .data(this.currentData)
                .join("rect")
                // .on("click", function(d) {
                //     that.updateData(d3.select(this))})
                //.transition()
                .attr("x", d => d.x)
                .attr("y", d => 750 - this.getScale(d)(d.nonEnglishSpeakers))
                .attr("width", d => this.getBarWidth(d))
                .attr("height", d => this.getScale(d)(d.nonEnglishSpeakers))
                .attr("id", d=>d.name.replace(/[\s,\)\(.]/g, ""))
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
                .attr("x", function(d){
                    if(d.level === "group")
                        return d.x + 20;
                    else
                        return d.x - 10;
                })
                .attr("y", d => 750 - that.getScale(d)(d.nonEnglishSpeakers) - 15)                    

                .classed("hidden", function(d){
                    if (that.currentGrouping === "Total" || d.level === "language")
                        return false;
                    else return true;
                })
                .attr("id", d=>"label" + d.name.replace(/[\s,\)\(.]/g, ""))
                .text( d => parseFloat(d.nonEnglishSpeakers/d.totalSpeakers * 100).toFixed(2) + "%");
                
        }

        updateData(selection){
            let node = selection.data()[0];
            let newData = this.tree.treeSelectionToArray(node, this.direction);
            this.currentLevel = newData[0].level;
            this.currentGrouping = node.grouping;

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
                
                if (node.level === "subgroup"){
                    this.currentData = this.tree.treeSelectionToArray(this.tree.root, "down");
                }

                else if (node.level === "language"){
                    this.currentData = this.tree.treeSelectionToArray(this.tree.root, "down");
                    let index = this.currentData.findIndex(
                        obj => obj.grouping === node.grouping);
                    let expandedGroup = this.tree.treeSelectionToArray(this.currentData[index], "down");
                    this.currentData.splice(index, 1, ...expandedGroup);
                    
                }
            }
            
            //node.isSelected = true;
            this.updateBarChart();
            console.log("updated data: ", this.currentData);
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
            if (node.level === "group") 
                return this.barWidth["group"];
            
            let numGroups = this.currentData.filter(obj => obj.level === "group").length;
            let numSubgroups = this.currentData.filter(obj => obj.level === "subgroup").length; 
            let numLanguages = this.currentData.filter(obj => obj.level === "language").length; 

            if (node.level === "subgroup"){
                let bWidth = (this.width - (this.barWidth["group"]) * numGroups  - this.barWidth["language"] * numLanguages) / numSubgroups - this.gap.small;               
                return Math.min(bWidth, this.barWidth["subgroup"]);
            }

            if (node.level === "language"){
                let bWidth = (this.width - (this.barWidth["group"]) * numGroups  - this.barWidth["subgroup"] * numSubgroups) / numLanguages - this.gap.small;  
                console.log("bar width: ", bWidth);
                return Math.min(bWidth, this.barWidth["language"]);       
            }
            
        }

        tooltipRender(data, rect) {
            let xCoord = parseFloat(d3.select(rect).attr("x"));
            let yCoord = parseFloat(d3.select(rect).attr("y")) + 20;
            if (yCoord > 650)
                yCoord -= 60;
            let inner = "<h1>" + data.name + "</h1>";
            d3.select(".tooltip")
                .html(inner)
                .style("left", xCoord + "px")
                .style("top", yCoord + "px")
                .classed("hidden", false)
                .style("opacity", 1);

            let selection = "#label" + data.name.replace(/[\s,\)\(.]/g, "");
            d3.select(selection).classed("hidden", false);
                
        }

        attachClickHandlers(){
            let that = this;
        function clickcancel() {
            var event = d3.dispatch('click', 'dblclick');
          
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
        d3.select(".divchart2").call(cc);

        cc.on('click', function(d, index) {
            let id = this.srcElement.id;
            let selection = d3.select("#" + id);
            that.direction = "down";
            that.clearSelection();
            that.updateData(selection);
        });
        cc.on('dblclick', function(d, index) {
            let id = this.srcElement.id;
            let selection = d3.select("#" + id);
            that.direction = "up";
            that.clearSelection();
            that.updateData(selection);
        });
    }

    clearSelection(){
        for (let d of this.currentData){
            d.isSelected = false;
        }
    }
        
    }