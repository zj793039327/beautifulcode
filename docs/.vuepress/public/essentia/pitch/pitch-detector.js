import { createEssentiaNode } from "../essentia-worklet-node1.js";
import { Smoother } from "../tools.js";

class PitchDetector {
    constructor() {
        this.audioContext = null;
        this.mediaStream = null;
        this.essentiaNode = null;
        this.analyserNode = null;
        this.analyserData = null;
        this.isRunning = false;
        this.animationId = null;
        this.smoother = new Smoother(20);
        
        // 钢琴键映射
        this.pianoKeys = {
            'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
            'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
            'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
        };
        
        this.setupUI();
        this.setupEventListeners();
    }

    setupUI() {
        // 创建钢琴键盘
        const pianoContainer = document.getElementById('piano');
        Object.keys(this.pianoKeys).forEach((note, index) => {
            const key = document.createElement('div');
            key.className = `piano-key ${note.includes('#') ? 'black' : ''}`;
            key.dataset.note = note;
            key.dataset.frequency = this.pianoKeys[note];
            pianoContainer.appendChild(key);
        });
    }

    setupEventListeners() {
        document.getElementById('startButton').addEventListener('click', () => this.start());
        document.getElementById('stopButton').addEventListener('click', () => this.stop());
    }

    async start() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 等待音频上下文恢复
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    sampleRate: this.audioContext.sampleRate
                } 
            });
            
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.analyserNode = this.audioContext.createAnalyser();
            this.analyserNode.fftSize = 2048;
            this.analyserData = new Float32Array(this.analyserNode.frequencyBinCount);
            
            // 创建 Essentia 节点
            this.essentiaNode = await createEssentiaNode(this.audioContext);
            
            // 连接节点
            source.connect(this.essentiaNode);
            this.essentiaNode.connect(this.analyserNode);
            
            this.isRunning = true;
            document.getElementById('startButton').disabled = true;
            document.getElementById('stopButton').disabled = false;
            
            this.startAnalysis();
        } catch (error) {
            console.error('Error starting audio:', error);
            alert('无法访问麦克风或初始化音频系统，请确保已授予权限。');
        }
    }

    stop() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.isRunning = false;
        cancelAnimationFrame(this.animationId);
        document.getElementById('startButton').disabled = false;
        document.getElementById('stopButton').disabled = true;
        document.getElementById('note-display').textContent = '等待开始...';
        document.getElementById('frequency-display').textContent = '频率: -- Hz';
        
        // 清除所有钢琴键的激活状态
        document.querySelectorAll('.piano-key').forEach(key => {
            key.classList.remove('active');
        });
    }

    startAnalysis() {
        const analyze = () => {
            if (!this.isRunning) return;
            
            this.analyserNode.getFloatTimeDomainData(this.analyserData);
            const frequency = this.essentiaNode.algorithms.PitchYinFFT(this.analyserData);
            const smoothedFreq = this.smoother.lowpass(frequency);
            
            if (smoothedFreq > 0) {
                this.updateDisplay(smoothedFreq);
            }
            
            this.animationId = requestAnimationFrame(analyze);
        };
        
        analyze();
    }

    updateDisplay(frequency) {
        document.getElementById('frequency-display').textContent = `频率: ${frequency.toFixed(2)} Hz`;
        
        // 找到最接近的音符
        let closestNote = null;
        let minDiff = Infinity;
        
        Object.entries(this.pianoKeys).forEach(([note, noteFreq]) => {
            const diff = Math.abs(frequency - noteFreq);
            if (diff < minDiff) {
                minDiff = diff;
                closestNote = note;
            }
        });
        
        // 计算音高差异百分比
        const noteFreq = this.pianoKeys[closestNote];
        const cents = 1200 * Math.log2(frequency / noteFreq);
        
        // 更新显示
        document.getElementById('note-display').textContent = `${closestNote} ${cents.toFixed(1)} cents`;
        
        // 更新钢琴键显示
        document.querySelectorAll('.piano-key').forEach(key => {
            key.classList.remove('active');
            if (key.dataset.note === closestNote) {
                key.classList.add('active');
            }
        });
    }
}

// 初始化应用
const pitchDetector = new PitchDetector(); 