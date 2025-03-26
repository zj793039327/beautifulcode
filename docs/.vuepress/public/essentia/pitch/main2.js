import { createEssentiaNode } from "./essentia-worklet-node2.js";
import { Smoother } from "./tools.js";

exports = {};

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
let refreshRate = bufferSize / audioCtx.sampleRate * 1000;

let isRecording = false;

const rmsValue = document.querySelector("#rms-value");
const audioButton = document.querySelector("#audio-button");
const freqValue = document.querySelector("#freq-value"); // 新增显示元素


const smoother = new Smoother(20);
const smootherFreq = new Smoother(30);  // 新增频率平滑器


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

    
function draw() {
    animationID = requestAnimationFrame(draw);
    analyserNode.getFloatTimeDomainData(analyserData);

    /* SAB method */
    let pitchBuffer = new Float32Array(3);
    if (audioReader.available_read() >= 1) {
        let read = audioReader.dequeue(pitchBuffer);
        if (read !== 0) {
            console.info("main: ", pitchBuffer[0], pitchBuffer[1], pitchBuffer[2]);
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

            let frequency = pitchBuffer[0];
            let smoothedFreq = smootherFreq.lowpass(frequency);
            freqValue.innerText = smoothedFreq.toFixed(1); // 显示频率值
        } 
    }
}


























window.console.logToScreen = function (str) {
    let node = document.createElement("div");
    node.appendChild(document.createTextNode(str));
    document.getElementById("myLog").appendChild(node);
};


