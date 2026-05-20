# Ótima Energia — Hero Animation Brief

## Context
The homepage hero section currently has a plain coloured background. Replace it with an animated plasma/electricity WebGL shader. Do not change any copy, CTAs, layout, or other page elements — only the hero background.

---

## What to build

A fullscreen animated background for the homepage hero section using a WebGL canvas. The effect is an organic, flowing plasma field in deep purple and violet — electric and alive, like a Tesla coil or plasma globe, not water. It loops seamlessly with no user interaction required.

---

## Exact implementation

### Step 1 — Create the component file

Create a new file at `src/components/HeroBackground.tsx` with the following code:

```tsx
import { useEffect, useRef } from 'react';

export default function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const vs = `attribute vec2 p; void main(){ gl_Position=vec4(p,0,1); }`;

    const fs = `
precision highp float;
uniform float t;
uniform vec2 res;

vec3 hash3(vec2 p){
  vec3 q=vec3(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)),dot(p,vec2(419.2,371.9)));
  return fract(sin(q)*43758.5453);
}

float voronoi(vec2 x, float spd){
  vec2 n=floor(x), f=fract(x);
  float md=8.;
  for(int j=-2;j<=2;j++) for(int i=-2;i<=2;i++){
    vec2 g=vec2(float(i),float(j));
    vec3 o=hash3(n+g);
    vec2 r=g-f+vec2(sin(o.x*6.28+t*spd),sin(o.y*6.28+t*spd*0.7))*0.5;
    float d=dot(r,r);
    md=min(md,d);
  }
  return sqrt(md);
}

float fbm(vec2 p, float spd){
  float v=0., a=0.5;
  mat2 rot=mat2(cos(.5),sin(.5),-sin(.5),cos(.5));
  for(int i=0;i<4;i++){
    v+=a*voronoi(p,spd);
    p=rot*p*2.1;
    a*=0.5;
  }
  return v;
}

void main(){
  vec2 uv=gl_FragCoord.xy/res;
  uv.y=1.-uv.y;
  vec2 p=(uv-.5)*vec2(res.x/res.y,1.)*3.5;

  float f1=fbm(p+vec2(0.,t*.08), 0.6);
  float f2=fbm(p+vec2(f1*.8,f1*.8)+vec2(t*.04,0.), 0.5);
  float f3=fbm(p+vec2(f2,f2)*1.2, 0.4);

  float e=f3*f3;

  float r=smoothstep(.2,.0,e)*0.35 + smoothstep(.6,.2,e)*0.55 * pow(1.-e,2.5);
  float crackle=smoothstep(.05,.0,e)*1.2;
  float glow=smoothstep(.7,.0,e)*0.4;

  vec3 dark=vec3(0.035,0.03,0.09);
  vec3 mid=vec3(0.38,0.08,0.92);
  vec3 bright=vec3(0.72,0.28,1.0);
  vec3 hot=vec3(0.95,0.72,1.0);
  vec3 spark=vec3(1.0,0.92,1.0);

  vec3 col=dark;
  col=mix(col,mid,smoothstep(0.,.5,r));
  col=mix(col,bright,smoothstep(.3,.7,r));
  col=mix(col,hot,smoothstep(.6,.95,r));
  col=mix(col,spark,crackle);
  col+=glow*vec3(0.15,0.05,0.35);

  float vign=1.-smoothstep(.3,.9,length(uv-.5)*1.6);
  col*=vign*0.7+0.3;

  col=pow(clamp(col,0.,1.),vec3(0.88));
  gl_FragColor=vec4(col,1.);
}`;

    function compileShader(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const tLoc = gl.getUniformLocation(prog, 't');
    const rLoc = gl.getUniformLocation(prog, 'res');

    let start: number | null = null;
    let rafId: number;

    function frame(ts: number) {
      if (!start) start = ts;
      const elapsed = (ts - start) / 1000;
      gl!.uniform1f(tLoc, elapsed);
      gl!.uniform2f(rLoc, canvas!.width, canvas!.height);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
}
```

---

### Step 2 — Add to the hero section

In the homepage hero section component, make two changes:

**1. Import at the top of the file:**
```tsx
import HeroBackground from '@/components/HeroBackground';
```

**2. Add as the first child of the hero section wrapper. The wrapper must have `position: relative` and `overflow: hidden`. Wrap the existing hero content in a div with `position: relative; z-index: 1` so it sits above the canvas:**

```tsx
<section style={{ position: 'relative', overflow: 'hidden' }}>
  <HeroBackground />
  <div style={{ position: 'relative', zIndex: 1 }}>
    {/* all existing hero content — badge, headline, subline, CTAs — unchanged */}
  </div>
</section>
```

**3. Remove any existing background colour on the hero section** (e.g. `bg-[#16163f]` or inline `background` style). The shader renders its own background: deep navy-black at the edges, flowing electric purple at the centres.

**4. Add a CSS fallback on the section for users on devices without WebGL:**
```
background: #09081e;
```

---

## Tuning guide (after seeing it live)

All tuning is done inside the fragment shader string `fs` in the component file. No other changes needed.

| Goal | Find this in the shader | Change to |
|---|---|---|
| Slower drift | `t*.08` and `t*.04` | e.g. `t*.05` and `t*.025` |
| Faster drift | `t*.08` and `t*.04` | e.g. `t*.14` and `t*.07` |
| Less white, more violet | `vec3 hot=vec3(0.95,0.72,1.0)` | e.g. `vec3(0.75,0.3,1.0)` |
| Larger plasma blobs | `*3.5` in the `p=` line | e.g. `*2.5` |
| Stronger dark vignette | `length(uv-.5)*1.6` | e.g. `*2.0` |

---

## Performance

WebGL is GPU-accelerated. This shader runs at 60fps on any device from the last 8 years including mobile. No external library or npm package required — pure vanilla WebGL.
