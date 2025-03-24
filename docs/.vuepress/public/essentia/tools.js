
class Smoother {
    constructor(windowSize = 10) {
        this.size = windowSize;
        this.buffer = new Array(this.size).fill(0);
        this.oldestVal = 0;
        this.sum = 0;
        this.firstTime = true;
    }

    lowpass(val) {
        // computes moving average
        this.buffer.push(val);
        this.oldestVal = this.buffer.shift();

        if (this.firstTime) {
            this.sum = this.buffer.reduce((acc, v) => acc + v);
            this.firstTime = false;
        } else {
            this.sum = (this.sum - this.oldestVal) + val;
        }
        const avg = this.sum / this.size;
        return Math.round(avg);
    }
}

export { Smoother };