(() => {
  const TAU = Math.PI * 2;
  const clamp = (value, low, high) => Math.max(low, Math.min(value, high));
  const smooth = (a, b, value) => {
    const t = clamp((value - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const color = (hex) => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
  const hypot = (v) => Math.hypot(...v) || 1;
  const norm = (v) => { const n = hypot(v); return v.map(x => x / n); };
  const dot = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const sub = (a, b) => a.map((x, i) => x - b[i]);
  const matrix = () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
  function multiply(a, b) {
    const result = Array(16);
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) {
        result[c*4+r] = a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
      }
    }
    return result;
  }
  function transform(position, rotation = [0,0,0], scale = [1,1,1]) {
    const [x, y, z] = rotation;
    const cx = Math.cos(x), sx = Math.sin(x), cy = Math.cos(y), sy = Math.sin(y), cz = Math.cos(z), sz = Math.sin(z);
    const matrixX = [1,0,0,0, 0,cx,sx,0, 0,-sx,cx,0, 0,0,0,1];
    const matrixY = [cy,0,-sy,0, 0,1,0,0, sy,0,cy,0, 0,0,0,1];
    const matrixZ = [cz,sz,0,0, -sz,cz,0,0, 0,0,1,0, 0,0,0,1];
    const local = multiply(matrixZ, multiply(matrixY, matrixX));
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) local[i*4+j] *= scale[i];
      local[12+i] = position[i];
    }
    return local;
  }
  function cameraMatrix(eye, target, width, height) {
    const z = norm(sub(eye, target));
    const x = norm(cross([0,1,0], z));
    const y = cross(z, x);
    const view = [x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0, -dot(x,eye),-dot(y,eye),-dot(z,eye),1];
    const projection = [2/width,0,0,0, 0,2/height,0,0, 0,0,-2/30,0, 0,0,-1,1];
    return multiply(projection, view);
  }
  function random(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }
  const ivory = color(0xf5f1ef);
  const pearl = color(0xb9b5c4);
  const charcoal = color(0x44404e);
  const rosetteCenter = color(0x918899);
  const pink = color(0xcc9eac);
  const ink = color(0x322637);

  function fur(kind, seed) {
    const rand = random(seed);
    const spots = [];
    const mark = (direction, radius, ring = false, stretch = 1) => {
      const unit = norm(direction);
      const across = norm(cross(Math.abs(unit[1]) > .94 ? [1,0,0] : [0,1,0], unit));
      spots.push({ unit, radius, ring, stretch, across, up: cross(unit, across), phase: rand() * TAU });
    };
    if (kind === 'head') {
      const pattern = [
        [-.16,.73,.66,.068], [.03,.60,.79,.07], [.19,.79,.62,.07], [.30,.62,.72,.09],
        [-.34,.62,.72,.078], [-.44,.79,.49,.082], [.47,.74,.5,.10],
        [-.67,.53,.48,.13], [.66,.54,.48,.125], [-.80,.08,.56,.12], [.82,.11,.53,.11],
        [-.84,-.18,.51,.12], [.85,-.17,.48,.115], [-.76,-.40,.50,.11], [.76,-.37,.51,.1],
        [-.09,.90,.43,.10], [.26,.94,.24,.09], [-.26,.96,.20,.105], [.53,.81,.2,.1]
      ];
      pattern.forEach(([x,y,z,r]) => mark([x,y,z],r,false,.72));
    }
    if (kind !== 'plain' && kind !== 'ear') {
      const count = kind === 'head' ? 34 : kind === 'body' ? 59 : 32;
      const spin = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < count; i++) {
        const y = 1 - 2 * (i + .5) / count;
        const r = Math.sqrt(1 - y*y);
        const direction = [r*Math.sin(i*spin+seed), y, r*Math.cos(i*spin+seed)];
        if (kind === 'head' && direction[2] > .35) continue;
        if (kind === 'body' && direction[2] > .58 && Math.abs(direction[0]) < .65) continue;
        mark(direction, .085 + rand()*.115, (kind === 'body' || kind === 'head') && rand() < .62, .7 + rand()*.56);
      }
    }
    return (x, y, z) => {
      const dark = kind === 'head' ? clamp((y+.15)*.25 + (1-z)*.23, 0, .55) : clamp((1-z)*.25 + Math.max(0,y)*.12, 0, .62);
      const grain = Math.sin(x*48+y*92+z*61) * Math.cos(z*91+x*61) * .024;
      let shade = mix(ivory, pearl, dark + grain);
      if (kind === 'plain') return shade;
      if (kind === 'ear') return mix(pearl, charcoal, .31 + .31 * smooth(-.1,.94,y));
      for (const spot of spots) {
        if (dot([x,y,z], spot.unit) < .945) continue;
        const angleX = dot([x,y,z], spot.across) / spot.stretch;
        const angleY = dot([x,y,z], spot.up);
        const angle = Math.atan2(angleY, angleX);
        const edge = 1 + .15*Math.sin(3*angle+spot.phase) + .075*Math.cos(5*angle+spot.phase);
        const d = Math.hypot(angleX, angleY) / (spot.radius * edge);
        if (d > 1.06) continue;
        const middle = spot.ring ? .51 + .13*Math.sin(angle*2+spot.phase) : 0;
        const pigment = spot.ring ? mix(rosetteCenter, charcoal, smooth(middle-.1,middle+.11,d)) : charcoal;
        shade = mix(shade, pigment, .93*(1-smooth(.78,1.06,d)));
      }
      return shade;
    };
  }
  const plain = fur('plain', 1);

  function createStage(canvas) {
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true });
    if (!gl) throw new Error('WebGL unavailable');
    function shader(type, source) {
      const result = gl.createShader(type);
      gl.shaderSource(result, source);
      gl.compileShader(result);
      if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result));
      return result;
    }
    const vertexShader = shader(gl.VERTEX_SHADER, `
      attribute vec3 aPosition, aNormal, aColor;
      attribute float aOpacity;
      uniform mat4 uProjection, uWorld;
      varying vec3 vNormal, vColor, vWorld, vLocal;
      varying float vOpacity;
      void main() {
        vec4 world = uWorld * vec4(aPosition, 1.0);
        vWorld = world.xyz;
        vLocal = aPosition;
        vNormal = mat3(uWorld) * aNormal;
        vColor = aColor;
        vOpacity = aOpacity;
        gl_Position = uProjection * world;
      }`);
    const fragmentShader = shader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      uniform float uGloss, uFlat;
      uniform vec3 uEye;
      varying vec3 vNormal, vColor, vWorld, vLocal;
      varying float vOpacity;
      void main() {
        vec3 n = normalize(vNormal);
        vec3 light = normalize(vec3(-3.6, 6.5, 5.0));
        vec3 view = normalize(uEye - vWorld);
        float key = max(dot(n, light), 0.0);
        float fill = max(dot(n, normalize(vec3(3.0, 3.0, -4.0))), 0.0);
        float rim = pow(1.0 - max(dot(n, view), 0.0), 3.0);
        float spec = pow(max(dot(n, normalize(light + view)), 0.0), 33.0) * uGloss;
        vec3 shade = vColor * vec3(.66 + .36*key + .13*fill, .62 + .38*key + .13*fill, .72 + .31*key + .16*fill);
        shade += vec3(.40,.34,.62) * rim * .13 + vec3(1.0,.96,.98) * spec;
        float noise = fract(sin(dot(vLocal, vec3(57.71,39.48,24.69)))*1431.34) - .5;
        shade += noise * .027 * (1.0-uGloss);
        gl_FragColor = vec4(mix(shade, vColor, uFlat) * vOpacity, vOpacity);
      }`);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const attributes = ['aPosition','aNormal','aColor','aOpacity'].map(name => gl.getAttribLocation(program, name));
    const uniform = Object.fromEntries(['uProjection','uWorld','uGloss','uFlat','uEye'].map(name => [name,gl.getUniformLocation(program,name)]));
    attributes.forEach(index => gl.enableVertexAttribArray(index));
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    function mesh(vertices, faces, gloss = 0, flat = false) {
      const vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
      const indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(faces), gl.STATIC_DRAW);
      return { vertexBuffer, indexBuffer, count: faces.length, gloss, flat };
    }
    function draw(geometry, world) {
      gl.bindBuffer(gl.ARRAY_BUFFER, geometry.vertexBuffer);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.indexBuffer);
      attributes.forEach((index, i) => gl.vertexAttribPointer(index, i === 3 ? 1 : 3, gl.FLOAT, false, 40, i*12));
      gl.uniformMatrix4fv(uniform.uWorld, false, world);
      gl.uniform1f(uniform.uGloss, geometry.gloss);
      gl.uniform1f(uniform.uFlat, geometry.flat ? 1 : 0);
      gl.drawElements(gl.TRIANGLES, geometry.count, gl.UNSIGNED_SHORT, 0);
    }
    function surface(uSteps, vSteps, point, gloss, flat) {
      const vertices = [], faces = [];
      for (let j = 0; j <= vSteps; j++) {
        for (let i = 0; i <= uSteps; i++) {
          vertices.push(...point(i/uSteps, j/vSteps));
          if (i === uSteps || j === vSteps) continue;
          const a = j*(uSteps+1)+i, b = a+uSteps+1;
          faces.push(a,b,a+1,a+1,b,b+1);
        }
      }
      return mesh(vertices, faces, gloss, flat);
    }
    function ellipsoid(size, shade, gloss = 0, detail = 28, shape = 0) {
      return surface(detail, Math.ceil(detail*.7), (u,v) => {
        const longitude = u*TAU, latitude = v*Math.PI;
        const x = Math.sin(latitude)*Math.sin(longitude), y = Math.cos(latitude), z = Math.sin(latitude)*Math.cos(longitude);
        const taper = 1 + shape*y;
        return [
          x*size[0]*taper, y*size[1], z*size[2],
          ...norm([x/size[0],(y-shape*x*x)/size[1],z/size[2]]),
          ...(typeof shade === 'function' ? shade(x,y,z) : shade), 1
        ];
      }, gloss);
    }
    function pipe(points, radii, shade, lengthSteps = 48, aroundSteps = 28) {
      function sample(u) {
        const edge = points.length - 1;
        const index = Math.min(Math.floor(u*edge), edge-1), t = u*edge-index;
        const p = points[index], q = points[index+1];
        const a = points[Math.max(0,index-1)], b = points[Math.min(edge,index+2)];
        return p.map((x,i) => .5*((2*x)+(-a[i]+q[i])*t+(2*a[i]-5*x+4*q[i]-b[i])*t*t+(-a[i]+3*x-3*q[i]+b[i])*t*t*t));
      }
      return surface(aroundSteps, lengthSteps, (angle,v) => {
        const angleRadians = angle*TAU;
        const p = sample(v);
        const dir = norm(sub(sample(Math.min(1,v+.001)), sample(Math.max(0,v-.001))));
        const across = norm(cross(Math.abs(dir[2]) > .95 ? [0,1,0] : [0,0,1], dir));
        const up = cross(dir, across);
        const n = across.map((x,i) => x*Math.cos(angleRadians)+up[i]*Math.sin(angleRadians));
        const interval = v*(radii.length-1), index = Math.min(Math.floor(interval), radii.length-2);
        const radius = radii[index] + (radii[index+1]-radii[index])*(interval-index);
        const tint = typeof shade === 'function' ? shade(angleRadians,v) : shade;
        return [...p.map((x,i) => x+n[i]*radius), ...n, ...tint, 1];
      });
    }
    function ring(inner, outer, y, tint, opacity = () => 1, arc = TAU, origin = 0) {
      return surface(Math.max(2, Math.ceil(100*arc/TAU)), 8, (u,v) => {
        const radius = inner + (outer-inner)*v;
        const angle = u*arc+origin;
        return [Math.sin(angle)*radius, y, Math.cos(angle)*radius, 0,1,0, ...tint, opacity(v)];
      }, 0, true);
    }
    function node(parent, position = [0,0,0], geometry = null, rotation = [0,0,0]) {
      const object = { position, rotation, scale: [1,1,1], children: [], geometry };
      if (parent) parent.children.push(object);
      return object;
    }
    function part(parent, position, size, shade, rotation, gloss = 0, detail, shape) {
      return node(parent, position, ellipsoid(size, shade, gloss, detail, shape), rotation);
    }
    function renderNode(object, parentWorld) {
      const world = multiply(parentWorld, transform(object.position, object.rotation, object.scale));
      if (object.geometry) draw(object.geometry, world);
      object.children.forEach(child => renderNode(child, world));
    }

    const floor = node(null);
    node(floor, [0,0,0], ring(0,2.21,-.105,color(0xb6a5ec)));
    node(floor, [0,0,0], ring(2.20,2.22,-.104,color(0xe8dcff)));
    node(floor, [0,0,0], surface(120,1, (u,v) => {
      const angle = u*TAU;
      return [Math.sin(angle)*2.21, -.104+v*.105, Math.cos(angle)*2.21, Math.sin(angle),0,Math.cos(angle),
        ...mix(color(0x9781dd),color(0xcbbaef),v),1];
    },0,true));
    node(floor, [0,0,0], surface(120,24, (u,v) => {
      const a = u*TAU;
      const hue = mix(color(0xe9e3ff),color(0xcab9f7), v*.75);
      return [Math.sin(a)*2.21*v,.002,Math.cos(a)*2.21*v,0,1,0,...hue,1];
    },0,true));
    node(floor, [0,0,0], ring(2.05,2.078,.009,color(0xf8f3ff)));
    node(floor, [0,0,0], ring(1.67,1.684,.009,color(0xf7f1ff),() => .63));
    for (let i = 0; i < 24; i++) {
      node(floor, [0,0,0], ring(1.87,1.90,.009,color(0xf9f3ff),() => .8,.048,i*TAU/24));
    }
    const shadow = ring(0,1,.018,color(0x46336d), v => .32*Math.pow(1-v*v,3));
    const floorGlow = ring(0,1,-.13,color(0x7251b2), v => .16*Math.pow(1-v*v,2));
    const root = node(null, [0,0,0]);
    const body = node(root, [0,1.10,0]);
    part(body,[0,0,-.10],[.64,.81,.47],fur('body',11),undefined,0,86,-.10);
    part(body,[0,.035,.262],[.45,.64,.24],plain,undefined,0,48,.18);
    part(body,[0,.56,.01],[.53,.45,.45],fur('body',17),undefined,0,60,.09);
    part(body,[0,.42,.30],[.42,.40,.23],plain,undefined,0,42,.1);

    const tail = node(body,[.02,-.54,-.38]);
    node(tail,[0,0,0],pipe(
      [[0,0,0],[.44,-.17,-.28],[.90,-.19,-.39],[1.30,-.10,-.30],[1.52,.12,-.16],[1.52,.38,-.08],[1.38,.52,.04],[1.23,.50,.09]],
      [.196,.196,.173,.145,.137,.122,.088,.001],
      (angle,t) => {
        const wave = Math.sin(44*t + .78*Math.sin(angle*3.0)+.53*Math.cos(angle*7+t*13));
        return mix(mix(ivory,pearl,.35), charcoal, Math.max(smooth(.14,.89,wave)*.82,smooth(.92,.985,t)*.93));
      },76,38
    ));

    const head = node(body,[0,1.03,.02]);
    part(head,[0,0,0],[.91,.74,.68],fur('head',8),undefined,0,116,-.095);
    for (const side of [-1,1]) {
      const ear = node(head,[side*.65,.55,-.04],null,[0,side*.14,-side*.39]);
      part(ear,[0,.111,0],[.245,.34,.166],fur('ear',7),undefined,0,45,.07);
      part(ear,[0,.125,.103],[.185,.24,.078],color(0xb29aab),undefined,0,34);
      part(ear,[0,.086,.123],[.146,.177,.064],color(0x8b7c93),undefined,0,34);
      part(ear,[-side*.043,.011,.16],[.138,.12,.052],plain,[0,0,side*.54],0,34);
      for (let i = 0; i < 4; i++) {
        part(ear,[-side*(.04+i*.021),.075+i*.019,.169],[.032,.094-i*.011,.028],plain,[.03,0,-side*(.51+i*.16)],0,16);
      }
      const eye = node(head,[side*.396,.114,.565],null,[0,side*.34,side*.13]);
      part(eye,[0,0,0],[.31,.311,.141],color(0xd9d2d7),undefined,0,48,-.18);
      part(eye,[0,.006,.044],[.268,.264,.147],color(0x34303b),undefined,.1,52,-.13);
      part(eye,[-side*.011,-.003,.092],[.229,.234,.12],(x,y,z) => {
        const r = Math.hypot(x*.98,y);
        const striation = Math.sin(Math.atan2(y,x)*37 + r*10)*.05;
        const iris = smooth(.45,.8,r)*(1-smooth(.83,1.04,r));
        return mix(color(0x191623), color(0x82748d),iris*(.47+striation)*(1-y*.35));
      },undefined,.36,54);
      part(eye,[-.066,.086,.201],[.048,.059,.014],color(0xfffcff),[.08,0,-.37],.06,26);
      part(eye,[.052,.117,.189],[.017,.02,.011],color(0xf1eaff),undefined,.08,18);
      part(eye,[.083,-.092,.181],[.027,.015,.010],color(0xa6a1bd),[0,0,.41],.03,18);
    }
    part(head,[0,-.410,.406],[.39,.264,.277],plain,undefined,0,47,.15);
    part(head,[0,-.069,.554],[.225,.33,.159],(x,y,z) => mix(color(0xd0c8d0),ivory,smooth(-.4,1,y)),undefined,0,48,.1);
    for (const side of [-1,1]) {
      part(head,[side*.198,-.285,.612],[.281,.192,.195],plain,[0,side*.08,side*.13],0,50);
      const rand = random(side+34);
      for (let i = 0; i < 7; i++) {
        const x = .20 + rand()*.24, y = -.234-rand()*.111;
        const surface = Math.sqrt(Math.max(.07,1-((x-.198)/.29)**2-((y+.285)/.193)**2));
        part(head,[side*x,y,.628+.185*surface],[.013,.009,.008],color(0x756b7a),undefined,0,13);
      }
      node(head,[0,0,0],pipe([[0,-.274,.801],[side*.011,-.359,.804],[side*.072,-.397,.788],[side*.134,-.386,.775]], [.008,.011,.009,.003], ink,17,8));
      for (let i = 0; i < 3; i++) {
        const y = -.258-i*.05;
        node(head,[0,0,0],pipe(
          [[side*.31,y,.784],[side*.51,y+.024-i*.018,.766],[side*.75,y+.05-i*.035,.671],[side*(.99-i*.045),y+.055-i*.057,.554]],
          [.008,.007,.0045,.001],color(0xe5dae4),14,8));
      }
    }
    part(head,[0,-.180,.728],[.146,.101,.099],color(0x695368),[0,0,0],.16,48,.56);
    part(head,[0,-.157,.789],[.121,.062,.041],color(0x836a7c),undefined,.18,38,.28);
    part(head,[-.032,-.141,.829],[.038,.011,.008],color(0xb18fa4),[0,0,.12],.07,20);
    for (const side of [-1,1]) {
      part(head,[side*.074,-.204,.789],[.038,.018,.017],ink,[0,side*.14,side*.26],0,26);
    }

    function paw(parent, position, size) {
      const group = node(parent,position);
      const [x,y,z] = size;
      part(group,[0,0,0],size,plain,undefined,0,44);
      part(group,[0,-y*.05,z*.93],[x*.56,y*.45,z*.14],color(0x766278),undefined,.07,41,-.18);
      for (let i = 0; i < 4; i++) {
        const toeX = (i-1.5)*x*.38, toeY = y*(.53+.22*Math.sin(i*Math.PI/3));
        part(group,[toeX,toeY,z*.12],[x*.245,y*.40,z*.73],plain,[0,0,(i-1.5)*-.07],0,26);
        part(group,[toeX,toeY,z*.79],[x*.152,y*.208,z*.13],pink,[0,0,(i-1.5)*-.11],.08,25);
      }
      return group;
    }

    const legs = [], arms = [];
    for (const side of [-1,1]) {
      const leg = node(root,[side*.366,.63,-.033]);
      part(leg,[0,-.194,0],[.253,.4,.265],fur('limb',22+side),[.09,0,side*.17],0,60);
      const foot = paw(leg,[0,-.398,.145],[.237,.161,.239]);
      foot.rotation[0] = Math.PI/2;
      legs.push(leg);

      const arm = node(body,[side*.506,.34,.021],null,[0,0,side*.40]);
      part(arm,[side*.059,-.212,0],[.237,.398,.235],fur('limb',37+side),[0,0,side*.11],0,72);
      const forearm = node(arm,[side*.075,-.468,.005],null,[-.23,0,0]);
      part(forearm,[0,-.068,0],[.176,.261,.176],fur('limb',52+side),undefined,0,53);
      const hand = paw(forearm,[0,-.231,.031],[.201,.185,.168]);
      hand.rotation[2] = Math.PI;
      arms.push({ arm, forearm, hand });
    }

    function pose(dance, time) {
      const phase = time*TAU;
      const rhythm = Math.sin(phase*.77);
      root.position = [0,0,0];
      root.rotation = [0,0,0];
      body.position = [0,1.10,0];
      body.rotation = [0,0,0];
      head.rotation = [0,-.08,.045];
      head.position[1] = 1.03;
      tail.rotation = [0, -.12 + Math.sin(phase*.75)*.19, .09 + rhythm*.10];
      arms.forEach(({arm, forearm, hand}, i) => {
        const side = i*2-1;
        arm.rotation = [-.11,0,side*.37];
        forearm.rotation = [-.32,0,0];
        hand.rotation = [0,0,Math.PI];
        legs[i].position = [side*.366,.641,-.033];
        legs[i].rotation = [0,0,side*.045];
      });
      if (dance === 'wave') {
        const wave = Math.sin(phase*1.30);
        body.rotation[2] = -.09+rhythm*.039;
        root.rotation[1] = -.11;
        head.rotation = [rhythm*.035,-.04,.12+rhythm*.065];
        arms[0].arm.rotation = [-1.40,0,-.32+wave*.13];
        arms[0].forearm.rotation = [-.87,0,.19+wave*.22];
        arms[0].hand.rotation = [2.19,0,.09+wave*.16];
        arms[1].arm.rotation[2] = .37+rhythm*.20;
      } else if (dance === 'hop') {
        const jump = Math.pow(Math.max(0,Math.sin(phase*.91)),1.5);
        const crouch = Math.max(0,-Math.sin(phase*.91));
        root.position[1] = jump*.66;
        body.position[1] -= .12*crouch;
        head.rotation = [.11*crouch-.12*jump,-.12,.05*rhythm];
        arms.forEach(({arm,forearm},i) => {
          arm.rotation = [-.17-.92*jump,0,(i*2-1)*(.37+.51*jump)];
          forearm.rotation[0] = -.27-.57*jump;
          legs[i].rotation[0] = .42*jump-.11*crouch;
        });
      } else if (dance === 'spin') {
        const cycle = (time/2.05)%1;
        const progress = smooth(.11,.87,cycle);
        const turn = Math.sin(progress*Math.PI);
        root.rotation[1] = TAU*progress;
        root.position[1] = .14*turn;
        body.rotation[2] = -.13*turn;
        head.rotation[1] = -.27*Math.sin(progress*TAU);
        arms.forEach(({arm,forearm},i) => {
          arm.rotation = [-.69-.35*turn,0,(i*2-1)*(.28+.52*turn)];
          forearm.rotation[0] = -.49;
          legs[i].position[0] *= 1-.28*turn;
        });
      } else {
        root.position[0] = rhythm*.27;
        root.position[1] = .024+.055*Math.abs(Math.cos(phase*.77));
        root.rotation[1] = rhythm*.19;
        body.rotation[2] = -.16*rhythm;
        head.rotation = [.026*Math.cos(phase*1.54),-.09+rhythm*.09,.10*rhythm];
        arms.forEach(({arm,forearm},i) => {
          const side = i*2-1;
          const swing = Math.sin(phase*.77+side*.91);
          arm.rotation = [-.19-Math.max(swing,0)*.74,0,side*(.47+side*rhythm*.27)];
          forearm.rotation[0] = -.31-Math.max(swing,0)*.8;
          legs[i].position[0] += side*.24*Math.max(0,rhythm*side);
          legs[i].position[1] += .13*Math.max(0,rhythm*-side);
          legs[i].rotation[2] += side*.18*Math.max(0,rhythm*side);
        });
      }
    }

    function render({dance, time, yaw, pitch, zoom}) {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const width = Math.max(1,Math.round(canvas.clientWidth*dpr));
      const height = Math.max(1,Math.round(canvas.clientHeight*dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0,0,width,height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const ratio = width / height;
      const sceneHeight = Math.max(4.50,4.63/ratio) / zoom;
      const angle = .24 + pitch;
      const eye = [Math.sin(yaw)*Math.cos(angle)*10, 1.65+Math.sin(angle)*10, Math.cos(yaw)*Math.cos(angle)*10];
      const view = cameraMatrix(eye,[0,1.50,0],sceneHeight*ratio,sceneHeight);
      gl.uniformMatrix4fv(uniform.uProjection,false,view);
      gl.uniform3fv(uniform.uEye,eye);
      pose(dance,time);
      gl.depthMask(false);
      draw(floorGlow,transform([0,0,.11],[0,0,0],[2.59,1,2.35]));
      gl.depthMask(true);
      renderNode(floor,matrix());
      gl.depthMask(false);
      const lift = root.position[1];
      draw(shadow,transform([root.position[0]*.85,0,-.07],[0,0,0],[1.0+lift*.3,1,.81+lift*.23]));
      draw(shadow,transform([root.position[0]+.34,0,.25],[0,0,0],[.37,1,.27]));
      draw(shadow,transform([root.position[0]-.33,0,.25],[0,0,0],[.37,1,.27]));
      gl.depthMask(true);
      renderNode(root,matrix());
    }
    return { render };
  }
  window.createSnowStage = createStage;
})();
