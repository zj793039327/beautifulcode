import { createEssentiaNode } from "./essentia-worklet-node2.js";
import { Smoother } from "./tools.js";

let AudioContext;
let audioCtx;

let bufferSize = 8192;

// try{
//     AudioContext = window.AudioContext || window.webkitAudioContext;
//     audioCtx = new AudioContext();
// }catch(e){
//     throw "Could not instantiate AudioContext: " + e.message;
// }

// global var getUserMedia mic stream
let gumStream;

let mic;
let gain;
let pitchNode;

let audioReader;

let animationId;

let pitchAccum = [];
let rmsAccum = [];
// let refreshRate = bufferSize / audioCtx.sampleRate * 1000;

let isRecording = false;

const rmsValue = document.querySelector("#rms-value");
const audioButton = document.querySelector("#audio-button");
const freqValue = document.querySelector("#freq-value"); // 新增显示元素


const smoother = new Smoother(20);
const smootherFreq = new Smoother(5);  // 新增频率平滑器

// const testSAB = new SharedArrayBuffer(1);

// 钢琴键映射（从A0到C8，共88个键）
const pianoKeys = {
    'A0': 27.50, 'A#0': 29.14, 'B0': 30.87,
    'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20, 'F1': 43.65, 'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00, 'A#1': 58.27, 'B1': 61.74,
    'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
    'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91, 'F#6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00, 'A#6': 1864.66, 'B6': 1975.53,
    'C7': 2093.00, 'C#7': 2217.46, 'D7': 2349.32, 'D#7': 2489.02, 'E7': 2637.02, 'F7': 2793.83, 'F#7': 2959.96, 'G7': 3135.96, 'G#7': 3322.44, 'A7': 3520.00, 'A#7': 3729.31, 'B7': 3951.07,
    'C8': 4186.01
};
// 在文件开头添加钢琴键盘绘制函数
function createPianoKeyboard() {
    const pianoContainer = document.getElementById('piano');
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octaves = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    
    octaves.forEach(octave => {
        notes.forEach((note, index) => {
            const key = document.createElement('div');
            key.className = `piano-key ${note.includes('#') ? 'black' : ''}`;
            key.dataset.note = `${note}${octave}`;
            
            // 添加音符标签
            const noteLabel = document.createElement('div');
            noteLabel.className = 'note-label';
            noteLabel.textContent = note;
            key.appendChild(noteLabel);
            
            // 添加八度标签
            if (note === 'C') {
                const octaveLabel = document.createElement('div');
                octaveLabel.className = 'octave-label';
                octaveLabel.textContent = octave;
                key.appendChild(octaveLabel);
            }
            
            pianoContainer.appendChild(key);
        });
    });
}

// 在页面加载完成后创建钢琴键盘
document.addEventListener('DOMContentLoaded', () => {
    createPianoKeyboard();
});

// 计算最接近的音符
function findClosestNote(frequency) {
    let closestNote = null;
    let minDiff = Infinity;
    
    Object.entries(pianoKeys).forEach(([note, noteFreq]) => {
        const diff = Math.abs(frequency - noteFreq);
        if (diff < minDiff) {
            minDiff = diff;
            closestNote = note;
        }
    });
    
    return closestNote;
}

// 计算音高差异（以音分为单位）
function calculateCents(frequency, noteFreq) {
    return 1200 * Math.log2(frequency / noteFreq);
}

audioButton.addEventListener('click', function () {
    if (!isRecording) {
        audioCtx = audioButton.audio.ctx;
        startEssentiaAnalyser(audioCtx)
            .then(() => console.logToScreen('essentia analyzer started'));
        return;
    } else {
        stopEssentiaAnalyser();

    }
});

function stopEssentiaAnalyser() {
    console.logToScreen('Closing audio context ...');
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    gumStream.getAudioTracks().forEach(function (track) {
        track.stop();
        gumStream.removeTrack(track);
    });

    mic.disconnect();
    pitchNode.disconnect();
    gain.disconnect();

    mic = undefined;
    pitchNode = undefined;
    gain = undefined;

    isRecording = false;
    console.logToScreen('Closing audio context ... success');

}
function resetOutData() {
    document.getElementById("myLog").innerHTML = ""; // empty on-screen log
}
async function startEssentiaAnalyser(audioContext) {
    isRecording = true;
    if (!navigator.mediaDevices.getUserMedia) {
        throw 'Could not access microphone - getUserMedia not available';
    }
    resetOutData();// empty on-screen log
    console.logToScreen(".................................")
    console.logToScreen('Initializing mic input stream ...')
    navigator.mediaDevices.getUserMedia(
        {
            audio: {
                sampleRate: {
                    exact: audioContext.sampleRate
                }
            },
            video: false
        }).then((stream) => {
            setupAudioGraph(stream);
        }).catch(function (message) {
            throw 'Could not access microphone - ' + message;
        });
}

