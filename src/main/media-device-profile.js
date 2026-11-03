function selectStableMediaDevices(devices, seed) {
    if (!Array.isArray(devices)) return devices;
    if (devices.length <= 3) return devices.slice();

    const normalizedSeed = (Number(seed) || 1) >>> 0;
    const kindCounts = new Map();
    const mandatory = new Set();
    const scored = devices.map((device, index) => {
        const kind = String(device && device.kind || 'unknown');
        const ordinal = kindCounts.get(kind) || 0;
        kindCounts.set(kind, ordinal + 1);

        const deviceId = String(device && device.deviceId || '').toLowerCase();
        if (ordinal === 0 || deviceId === 'default' || deviceId === 'communications') {
            mandatory.add(index);
        }

        const identity = `${kind}\u0000${ordinal}`;
        let hash = (normalizedSeed ^ 0x811c9dc5) >>> 0;
        for (let i = 0; i < identity.length; i++) {
            hash ^= identity.charCodeAt(i);
            hash = Math.imul(hash, 0x01000193) >>> 0;
        }
        hash ^= hash >>> 16;
        hash = Math.imul(hash, 0x7feb352d) >>> 0;
        hash ^= hash >>> 15;
        return { index, score: hash >>> 0 };
    });

    const keep = new Set(mandatory);
    const keepPercent = 75 + (normalizedSeed % 16);
    scored.forEach(({ index, score }) => {
        if (mandatory.has(index) || score % 100 < keepPercent) keep.add(index);
    });

    if (keep.size === devices.length && devices.length >= 6) {
        const removable = scored
            .filter(({ index }) => !mandatory.has(index))
            .sort((a, b) => b.score - a.score)[0];
        if (removable) keep.delete(removable.index);
    }

    return devices.filter((_device, index) => keep.has(index));
}

module.exports = {
    selectStableMediaDevices
};
