precision mediump float;

uniform sampler2D tMap;
uniform vec4 uResolution;

varying vec2 vUv;

void main() {
  vec2 uv = (vUv - vec2(0.5)) * uResolution.zw + vec2(0.5);
  vec4 color = texture2D(tMap, uv);

  gl_FragColor = color;
}
