precision mediump float;

uniform sampler2D tMap;
uniform vec4 uResolution;

varying vec2 vUv;

const float uBorderRadius = 0.025;

float calcDistance(vec2 uv) {
  vec2 position = abs(uv * 2.0 - 1.0);
  vec2 extend = vec2(uResolution.xy) / 2.0;
  vec2 coords = position * (extend + uBorderRadius);
  vec2 delta = max(coords - extend, 0.0);

  return length(delta);
}

void main() {
  vec2 uv = (vUv - vec2(0.5)) * uResolution.zw + vec2(0.5);
  vec4 color = texture2D(tMap, uv);

  float dist = calcDistance(vUv);
  
  if (dist > uBorderRadius) {
    discard;
  }

  gl_FragColor = color;
}
