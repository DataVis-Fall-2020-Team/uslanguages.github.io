/**
 * A class for rendering the stacked area chart
 */
class AreaChart{

    /**
     * Creates an AreaChart object
     * @param {array} data_compare -- array that contains the comparison lanaguage data in numbers
     * @param {array} data_percentage -- array that contains the comparison lanaguage data in percentages
     * @param {array} language_map -- maps the language to the language group
     * @param {element} svg -- the svg element on which the area chart will be rendered
     */
    constructor(data_compare, data_percentage, language_map, svg){
        
        this.data = [data_compare, data_percentage, language_map];
        this.svg = svg;
        this.margin = { top: 75, right: 10, bottom: 50, left: 100};
        this.width = 700 - this.margin.right - this.margin.left;
        this.height = 700 - this.margin.top - this.margin.bottom;
        
        this.svg.append('g')
                .attr("id", "area")
                .style('opacity', 0)
        d3.select("#area")
            .append("g")
            .attr("id", "graph")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
        
        this.keys = data_compare.columns.slice(1);
        this.currentType = "numbers";  // {"numbers", "percentages"}
        this.currentView = "combined";   // {"combined", "single"}

        //x axis and scale
        this.xScale = d3.scaleLinear()
            .domain(d3.extent(data_compare, function(d) { return d.Year; }))
            .range([ 0, this.width ]);

        d3.select("#graph").append("g")
            .attr("class", "xAxis")
            .attr("transform", "translate(0," + this.height + ")")
            .call(d3.axisBottom(this.xScale).ticks(4)
            .tickFormat(x => x.toString()));
        
        this.yScale; //defined depending upon the type of chart

        //tooltip line and buttons
        d3.select("#graph").append('line').classed('hoverLine', true)
        d3.select("#graph").append('circle').classed('hoverPoint', true);
        this.createButtons();
        this.drawChart();     
    }

