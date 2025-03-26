// 等待 Essentia.js 加载完成
let essentia = null;

// 初始化 Essentia.js
async function initEssentia() {
    if (!essentia) {
        // 等待 Module 对象可用
        while (typeof Module === 'undefined') {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        essentia = new Essentia(Module);
        console.log('Essentia.js initialized:', essentia.version);
    }
    return essentia;
}

/**
 * A simple demonstration of using essentia.js wasm  Modules as AudioWorkletProcessor.
 *
 * @class EssentiaWorkletProcessor
 * @extends AudioWorkletProcessor
 */
class EssentiaWorkletProcessor extends AudioWorkletProcessor {
  /**
   * @constructor
   */
  constructor() {
    super();
    this.initialized = false;
  }
  /**
   * System-invoked process callback function.
   * @param  {Array} inputs Incoming audio stream.
   * @param  {Array} outputs Outgoing audio stream.
   * @param  {Object} parameters AudioParam data.
   * @return {Boolean} Active source flag.
   */
  async process(inputs, outputs, parameters) {
    if (!this.initialized) {
      try {
        this.essentia = await initEssentia();
        this.initialized = true;
        console.log('AudioWorklet processor initialized');
      } catch (error) {
        console.error('Error initializing Essentia:', error);
        return true;
      }
    }

    const input = inputs[0];
    const output = outputs[0];

    if (!input || !input[0]) {
      return true;
    }

    try {
      // 将输入音频转换为 Essentia 可用的格式
      const vectorInput = this.essentia.arrayToVector(input[0]);
      
      // 计算音高
      const pitchResult = this.essentia.PitchYinFFT(vectorInput);
      
      // 将结果存储到 algorithms 对象中
      this.algorithms = {
        PitchYinFFT: pitchResult.pitch
      };
      
      // 输出处理后的音频（这里我们直接传递输入）
      output[0].set(input[0]);
      
    } catch (error) {
      console.error('Error in audio processing:', error);
    }

    return true;
  }
}

registerProcessor('essentia-worklet-processor1', EssentiaWorkletProcessor);