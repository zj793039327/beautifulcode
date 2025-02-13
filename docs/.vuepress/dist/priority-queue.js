/**
 * 小顶堆的实现
 * @see https://labuladong.online/algo/data-structure-basic/binary-heap-implement/#%E4%BB%A3%E7%A0%81%E5%AE%9E%E7%8E%B0
 */
class MyPriorityQueue {
    // 构造函数
    constructor(capacity, comparator) {
        // 堆数组
        this.heap = new Array(capacity);
        // 堆中元素的数量
        this.size = 0;
        // 元素比较器
        this.comparator = comparator || ((a, b) => (a > b) ? 1 : (a < b) ? -1 : 0);
    }

    // 返回堆的大小
    size() {
        return this.size;
    }

    // 判断堆是否为空
    isEmpty() {
        return this.size === 0;
    }

    // 父节点的索引
    parent(node) {
        return Math.floor((node - 1) / 2);
    }

    // 左子节点的索引
    left(node) {
        return node * 2 + 1;
    }

    // 右子节点的索引
    right(node) {
        return node * 2 + 2;
    }

    // 交换数组的两个元素
    swap(i, j) {
        const temp = this.heap[i];
        this.heap[i] = this.heap[j];
        this.heap[j] = temp;
    }

    // 查，返回堆顶元素，时间复杂度 O(1)
    peek() {
        if (this.isEmpty()) {
            throw new Error("Priority queue underflow");
        }
        return this.heap[0];
    }

    // 增，向堆中插入一个元素，时间复杂度 O(logN)
    push(node) {
        // 扩容
        if (this.size === this.heap.length) {
            this.resize(this.heap.length * 2);
        }
        // 把新元素追加到最后
        this.heap[this.size] = node;
        // 然后上浮到正确位置
        this.swim(this.size);
        this.size++;
    }

    // 删，删除堆顶元素，时间复杂度 O(logN)
    pop() {
        if (this.isEmpty()) {
            throw new Error("Priority queue underflow");
        }
        const res = this.heap[0];
        // 把堆底元素放到堆顶
        this.swap(0, this.size - 1);
        // 避免对象游离
        this.heap[this.size - 1] = undefined;
        this.size--;
        // 然后下沉到正确位置
        this.sink(0);
        // 缩容
        if (this.size > 0 && this.size === Math.floor(this.heap.length / 4)) {
            this.resize(Math.floor(this.heap.length / 2));
        }
        return res;
    }

    // 上浮操作，时间复杂度是树高 O(logN)
    swim(node) {
        while (node > 0 && this.comparator(this.heap[this.parent(node)], this.heap[node]) > 0) {
            this.swap(this.parent(node), node);
            node = this.parent(node);
        }
    }

    // 下沉操作，时间复杂度是树高 O(logN)
    sink(node) {
        while (this.left(node) < this.size) {
            // 比较自己和左右子节点，看看谁最小
            let minNode = node;
            if (this.left(node) < this.size && this.comparator(this.heap[this.left(node)], this.heap[minNode]) < 0) {
                minNode = this.left(node);
            }
            if (this.right(node) < this.size && this.comparator(this.heap[this.right(node)], this.heap[minNode]) < 0) {
                minNode = this.right(node);
            }
            if (minNode === node) {
                break;
            }
            // 如果左右子节点中有比自己小的，就交换
            this.swap(node, minNode);
            node = minNode;
        }
    }

    // 调整堆的大小
    resize(capacity) {
        const newHeap = new Array(capacity);
        for (let i = 0; i < this.size; i++) {
            newHeap[i] = this.heap[i];
        }
        this.heap = newHeap;
    }
}

// 小顶堆
const pq = new MyPriorityQueue(3, (a, b) => a - b);
pq.push(3);
pq.push(1);
pq.push(4);
pq.push(1);
pq.push(5);
pq.push(9);

// 1 1 3 4 5 9
while (!pq.isEmpty()) {
    console.log(pq.pop());
}