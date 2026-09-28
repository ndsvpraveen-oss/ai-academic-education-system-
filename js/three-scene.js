/**
 * ACADEMIQ OS: 3D THREE.JS HOLOGRAPHIC SCENE & PARTICLE CONSTELLATION
 * Renders floating knowledge crystals, neural pathways, and reacts to user mouse dynamics.
 */

(function () {
  const container = document.getElementById('webgl-canvas-container');
  if (!container) return;

  let scene, camera, renderer;
  let crystalMesh, wireframeMesh, particleSystem, linesMesh;
  let mouseX = 0, mouseY = 0;
  let targetRotationX = 0, targetRotationY = 0;

  function initThree() {
    if (typeof THREE === 'undefined') {
      initCanvasFallback();
      return;
    }

    try {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 28;

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      // 1. Central Holographic Crystal (Icosahedron)
      const geometry = new THREE.IcosahedronGeometry(7, 1);
      const material = new THREE.MeshPhongMaterial({
        color: 0x8b5cf6,
        emissive: 0x2e1065,
        wireframe: false,
        transparent: true,
        opacity: 0.25,
        shininess: 90,
      });
      crystalMesh = new THREE.Mesh(geometry, material);
      crystalMesh.position.set(12, 2, -6);
      scene.add(crystalMesh);

      // Wireframe Outer Shell
      const wireGeometry = new THREE.IcosahedronGeometry(7.2, 1);
      const wireMaterial = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      });
      wireframeMesh = new THREE.Mesh(wireGeometry, wireMaterial);
      wireframeMesh.position.copy(crystalMesh.position);
      scene.add(wireframeMesh);

      // 2. Particle Constellation
      const particleCount = 220;
      const particleGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);

      const colorViolet = new THREE.Color(0x8b5cf6);
      const colorCyan = new THREE.Color(0x06b6d4);

      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 80;
        positions[i + 1] = (Math.random() - 0.5) * 60;
        positions[i + 2] = (Math.random() - 0.5) * 50;

        const mixedColor = Math.random() > 0.5 ? colorViolet : colorCyan;
        colors[i] = mixedColor.r;
        colors[i + 1] = mixedColor.g;
        colors[i + 2] = mixedColor.b;
      }

      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const particleMat = new THREE.PointsMaterial({
        size: 0.45,
        vertexColors: true,
        transparent: true,
        opacity: 0.65,
      });

      particleSystem = new THREE.Points(particleGeo, particleMat);
      scene.add(particleSystem);

      // 3. Ambient & Point Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambientLight);

      const violetLight = new THREE.PointLight(0x8b5cf6, 2.5, 60);
      violetLight.position.set(15, 10, 10);
      scene.add(violetLight);

      const cyanLight = new THREE.PointLight(0x06b6d4, 2.0, 60);
      cyanLight.position.set(-15, -10, 5);
      scene.add(cyanLight);

      // Events
      window.addEventListener('resize', onWindowResize, false);
      window.addEventListener('mousemove', onMouseMove, false);

      animate();
    } catch (e) {
      console.warn("WebGL initialization note, switching to canvas fallback:", e);
      initCanvasFallback();
    }
  }

  function onMouseMove(event) {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    targetRotationY = mouseX * 0.4;
    targetRotationX = -mouseY * 0.3;
  }

  function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animate() {
    requestAnimationFrame(animate);

    if (crystalMesh && wireframeMesh) {
      crystalMesh.rotation.y += 0.003;
      crystalMesh.rotation.x += 0.002;
      wireframeMesh.rotation.y -= 0.0025;
      wireframeMesh.rotation.z += 0.0015;

      // Parallax lerp
      crystalMesh.rotation.x += (targetRotationX - crystalMesh.rotation.x) * 0.05;
      crystalMesh.rotation.y += (targetRotationY - crystalMesh.rotation.y) * 0.05;
      wireframeMesh.rotation.x = crystalMesh.rotation.x;
      wireframeMesh.rotation.y = crystalMesh.rotation.y;
    }

    if (particleSystem) {
      particleSystem.rotation.y += 0.0006;
      particleSystem.rotation.x += 0.0003;
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  // Fallback procedural canvas constellation if CDN is offline
  function initCanvasFallback() {
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const nodes = [];
    const count = 65;

    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? 'rgba(139, 92, 246, 0.6)' : 'rgba(6, 182, 212, 0.6)',
      });
    }

    function renderFallback() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 0.5;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;

        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dist = Math.hypot(n.x - n2.x, n.y - n2.y);
          if (dist < 130) {
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.15 * (1 - dist / 130)})`;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(renderFallback);
    }

    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });

    renderFallback();
  }

  // Check script availability
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThree);
  } else {
    initThree();
  }
})();
