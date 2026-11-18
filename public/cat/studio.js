(() => {
  const icons = {
    paw: '<ellipse cx="4.5" cy="9" rx="2.2" ry="2.9" transform="rotate(-24 4.5 9)"/><ellipse cx="9" cy="5.8" rx="2.2" ry="3.1" transform="rotate(-12 9 5.8)"/><ellipse cx="15" cy="5.8" rx="2.2" ry="3.1" transform="rotate(12 15 5.8)"/><ellipse cx="19.5" cy="9" rx="2.2" ry="2.9" transform="rotate(24 19.5 9)"/><path d="M12 10.5c2.5 0 3.6 2.2 5.1 3.8 1.5 1.5 2 2.9 1.1 4.4-.8 1.4-2.5 1.7-4.1 1.1a5.1 5.1 0 0 0-4.2 0c-1.6.6-3.3.3-4.1-1.1-.9-1.5-.4-2.9 1.1-4.4 1.5-1.6 2.6-3.8 5.1-3.8Z"/>',
    sparkle: '<path d="M12 2c.8 6.1 3.9 9.2 10 10-6.1.8-9.2 3.9-10 10-.8-6.1-3.9-9.2-10-10 6.1-.8 9.2-3.9 10-10Z"/>',
    reset: '<path d="M3 10a9 9 0 1 1 1.5 7.5M3 4v6h6"/>',
    fullscreen: '<path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/>',
    collapse: '<path d="M4 9h5V4m11 5h-5V4m-6 16v-5H4m11 5v-5h5"/>',
    orbit: '<ellipse cx="12" cy="12" rx="9" ry="4.5" transform="rotate(-24 12 12)"/><circle cx="12" cy="12" r="1.5"/><path d="M19 6h2m-1-1v2"/>',
    music: '<path d="M9 18V6l12-3v12M9 9l12-3"/><ellipse cx="6" cy="18" rx="3" ry="2.4"/><ellipse cx="18" cy="15" rx="3" ry="2.4"/>',
    step: '<path d="m5 5 3 3-3 3m5-3H3m16 5-3 3 3 3m-5-3h7"/>',
    hop: '<path d="M12 19V4m-5 5 5-5 5 5M5 15v4m14-4v4"/>',
    spin: '<path d="M20 8a8 8 0 1 0 .4 6M20 3v5h-5"/><circle cx="12" cy="12" r="1.3"/>',
    wave: '<path d="M8 13V7a1.3 1.3 0 1 1 2.6 0v3-5a1.3 1.3 0 1 1 2.6 0v5-4a1.3 1.3 0 1 1 2.6 0v5-2a1.3 1.3 0 1 1 2.6 0v6.2c0 3.2-2 5.3-5.2 5.3H12c-2.1 0-3.4-.8-4.4-2.4L5.1 14a1.45 1.45 0 0 1 2.4-1.6l.5.6Z"/>',
    pause: '<path d="M9 5h-2v14h2zm8 0h-2v14h2z"/>',
    play: '<path d="m8 5 12 7-12 7z"/>'
  };
  function icon(target, name) {
    const filled = ['paw','sparkle','pause','play'].includes(name);
    const style = filled ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"';
    target.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" ' + style + '>' + icons[name] + '</svg>';
  }
  document.querySelectorAll('[data-icon]').forEach(element => icon(element, element.dataset.icon));
  const snow = document.querySelector('.snow');
  let seed = 27;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 53; i++) {
    const mote = document.createElement('i');
    const star = i % 10 === 0;
    if (star) {
      mote.textContent = '✦';
      mote.className = 'star';
    }
    mote.style.setProperty('--x', (3 + rand()*94) + '%');
    mote.style.setProperty('--y', (6 + rand()*85) + '%');
    mote.style.setProperty('--size', (star ? 12 + rand()*12 : 1 + rand()*4) + 'px');
    mote.style.setProperty('--opacity', .28 + rand()*.55);
    snow.append(mote);
  }

  const viewport = document.getElementById('viewport');
  const canvas = document.getElementById('stage');
  const renderError = document.getElementById('render-error');
  const speedInput = document.getElementById('speed');
  const speedValue = document.getElementById('speed-value');
  const play = document.getElementById('play');
  const playLabel = document.getElementById('play-label');
  const full = document.getElementById('fullscreen');
  const dances = [...document.querySelectorAll('.dance')];
  const state = { dance: 'step', time: .18, yaw: .04, pitch: 0, zoom: 1 };
  let running = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let speed = 1;
  let stage;
  let lastFrame = null;
  let needsFrame = true;

  function initialize() {
    try {
      stage = window.createSnowStage(canvas);
      renderError.hidden = true;
      needsFrame = true;
    } catch (error) {
      console.error(error);
      renderError.hidden = false;
    }
  }
  initialize();
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    stage = null;
    renderError.hidden = false;
  });
  canvas.addEventListener('webglcontextrestored', initialize);

  function updatePlay() {
    playLabel.textContent = running ? '일시정지' : '재생';
    icon(play.querySelector('[data-icon]'), running ? 'pause' : 'play');
    document.querySelector('.stage-state').classList.toggle('paused', !running);
    needsFrame = true;
  }
  function togglePlay() {
    running = !running;
    updatePlay();
  }
  updatePlay();
  play.addEventListener('click', togglePlay);
  dances.forEach(button => button.addEventListener('click', () => {
    if (state.dance !== button.dataset.dance) state.time = .18;
    state.dance = button.dataset.dance;
    dances.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.getElementById('now-playing').textContent = button.querySelector('strong').textContent;
    running = true;
    updatePlay();
  }));
  speedInput.addEventListener('input', () => {
    speed = Number(speedInput.value);
    speedValue.value = speed.toFixed(1) + '×';
    speedInput.setAttribute('aria-valuetext', speed.toFixed(1) + '배');
    speedInput.style.setProperty('--progress', (speed-.5)*100 + '%');
  });

  function resetView() {
    state.yaw = .04;
    state.pitch = 0;
    state.zoom = 1;
    needsFrame = true;
  }
  document.getElementById('reset-view').addEventListener('click', resetView);
  function setZoom(value) {
    state.zoom = Math.min(1.85, Math.max(.72, value));
    needsFrame = true;
  }
  const contacts = new Map();
  const distance = ([a,b]) => Math.hypot(a.x-b.x,a.y-b.y);
  const coords = event => ({x: event.clientX, y: event.clientY});
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || contacts.size >= 2) return;
    canvas.setPointerCapture(event.pointerId);
    contacts.set(event.pointerId, coords(event));
  });
  canvas.addEventListener('pointermove', event => {
    const previous = contacts.get(event.pointerId);
    if (!previous) return;
    const next = coords(event);
    const before = contacts.size === 2 ? distance([...contacts.values()]) : 0;
    contacts.set(event.pointerId, next);
    if (contacts.size === 2) {
      if (before > 0) setZoom(state.zoom * distance([...contacts.values()]) / before);
      return;
    }
    state.yaw = (state.yaw - (next.x-previous.x)*.011) % (Math.PI*2);
    state.pitch = Math.min(.6, Math.max(-.22, state.pitch + (next.y-previous.y)*.006));
    needsFrame = true;
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(type => canvas.addEventListener(type, event => contacts.delete(event.pointerId)));
  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1;
    setZoom(state.zoom * Math.exp(-event.deltaY * unit * .0012));
  }, {passive: false});
  canvas.addEventListener('keydown', event => {
    const keys = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') state.yaw += .15;
    if (event.key === 'ArrowRight') state.yaw -= .15;
    if (event.key === 'ArrowUp') state.pitch = Math.min(.6,state.pitch+.12);
    if (event.key === 'ArrowDown') state.pitch = Math.max(-.22,state.pitch-.12);
    if (event.key === '+' || event.key === '=') setZoom(state.zoom*1.12);
    if (event.key === '-') setZoom(state.zoom/1.12);
    if (event.key === 'Home') resetView();
    needsFrame = true;
  });

  function syncFull() {
    const expanded = document.fullscreenElement === viewport || viewport.classList.contains('expand');
    const text = expanded ? '전체 화면 닫기' : '전체 화면';
    full.title = text;
    full.setAttribute('aria-label', text);
    icon(full, expanded ? 'collapse' : 'fullscreen');
    needsFrame = true;
  }
  full.addEventListener('click', async () => {
    if (viewport.classList.contains('expand')) {
      viewport.classList.remove('expand');
    } else if (document.fullscreenElement === viewport) {
      await document.exitFullscreen();
    } else {
      try {
        await viewport.requestFullscreen();
      } catch {
        viewport.classList.add('expand');
      }
    }
    syncFull();
  });
  document.addEventListener('fullscreenchange', syncFull);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && viewport.classList.contains('expand')) {
      viewport.classList.remove('expand');
      syncFull();
    }
    if (event.code !== 'Space' || event.repeat || event.target.closest?.('input, textarea, button, a, [contenteditable]')) return;
    event.preventDefault();
    togglePlay();
  });
  if ('ResizeObserver' in window) new ResizeObserver(() => { needsFrame = true; }).observe(viewport);
  window.addEventListener('resize', () => { needsFrame = true; });

  function frame(timestamp) {
    const delta = lastFrame === null ? 0 : Math.min(.045, (timestamp-lastFrame)/1000);
    lastFrame = timestamp;
    if (running) state.time += delta*speed;
    if (stage && (running || needsFrame)) stage.render(state);
    needsFrame = false;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
