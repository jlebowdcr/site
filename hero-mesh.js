// Animated low-poly triangle mesh, reused as a background/decoration in any
// sized, positioned container. Canvas-drawn (not DOM triangles) so hundreds
// of facets stay cheap to redraw. Every element with class "js-mesh-canvas"
// gets its own independent instance, sized to its immediate parent.
document.querySelectorAll('.js-mesh-canvas').forEach(initMesh);

function initMesh(canvas) {
    const heroSection = canvas.parentElement;
    const ctx = canvas.getContext('2d');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Brand pair pulled from the logo: navy triangle outline + the bright
    // blue "price line" breaking through it.
    const NAVY = [11, 31, 58];
    const BLUE = [37, 99, 235];

    const SPACING = 92;
    const JITTER = 0.38;
    const DRIFT_AMP = 10;

    // Mouse path: recent points pull nearby vertices toward the path,
    // collapsing/stretching the triangles they pass through. Points age out
    // on their own, so the mesh eases back to rest without any extra state.
    const DRAG_RADIUS = 150;
    const DRAG_MAX_AGE = 700;
    const DRAG_MAX_PULL = 0.82;
    const DRAG_MIN_SPACING = 8;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let points = [];
    let triangles = [];
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let scrollParallax = 0;
    let dragTrail = [];

    // Deterministic pseudo-random so the mesh doesn't reshuffle on every rebuild.
    function seededRandom(seed) {
        const s = Math.sin(seed) * 43758.5453;
        return s - Math.floor(s);
    }

    function buildMesh() {
        const rect = heroSection.getBoundingClientRect();
        width = rect.width;
        height = rect.height;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const cols = Math.ceil(width / SPACING) + 2;
        const rows = Math.ceil(height / SPACING) + 2;

        points = [];
        for (let j = 0; j < rows; j++) {
            const row = [];
            for (let i = 0; i < cols; i++) {
                const seed = i * 92.13 + j * 57.31;
                const jx = (seededRandom(seed) - 0.5) * SPACING * JITTER;
                const jy = (seededRandom(seed + 13.7) - 0.5) * SPACING * JITTER;
                row.push({
                    bx: i * SPACING - SPACING + jx,
                    by: j * SPACING - SPACING + jy,
                    phaseX: seededRandom(seed + 3.1) * Math.PI * 2,
                    phaseY: seededRandom(seed + 7.9) * Math.PI * 2,
                    freqX: 0.15 + seededRandom(seed + 1.3) * 0.15,
                    freqY: 0.15 + seededRandom(seed + 5.5) * 0.15,
                });
            }
            points.push(row);
        }

        triangles = [];
        for (let j = 0; j < rows - 1; j++) {
            for (let i = 0; i < cols - 1; i++) {
                const p00 = [i, j], p10 = [i + 1, j], p01 = [i, j + 1], p11 = [i + 1, j + 1];
                const tSeed = i * 12.9 + j * 78.2;
                const shimmerSpeed = 0.25 + seededRandom(tSeed + 2.2) * 0.35;
                const shimmerPhase = seededRandom(tSeed + 4.4) * Math.PI * 2;
                triangles.push({ verts: [p00, p10, p11], blend: seededRandom(tSeed), shimmerSpeed, shimmerPhase });
                triangles.push({ verts: [p00, p11, p01], blend: seededRandom(tSeed + 1), shimmerSpeed, shimmerPhase: shimmerPhase + 1.5 });
            }
        }
    }

    function currentPos(ref, t, now) {
        const p = points[ref[1]][ref[0]];
        const driftAmp = prefersReducedMotion ? 0 : DRIFT_AMP;
        const restX = p.bx + Math.sin(t * p.freqX + p.phaseX) * driftAmp + mouseX;
        const restY = p.by + Math.cos(t * p.freqY + p.phaseY) * driftAmp + mouseY + scrollParallax;

        if (!dragTrail.length) {
            return { x: restX, y: restY };
        }

        let sumX = 0, sumY = 0, sumW = 0;
        for (const dp of dragTrail) {
            const dx = dp.x - restX;
            const dy = dp.y - restY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist >= DRAG_RADIUS) continue;
            const age = now - dp.t;
            const ageFactor = Math.max(0, 1 - age / DRAG_MAX_AGE);
            if (ageFactor <= 0) continue;
            const proximity = 1 - dist / DRAG_RADIUS;
            const w = proximity * proximity * ageFactor;
            sumX += dp.x * w;
            sumY += dp.y * w;
            sumW += w;
        }

        if (sumW <= 0) {
            return { x: restX, y: restY };
        }

        const targetX = sumX / sumW;
        const targetY = sumY / sumW;
        const pull = Math.min(sumW, 1) * DRAG_MAX_PULL;
        return {
            x: restX + (targetX - restX) * pull,
            y: restY + (targetY - restY) * pull,
        };
    }

    function draw(t, now) {
        ctx.clearRect(0, 0, width, height);
        for (const tri of triangles) {
            const a = currentPos(tri.verts[0], t, now);
            const b = currentPos(tri.verts[1], t, now);
            const c = currentPos(tri.verts[2], t, now);

            const shimmer = prefersReducedMotion ? 0.5 : Math.sin(t * tri.shimmerSpeed + tri.shimmerPhase) * 0.5 + 0.5;
            const mix = tri.blend * 0.6 + shimmer * 0.4;
            const r = NAVY[0] + (BLUE[0] - NAVY[0]) * mix;
            const g = NAVY[1] + (BLUE[1] - NAVY[1]) * mix;
            const bch = NAVY[2] + (BLUE[2] - NAVY[2]) * mix;
            const alpha = 0.05 + mix * 0.10;

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.lineTo(c.x, c.y);
            ctx.closePath();
            ctx.fillStyle = `rgba(${r | 0}, ${g | 0}, ${bch | 0}, ${alpha})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(${BLUE[0]}, ${BLUE[1]}, ${BLUE[2]}, ${0.05 + mix * 0.08})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    let startTime = null;
    function loop(now) {
        if (startTime === null) startTime = now;
        const t = (now - startTime) / 1000;

        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        while (dragTrail.length && now - dragTrail[0].t > DRAG_MAX_AGE) {
            dragTrail.shift();
        }

        draw(t, now);
        requestAnimationFrame(loop);
    }

    function localPos(clientX, clientY) {
        const rect = heroSection.getBoundingClientRect();
        return { x: clientX - rect.left, y: clientY - rect.top, rect };
    }

    function pushDragPoint(clientX, clientY, timeStamp) {
        const { x, y } = localPos(clientX, clientY);
        const last = dragTrail[dragTrail.length - 1];
        if (last) {
            const dx = x - last.x;
            const dy = y - last.y;
            if (Math.sqrt(dx * dx + dy * dy) < DRAG_MIN_SPACING) return;
        }
        dragTrail.push({ x, y, t: timeStamp });
    }

    function onMouseMove(e) {
        const { x, y, rect } = localPos(e.clientX, e.clientY);
        targetMouseX = (x / rect.width - 0.5) * 24;
        targetMouseY = (y / rect.height - 0.5) * 24;
        pushDragPoint(e.clientX, e.clientY, e.timeStamp);
    }

    function onTouchMove(e) {
        if (!e.touches.length) return;
        const touch = e.touches[0];
        pushDragPoint(touch.clientX, touch.clientY, e.timeStamp);
    }

    function onScroll() {
        const rect = heroSection.getBoundingClientRect();
        scrollParallax = rect.top * -0.06;
    }

    let resizeTimer = null;
    function onResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(buildMesh, 150);
    }

    buildMesh();
    // ResizeObserver (not just a window 'resize' listener) so the canvas also
    // rebuilds when its own parent's size settles later for reasons that
    // aren't a window resize - e.g. a grid-stretched box like .contact-mesh-box
    // whose height depends on a sibling's content height, which can still be
    // shifting after web fonts finish loading.
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(heroSection);
    window.addEventListener('scroll', onScroll, { passive: true });
    heroSection.addEventListener('mousemove', onMouseMove);
    heroSection.addEventListener('mouseleave', () => {
        targetMouseX = 0;
        targetMouseY = 0;
    });
    heroSection.addEventListener('touchstart', onTouchMove, { passive: true });
    heroSection.addEventListener('touchmove', onTouchMove, { passive: true });

    requestAnimationFrame(loop);
}
