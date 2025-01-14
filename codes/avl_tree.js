var show = console.log;

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

    insert(node, key) {
        if (!node) {
            return new AVLNode(key);
        }
        if (key < node.key) {
            node.left = this.insert(node.left, key)
        } else if (key > node.key) {
            node.right = this.insert(node.right, key)
        } else {
            return node;
        }
        return node;
    }
    // 插入接口
    add(key) {
        this.root = this.insert(this.root, key);
    }

    inOrder(node = this.root, result = []) {
        if (node) {
          this.inOrder(node.left, result);
          result.push(node.key);
          this.inOrder(node.right, result);
        }
        return result;
      }
}

const avl = new AVLTree();
avl.add(10);
avl.add(20);
avl.add(30);
avl.add(40);
avl.add(50);
avl.add(25);

show("中序遍历结果:", avl.inOrder());