async function setupAudioGraph(stream) {
    gumStream = stream;
    if (gumStream.active) {
        if (audioCtx.state == "closed") {
            audioCtx = new AudioContext();
        } else if (audioCtx.state == "suspended") {
            audioCtx.resume();
        }
        console.logToScreen('Sample Rate = ' + audioCtx.sampleRate);

        mic = audioCtx.createMediaStreamSource(gumStream);
        gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0, audioCtx.currentTime);


        let sab = exports.RingBuffer.getStorageForCapacity(3, Float32Array); // capacity: three float32 values [pitch, confidence, rms]
        let rb = new exports.RingBuffer(sab, Float32Array);
        audioReader = new exports.AudioReader(rb);

        if (!pitchNode) {
            pitchNode = await createEssentiaNode(audioCtx, bufferSize);
            console.logToScreen("Creating EssentiaNode instance ...")
        }

        try {
            pitchNode.port.postMessage({
                sab: sab,
            });
        } catch (_) {
            console.logToScreen("No SharedArrayBuffer tranfer support, try another browser.");
            return;
        }
        // It seems necessary to connect the stream to a sink for the pipeline to work, contrary to documentataions.
        // As a workaround, here we create a gain node with zero gain, and connect temp to the system audio output.
        mic.connect(pitchNode);
        pitchNode.connect(gain);
        gain.connect(audioCtx.destination);

        requestAnimationFrame(draw); // start plot animation

    }
}


function draw() {
    animationId = requestAnimationFrame(draw);
    // analyserNode.getFloatTimeDomainData(analyserData);

    /* SAB method */
    let pitchBuffer = new Float32Array(3);
    if (audioReader.available_read() >= 1) {
        let read = audioReader.dequeue(pitchBuffer);
        if (read !== 0) {
            console.info("main: ", pitchBuffer[0], pitchBuffer[1]);
            // elapsed = timestamp - animationStart;
            // animationStart = timestamp;
            // console.info(elapsed);
            // CONFIDENCE_ARRAY.push(pitchBuffer[1]);
            // CONFIDENCE_ARRAY.shift();
            // const logRMS = 1 + Math.log10(pitchBuffer[2] + Number.MIN_VALUE) * 0.5;
            // rmsAccum.push(logRMS);
            // RMS_ARRAY.push(logRMS);
            // RMS_ARRAY.shift();
            // pitchAccum.push(pitchBuffer[0]);
            // pitchChart.data.datasets[0].data.push(pitchBuffer[0]);
            // pitchChart.data.datasets[0].data.shift();

            // console.info("before chart update");
            // pitchChart.update();
            // console.info("AFTER chart update");
            let rms = pitchBuffer[2];
            let dbFS = 20 * Math.log10((rms + Number.EPSILON) * Math.sqrt(2));
            // lowpass value for easier visualization
            let smoothedVal = smoother.lowpass(dbFS);
            rmsValue.innerText = smoothedVal;


            // 如果置信度大于0.5，则使用平滑器
            let frequency = pitchBuffer[0];
            if (pitchBuffer[1] > 0.05) {
                frequency = pitchBuffer[0];
            } else {
                frequency = 0;
            }
            let smoothedFreq = smootherFreq.lowpass(frequency);
            freqValue.innerText = Math.round(frequency);

            // 如果频率有效，显示对应的音符
            if (frequency > 0) {
                const closestNote = findClosestNote(frequency);
                const cents = calculateCents(frequency, pianoKeys[closestNote]);
                
                // 更新音符显示
                const noteDisplay = document.getElementById('note-display');
                if (noteDisplay) {
                    noteDisplay.textContent = `${closestNote} ${cents.toFixed(1)} cents`;
                }
                
                // 更新钢琴键显示
                document.querySelectorAll('.piano-key').forEach(key => {
                    key.classList.remove('active');
                    if (key.dataset.note === closestNote) {
                        key.classList.add('active');
                    }
                });
            }

            // 显示频率值
            // freqValue.innerText = pitchBuffer[2];


        }
    }
}



window.console.logToScreen = function (str) {
    let node = document.createElement("div");
    node.appendChild(document.createTextNode(str));
    document.getElementById("myLog").appendChild(node);
};


