// AVL Node and Tree Definitions (from the previous code)
class AVLNode {
  constructor(key) {
    this.key = key;
    this.height = 1;
    this.left = null;
    this.right = null;
  }
}

class AVLTree {
  constructor() {
    this.root = null;
  }

  height(node) {
    console.log('height called');
    return node ? node.height : 0;
  }

  updateHeight(node) {
    node.height = Math.max(this.height(node.left), this.height(node.right)) + 1;
  }

  rotateRight(y) {
    const x = y.left;
    const T2 = x.right;
    x.right = y;
    y.left = T2;
    this.updateHeight(y);
    this.updateHeight(x);
    return x;
  }

  rotateLeft(x) {
    const newX = x.right;
    const T2 = newX.left; // T2 是 > oldX, 但是 < newX的部分
    newX.left = x;
    x.right = T2; // 重新连接 T2 到 oldX 的右边，是因为 T2 > oldX
    this.updateHeight(x);
    this.updateHeight(newX);
    return newX;
  }

  getBalanceFactor(node) {
    return node ? this.height(node.left) - this.height(node.right) : 0;
  }

  insert(node, key) {
    if (!node) return new AVLNode(key);

    if (key < node.key) {
      node.left = this.insert(node.left, key);
    } else if (key > node.key) {
      node.right = this.insert(node.right, key);
    } else {
      return node;
    }

    this.updateHeight(node);
    // const balance = this.getBalanceFactor(node); // left - right
    const lh = this.height(node.left);
    const rh = this.height(node.right);

    if (Math.abs(lh - rh) == 1) {
      return node;
    } else {
      if (lh > rh) {
        if (key < node.left.key) { // 左左情况
          return this.rotateRight(node);
        } else if (key > node.left.key) { // 左右情况
          node.left = this.rotateLeft(node.left);
          return this.rotateRight(node);
        }
      } else if (lh < rh) {
        if (key > node.right.key) { // 右右情况
          return this.rotateLeft(node);
        } else if (key < node.right.key) { // 右左情况
          node.right = this.rotateRight(node.right);
          return this.rotateLeft(node);
        }
      }
    }
    return node;
  }

  add(key) {
    this.root = this.insert(this.root, key);
  }
}
const nodeR = 20;
// Initialize AVL Tree
const tree = new AVLTree();
const data = [10, 20, 5, 6, 15, 30]; // Example keys to insert

// D3.js Visualization Setup
const width = 800, height = 600;
const svg = d3.select("#tree").append("svg")
  .attr("width", width)
  .attr("height", height);

const treeGroup = svg.append("g").attr("transform", "translate(50, 50)");

const treeLayout = d3.tree().size([width - 100, height - 100]);

// Function to update the tree visualization
function update(root) {
  const nodes = d3.hierarchy(root, d => [d.left, d.right].filter(Boolean));
  const links = treeLayout(nodes).links();

  // Render links first (so they appear below the nodes)
  const link = treeGroup.selectAll(".link").data(links, d => d.target.data.key);
  link.enter().append("path")
    .attr("class", "link")
    .merge(link)
    .attr("d", d3.linkVertical()
      .x(d => d.x)
      .y(d => d.y + nodeR)
    );
  link.exit().remove();

  // Render nodes after links (so they appear above the links)
  const node = treeGroup.selectAll(".node").data(nodes.descendants(), d => d.data.key);
  const nodeEnter = node.enter().append("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.x}, ${d.y})`);

  nodeEnter.append("circle").attr("r", nodeR);
  nodeEnter.append("text").attr("dy", 4).attr("text-anchor", "middle")
    .text(d => d.data.key);

  node.merge(nodeEnter).transition().duration(500)
    .attr("transform", d => `translate(${d.x}, ${d.y})`);
  node.exit().remove();
}


// Function to handle adding nodes from input field
function addNode() {
  const inputValue = document.getElementById("nodeInput").value;
  const key = parseInt(inputValue, 10);

  if (isNaN(key)) {
    alert("Please enter a valid number.");
    return;
  }

  tree.add(key);  // Insert the node into the AVL tree
  update(tree.root);  // Update the visualization with the new tree structure

  // Clear the input field for the next value
  document.getElementById("nodeInput").value = '';
}

// Insert nodes and update visualization
data.forEach(key => {
  tree.add(key);
  update(tree.root);
});
