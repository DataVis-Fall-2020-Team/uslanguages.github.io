class Node{
    /**Creates a node and initializes the following fields to null/empty:
     * children, totalSpeakers, englishSpeakers
     * @param {string} name - the name of the node
     * @param {string} level - the level of the node {"root", "group", "subgroup", "language"}
     * @param {string} parentName - the name of the parent node
     * @param {Node} parent - a reference to the parent node
     */
    constructor(name, level, grouping, parentName, parent, total, english){
        this.name = name;
        this.level = level;
        this.grouping = grouping;
        this.parentName = parentName
        this.parent = parent;
        this.children = [];
        this.totalSpeakers = total;
        this.englishSpeakers = english;
    }

/**
 * Add child to current Node
 * @param {Node} childNode - add a child to this node
 */
    addChild(childNode){
        this.children.push(childNode);
    }
}

class Tree{
    constructor(data){
        let that = this;
        let rootData = data.filter(obj => obj.Group === "Total")[0];
        let otherData = data.filter(obj => obj.Group != "Total" && obj.Group != "English" && !Number.isNaN(obj.Speakers));
        this.root = new Node(rootData.Group, "root", null, null, null, rootData.Speakers, rootData.EnglishSpeakers);
        
        let groupData = d3.rollup(otherData, v => d3.sum(v, d => d.Speakers), d => d.Group);
        let groupDataEnglish = d3.rollup(otherData, v => d3.sum(v, d => d.EnglishSpeakers), d => d.Group);
    
        groupData.forEach(function(val, key) {
            let newNode = new Node(key, "group", key, "root", that.root, val, groupDataEnglish.get(key));
            that.root.addChild(newNode);
        });

        let subgroupData = d3.rollup(otherData, v => d3.sum(v, d => d.Speakers), d => d.Group, d => d.Subgroup);
        let subgroupDataEnglish = d3.rollup(otherData, v => d3.sum(v, d => d.EnglishSpeakers), d => d.Group, d => d.Subgroup);

        subgroupData.forEach(function(val, key) {
            val.forEach(function (v, k){
                let parentNode = that.getNode(key, "group", that.root)
                let englishSpeakers = subgroupDataEnglish.get(key).get(k);
                let newNode = new Node(k, "subgroup", parentNode.grouping, parentNode.name, parentNode, v, englishSpeakers);
                parentNode.addChild(newNode);
            })
        });

        for (let d of otherData){
            let parentNode = this.getNode(d.Subgroup, "subgroup", this.root);
            let newNode = new Node(d.Language, "language", parentNode.grouping, parentNode.name, parentNode, d.Speakers, d.EnglishSpeakers);
            parentNode.addChild(newNode);
        }
        //this.treeTraversal(this.root);

    }

    getNode(nodeName, level, node){
        if (node.name === nodeName && node.level === level){
            return node;
        }
        else{
            if (node.children){
                let searchQueue = [...node.children];
                while (searchQueue.length > 0){
                    let currentNode = searchQueue.pop();
                    let returnNode = this.getNode(nodeName, level, currentNode);
                    if (returnNode) return returnNode;
                }
            }
            return null;
        }
    }

    treeSelectionToArray(node, direction){
        let data = [];

        if (direction === "down" && node.children){
            for (let child of node.children){
                data.push(child);
            }
        }
        else if (direction === "up" && node.parent){
            data.push(node.parent);
        }
        return data;
    }
}



class DivChart{

    /**
     * @param data array that contains the state language data
     */
    
        constructor(data){
            
            this.tree = new Tree(data);
            this.direction = "down";
            console.log("Tree: ", this.tree);
            this.currentData = this.tree.treeSelectionToArray(this.tree.root, this.direction);


            this.margin = { top: 20, right: 10, bottom: 20, left: 10};
            this.width = 750;
            this.height = 1500;
            this.barHeight = {group: 30, subgroup: 15, language: 10};
    
            console.log(d3.max(this.currentData, d=>d.totalSpeakers));
            this.scaleBar = d3.scaleLinear()
                 .domain([0, d3.max(this.currentData, d=>d.totalSpeakers)])
                //.domain([0, 10000000])
                .range([0, this.width/2]);

            this.groupMap = {
                "ENGLISH": "english",
                "SPANISH AND SPANISH CREOLE": "spanish",
                "OTHER INDO-EUROPEAN LANGUAGES": "europe",
                "ASIAN AND PACIFIC ISLAND LANGUAGES": "asian",
                "ALL OTHER LANGUAGES": "other",
            }
            
        
            this.drawChart();
            this.updateBarChart();
        }

        drawChart(){

            let svg = d3.select(".divchart").append("svg")
                .attr("id", "divchart-svg")
                .attr("height", this.height + this.margin.top + this.margin.bottom)
                .attr("width", this.width + this.margin.left + this.margin.right);

            // svg.append("line")
            //     .attr("x1", this.width / 2 + this.margin.left)
            //     .attr("x2", this.width / 2 + this.margin.left)
            //     .attr("y1", this.margin.top)
            //     .attr("y2", this.margin.top + this.currentData[this.currentData.length-1].y + 30);
            
            svg.append("g").attr("class", "rightBars");
            svg.append("g").attr("class", "leftBars");
        }

        updateBarChart(){
            let that = this;
            

            
            //calculate y values for bars
            let y = this.margin.top;
            for(let d of this.currentData){
                d.y = y;
                y += this.barHeight[d.level] + 2;
            }
            

            d3.select(".rightBars").selectAll("rect")
                .data(this.currentData)
                .join("rect")
                .on("click", function(d){
                    that.updateData(d3.select(this))})
                .on("mouseover", function(d) {
                    d3.select(this).classed("hover", true);
                    d3.select(this).append("title")
                        .text(d => d.name) })
                .on("mouseout", function(d) {
                    d3.select(".hover").classed("hover", false);})
                .transition()
                .attr("x", this.width / 2 + this.margin.left+2)
                .attr("y", d => d.y)
                .attr("width", d => this.scaleBar(d.totalSpeakers))
                .attr("height", d => this.barHeight[d.level])
                .attr("class", d => this.groupMap[d.grouping.toUpperCase()]);
                
            d3.select(".leftBars").selectAll("rect")
                .data(this.currentData)
                .join("rect")
                .on("click", function(d) {
                    that.updateData(d3.select(this))})
                .on("mouseover", function(d) {
                    d3.select(this).classed("hover", true);
                    d3.select(this).append("title")
                        .text(d => d.name) })
                .on("mouseout", function(d) {
                    d3.select(".hover").classed("hover", false);})
                .transition()
                .attr("x", 0)
                .attr("y", d => d.y)
                .attr("width", d => this.scaleBar(d.englishSpeakers))
                .attr("height", d => this.barHeight[d.level])
                .attr("class", d => this.groupMap[d.grouping.toUpperCase()])
               .attr("transform", "translate(383,0) scale(-1,1)");
                
        }

        updateData(selection){
            console.log("bar was clicked");
            let node = selection.data()[0];
            let newData = this.tree.treeSelectionToArray(node);
            let index = this.currentData.indexOf(node);
            console.log("index: ", index);
            console.log("Current data before splice: ", this.currentData);
            this.currentData.splice(index, 1, ...newData);
            console.log(this.currentData);
            this.updateBarChart();
        }
    }