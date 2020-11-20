/**
 * Class that creates an object for holding state language data
 */
class StateData {

    /**
     * Creates a data instance containing state language information
     * Data object to be used in Barchart view
     * @param {string} state - name of the state
     * @param {int} total - total state population
     * @param {array} groups - array of data objects.  Each object contains information 
     *      for that state and a particular lanaguage group.  
     *      {"group": language group, 
     *       "total": total speakers of this language group, 
     *       "percentage" : The percentage of speakers in this state that speak this language group, 
     *       "xValues": the values for the x attribute of the rect representing this language group,
     *       "state": state name }
     * @param {map} subgroups - a map of subgroups with the keys being the different language subgroups 
     *      and the values are the total speakers of that language subgroup
     */
    constructor(state, total, groups, subgroups){
        this.state = state;
        this.total = total;
        this.groups = groups;
        this.subgroups = subgroups;
        this.languages;
    }
}

/**
 * A class for rendering the horizontal barchart
 */
class Barchart{

/**
 * Creates a barchart object
 * @param {array} data -- array that contains the state language data
 * @param {element} svg -- the svg element on which the barchart will be rendered
 */
    constructor(data, svg){
        
        this.stateData = this.sumData(data);
        this.svg = svg;
        this.margin = { top: 20, right: 10, bottom: 20, left: 10};
        this.barWidth = 500;
        this.cellHeight = 15;
        this.nameWidth = 150;
        this.sortAscending = true;
        this.currentSelection = "ENGLISH";

        this.scaleBar = d3.scaleLinear()
            .domain([0, 1])
            .range([0, this.barWidth]);

        this.groupMap = {
            "ENGLISH": [0,"english"],
            "SPANISH AND SPANISH CREOLE": [1,"spanish"],
            "OTHER INDO-EUROPEAN LANGUAGES": [2,"europe"],
            "ASIAN AND PACIFIC ISLAND LANGUAGES": [3,"asian"],
            "ALL OTHER LANGUAGES": [4, "other"],
        }

        this.svg.append('g')
                .attr("id", "barchart1")
                .style('opacity', 0);
        
        this.drawBarChart();
    }

    /**
     * Helper function that sums the speakers for the groups and subgroups in each state
     * and creates the StateData objects where this data is stored.
     * @param {array} data - data array that contains the state language data
     */
    sumData(data){
        let totalData = d3.rollup(data, v=>d3.sum(v, d=>d.Speakers), d=>d.State);
        let groupData = d3.rollup(data, v => d3.sum(v, d => d.Speakers), d=>d.State, d => d.Group);
        let subgroupData = d3.rollup(data, v => d3.sum(v, d => d.Speakers), d=>d.State, d=>d.Group, d => d.Subgroup);
        let stateData = [];

        //iterate through states and create a new data object for each state
        for (let [key, value] of totalData) {
            let groups = [];
            let total = value;
            let xVal = 0;

            //iterate over groups and create object array
            groupData.get(key).forEach(function(val, k) {
                let xValues = [xVal];
                let data = {
                    "group": k,
                    "total": val,
                    "percentage": val/total,
                    "xValues": xValues,
                    "state": key,
                };
                groups.push(data);
                xVal += val/total;
            });

            //calculate the x values for all sorted combinations
            for (let index = 1; index < groups.length; index++){
                xVal = 0;
                for (let i = index; i < groups.length; i++) {
                    groups[i].xValues.push(xVal)
                    xVal += groups[i].percentage;
                }
                for(let i = 0; i < index; i++){
                    groups[i].xValues.push(xVal);
                    xVal += groups[i].percentage;
                }
            }
            let state = new StateData(key, value, groups, subgroupData.get(key));
            stateData.push(state);
        }

        //sort array by state
        stateData.sort(function (a,b){
            if (a.state > b.state) return 1;
            else return -1;
        });
        return stateData;
    }

