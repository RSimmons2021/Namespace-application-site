export const planetVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vLocal;
  void main() {
    vLocal = position;
    vec4 localPosition = vec4(position, 1.0);
    vec3 localNormal = normal;
    #ifdef USE_INSTANCING
      localPosition = instanceMatrix * localPosition;
      localNormal = mat3(instanceMatrix) * localNormal;
    #endif
    vec3 viewNormal = normalize(normalMatrix * localNormal);
    // Transform view normals back to world space, including nonuniform model scale.
    vNormal = normalize(vec3(dot(viewMatrix[0].xyz, viewNormal),
      dot(viewMatrix[1].xyz, viewNormal), dot(viewMatrix[2].xyz, viewNormal)));
    vec4 world = modelMatrix * localPosition;
    vPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const comicShading = /* glsl */ `
  float celLight(vec3 normal) {
    float light = dot(normal, normalize(vec3(-.9, .7, .5)));
    return .18 + step(-.04, light) * .23 + step(.36, light) * .30 + step(.76, light) * .29;
  }
  float halftone(float shade) {
    vec2 pixel = gl_FragCoord.xy / uPixelRatio;
    vec2 rotated = vec2(pixel.x - pixel.y, pixel.x + pixel.y) * .70710678;
    vec2 cell = fract(rotated / 5.0) - .5;
    float dotMask = 1.0 - smoothstep(.20, .27, length(cell));
    return 1.0 - dotMask * .42 * (1.0 - step(.6, shade));
  }
`;

export const toonFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uPixelRatio;
  varying vec3 vNormal;
  varying vec3 vPosition;
  ${comicShading}
  void main() {
    vec3 normal = normalize(vNormal);
    float shade = celLight(normal);
    vec3 shadow = mix(vec3(.015, .008, .05), uColor * .30, .60);
    vec3 color = mix(shadow, uColor * 1.15, shade);
    // A hard magenta bounce band complements the cyan engine and cockpit accents.
    float bounce = step(.65, dot(normal, normalize(vec3(.6, -.3, -.8))));
    color += vec3(.075, .006, .04) * bounce * (1.0 - shade);
    color *= halftone(shade);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const outlineVertex = /* glsl */ `
  uniform vec2 uViewport;
  uniform float uWidth;
  void main() {
    vec4 localPosition = vec4(position, 1.0);
    vec3 localNormal = normal;
    #ifdef USE_INSTANCING
      localPosition = instanceMatrix * localPosition;
      localNormal = mat3(instanceMatrix) * localNormal;
    #endif
    vec4 clip = projectionMatrix * modelViewMatrix * localPosition;
    vec3 viewNormal = normalize(normalMatrix * localNormal);
    vec2 direction = normalize((projectionMatrix * vec4(viewNormal, 0.0)).xy + vec2(.000001));
    clip.xy += direction * uWidth * 2.0 / uViewport * clip.w;
    gl_Position = clip;
  }
`;
export const outlineFragment = /* glsl */ `
  void main() {
    gl_FragColor = vec4(.0012, .0016, .004, 1.0);
    #include <colorspace_fragment>
  }
`;

export const planetFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uKind;
  uniform float uPixelRatio;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vLocal;
  ${comicShading}
  float hash(vec3 p) {
    p = fract(p * .3183099 + vec3(.1, .2, .3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
      mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
      mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float n = 0.0, a = .5;
    for (int i = 0; i < 3; i++) { n += a * noise(p); p = p * 2.03 + 11.3; a *= .5; }
    return n;
  }
  void main() {
    vec3 n = normalize(vNormal);
    vec3 view = normalize(cameraPosition - vPosition);
    vec3 p = normalize(vLocal);
    float terrain = fbm(p * 3.8 + uKind * 3.1);
    float bands = sin(p.y * 18.0 + terrain * 3.0) * .5 + .5;
    float gasGiant = step(.5, uKind) * (1.0 - step(1.5, uKind));
    float surface = mix(terrain, bands, gasGiant);
    float lower = mix(.36, .30, gasGiant);
    float upper = mix(.52, .68, gasGiant);
    // Broad flat regions replace fine photographic terrain noise.
    float region = .35 + step(lower, surface) * .40 + step(upper, surface) * .32;
    vec3 pigment = mix(uColor * region, uColor * region + vec3(.025, .015, .055), 1.0 - step(lower, surface));
    float shade = celLight(n);
    vec3 shadow = mix(vec3(.013, .005, .034), pigment * .25, .7);
    vec3 albedo = mix(shadow, pigment * 1.12, shade);
    // Fine ink contours around the largest terrain regions, with pixel antialiasing.
    float lineWidth = max(fwidth(surface), .001);
    float contour = 1.0 - smoothstep(lineWidth, lineWidth * 2.0, abs(surface - lower));
    albedo *= 1.0 - contour * .28 * (1.0 - gasGiant);
    albedo *= halftone(shade);
    float rim = 1.0 - max(dot(n, view), 0.0);
    albedo += uColor * step(.94, rim) * .20;
    if (uKind > 2.5 && uKind < 3.5) {
      float cities = step(.82, noise(p * 65.0)) * step(lower, terrain);
      albedo += uColor * cities * (1.0 - step(.5, shade)) * .9;
    }
    gl_FragColor = vec4(albedo, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const atmosphereFragment = /* glsl */ `
  uniform vec3 uColor;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 eye = normalize(cameraPosition - vPosition);
    float rim = pow(1.0 - abs(dot(normalize(vNormal), eye)), 4.0);
    gl_FragColor = vec4(uColor, rim * .43);
    #include <colorspace_fragment>
  }
`;

export const ringVertex = /* glsl */ `
  varying vec3 vLocal;
  void main() {
    vLocal = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
export const ringFragment = /* glsl */ `
  uniform vec3 uColor;
  varying vec3 vLocal;
  void main() {
    float r = length(vLocal.xy);
    float wave = sin(r * 28.0) * .5 + .5;
    float band = smoothstep(.45 - fwidth(wave), .45 + fwidth(wave), wave);
    float edge = smoothstep(1.35, 1.37, r) * (1.0 - smoothstep(2.23, 2.25, r));
    float gap = 1.0 - smoothstep(.025, .04, abs(r - 1.86));
    float ink = smoothstep(.90 - fwidth(wave), .90 + fwidth(wave), wave);
    vec3 color = mix(uColor * .3, uColor * .8, band);
    color *= 1.0 - ink * .65;
    gl_FragColor = vec4(color, edge * (.35 + band * .4) * (1.0 - gap));
    #include <colorspace_fragment>
  }
`;
