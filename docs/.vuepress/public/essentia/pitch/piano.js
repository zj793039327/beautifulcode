
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

function setNote(frequency){
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
export {setNote};