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
precision mediump float;
uniform float t;
uniform vec2 res;

vec3 hash3(vec2 p){
  vec3 q=vec3(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)),dot(p,vec2(419.2,371.9)));
  return fract(sin(q)*43758.5453);
}

float voronoi(vec2 x, float spd){
  vec2 n=floor(x), f=fract(x);
  float md=8.;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
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
  for(int i=0;i<3;i++){
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
    let visible = true;

    function frame(ts: number) {
      if (!visible) { rafId = requestAnimationFrame(frame); return; }
      if (!start) start = ts;
      const elapsed = (ts - start) / 1000;
      gl!.uniform1f(tLoc, elapsed);
      gl!.uniform2f(rLoc, canvas!.width, canvas!.height);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);

    const observer = new IntersectionObserver(
      ([entry]) => { visible = entry.isIntersecting; },
      { threshold: 0 }
    );
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
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
