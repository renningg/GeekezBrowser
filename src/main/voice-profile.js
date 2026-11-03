function selectStableVoices(voices, seed, language) {
    if (!Array.isArray(voices)) return voices;
    if (voices.length <= 3) return voices.slice();

    const normalizedSeed = (Number(seed) || 1) >>> 0;
    const targetLanguage = String(language || '').toLowerCase();
    const targetPrimary = targetLanguage.split('-')[0];
    const mandatory = new Set();
    const scored = [];

    const scoreVoice = (voice, index) => {
        const identity = [
            voice && voice.voiceURI,
            voice && voice.name,
            voice && voice.lang,
            voice && voice.localService,
            index
        ].map((value) => String(value ?? '')).join('\u0000');
        let hash = (normalizedSeed ^ 0x811c9dc5) >>> 0;
        for (let i = 0; i < identity.length; i++) {
            hash ^= identity.charCodeAt(i);
            hash = Math.imul(hash, 0x01000193) >>> 0;
        }
        hash ^= hash >>> 16;
        hash = Math.imul(hash, 0x7feb352d) >>> 0;
        hash ^= hash >>> 15;
        return hash >>> 0;
    };

    let hasExactLanguage = false;
    voices.forEach((voice, index) => {
        const voiceLanguage = String(voice && voice.lang || '').toLowerCase();
        if (voice && voice.default) mandatory.add(index);
        if (targetLanguage && voiceLanguage === targetLanguage) {
            mandatory.add(index);
            hasExactLanguage = true;
        }
        scored.push({ index, score: scoreVoice(voice, index) });
    });

    if (!hasExactLanguage && targetPrimary) {
        const primaryMatch = scored
            .filter(({ index }) => String(voices[index] && voices[index].lang || '').toLowerCase().split('-')[0] === targetPrimary)
            .sort((a, b) => a.score - b.score)[0];
        if (primaryMatch) mandatory.add(primaryMatch.index);
    }

    const keep = new Set(mandatory);
    const keepPercent = 70 + (normalizedSeed % 16);
    scored.forEach(({ index, score }) => {
        if (mandatory.has(index) || score % 100 < keepPercent) keep.add(index);
    });

    const minimum = Math.min(4, voices.length);
    scored.sort((a, b) => a.score - b.score).forEach(({ index }) => {
        if (keep.size < minimum) keep.add(index);
    });

    if (keep.size === voices.length && voices.length >= 6) {
        const removable = scored
            .filter(({ index }) => !mandatory.has(index))
            .sort((a, b) => b.score - a.score)[0];
        if (removable) keep.delete(removable.index);
    }

    return voices.filter((_voice, index) => keep.has(index));
}

module.exports = {
    selectStableVoices
};
