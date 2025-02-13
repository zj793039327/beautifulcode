/**
 * 二叉树相关内容
 */
// 定义二叉树节点
class TreeNode {
    constructor(val) {
        this.val = val;
        this.left = null;
        this.right = null;
        this.x = 0;
        this.y = 0;
    }
}

// 数组转二叉树（层序构建）
function arrayToTree(arr) {
    if (!arr || arr.length === 0) return null;
    const root = new TreeNode(arr[0]);
    const queue = [root];
    let i = 1;
    while (i < arr.length) {
        const current = queue.shift();
        if (arr[i] !== null && arr[i] !== undefined) {
            current.left = new TreeNode(arr[i]);
            queue.push(current.left);
        }
        i++;
        if (i < arr.length && arr[i] !== null && arr[i] !== undefined) {
            current.right = new TreeNode(arr[i]);
            queue.push(current.right);
        }
        i++;
    }
    return root;
}