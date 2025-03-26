import { createEssentiaNode } from "./essentia-worklet-node2.js";
import { Smoother } from "./tools.js";

let audioContext;
let gumStream;

let isRecording = false;

let micNode = null;
let essentiaNode = null;
let analyserNode = null;
let analyserData = null;

let animationID;

const smoother = new Smoother(20);

const smootherFreq = new Smoother(30);  // 新增频率平滑器
const freqValue = document.querySelector("#freq-value"); // 新增显示元素


// show console.log on html div
window.console.logToScreen = function (str) {
    let node = document.createElement("div");
    node.appendChild(document.createTextNode(str));
    document.getElementById("myLog").appendChild(node);
};


const rmsValue = document.querySelector("#rms-value");

const audioButton = document.querySelector("#audio-button");

audioButton.addEventListener('click', function () {
    if (!isRecording) {
        audioContext = audioButton.audio.ctx;
        startEssentiaAnalyser(audioContext).then(() => console.logToScreen('essentia analyzer started'));
        return;
    } else {
        gumStream.getAudioTracks().forEach((track) => {
            track.stop();
            gumStream.removeTrack(track);
        });
        console.logToScreen('Closing audio context ...');

        micNode.disconnect();
        analyserNode.disconnect();
        essentiaNode.disconnect();
        // micNode = null;
        // essentiaNode = null;

        cancelAnimationFrame(animationID);

        isRecording = false;
    }
})

function draw() {
    animationID = requestAnimationFrame(draw);
    analyserNode.getFloatTimeDomainData(analyserData);
    let rms = analyserData[0];
    let dbFS = 20 * Math.log10((rms + Number.EPSILON) * Math.sqrt(2));
    // lowpass value for easier visualization
    let smoothedVal = smoother.lowpass(dbFS);
    rmsValue.innerText = smoothedVal;

    // 新增频率检测部分
    // const frequency = essentiaNode.algorithms.PitchYinFFT(analyserData);
    // let smoothedFreq = smootherFreq.lowpass(frequency);
    // freqValue.innerText = smoothedFreq.toFixed(1); // 显示频率值

}

async function setupAudioGraph(stream) {
    gumStream = stream;
    if (gumStream.active) {
        console.logToScreen('Sample Rate = ' + audioContext.sampleRate);
        micNode = audioContext.createMediaStreamSource(stream);
        analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 2 * 128;
        analyserData = new Float32Array(analyserNode.frequencyBinCount);

        // create essentia node only once (avoid registering processor repeatedly)
        if (!essentiaNode) {
            console.logToScreen("Creating EssentiaNode instance ...")
            essentiaNode = await createEssentiaNode(audioContext);
        }

        console.logToScreen("Mic => essentiaWorklet => audioContext.destination ....");
        console.logToScreen("Calculating RMS level from microphone input ....");
        // connect mic stream to essentia node
        audioButton.connectToAudioNode(essentiaNode);
        // If it isn't connected to destination, the worklet is not executed
        essentiaNode.connect(analyserNode);

        draw(analyserData);

        isRecording = true;
    } else {
        throw 'Mic stream not active';
    }
}
async function startEssentiaAnalyser(audioContext) {
    if (navigator.mediaDevices.getUserMedia) {
        document.getElementById("myLog").innerHTML = ""; // empty on-screen log
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
    } else {
        throw 'Could not access microphone - getUserMedia not available';
    }
}


