
function URLFromFiles(files) {
    const promises = files
        .map((file) => fetch(file)
            .then((response) => response.text()));

    return Promise
        .all(promises)
        .then((texts) => {
            const text = texts.join('');
            const blob = new Blob([text], { type: "application/javascript" });
            return URL.createObjectURL(blob);
        })

}

const workletProcessorCode = [
    "https://cdn.jsdelivr.net/npm/essentia.js@0.1.3/dist/essentia-wasm.umd.js",
    "https://cdn.jsdelivr.net/npm/essentia.js@0.1.3/dist/essentia.js-core.umd.js",
    "pitchyinprob-processor.js",
    "https://unpkg.com/ringbuf.js@0.1.0/dist/index.js"];

export async function createEssentiaNode(context, bufferSize) {
    class EssentiaNode extends AudioWorkletNode {
        constructor(context) {
            super(context, 'pitchyinprob-processor', {
                // outputChannelCount: [1],
                processorOptions: {
                    bufferSize: bufferSize,
                    sampleRate: context.sampleRate,
                }
            });
        }
    }

    try {
        let concatenatedCode = await URLFromFiles(workletProcessorCode);
        await context.audioWorklet.addModule(concatenatedCode);
    } catch (e) {
        console.log(e)
    }

    return new EssentiaNode(context);
}