    /**
     * Function that draws the area chart
     */
    drawChart(){
        let that = this;
        let yLabel, data, stackedData, areaGenerator, yAxis;

        if (this.currentType === "numbers"){
            data = this.data[0];
            let formatAsMillions = d3.format(".2s")
            this.yScale = d3.scaleLinear()
                            .domain([0, 60000000])
                            .range([this.height, 0]);
            yAxis = d3.axisLeft().scale(this.yScale).tickFormat(formatAsMillions);
            yLabel = "Number of Foreign Speakers in the U.S. (in Millions)";
        }
        
        else { //this.currentType === "percentages"
            data = this.data[1];
            this.yScale = d3.scaleLinear()
                            .domain([0, 1])
                            .range([this.height, 0]);
            let formatAsPercentage = d3.format(".0%");
            yAxis = d3.axisLeft()
                    .scale(this.yScale)
                    .tickFormat(formatAsPercentage);
            yLabel = "Percentage of Total Foreign Speakers in the U.S.";
        }
            
        stackedData = d3.stack()
                        .keys(this.keys)
                        .order(d3.stackOrderAscending)
                        (data);
        areaGenerator = d3.area()
                        .x(function(d, i) { return that.xScale(d.data.Year); })
                        .y0(function(d) { return that.yScale(d[0]); })
                        .y1(function(d) { return that.yScale(d[1]); });
        
        let graph = d3.select("#graph");
        let layers = graph
            .selectAll(".layers")
            .data(stackedData)
            .join("g")
            .attr("class", "layers")
            .attr("id", d=>d.key.replace(/[\s,\)\(.]/g, ""))

        layers
            .append("path")
            .attr("class", "areas")
            .attr("d", areaGenerator)
            .style("fill", function(d) { 
                let obj = that.data[2].find(obj => obj.Language === d.key);
                return colorScale(obj.Group);});

        //draw y axis and axis labels
        //Y axis depends on the this.currentType {"numbers", "percentages"}
        graph
            .append("g")
            .classed("yAxis", true)
            .call(yAxis)
            .call(g => g.select(".domain").remove());

        graph.append("text") 
            .attr("id", "xAxisLabel")            
            .attr("transform", "translate(" + (this.width/2) + " ," + 
                                (this.height + this.margin.top/2) + ")")
            .style("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Year");

            graph.append("text")
                .attr("id", "yAxisLabel")
                .classed("yAxis", true)
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - this.margin.left)
                .attr("x",0 - (this.height / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .style("font-size", "16px")
                .text(yLabel);   
    }  

    /**
     * Function that updates the view when a single layer is clicked
     * @param {selection} selection -- a d3 selection, which is a <g> element that
     *      contains a path element for the single layer
     * @param {string} key -- the name of the layer to show 
     */
    updateSingleView(selection, key){
        let that = this;
        d3.selectAll(".hoverLine").raise();
        d3.selectAll(".hoverPoint").raise();
        
        //select data for single view
        let data = this.data[0];
        if (that.currentType === "percentages")
            data = this.data[1];
        let selectData = [];
        for (let year of data){
            let item = 
                {   Year: year.Year,
                    Values: year[key],
                    Name: key
                }
            selectData.push(item); 
            }
                
        //update selected area
        let areaGenerator = d3.area()
            .x(function(d, i) { return that.xScale(d.Year); })
            .y0(function(d) { return that.height})
            .y1(function(d) { return that.yScale(d.Values); })
        d3.select(selection).selectAll("path")
            .transition()
            .attr("d", areaGenerator(selectData))
            .style("fill", function(d) { 
                let obj = that.data[2].find(obj => obj.Language === d.key);
                return colorScale(obj.Group);});;

        //hide other layers
        d3.selectAll(".layers")
            .classed("hidden", true)
            .attr("pointer-events", "none");
        d3.select(selection)
            .classed("hidden", false)
            .attr("pointer-events", "auto")
    }

    /**
     * Function that creates the buttons to toggle between the current views: {"numbers", "percentages"}
     */
    createButtons(){
        let that = this;
        let buttonData = ["Numbers", "Percentages"];

        //draw sort button
        d3.select("#area").append("foreignObject")
            .attr("transform", "translate(" + (this.width/2) + " ,20)")
            .attr("width", 300)
            .attr("height", 50)
            .append('xhtml:div')
            .append('div')
            .attr("id", "radioBtn")
            .attr("class", "btn-group")
            .selectAll("a")
            .data(buttonData)
            .join('a')
            .classed("btn notActive", true)
            .text(d=>d)
            .attr("id", d=>d.toLowerCase() + "-btn")
            .on("click", function(d){
                        //does nothing if the current view type is the same as the button clicked
                        if (that.currentType === d.toLowerCase()) return;
                        
                        d3.select("#radioBtn")
                            .selectAll(".btn.active")
                            .classed("btn active", false)
                            .classed("btn notActive", true);
                        
                        d3.select(this)
                            .classed("btn notActive", false)
                            .classed("btn active", true);
                        that.currentType = d.toLowerCase();
                        that.currentView = "combined";
                        d3.selectAll(".layers").remove();
                        d3.selectAll(".yAxis").remove();
                        that.drawChart();
                        that.attachEventHandlers();
                    });
            d3.select("#" + this.currentType + "-btn").classed("btn notActive", false).classed("btn active", true);
        }

    /**
     * Attaches the mouse event and click handlers to the chart
     */
    attachEventHandlers(){
        let that = this;

        let mouseover = function(d, i) {
            d3.selectAll(".layers").style("opacity", .2)
            d3.select(this)
                .style("stroke", "black")
                .style("opacity", 1)
                that.renderTooltip(d.key, null, null, null);
        }

        let mousemove = function(d,i) {
            let mouseYear;
            let data = that.data[0];
            if (that.currentType === "percentages") 
                data = that.data[1];
            if (that.currentView === "single"){
                let mouse = d3.mouse(d3.event.target);
                let [xCoord, yCoord,] = mouse;
                mouseYear = that.xScale.invert(xCoord);

            if (that.xScale(mouseYear) < 0 ||
                that.xScale(mouseYear) > that.width) {
                return; }

            let years = [1980, 1990, 2000, 2010];
            let xIndex = d3.bisectCenter(years, mouseYear);
            let mouseValue = data[xIndex][d.key];
            let snapX = that.xScale(years[xIndex].toString());
            that.renderTooltip(d.key, mouseValue, data[xIndex].Year, snapX)
                
            d3.select("#graph").selectAll('.hoverLine')
                .classed("hidden", false)
                .attr('x1', snapX)
                .attr('y1', that.yScale(mouseValue) - 50)
                .attr('x2', snapX)
                .attr('y2', that.height)
                .attr('stroke', '#147F90')
                .attr('fill', "darkgrey");
            
            d3.select("#graph").selectAll('.hoverPoint')
                .classed("hidden", false)
                .attr('cx', snapX)
                .attr('cy', that.yScale(mouseValue))
                .attr('r', 3)
                .attr('fill', 'darkgrey')
                .attr('stroke', 'black');
            }
        }

        let mouseleave = function(d) {
            d3.selectAll(".layers").style("stroke","none").style("opacity", 1);
            d3.select("#tooltip").style('visibility', 'hidden');
            d3.selectAll(".hoverPoint").classed("hidden", true);
            d3.selectAll(".hoverLine").classed("hidden", true);

        }

        let click = function(d){
            if (that.currentView === "combined"){
                that.currentView = "single";
                that.updateSingleView(this, d.key);
            }
            
            else{ // that.currentView === "single"
                that.currentView = "combined";
                that.clearChart();
                that.drawChart();
                that.attachEventHandlers();
            }   
        }

        d3.selectAll(".layers")
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)
            .on("click", click);
        
        this.attachStorytellingHandlers();
    }

