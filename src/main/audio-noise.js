function applyStableAudioNoise(samples, seed, amplitude, channel = 0) {
    if (!samples || typeof samples.length !== 'number') return samples;

    const normalizedSeed = (Number(seed) || 1) >>> 0;
    const normalizedChannel = (Number(channel) || 0) >>> 0;
    const normalizedAmplitude = Math.abs(Number(amplitude)) || 0.0000001;

    for (let i = 0; i < samples.length; i++) {
        if (samples[i] === 0) continue;

        let value = (
            normalizedSeed ^
            Math.imul(i + 1, 0x45d9f3b) ^
            Math.imul(normalizedChannel + 1, 0x27d4eb2d)
        ) >>> 0;
        value ^= value >>> 16;
        value = Math.imul(value, 0x7feb352d);
        value ^= value >>> 15;
        value = Math.imul(value, 0x846ca68b);
        value ^= value >>> 16;

        const signedUnit = ((value >>> 0) / 0xffffffff) * 2 - 1;
        samples[i] += signedUnit * normalizedAmplitude;
    }

    return samples;
}

module.exports = {
    applyStableAudioNoise
};
