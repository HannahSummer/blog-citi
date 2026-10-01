import { useEffect, useRef, useState } from 'react'

interface Props {
  src: string
  className?: string
  intensidade?: number
  velocidade?: number
}

const VERT = `
attribute vec2 a;
varying vec2 v;
void main() {
  v = a * 0.5 + 0.5;
  gl_Position = vec4(a, 0.0, 1.0);
}`

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v;
uniform sampler2D u_img;
uniform vec2 u_res;
uniform vec2 u_imgRes;
uniform float u_t;
uniform float u_int;

vec2 girar(vec2 p, vec2 c, float raio, float angulo, float asp) {
  vec2 d = (p - c) * vec2(asp, 1.0);
  float r = length(d);
  float a = angulo * exp(-(r / raio) * (r / raio));
  float ca = cos(a);
  float sa = sin(a);
  d = vec2(d.x * ca - d.y * sa, d.x * sa + d.y * ca);
  return d / vec2(asp, 1.0) + c;
}

void main() {
  float rc = u_res.x / u_res.y;
  float ri = u_imgRes.x / u_imgRes.y;
  vec2 s = rc > ri ? vec2(1.0, ri / rc) : vec2(rc / ri, 1.0);
  vec2 p = (vec2(v.x, 1.0 - v.y) - 0.5) * s + 0.5;

  float t = u_t;
  float asp = ri;
  float a1 = (0.8 * sin(t * 0.45) + 0.2 * sin(t * 0.23 + 1.0)) * 0.38 * u_int;
  p = girar(p, vec2(0.50, 0.56), 0.42, a1, asp);
  float a2 = sin(t * 0.38 + 2.0) * 0.45 * u_int;
  p = girar(p, vec2(0.08, 0.06), 0.22, a2, asp);
  float a3 = sin(t * 0.33 + 4.0) * 0.45 * u_int;
  p = girar(p, vec2(0.96, 0.96), 0.2, a3, asp);

  vec3 c = texture2D(u_img, clamp(p, 0.0, 1.0)).rgb;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  float diag = dot(v - 0.5, normalize(vec2(1.0, 0.55)));
  float pos = mod(t * 0.035, 2.4) - 1.2;
  float band = exp(-pow((diag - pos) * 4.0, 2.0));
  c += band * smoothstep(0.2, 0.7, l) * 0.16 * u_int * vec3(0.45, 1.0, 0.75);

  gl_FragColor = vec4(c, 1.0);
}`

function compilar(gl: WebGLRenderingContext, tipo: number, fonte: string): WebGLShader | null {
  const sh = gl.createShader(tipo)
  if (!sh) return null
  gl.shaderSource(sh, fonte)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('[HeroImagemGirando] shader:', gl.getShaderInfoLog(sh))
    gl.deleteShader(sh)
    return null
  }
  return sh
}

export default function HeroImagemGirando({ src, className = '', intensidade = 1, velocidade = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false })
    if (!gl) return

    const vs = compilar(gl, gl.VERTEX_SHADER, VERT)
    const fs = compilar(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return
    const prog = gl.createProgram()
    if (!prog) return
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const aLoc = gl.getAttribLocation(prog, 'a')
    gl.enableVertexAttribArray(aLoc)
    gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0)

    const u = {
      res: gl.getUniformLocation(prog, 'u_res'),
      imgRes: gl.getUniformLocation(prog, 'u_imgRes'),
      t: gl.getUniformLocation(prog, 'u_t'),
      int: gl.getUniformLocation(prog, 'u_int'),
    }

    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0
    let visivel = true
    let carregada = false
    let tempo = 0
    let ultimo = 0

    const desenhar = () => {
      if (!carregada) return
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(u.res, canvas.width, canvas.height)
      gl.uniform1f(u.t, tempo)
      gl.uniform1f(u.int, reduzir.matches ? 0 : intensidade)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    const redimensionar = () => {
      const { width, height } = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      desenhar()
    }

    const quadro = (agora: number) => {
      const dt = ultimo ? Math.min((agora - ultimo) / 1000, 0.1) : 0
      ultimo = agora
      tempo += dt * velocidade
      desenhar()
      raf = requestAnimationFrame(quadro)
    }
    const iniciar = () => {
      if (raf || !carregada || reduzir.matches || !visivel || document.hidden) return
      ultimo = 0
      raf = requestAnimationFrame(quadro)
    }
    const parar = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      const tex = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.uniform2f(u.imgRes, img.naturalWidth, img.naturalHeight)
      carregada = true
      redimensionar()
      setPronto(true)
      iniciar()
    }
    img.src = src

    const aoMudarMovimento = () => {
      if (reduzir.matches) {
        parar()
        desenhar()
      } else iniciar()
    }
    const aoMudarAba = () => (document.hidden ? parar() : iniciar())

    const ro = new ResizeObserver(redimensionar)
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting
      if (visivel) iniciar()
      else parar()
    })
    io.observe(canvas)
    reduzir.addEventListener('change', aoMudarMovimento)
    document.addEventListener('visibilitychange', aoMudarAba)

    return () => {
      parar()
      img.onload = null
      ro.disconnect()
      io.disconnect()
      reduzir.removeEventListener('change', aoMudarMovimento)
      document.removeEventListener('visibilitychange', aoMudarAba)
    }
  }, [src, intensidade, velocidade])

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full transition-opacity duration-700"
        style={{ opacity: pronto ? 1 : 0 }}
      />
    </div>
  )
}