    /**
     * Function that renders the tooltip on mouse events
     * @param {string} name -- the name of the language
     * @param {int/float} value -- the value to display.  Either a int or a float (percentage)
     * @param {int} year -- the year to be displayed
     * @param {float} snapX -- the x coordinate of the year
     */
    renderTooltip(name, value, year, snapX){
        if (!name) return;
        let that = this;
        
        //https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
        function numberWithCommas(x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        let mouse = d3.mouse(d3.event.target);
                let [xCoord, yCoord,] = mouse;

        d3.select("#tooltip")
            .style("left", function(){
                if (that.currentView === "combined")
                    return (xCoord + 10) + "px";
                else{
                    return snapX + "px";
                }})
            .style("top", function() {return (yCoord - 50) + "px"})
            .style('visibility', 'visible')
            .style('opacity', 1.0)
            .html(function(d){
                if (that.currentView === "combined"){
                    return `<h2>${name}</h2>`;
                }
                else if (that.currentType === "numbers" && value){
                    return `<h2>${name}</h2>
                    <strong>Number of Speakers:</strong> ${numberWithCommas(value)}
                    <br> <strong>Year:</strong> ${year}`;
                }
                else{
                    return `<h2>${name}</h2>
                    <strong>Percentage:</strong> ${d3.format(",.2r")(value * 100)}%
                    <br> <strong>Year:</strong> ${year}`;
                }
            });
    }

    /**
     * Function that attaches the handlers for the buttons on the scrolling view
     */
    attachStorytellingHandlers(){
        let that = this;
        d3.select("#showSpanishGrowth").on("click", function(d){
            that.clearChart();
            that.currentView = "single";
            that.currentType = "percentages";
            
            //update buttons
            d3.select("#numbers-btn").classed("btn active", false).classed("btn notActive", true);
            d3.select("#percentages-btn").classed("btn notActive", false).classed("btn active", true);

            //update graph
            let key = that.keys[0];
            that.drawChart();
            that.attachEventHandlers();
            let language = "#" + key.replace(/[\s,\)\(.]/g, "");
            let selection = d3.select(language);
            that.updateSingleView(selection._groups[0][0], key);
        })

        d3.select("#showChineseGrowth").on("click", function(d){
            that.clearChart();
            that.currentView = "single";
            that.currentType = "numbers";
            
            //update buttons
            d3.select("#percentages-btn").classed("btn active", false).classed("btn notActive", true);
            d3.select("#numbers-btn").classed("btn notActive", false).classed("btn active", true);

            //update graph
            let key = that.keys[1];
            that.drawChart();
            that.attachEventHandlers();
            let language = "#" + key.replace(/[\s,\)\(.]/g, "");
            let selection = d3.select(language);
            that.updateSingleView(selection._groups[0][0], key);
        })
    }

    /**
     * Clears all the event handlers from the chart
     */
    clearEventHandlers(){
        d3.selectAll(".layers")
            .on("mouseover", null)
            .on("mousemove", null)
            .on("mouseleave", null)
            .on("click", null);
        d3.select("#showSpanishGrowth").on("click", null);
    }

    /**
     * Clears the elements from the chart to prepare for a redraw
     */
    clearChart(){
        d3.selectAll(".layers").remove();
        d3.selectAll(".yAxis").remove();
        d3.selectAll(".hoverLine").classed("hidden", true);
        d3.selectAll(".hoverPoint").classed("hidden", true);
        d3.select("#tooltip").style('visibility', 'hidden')
    }
}

    