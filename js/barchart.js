class StateData {
    constructor(state, total, groups, subgroups){
        this.state = state;
        this.total = total;
        this.groups = groups;
        this.subgroups = subgroups;
        this.languages;
    }
}

class Barchart{

/**
 * @param data array that contains the state language data
 */

    constructor(data){
        
        this.stateData = this.sumData(data);
        this.margin = { top: 20, right: 10, bottom: 20, left: 10};
        this.width = 750;
        this.height = 1500;
        this.barWidth = 600;
        this.cellHeight = 17;
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
        
        const distinct = (value, index, self) => {
            return self.indexOf(value) === index;
        }

        this.categories = data.map(x => x.group).filter(distinct);

        // Color scale
        this.colorScale = d3.scaleOrdinal() 
            .domain(this.categories)
            .range(d3.schemeCategory10.slice(0,5))

        this.drawBarChart();
        this.attachSortHandlers();
    }

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
            groupData.get(key).forEach(function(val, key) {
                let xValues = [xVal];
                let data = {
                    "group": key,
                    "total": val,
                    "percentage": val/total,
                    "xValues": xValues,
                };
                groups.push(data);
                xVal += val/total;
            });

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
        console.log(stateData);
        return stateData;
    }

    drawBarChart(){
        let that = this;
  
        //https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
        function numberWithCommas(x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        let rowSelection = d3.select("#table-body")
            .selectAll("tr")
            .data(this.stateData)
            .join("tr");
        
        let dataSelection = rowSelection.selectAll("td")
            .data(this.rowToCellDataTransform)
            .join("td");

        dataSelection.filter(d => d.type === "text")
            .text(d => d.value)
            .attr("class", "stateNames");
        
        let vizSelection = dataSelection.filter( d => d.type === "viz");

        let svgSelect = vizSelection.selectAll("svg")
            .data( d => [d])
            .join("svg")
            .attr("width", this.barWidth)
            .attr("height", this.cellHeight)
            .each(function(d){ 
                d3.select(this).selectAll("rect")
                    .data(d => d.value)
                    .join("rect")
                    .on("mouseover", function(d) {
                        d3.select(this).classed("hover", true);
                        d3.select(this).append("title")
                            .text(function (d) { return "Group: " + d.group + 
                            "\nPercentage: " + (d.percentage * 100).toFixed(2) + "%" + 
                            "\nSpeakers: " + numberWithCommas(d.total)})})
                    .on("mouseout", function(d) {
                        d3.select(".hover").classed("hover", false);
                    })
                    .transition()

                    .attr("x", function(d){
                        let index = that.groupMap[that.currentSelection][0];
                        return that.scaleBar(d.xValues[index]);
                    })
                    .attr("y", 1)
                    .attr("width", d => that.scaleBar(d.percentage))
                    .attr("height", that.cellHeight-2)
                    //.attr('fill',d => that.colorScale(d.group));
                    .attr("class", d => that.groupMap[d.group][1]);
                    
            });

        console.log(svgSelect.selectAll("rect").data());
    }

    rowToCellDataTransform(d){
        let state = {
            type: "text",
            key: "state",
            value: d.state,
        };

        let barInfo = {
            type: "viz",
            key: "groups",
            value: d.groups,
        };

        let dataList = [state, barInfo];
        return dataList;
    }

    attachSortHandlers(){
        let that = this;
        d3.selectAll("rect").on("click", function(){
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

        d3.selectAll(".stateNames").on("click", function(){
            
            that.stateData.sort(function (a,b){
                if (a.state > b.state) return 1;
                else return -1;
            })
            that.currentSelection = "ENGLISH";
            that.drawBarChart();
        });
    }

}