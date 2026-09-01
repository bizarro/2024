precision highp float;

uniform sampler2D tMap;
uniform sampler2D tFluid;
uniform float uTime;
varying vec2 vUv;

void main() {
  vec3 fluid = texture2D(tFluid, vUv).rgb;
  vec2 uv = vUv;
  vec2 uv2 = vUv - fluid.rg * 0.0003;

  vec4 color = texture2D(tMap, uv2);

  vec3 rgb = fluid * 0.003;

  color.r = texture2D(tMap, vec2(uv.x + rgb.x, uv.y + rgb.y)).r;
  color.g = texture2D(tMap, vec2(uv.x - rgb.x, uv.y + rgb.y)).g;
  color.b = texture2D(tMap, vec2(uv.x - rgb.x, uv.y - rgb.y)).b;

  gl_FragColor = color;
}
