class Node{
    /**Creates a node and initializes the following fields to null/empty:
     * children, totalSpeakers, englishSpeakers
     * @param {string} name - the name of the node
     * @param {string} level - the level of the node {"root", "group", "subgroup", "language"}
     * @param {string} parentName - the name of the parent node
     * @param {Node} parent - a reference to the parent node
     * @param {array} children - array of children nodes
     * @param {int} totalSpeakers - total number of speakers
     * @param {int} nonEnglishSpeakers - number that don't speak Enlgish "very well"
     * @param {boolean} isSelected - true if node is currently selected in view, false otherwise
     */
    constructor(name, level, grouping, parentName, parent, total, nonEnglish){
        this.name = name;
        this.level = level;
        this.grouping = grouping;
        this.parentName = parentName
        this.parent = parent;
        this.children = [];
        this.totalSpeakers = total;
        this.nonEnglishSpeakers = nonEnglish;
        this.isSelected = false;
    }

/**
 * Add child to current Node
 * @param {Node} childNode - add a child to this node
 */
    addChild(childNode){
        this.children.push(childNode);
    }
}

/** 
 * Class for creating a tree data structure using the Node class
 */
class Tree{

    /**
     * Creates a tree data structure with a root node for use with the National 
     * Languagues data set
     * @param {Array} data 
     */
    constructor(data){
        let that = this;
        let rootData = data.filter(obj => obj.Group === "Total")[0];

        //filter out total row and rows with NaN Speakers and speakers less than 100 and Native American Languages
        let otherData = data.filter(obj => obj.Group != "Total" 
            && obj.Group != "English" && !Number.isNaN(obj.Speakers) && obj.Speakers > 100);

        this.root = new Node(rootData.Group, "root", null, null, null, rootData.Speakers, rootData.nonEnglishSpeakers);
        let groupData = d3.rollup(otherData, v => d3.sum(v, d => d.Speakers), d => d.Group);
        let groupDataNonEnglish = d3.rollup(otherData, v => d3.sum(v, d => d.nonEnglishSpeakers), d => d.Group);
    
        groupData.forEach(function(val, key) {
            let newNode = new Node(key, "group", key, "root", that.root, val, groupDataNonEnglish.get(key));
            that.root.addChild(newNode);
        });

        let subgroupData = d3.rollup(otherData, v => d3.sum(v, d => d.Speakers), d => d.Group, d => d.Subgroup);
        let subgroupDataNonEnglish = d3.rollup(otherData, v => d3.sum(v, d => d.nonEnglishSpeakers), d => d.Group, d => d.Subgroup);

        subgroupData.forEach(function(val, key) {
            val.forEach(function (v, k){
                let parentNode = that.getNode(key, "group", that.root)
                let nonEnglishSpeakers = subgroupDataNonEnglish.get(key).get(k);
                let newNode = new Node(k, "subgroup", parentNode.grouping, parentNode.name, parentNode, v, nonEnglishSpeakers);
                parentNode.addChild(newNode);
            })
        });

        for (let d of otherData){
            let parentNode = this.getNode(d.Subgroup, "subgroup", this.root);
            let newNode = new Node(d.Language, "language", parentNode.grouping, parentNode.name, parentNode, d.Speakers, d.nonEnglishSpeakers);
            parentNode.addChild(newNode);
        }

        //eliminate native American languages
        let selection = this.getNode("Other Native North American languages", "subgroup", this.root)
        selection.children = [new Node("Other Native North American languages", "language", 
            "ALL OTHER LANGUAGES", selection.name, selection, selection.totalSpeakers, selection.nonEnglishSpeakers)];

        //this.treeTraversal(this.root);

    }

    /**
     * Recursive function that returns a node 
     * @param {string} nodeName - Name of node to return
     * @param {string} level - Level of node to return
     * @param {Node} node - The search starts at this node
     */
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

    /**
     * Returns an array of either the node's children or parent depending on the direction
     * @param {Node} node 
     * @param {string} direction - {"up", "down"}
     */
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
