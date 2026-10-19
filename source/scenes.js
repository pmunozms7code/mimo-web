import * as THREE from 'three';
import { buildCharacter } from './characters.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export async function mountScene(kind) {
    const hero = document.querySelector('.hero');
    const host = document.querySelector('#visual');
    const mount = host.querySelector('.canvas-mount');
    const status = document.querySelector('#metrics');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');

    let paused = reduced.matches, visible = true, disposed = false,
        raf = 0, last = 0, elapsed = 0, frameCount = 0,
        measured = 0, meanFrame = 0, sayHi = 0;

    const pointer = new THREE.Vector2(0, 0);
    const smooth = new THREE.Vector2(0, 0);

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
        status.textContent = 'WebGL no disponible. Se conserva la composición estática.';
        return;
    }

    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.25 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .76;
    renderer.setClearColor(0x000000, 0);
    mount.append(renderer.domElement);

    // Apply vivid filter to canvas
    renderer.domElement.style.cssText += 'filter:saturate(1.28) contrast(1.045);';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
    camera.position.set(0, .12, 7.2);
    camera.lookAt(0, 0, 0);

    const group = new THREE.Group();
    scene.add(group);

    const geometries = new Set(), materials = new Set(), textures = new Set();
    const geo = g => (geometries.add(g), g);
    const mat = m => (materials.add(m), m);

    function mesh(g, m, parent = group, pos = [0, 0, 0], scale = [1, 1, 1]) {
        const n = new THREE.Mesh(geo(g), m);
        n.position.set(...pos);
        n.scale.set(...scale);
        parent.add(n);
        return n;
    }

    // Environment & lights
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const envTarget = pmrem.fromScene(room, .025);
    scene.environment = envTarget.texture;
    room.dispose();
    scene.environmentIntensity = .55;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x434137, .75));
    const key = new THREE.DirectionalLight(0xffebd5, 2.3); key.position.set(-3, 5, 5); scene.add(key);
    const fill = new THREE.DirectionalLight(0xd4ecff, 1.3); fill.position.set(4, 1, 2); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 3); rim.position.set(0, 3, -3); scene.add(rim);

    // Build Mimo character
    const character = buildCharacter(kind, { mesh, mat, group });

    function render(now = performance.now()) {
        raf = 0;
        if (disposed || !visible || document.hidden) return;
        const rawDt = (now - (last || now)) / 1000;
        const dt = Math.min(rawDt, .05);
        last = now;
        if (!paused) elapsed += dt;

        const damping = 1 - Math.exp(-dt * 6);
        if (!paused) smooth.lerp(pointer, damping);

        if (character && !paused) {
            sayHi = Math.max(0, sayHi - dt);
            character.update(elapsed, smooth, sayHi);
        }

        renderer.render(scene, camera);
        hero.classList.add('webgl-ready');

        frameCount++;
        if (rawDt > 0 && rawDt < .25 && !paused) { meanFrame += rawDt * 1000; measured++; }
        if (frameCount % 60 === 0 || frameCount === 1 || paused) {
            status.textContent = `Three.js r${THREE.REVISION} · ${renderer.info.render.calls} draw calls · ${renderer.info.render.triangles.toLocaleString('es')} triángulos · DPR ${renderer.getPixelRatio()} · ${measured ? (meanFrame / measured).toFixed(1) + ' ms/frame' : 'sin medición'} · ${paused ? 'pausado' : 'activo'}`;
        }

        raf = requestAnimationFrame(render);
    }

    function wake() {
        if (!raf && !disposed) { last = performance.now(); raf = requestAnimationFrame(render); }
    }

    function resize() {
        const r = host.getBoundingClientRect();
        renderer.setSize(r.width, r.height);
        camera.aspect = r.width / r.height;
        camera.updateProjectionMatrix();
        wake();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    // Pointer interaction
    const onMove = e => {
        const r = host.getBoundingClientRect();
        pointer.set(
            THREE.MathUtils.clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1),
            THREE.MathUtils.clamp(1 - (e.clientY - r.top) / r.height * 2, -1, 1)
        );
        wake();
    };
    const onLeave = () => { pointer.set(0, 0); wake(); };
    const onKey = e => {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(e.key)) {
            e.preventDefault();
            if (e.key === 'Home') pointer.set(0, 0);
            else {
                pointer.x = THREE.MathUtils.clamp(pointer.x + (e.key === 'ArrowLeft' ? -.2 : e.key === 'ArrowRight' ? .2 : 0), -1, 1);
                pointer.y = THREE.MathUtils.clamp(pointer.y + (e.key === 'ArrowUp' ? .2 : e.key === 'ArrowDown' ? -.2 : 0), -1, 1);
            }
            wake();
        }
    };

    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerdown', onMove);
    host.addEventListener('pointerleave', onLeave);
    host.addEventListener('keydown', onKey);

    const onPreference = () => { paused = reduced.matches; wake(); };
    reduced.addEventListener('change', onPreference);

    const onVisibility = () => {
        if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else wake();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) wake(); else { cancelAnimationFrame(raf); raf = 0; }
    }, { threshold: .01 });
    observer.observe(hero);

    // CTA button
    document.querySelector('#action').addEventListener('click', () => {
        const response = document.querySelector('#response');
        sayHi = 2;
        response.textContent = '¡Hola, tú! Bienvenida a Mimo 🎀';
        wake();
    });

    // Context lost
    function onContextLost(e) {
        e.preventDefault();
        cancelAnimationFrame(raf); raf = 0;
        hero.classList.remove('webgl-ready');
        status.textContent = 'Contexto gráfico perdido. Recarga para reintentar.';
        disposed = true;
    }
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    function dispose() {
        disposed = true;
        cancelAnimationFrame(raf);
        resizeObserver.disconnect();
        observer.disconnect();
        host.removeEventListener('pointermove', onMove);
        host.removeEventListener('pointerdown', onMove);
        host.removeEventListener('pointerleave', onLeave);
        host.removeEventListener('keydown', onKey);
        document.removeEventListener('visibilitychange', onVisibility);
        reduced.removeEventListener('change', onPreference);
        geometries.forEach(g => g.dispose());
        materials.forEach(m => m.dispose());
        textures.forEach(t => t.dispose());
        envTarget?.dispose();
        pmrem?.dispose();
        renderer.dispose();
    }

    window.addEventListener('pagehide', dispose, { once: true });

    resize();
    wake();
}