    /**
     * Function that renders the horizontal bar charts
     * This function is called everytime the barchart is updated.
     */
    drawBarChart(){
        let that = this;
  
        d3.select("#barchart1").selectAll("text")
            .data(this.stateData)
            .join("text")
            .attr("x", 0)
            .attr("y", (d,i) => (i+1) * this.cellHeight)
            .text(d=>d.state)
            .attr("class", "stateNames");
        
        d3.select("#barchart1").selectAll("g")
            .data(this.stateData)
            .join("g")
            .each(function(d, i){ 
                d3.select(this).selectAll("rect")
                    .data(d => d.groups)
                    .join("rect")
                    .transition()
                    .attr("x", function(d){
                        let index = that.groupMap[that.currentSelection][0];
                        return that.scaleBar(d.xValues[index]) + that.nameWidth;
                    })
                    .attr("y", i * that.cellHeight)
                    .attr("width", d => that.scaleBar(d.percentage))
                    .attr("height", that.cellHeight - 1.5)
                    .attr('fill',d => colorScale(d.group))
                    .attr("class", "stateRects");
                });
    }

    /**
     * Function that attaches tshe sort handlers to the barchart visualization
     */
    attachSortHandlers(){
        let that = this;

        d3.selectAll(".stateRects").on("click", function(){
            //console.log("click function in barchart1");
            let sortSelection = d3.select(this).data()[0].group;
            
            if (that.currentSelection === sortSelection){
                that.sortAscending != that.sortAscending;
            }
            else{
                that.currentSelection = sortSelection;
                that.sortAscending = true;
            }

            let aPercentage;
            let bPercentage;
            let sort = function(a,b) {
                for (let aData of a.groups){
                    if(aData.group === sortSelection){
                        aPercentage = aData.percentage;
                    }
                }
            
                for (let bData of b.groups){
                    if  (bData.group === sortSelection)
                        bPercentage = bData.percentage;
                }
                
                if (that.sortAscending){
                    if (aPercentage < bPercentage) return 1;
                    else return -1;
                }

                else {
                    if (aPercentage < bPercentage) return -1;
                    else return 1;
                }
                
            }
            that.stateData.sort(sort);
            that.sortAscending = !that.sortAscending;
            that.drawBarChart();
        })
    }

    /**
     * Function that attaches the mouse event handlers to the horizontal barchart.
     * When a language group is clicked, the barchart will be sorted by that language group.
     * When the language group is clicked again, the barchart will be sorted in reverse order
     * by that language group.  Clicking on the state name sorts alphabetically by state.
     */
    attachEventHandlers(){
        let that = this;
        this.attachSortHandlers();


        //https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
        function numberWithCommas(x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        d3.select("#barchart1").selectAll("rect")
            .on("mouseover.barchart", function(d) {
                d3.select(this).classed("hover", true);                  

                let state = d3.select(this).data()[0]["state"];
                let index = that.stateData.findIndex(obj => obj.state === state);
                let x = parseInt(d3.select(this).attr("x"));
                let y = index * (that.cellHeight+0.5);
                x > 650 ? x -= 100: x + 25;
                y < 500 ? y += 50: y -= 175;
                d3.select("#tooltip-bar2")
                    .style("left", x + "px")
                    .style("top", y + "px")
                    .style('visibility', 'visible')
                    .html(`<h2>${d.state}</h2> 
                        <strong>Language:</strong> ${d.group}
                        <br><strong>Percentage:</strong> ${d3.format(",.2r")(d.percentage * 100)}%
                        <br><strong>Total Speakers:</strong> ${numberWithCommas(d.total)}`);
             })
            .on("mouseout.barchart", function(d) {
                d3.select(".hover").classed("hover", false);
                d3.select("#tooltip-bar2")
                    .style('visibility', 'hidden');});

        //sort handler for sorting by state name
        d3.selectAll(".stateNames").on("click", function(){    
            that.stateData.sort(function (a,b){
                if (a.state > b.state) return 1;
                else return -1;
            })
            that.currentSelection = "ENGLISH";
            that.drawBarChart();
        });
    }

    /**
     * Function that clears all the event handlers from the horizontal barchart.
     */
    clearEventHandlers(){

        d3.select("#barchart1").selectAll("rect")
            .on("mouseover.barchart", null)
            .on("mouseout.barchart", null);

        d3.selectAll(".stateNames").on("click", null);
        d3.selectAll(".stateRects").on("click", null);

    }

}