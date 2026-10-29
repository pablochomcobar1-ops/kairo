/**
 * 3D simplex noise. Ashima Arts / Stefan Gustavson, MIT licence:
 * https://github.com/ashima/webgl-noise
 */
export const SIMPLEX_3D = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

export const SILK_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uFold;
uniform vec2 uPointer;
uniform float uPress;

varying vec3 vNormal;
varying vec3 vViewPos;
varying vec2 vUv;

${SIMPLEX_3D}

// Height of the cloth at a point on the plane.
float height(vec2 p) {
  float t = uTime * 0.08 * uFold;
  // a slow warp bends the folds so they never look like a regular wave
  float warp = snoise(vec3(p * 0.09, t * 0.7));
  // diagonal folds, like silk draped from the top-left corner: several across the screen
  float phase = dot(p, vec2(0.82, 0.57)) * 1.35 + warp * 1.9 + t * 1.6;
  float s = sin(phase);
  // rounded folds plus sharper creases: creases catch thin lines of light, like silk
  // smooth |x| (sqrt(x² + k)): a crease without a hard corner the mesh would show as steps
  float c = sin(phase * 0.5 + 1.3);
  float h = s * 0.22 + (0.5 - sqrt(c * c + 0.035)) * 0.3;
  // slow, large billows so the whole sheet breathes
  h += snoise(vec3(p * 0.09 + 3.0, t)) * 0.45;
  // a little secondary rippling
  h += snoise(vec3(p * 0.3 + 9.0, t * 1.3)) * 0.05;
  // the cursor presses a soft dent into the fabric
  vec2 d = p - uPointer;
  h -= uPress * 0.6 * exp(-dot(d, d) * 0.32);
  return h;
}

void main() {
  vec3 p = position;
  const float e = 0.06;
  float h = height(p.xy);
  float hx = height(p.xy + vec2(e, 0.0));
  float hy = height(p.xy + vec2(0.0, e));
  vec3 n = normalize(vec3(-(hx - h) / e, -(hy - h) / e, 1.0));
  p.z += h;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vNormal = normalize(normalMatrix * n);
  vViewPos = mv.xyz;
  vUv = uv;
  gl_Position = projectionMatrix * mv;
}
`;

export const SILK_FRAGMENT = /* glsl */ `
uniform vec3 uBase;
uniform vec3 uShadow;
uniform vec3 uLight;
uniform float uSheen;

varying vec3 vNormal;
varying vec3 vViewPos;
varying vec2 vUv;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(-vViewPos);
  vec3 L = normalize(vec3(-0.35, 0.65, 0.7));

  float diffuse = clamp(dot(N, L) * 0.5 + 0.5, 0.0, 1.0);
  diffuse = pow(diffuse, 2.0);
  vec3 H = normalize(L + V);
  float nh = clamp(dot(N, H), 0.0, 1.0);
  // a tight highlight on the crests plus a faint wide sheen: silk, not plastic, not smoke
  float spec = (pow(nh, 70.0) * 1.15 + pow(nh, 10.0) * 0.16) * uSheen;
  float rim = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.5) * 0.25 * uSheen;

  vec3 col = mix(uShadow, uBase, diffuse);
  col += uLight * (spec + rim);

  // darken the edges so the type in front stays readable
  float vignette = smoothstep(1.2, 0.2, length((vUv - 0.5) * vec2(1.4, 1.8)));
  col *= mix(0.4, 1.0, vignette);

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;
