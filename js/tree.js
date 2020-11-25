/**
 * Class that creates nodes for a tree.  The nodes hold data for foreign languages spoken
 * in the United States.  
 */
class Node{
    /**Creates a node and initializes the following fields to null/empty:
     * children, totalSpeakers, englishSpeakers
     * @param {string} name - the name of the node
     * @param {string} level - the level of the node {"root", "group", "subgroup", "language"}
     * @param {string} grouping - the language grouping of the node
     * @param {string} parentName - the name of the parent node
     * @param {Node} parent - a reference to the parent node
     * @param {int} total - total number of speakers
     * @param {int} nonEnglish - number that don't speak Enlgish "very well"
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
        this.percentage = (this.totalSpeakers - this.nonEnglishSpeakers) / this.totalSpeakers;
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
     * @param {Array} data - The data array containing the language information
     */
    constructor(data){
        this.root = this.createTree(data);

    }

    /**
     * Helper function that creates the tree holding all the language data.
     * Each level of the tree represents the language groups, subgroups and individual lnaguages.
     * @param {Array} data - The data array containing the language information
     */
    createTree(data){
        let that = this;
        let rootData = data.filter(obj => obj.Group === "Total")[0];

            //filter out total row and rows with NaN Speakers and speakers less than 100
            let otherData = data.filter(obj => obj.Group != "Total" 
                && obj.Group != "English" && !Number.isNaN(obj.Speakers) && obj.Speakers > 100);

            //root node
            let root = new Node(rootData.Group, "root", null, null, null, rootData.Speakers, rootData.nonEnglishSpeakers);
            let groupData = d3.rollup(otherData, v => d3.sum(v, d => d.Speakers), d => d.Group);
            let groupDataNonEnglish = d3.rollup(otherData, v => d3.sum(v, d => d.nonEnglishSpeakers), d => d.Group);
        
            groupData.forEach(function(val, key) {
                let newNode = new Node(key, "group", key, "root", root, val, groupDataNonEnglish.get(key));
                root.addChild(newNode);
            });

            let subgroupData = d3.rollup(otherData, v => d3.sum(v, d => d.Speakers), d => d.Group, d => d.Subgroup);
            let subgroupDataNonEnglish = d3.rollup(otherData, v => d3.sum(v, d => d.nonEnglishSpeakers), d => d.Group, d => d.Subgroup);

            subgroupData.forEach(function(val, key) {
                val.forEach(function (v, k){
                    let parentNode = that.getNode(key, "group", root)
                    let nonEnglishSpeakers = subgroupDataNonEnglish.get(key).get(k);
                    let newNode = new Node(k, "subgroup", parentNode.grouping, parentNode.name, parentNode, v, nonEnglishSpeakers);
                    parentNode.addChild(newNode);
                })
            });

            for (let d of otherData){
                let parentNode = this.getNode(d.Subgroup, "subgroup", root);
                let newNode = new Node(d.Language, "language", parentNode.grouping, parentNode.name, parentNode, d.Speakers, d.nonEnglishSpeakers);
                parentNode.addChild(newNode);
            }

            //remove percentages that are NaN
            this.removeNodes(root);

            return root;
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

    /**
     * Recursive function that traverses the tree and removes any leaf nodes that have
     * NaN for the percentage.
     * @param {Node} node - the starting node for the search
     */
    removeNodes(node){
        if (node.level === "language" && Number.isNaN(node.percentage)){
            node.parent.children = node.parent.children.filter(obj => obj != node);
        }

        else if (node.children){
            let searchQueue = [...node.children];
            while (searchQueue.length > 0){
                let currentNode = searchQueue.pop();
                this.removeNodes(currentNode);
            }
        }
        return;
    }

    /**
     * Function that uses a recursive helper function to return an array of all nodes in 
     * the tree at the given level. 
     * @param {string} level - level of nodes to be returned {"group", "subgroup", "language"}
     */
    returnAll(level){
        let nodeArray;

        function treeTraversal(node, level){
            let array = [];
            if (node.level === level)
                return node;
            else if (node.children){
                let searchQueue = [...node.children];
                while (searchQueue.length > 0){
                    let currentNode = searchQueue.pop();
                    array = array.concat(treeTraversal(currentNode, level));
                }
            }
            return array;
        }

        nodeArray = treeTraversal(this.root, level);
        return nodeArray;

    }

}
