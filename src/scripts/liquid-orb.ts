// @ts-check
/**
 * Motor WebGPU para la Esfera Líquida (Liquid Glass Orb).
 * Creado a partir del shader WGSL Glass Liquid.
 */

export const SHADER_SOURCE = /* wgsl */ `
struct Uniforms {
  size:           vec2<f32>,
  time:           f32,
  speed:          f32,
  radius:         f32,
  zoom:           f32,
  warp:           f32,
  ridgeAmt:       f32,
  sharp:          f32,
  shade:          f32,
  sheen:          f32,
  gloss:          f32,
  shellMidAlpha:  f32,
  shellEdgeAlpha: f32,
  exposure:       f32,
  style:          f32,
  edgeSoftness:   f32,
  edgeGlow:       f32,
  paletteCount:   f32,
  glassEnabled:   f32,
  glassOpacity:   f32,
  contourDeform:  f32,
  bandDensity:    f32,
  chromaticShift: f32,
  metalScale:     f32,
  metalStretch:   f32,
  metalAngle:     f32,
  metalOffset:    f32,
  metalPhase:     f32,
  metalEvolution: f32,
  metalRoughness: f32,
  metalDepth:     f32,
  particleDensity: f32,
  ribbonCount:     f32,
  ribbonWidth:     f32,
  ribbonTwist:     f32,
  ribbonFold:      f32,
  ribbonBreath:    f32,
  particleSize:    f32,
  particleBloom:   f32,
  colorA:         vec4<f32>,
  colorB:         vec4<f32>,
  colorC:         vec4<f32>,
  colorD:         vec4<f32>,
  highlightColor: vec4<f32>,
  shellInner:     vec4<f32>,
  shellMid:       vec4<f32>,
  shellEdge:      vec4<f32>,
  sheenColor:     vec4<f32>,
  specColor:      vec4<f32>,
  canvasColor:    vec4<f32>,
  glowColor:      vec4<f32>,
  paletteStop0:    vec4<f32>,
  paletteStop1:    vec4<f32>,
  paletteStop2:    vec4<f32>,
  paletteStop3:    vec4<f32>,
  paletteStop4:    vec4<f32>,
  paletteStop5:    vec4<f32>,
  paletteStop6:    vec4<f32>,
  paletteStop7:    vec4<f32>,
  paletteStop8:    vec4<f32>,
  paletteStop9:    vec4<f32>,
  paletteStop10:   vec4<f32>,
  paletteStop11:   vec4<f32>,
};
@group(0) @binding(0) var<uniform> u: Uniforms;

fn mfEdgeD(soft: f32) -> f32 {
  return soft - 0.005;
}

fn mfEdgeGlow(col: vec3<f32>, uv: vec2<f32>, ctr: vec2<f32>, rad: f32,
              soft: f32, glow: f32, glowRGB: vec3<f32>) -> vec3<f32> {
  if (glow <= 0.0) { return col; }
  let r = length(uv - ctr);
  let outside = smoothstep(rad - max(soft, 0.0005), rad + max(soft, 0.0005), r);
  return col + glowRGB * (glow * exp(-max(r - rad, 0.0) * 11.0) * outside);
}

fn mfRampPick(idx: f32,
              s0: vec3<f32>, s1: vec3<f32>, s2:  vec3<f32>, s3:  vec3<f32>,
              s4: vec3<f32>, s5: vec3<f32>, s6:  vec3<f32>, s7:  vec3<f32>,
              s8: vec3<f32>, s9: vec3<f32>, s10: vec3<f32>, s11: vec3<f32>) -> vec3<f32> {
  var r = s0;
  r = select(r, s1,  idx == 1.0);
  r = select(r, s2,  idx == 2.0);
  r = select(r, s3,  idx == 3.0);
  r = select(r, s4,  idx == 4.0);
  r = select(r, s5,  idx == 5.0);
  r = select(r, s6,  idx == 6.0);
  r = select(r, s7,  idx == 7.0);
  r = select(r, s8,  idx == 8.0);
  r = select(r, s9,  idx == 9.0);
  r = select(r, s10, idx == 10.0);
  r = select(r, s11, idx == 11.0);
  return r;
}

fn mfRampLin(tIn: f32, n: f32,
             s0: vec3<f32>, s1: vec3<f32>, s2:  vec3<f32>, s3:  vec3<f32>,
             s4: vec3<f32>, s5: vec3<f32>, s6:  vec3<f32>, s7:  vec3<f32>,
             s8: vec3<f32>, s9: vec3<f32>, s10: vec3<f32>, s11: vec3<f32>) -> vec3<f32> {
  let k  = clamp(floor(n + 0.5), 1.0, 12.0);
  let x  = clamp(tIn, 0.0, 1.0) * (k - 1.0);
  let i0 = clamp(floor(x), 0.0, max(k - 2.0, 0.0));
  return mix(mfRampPick(i0,     s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11),
             mfRampPick(i0 + 1.0, s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11),
             x - i0);
}

const GL_FU:   f32 = 0.88172043;
const GL_BSIG_CLEAR: f32 = 0.01800000;
const GL_BSIG_GLASS: f32 = 0.03990000;
const GL_KA:  f32 = 6.0;
const GL_KG:  f32 = 4.1209;
const GL_KWA: f32 = 0.5;
const GL_KR:  f32 = 0.32;
const GL_GH:  f32 = 1.73205081;
const GL_CLEAR_EA: f32 = 0.995;
const GL_CLEAR_EB: f32 = 1.04;

fn lqHash(pIn: vec2<f32>) -> f32 {
  var p = fract(pIn * vec2<f32>(123.34, 456.21));
  p = p + vec2<f32>(dot(p, p + vec2<f32>(45.32)));
  return fract(p.x * p.y);
}

fn lqNoise(p: vec2<f32>) -> f32 {
  let i = floor(p);
  var f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(lqHash(i), lqHash(i + vec2<f32>(1.0, 0.0)), f.x),
             mix(lqHash(i + vec2<f32>(0.0, 1.0)), lqHash(i + vec2<f32>(1.0, 1.0)), f.x), f.y);
}

fn lqFbm(pIn: vec2<f32>, bs: f32) -> vec2<f32> {
  var p = pIn;
  var s:  f32 = 0.0;
  var a:  f32 = 0.5;
  var m:  f32 = 0.0;
  var vr: f32 = 0.0;
  let e = -GL_KA * bs * bs;
  var g: f32 = 1.0;
  for (var i: i32 = 0; i < 5; i = i + 1) {
    let b = exp(e * g);
    s  = s  + a * (0.5 + b * (lqNoise(p) - 0.5));
    vr = vr + a * a * (1.0 - b * b);
    m  = m + a;
    a  = a * 0.5;
    g  = g * GL_KG;
    p = vec2<f32>(0.8 * p.x - 0.6 * p.y, 0.6 * p.x + 0.8 * p.y) * 2.03;
  }
  return vec2<f32>(s / m, GL_KR * sqrt(vr) / m);
}

fn lqRidge(v: f32, k: f32) -> f32 {
  return pow(clamp(1.0 - abs(v * 2.0 - 1.0), 0.0, 1.0), k);
}

fn lqRamp(v: f32, cA: vec3<f32>, cB: vec3<f32>, cC: vec3<f32>, cD: vec3<f32>) -> vec3<f32> {
  var c = mix(cA, cB, smoothstep(0.0, 0.45, v));
  c = mix(c, cC, smoothstep(0.38, 0.72, v));
  c = mix(c, cD, smoothstep(0.68, 1.0, v));
  return select(c, mfRampLin(v, u.paletteCount,
                             u.paletteStop0.rgb, u.paletteStop1.rgb, u.paletteStop2.rgb,
                             u.paletteStop3.rgb, u.paletteStop4.rgb, u.paletteStop5.rgb,
                             u.paletteStop6.rgb, u.paletteStop7.rgb, u.paletteStop8.rgb,
                             u.paletteStop9.rgb, u.paletteStop10.rgb, u.paletteStop11.rgb), u.paletteCount > 0.5);
}

fn lqRidgeS(vs: vec2<f32>, k: f32) -> f32 {
  let d = GL_GH * vs.y;
  return (lqRidge(vs.x - d, k) + 4.0 * lqRidge(vs.x, k) + lqRidge(vs.x + d, k)) / 6.0;
}

fn lqStepS(vs: vec2<f32>, a: f32, b: f32) -> f32 {
  let d = GL_GH * vs.y;
  return (smoothstep(a, b, vs.x - d) + 4.0 * smoothstep(a, b, vs.x)
        + smoothstep(a, b, vs.x + d)) / 6.0;
}

fn lqPowS(vs: vec2<f32>, k: f32) -> f32 {
  let d = GL_GH * vs.y;
  return (pow(clamp(vs.x - d, 0.0, 1.0), k) + 4.0 * pow(clamp(vs.x, 0.0, 1.0), k)
        + pow(clamp(vs.x + d, 0.0, 1.0), k)) / 6.0;
}

fn glsFinishPresetFluid(colorIn: vec3<f32>, p: vec2<f32>) -> vec3<f32> {
  var color = colorIn;
  color = mix(color, u.highlightColor.rgb,
              u.shade * 0.22 * smoothstep(0.15, 1.15, dot(p, vec2<f32>(-0.32, 0.78))));
  color = color * (1.0 - u.shade * 0.34
                  * smoothstep(-0.1, 1.2, dot(p, vec2<f32>(0.45, -0.62))));
  color = color * (1.0 - u.shade * 0.22 * smoothstep(0.72, 1.08, length(p)));
  return clamp(color, vec3<f32>(0.0), vec3<f32>(1.0));
}

fn glsFinishEmissionFluid(colorIn: vec3<f32>, p: vec2<f32>) -> vec3<f32> {
  var color = colorIn;
  if (u.glassEnabled > 0.5) {
    color = mix(color, u.highlightColor.rgb,
                u.shade * 0.22 * smoothstep(0.15, 1.15, dot(p, vec2<f32>(-0.32, 0.78))));
  }
  color = color * (1.0 - u.shade * 0.34
                  * smoothstep(-0.1, 1.2, dot(p, vec2<f32>(0.45, -0.62))));
  color = color * (1.0 - u.shade * 0.22 * smoothstep(0.72, 1.08, length(p)));
  return clamp(color, vec3<f32>(0.0), vec3<f32>(1.0));
}

fn glsRotate(p: vec2<f32>, angle: f32) -> vec2<f32> {
  let c = cos(angle);
  let s = sin(angle);
  return vec2<f32>(c * p.x - s * p.y, s * p.x + c * p.y);
}

// ---------------- Presets de flujo ----------------
fn glsBlueDropFluid(p: vec2<f32>, t: f32) -> vec3<f32> {
  let depth = sqrt(max(1.0 - clamp(dot(p, p), 0.0, 1.0), 0.0));
  var q = p * mix(0.72, 1.0, depth * 0.62 + 0.38);
  q = glsRotate(q, -0.24 + 0.06 * sin(t * 0.17));
  let scale = 1.0 + u.zoom * 1.12;
  let blur = 0.012 + 0.006 * u.zoom;
  let driftA = lqFbm(q * 1.28 + vec2<f32>(t * 0.095, -t * 0.034), blur * 1.28);
  let driftB = lqFbm(glsRotate(q, 1.08) * 1.62
                     + vec2<f32>(-t * 0.042, t * 0.078), blur * 1.62);
  var flowed = q + vec2<f32>(driftA.x - 0.5, driftB.x - 0.5)
                 * (0.24 + u.warp * 0.1);
  flowed.x = flowed.x + sin(flowed.y * 2.15 + t * 0.24) * (0.035 + u.warp * 0.012);
  flowed.y = flowed.y + sin(flowed.x * 1.38 - t * 0.18) * (0.045 + u.warp * 0.01);
  let body = lqFbm(flowed * scale + vec2<f32>(t * 0.025, -t * 0.018), blur * scale);
  let marble = lqRidgeS(lqFbm(flowed * (1.72 + u.zoom * 0.9)
                              + vec2<f32>(2.7, -t * 0.035),
                              blur * (1.72 + u.zoom * 0.9)),
                            0.8 + u.sharp * 0.46);
  let value = clamp(mix(body.x, body.x * 0.62 + marble * 0.58, u.ridgeAmt), 0.0, 1.0);
  var color = lqRamp(value, u.colorA.rgb, u.colorB.rgb, u.colorC.rgb, u.colorD.rgb);
  let light = pow(max(dot(normalize(vec3<f32>(p, depth)),
                          normalize(vec3<f32>(-0.48, 0.62, 0.92))), 0.0), 3.2);
  color = mix(color, u.highlightColor.rgb, light * (0.035 + 0.05 * u.shade));
  color = color * (0.74 + 0.26 * depth);
  return glsFinishPresetFluid(color, p);
}

fn glsVioletEmberFluid(p: vec2<f32>, t: f32) -> vec3<f32> {
  let scale = 1.08 + u.zoom * 1.18;
  let blur = 0.011 + 0.005 * u.zoom;
  let radius = length(p);
  let twist = t * 0.055 + radius * (0.72 + u.warp * 0.11)
              + 0.08 * sin(t * 0.31 + radius * 4.0);
  let q = glsRotate(p * scale, twist);
  let low = lqFbm(q * 1.18 + vec2<f32>(t * 0.068, -t * 0.105), blur * 1.18);
  let cross = lqFbm(glsRotate(q, -1.12) * 1.52
                    + vec2<f32>(-t * 0.094, t * 0.042)
                    + vec2<f32>(low.x * 1.35, -low.x * 0.72), blur * 1.52);
  let warped = q + vec2<f32>(low.x - 0.5, cross.x - 0.5)
                   * (0.3 + u.warp * 0.12);
  let melt = lqFbm(warped * 1.34
                   + vec2<f32>(cross.x * 1.48, low.x * 1.12), blur * 1.34);
  let veins = lqRidgeS(lqFbm(warped * (2.05 + u.zoom * 0.72)
                             + vec2<f32>(-2.1, t * 0.052),
                             blur * (2.05 + u.zoom * 0.72)),
                           0.82 + u.sharp * 0.58);
  let heat = smoothstep(0.18, 0.92,
                        melt.x * (0.72 - u.ridgeAmt * 0.16)
                        + veins * (0.32 + u.ridgeAmt * 0.5));
  var color = lqRamp(heat, u.colorA.rgb, u.colorB.rgb, u.colorC.rgb, u.colorD.rgb);
  let pulse = 0.94 + 0.06 * sin(t * 0.44 + melt.x * 5.0);
  color = color * pulse;
  color = mix(color, u.highlightColor.rgb, pow(veins, 4.0) * 0.045);
  return glsFinishPresetFluid(color, p);
}

fn glsAuroraLayer(p: vec2<f32>, t: f32, offset: f32) -> f32 {
  let drift = t * 0.18 + offset * 2.5;
  let wave1 = sin(p.x * (2.0 + u.warp * 0.13) + drift + offset * 6.0) * 0.25;
  let wave2 = sin(p.x * 3.7 + drift * 1.3 + offset * 4.0) * 0.12;
  let wave3 = sin(p.x * 7.2 + drift * 0.7 + offset * 8.0) * 0.055;
  let noiseValue = lqFbm(vec2<f32>(p.x * 1.6 + drift * 0.35,
                                   p.y * 0.8 + offset * 3.0), 0.018).x;
  let center = offset * 0.46 + wave1 + wave2 + wave3
               + (noiseValue - 0.5) * 0.28;
  let dist = abs(p.y - center);
  let glow = exp(-dist * dist * (13.0 - 5.0 * u.ridgeAmt));
  let shimmer = lqFbm(vec2<f32>(p.x * 4.0 + t * 0.22,
                                p.y * 7.0 + offset * 5.0), 0.012).x;
  return glow * (0.64 + 0.36 * shimmer);
}

fn glsAuroraFluid(p: vec2<f32>, t: f32) -> vec3<f32> {
  let q = p * (0.82 + u.zoom * 0.58);
  let l0 = glsAuroraLayer(q, t, -0.72);
  let l1 = glsAuroraLayer(q, t, 0.0);
  let l2 = glsAuroraLayer(q, t, 0.72);
  var color = u.colorA.rgb * (0.46 + 0.18 * (q.y + 1.0));
  color = color + u.colorB.rgb * l0 * 1.3;
  color = color + u.colorC.rgb * l1 * 1.15;
  color = color + u.colorD.rgb * l2 * 1.2;
  color = color + mix(u.colorB.rgb, u.colorD.rgb, 0.5) * min(l0 * l2, l1) * 0.65;
  color = color / (vec3<f32>(1.0) + color * 0.28);
  return glsFinishPresetFluid(color, p);
}

fn glsNeuroShape(pIn: vec2<f32>, t: f32) -> f32 {
  var p = pIn * (0.34 + 0.08 * u.zoom);
  var sineAccum = vec2<f32>(0.0);
  var result = vec2<f32>(0.0);
  var scale = 8.0;
  for (var j: i32 = 0; j < 11; j = j + 1) {
    p = glsRotate(p, 1.0);
    sineAccum = glsRotate(sineAccum, 1.0);
    let layer = p * scale + vec2<f32>(f32(j)) + sineAccum - vec2<f32>(t * 0.34);
    sineAccum = sineAccum + sin(layer);
    result = result + (vec2<f32>(0.5) + 0.5 * cos(layer)) / scale;
    scale = scale * 1.16;
  }
  return result.x + result.y;
}

fn glsPlasmaFluid(p: vec2<f32>, t: f32) -> vec3<f32> {
  let shape = glsNeuroShape(p, t);
  let phase = shape * (10.0 + u.warp) + p.x * 1.7 - p.y * 1.3 - t * 0.52;
  let ridgeWidth = 0.62 - 0.24 * u.ridgeAmt;
  let primary = pow(abs(cos(phase)), max(1.3, u.sharp * ridgeWidth));
  let secondary = pow(abs(cos(phase * 0.53 + atan2(p.y, p.x) * 2.0 + t * 0.21)),
                      max(1.6, u.sharp * (ridgeWidth + 0.1)));
  let filaments = max(primary, secondary * 0.64);
  let core = pow(primary, 4.0);
  let polarity = 0.5 + 0.5 * sin(phase * 0.37 + shape * 3.0);
  var color = mix(u.colorA.rgb * 0.42, u.colorD.rgb * 0.48, polarity * 0.46);
  color = mix(color, u.colorB.rgb, filaments * 0.72);
  color = mix(color, u.colorC.rgb, core * 0.68);
  color = color + u.highlightColor.rgb * pow(core, 3.0) * 0.16;
  color = color / (vec3<f32>(1.0) + color * 0.34);
  return glsFinishPresetFluid(color, p);
}

fn glsChromeFluid(p: vec2<f32>, t: f32) -> vec3<f32> {
  var q = p * (1.0 + u.zoom * 0.35);
  let amplitude = 0.028 * u.warp;
  for (var i: i32 = 1; i <= 9; i = i + 1) {
    let fi = f32(i);
    q.x = q.x + amplitude / fi * cos(fi * 2.7 * q.y + t * 0.46);
    q.y = q.y + amplitude / fi * cos(fi * 3.1 * q.x - t * 0.4);
  }
  let denominator = max(abs(sin(t * 0.24 - q.y - q.x)), 0.045);
  let flare = clamp(1.0 / denominator, 0.0, 18.0);
  let metal = smoothstep(1.15, 7.5, flare);
  let fold = 0.5 + 0.5 * cos((q.x - q.y) * (3.2 + u.sharp * 0.28) + t * 0.32);
  let value = clamp(metal * 0.74 + fold * 0.36, 0.0, 1.0);
  var color = lqRamp(value, u.colorD.rgb, u.colorC.rgb, u.colorB.rgb, u.colorA.rgb);
  color = mix(color, u.colorA.rgb, pow(metal, 5.0) * 0.62);
  return glsFinishPresetFluid(color, p);
}

fn glsFrostFluid(p: vec2<f32>, t: f32) -> vec3<f32> {
  var q = p * (0.66 + u.zoom * 0.92);
  q.y = q.y + t * 0.055;
  let blur = 0.011 + 0.006 * u.zoom;
  let warpField = vec2<f32>(
    lqFbm(q * 1.14 + vec2<f32>(t * 0.055, 0.0), blur).x,
    lqFbm(q * 1.14 + vec2<f32>(6.8, -t * 0.048), blur).x
  );
  let warped = q + (warpField - vec2<f32>(0.5)) * (0.28 + u.warp * 0.17);
  let body = lqFbm(warped * 1.48 + vec2<f32>(t * 0.032, -t * 0.02), blur * 1.48);
  let veins = lqRidgeS(
    lqFbm(warped * 2.36 + vec2<f32>(3.1, -t * 0.024), blur * 2.36),
    u.sharp
  );
  let value = mix(lqStepS(body, 0.1, 0.9),
                  clamp(veins * 0.8 + body.x * 0.46, 0.0, 1.0),
                  u.ridgeAmt);
  var color = lqRamp(value, u.colorA.rgb, u.colorB.rgb, u.colorC.rgb, u.colorD.rgb);
  color = mix(color, u.colorA.rgb, 0.08 * smoothstep(0.62, 0.92, body.x));
  return glsFinishPresetFluid(color, p);
}

fn glsPresetFluid(p: vec2<f32>, style: i32, t: f32) -> vec3<f32> {
  if (style == 10) { return glsAuroraFluid(p, t); }
  if (style == 11) { return glsPlasmaFluid(p, t); }
  if (style == 12) { return glsChromeFluid(p, t); }
  if (style == 15) { return glsFrostFluid(p, t); }
  if (style == 20) { return glsBlueDropFluid(p, t); }
  if (style == 21) { return glsVioletEmberFluid(p, t); }
  return glsBlueDropFluid(p, t);
}

fn glsOver(dst: vec3<f32>, src: vec3<f32>, a: f32) -> vec3<f32> {
  let k = clamp(a, 0.0, 1.0);
  return src * k + dst * (1.0 - k);
}

fn glsRefractionProfile(t: f32) -> f32 {
  let depth = clamp(t, 0.0, 1.0);
  let circular = sqrt(max(1.0 - (1.0 - depth) * (1.0 - depth), 0.0));
  return 1.0 - circular;
}

fn glsHighlightLobe(normal: vec2<f32>, direction: vec2<f32>, cut: f32,
                     power: f32) -> f32 {
  let angular = clamp((dot(normal, direction) - cut) / max(1.0 - cut, 0.001),
                      0.0, 1.0);
  return pow(angular, power);
}

fn glsContourScale(uv: vec2<f32>, t: f32, amount: f32) -> f32 {
  if (amount <= 0.0) { return 1.0; }
  let angle = atan2(uv.y, uv.x);
  let wave = sin(angle * 3.0 + t * 0.62) * 0.52
             + sin(angle * 5.0 - t * 0.41 + 1.7) * 0.31;
  return 1.0 + clamp(amount, 0.0, 1.0) * 0.09 * wave;
}

fn glsContourNormal(uv: vec2<f32>, rad: f32, t: f32, amount: f32) -> vec2<f32> {
  let distance = length(uv);
  if (distance <= 0.0001) { return vec2<f32>(0.0); }
  return uv / distance;
}

fn orbGlassLiquidAnim(uv01: vec2<f32>) -> vec4<f32> {
  let fc = vec2<f32>(uv01.x, 1.0 - uv01.y) * u.size;
  let uv = (2.0 * fc - u.size) / max(min(u.size.x, u.size.y), 1.0);

  let rad = max(u.radius, 0.05);
  let t = u.time * u.speed;
  let s = i32(u.style + 0.5);
  let contourRad = rad * glsContourScale(uv, t, u.contourDeform);

  if (length(uv) > contourRad * (1.01 + mfEdgeD(u.edgeSoftness))) {
    let halo = clamp(mfEdgeGlow(vec3<f32>(0.0), uv, vec2<f32>(0.0), contourRad,
                                u.edgeSoftness, u.edgeGlow, u.glowColor.rgb),
                     vec3<f32>(0.0), vec3<f32>(1.0));
    let haloAlpha = max(halo.r, max(halo.g, halo.b));
    return vec4<f32>(halo, haloAlpha);
  }

  let p   = uv / contourRad;
  let pd  = length(p);
  let clearFa = 1.0 - smoothstep(GL_CLEAR_EA, GL_CLEAR_EB, pd);
  let normal = glsContourNormal(uv, rad, t, u.contourDeform);
  let edgeDepth = max(1.0 - pd, 0.0);
  let refractionWidth = 0.015 + 0.95 * clamp(u.shellMidAlpha, 0.0, 1.0);
  let refractionT = edgeDepth / max(refractionWidth, 0.001);
  let refractionProfile = pow(glsRefractionProfile(refractionT), 0.68);
  let refractionAmount = 1.6 * clamp(u.glassOpacity, 0.0, 1.0)
                         * refractionProfile;
  let refractedP = p - normal * refractionAmount;

  var fcol = vec3<f32>(0.0);
  if (clearFa > 0.0) {
    if (u.glassEnabled > 0.5) {
      let channelSplit = 0.14 * clamp(u.gloss, 0.0, 2.0)
                         * clamp(u.glassOpacity, 0.0, 1.0)
                         * refractionProfile;
      let redSample = glsPresetFluid(refractedP - normal * channelSplit, s, t);
      let greenSample = glsPresetFluid(refractedP, s, t);
      let blueSample = glsPresetFluid(refractedP + normal * channelSplit, s, t);
      fcol = vec3<f32>(redSample.r, greenSample.g, blueSample.b);
    } else {
      fcol = glsPresetFluid(p, s, t);
    }
  }

  let lum = dot(fcol, vec3<f32>(0.213, 0.715, 0.072));
  let clearSat = clamp(vec3<f32>(lum) + (fcol - vec3<f32>(lum)) * 1.22,
                       vec3<f32>(0.0), vec3<f32>(1.0));
  var col = glsOver(u.canvasColor.rgb, clearSat, 0.99 * clearFa);

  if (u.glassEnabled > 0.5) {
    let surfaceWidth = 0.026 + 0.055 * clamp(u.shellEdgeAlpha, 0.0, 1.0);
    let surfaceBand = (1.0 - smoothstep(0.0, surfaceWidth, edgeDepth)) * clearFa;
    let opticalRim = pow(surfaceBand, 1.8);
    let innerRimAlpha = opticalRim * u.glassOpacity * 0.45;
    col = glsOver(col, u.shellInner.rgb, innerRimAlpha);

    let coolDirection = normalize(vec2<f32>(0.84, 0.54));
    let warmDirection = normalize(vec2<f32>(-0.62, -0.78));
    let coolSplit = glsHighlightLobe(normal, coolDirection, -0.32, 1.8);
    let warmSplit = glsHighlightLobe(normal, warmDirection, -0.28, 2.0);
    let dispersion = opticalRim * clamp(u.gloss, 0.0, 2.0)
                     * (0.8 + 0.8 * u.shellEdgeAlpha);
    col = glsOver(col, u.shellMid.rgb, dispersion * coolSplit);
    col = glsOver(col, u.shellEdge.rgb, dispersion * warmSplit);

    let edgeShadow = opticalRim * (0.015 + 0.15 * u.shellEdgeAlpha)
                     * (0.15 + 0.85 * max(dot(normal, vec2<f32>(0.45, -0.89)), 0.0));
    col = col * (1.0 - edgeShadow);

    let keyDirection = normalize(vec2<f32>(-0.68, 0.73));
    let fillDirection = normalize(vec2<f32>(0.74, -0.67));
    let key = opticalRim * glsHighlightLobe(normal, keyDirection, 0.2, 2.8)
              * clamp(u.sheen, 0.0, 2.0) * 1.4;
    let fill = opticalRim * glsHighlightLobe(normal, fillDirection, 0.4, 3.6)
               * clamp(u.sheen, 0.0, 2.0) * 1.0;
    col = glsOver(col, u.sheenColor.rgb, key);
    col = glsOver(col, u.specColor.rgb, fill);
  }

  let ballA = 1.0 - smoothstep(0.99 - mfEdgeD(u.edgeSoftness), 1.01 + mfEdgeD(u.edgeSoftness), pd);
  col = clamp(col * max(u.exposure, 0.0), vec3<f32>(0.0), vec3<f32>(1.0)) * ballA;
  let edged = mfEdgeGlow(col, uv, vec2<f32>(0.0), contourRad,
                         u.edgeSoftness, u.edgeGlow, u.glowColor.rgb);
  let finalColor = clamp(edged, vec3<f32>(0.0), vec3<f32>(1.0));
  let emissionAlpha = max(finalColor.r, max(finalColor.g, finalColor.b));
  let sphereAlpha = clamp(max(ballA, emissionAlpha), 0.0, 1.0);

  return vec4<f32>(finalColor, sphereAlpha);
}

struct VOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vs_main(@builtin(vertex_index) i: u32) -> VOut {
  var p = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 3.0, -1.0),
    vec2<f32>(-1.0,  3.0),
  );
  var out: VOut;
  out.pos = vec4<f32>(p[i], 0.0, 1.0);
  let uv01 = (p[i] + vec2<f32>(1.0)) * 0.5;
  out.uv = vec2<f32>(uv01.x, 1.0 - uv01.y);
  return out;
}

@fragment
fn fs_main(in: VOut) -> @location(0) vec4<f32> {
  let c = orbGlassLiquidAnim(in.uv);
  let fc = vec2<f32>(in.uv.x, 1.0 - in.uv.y) * u.size;
  let uv = (2.0 * fc - u.size) / max(min(u.size.x, u.size.y), 1.0);
  let rad = max(u.radius, 0.05);
  let t = u.time * u.speed;
  let contourRad = rad * glsContourScale(uv, t, u.contourDeform);
  let q = (2.0 * fc - u.size) / u.size;
  let fitEnd = 1.0;
  let fitFeather = 2.0 / max(min(u.size.x, u.size.y), 1.0);
  let fitStart = min(mix(contourRad, fitEnd, 0.5), fitEnd - fitFeather);
  let fit = 1.0 - smoothstep(fitStart, fitEnd, max(abs(q.x), abs(q.y)));
  return vec4<f32>(c.rgb * fit, c.a * fit);
}
`;

// Semilla base de 136 flotantes para el UniformBuffer
export const BASE_UNIFORM_SEED = [
  1, 1, 0, 0.6, 0.74, 0.48, 1.1, 0.2, 1.9, 0.16, 0.22, 0.42, 0.32, 0.24, 0.9, 20,
  0.005, 0.35, 0, 1, 0.66, 0.03, 2, 0.42, 0.77, 0.23, 65, 0, 0, 1, 0.22, 0.25,
  0.72, 5, 0.42, 1.25, 0.55, 0.3, 1.2, 0.7,
  // 40: colorA
  0.008, 0.031, 0.071, 1,
  // 44: colorB
  0.039, 0.173, 0.353, 1,
  // 48: colorC
  0.141, 0.404, 0.541, 1,
  // 52: colorD
  0.643, 0.765, 0.792, 1,
  // 56: highlightColor
  0.965, 0.992, 1, 1,
  // 60: shellInner
  0.804, 0.31, 1, 1,
  // 64: shellMid
  0.867, 0.275, 1, 1,
  // 68: shellEdge
  0.867, 0.984, 1, 1,
  // 72: sheenColor
  0.659, 0.851, 1, 1,
  // 76: specColor
  0.004, 0.008, 0.027, 1,
  // 80: canvasColor
  0.004, 0.008, 0.027, 1,
  // 84: glowColor
  0.122, 0.314, 0.463, 1,
  // 88..135: Palette stops
  0.97, 0.98, 1, 1,
  0.94, 0.96, 0.99, 1,
  0.88, 0.93, 0.98, 1,
  0.83, 0.9, 0.97, 1,
  0.73, 0.84, 0.95, 1,
  0.65, 0.78, 0.94, 1,
  0.53, 0.69, 0.92, 1,
  0.44, 0.62, 0.91, 1,
  0.44, 0.62, 0.91, 1,
  0.44, 0.62, 0.91, 1,
  0.44, 0.62, 0.91, 1,
  0.44, 0.62, 0.91, 1
];

function hexToRgbaArray(hex: string | undefined, defaultVal: [number, number, number, number]): [number, number, number, number] {
  if (!hex || typeof hex !== 'string') return defaultVal;
  let c = hex.replace('#', '').trim();
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  if (c.length === 6) {
    const num = parseInt(c, 16);
    if (isNaN(num)) return defaultVal;
    return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255, defaultVal[3]];
  }
  return defaultVal;
}

interface OrbInstance {
  canvas: HTMLCanvasElement;
  context: GPUCanvasContext;
  uniformBuffer: GPUBuffer;
  bindGroup: GPUBindGroup;
  values: Float32Array;
  baseSpeed: number;
  baseExposure: number;
  targetSpeed: number;
  targetExposure: number;
  motionPhase: number;
  lastFrameAt: number | null;
  isVisible: boolean;
}

class LiquidOrbManager {
  private device: GPUDevice | null = null;
  private pipeline: GPURenderPipeline | null = null;
  private instances: OrbInstance[] = [];
  private animationFrame = 0;
  private isRunning = false;
  private observer: IntersectionObserver | null = null;

  async init() {
    const canvases = Array.from(document.querySelectorAll<HTMLCanvasElement>('canvas[data-liquid-orb]'));
    if (canvases.length === 0) return;

    if (!navigator.gpu) {
      this.markFallbacks(canvases);
      return;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        this.markFallbacks(canvases);
        return;
      }
      this.device = await adapter.requestDevice();
      const format = navigator.gpu.getPreferredCanvasFormat();

      const shader = this.device.createShaderModule({ code: SHADER_SOURCE });
      this.pipeline = this.device.createRenderPipeline({
        layout: 'auto',
        vertex: { module: shader, entryPoint: 'vs_main' },
        fragment: {
          module: shader,
          entryPoint: 'fs_main',
          targets: [{
            format,
            blend: {
              color: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
              alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
            },
          }],
        },
        primitive: { topology: 'triangle-list' },
      });

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const canvas = entry.target as HTMLCanvasElement;
          const inst = this.instances.find(i => i.canvas === canvas);
          if (inst) {
            inst.isVisible = entry.isIntersecting;
          }
        });
        const hasVisible = this.instances.some(i => i.isVisible);
        if (hasVisible && !this.isRunning) {
          this.startLoop();
        } else if (!hasVisible && this.isRunning) {
          this.stopLoop();
        }
      }, { rootMargin: '100px 0px' });

      for (const canvas of canvases) {
        this.setupCanvas(canvas, format);
      }

      this.startLoop();
    } catch (err) {
      console.warn('[LiquidOrb] No se pudo inicializar WebGPU:', err);
      this.markFallbacks(canvases);
    }
  }

  private markFallbacks(canvases: HTMLCanvasElement[]) {
    canvases.forEach((canvas) => {
      const parent = canvas.closest('.liquid-orb-wrapper');
      if (parent) parent.classList.add('is-fallback');
    });
  }

  private setupCanvas(canvas: HTMLCanvasElement, format: GPUTextureFormat) {
    if (!this.device || !this.pipeline) return;

    const context = canvas.getContext('webgpu');
    if (!context) return;

    context.configure({ device: this.device, format, alphaMode: 'premultiplied' });

    // Cargar configuración personalizada del data-orb
    let custom: any = {};
    try {
      const raw = canvas.dataset.liquidOrb;
      if (raw) custom = JSON.parse(raw);
    } catch (e) {
      // Ignorar json malformado
    }

    const values = new Float32Array(BASE_UNIFORM_SEED);

    // Resolver estilo de forma robusta (número o nombre de preset)
    const styleVal = custom.style ?? custom.preset ?? 20;
    let resolvedStyle = 20;
    if (typeof styleVal === 'number' && !isNaN(styleVal)) {
      resolvedStyle = styleVal;
    } else if (typeof styleVal === 'string') {
      const lower = styleVal.toLowerCase().trim();
      const presets: Record<string, number> = {
        siri: 9,
        aurora: 10,
        plasma: 11,
        chrome: 12,
        opal: 13,
        spectrum: 14,
        frost: 15,
        'voice-wave': 19,
        voicewave: 19,
        'blue-drop': 20,
        bluedrop: 20,
        'violet-ember': 21,
        violetember: 21,
        ember: 21,
        'chromatic-metal': 22,
        chromaticmetal: 22,
        metal: 22,
        'refractive-blob': 23,
        blob: 23,
        'particle-ribbon': 24,
        ribbon: 24,
      };
      if (presets[lower] !== undefined) {
        resolvedStyle = presets[lower];
      } else {
        const parsedNum = parseFloat(lower);
        if (!isNaN(parsedNum)) resolvedStyle = parsedNum;
      }
    }

    const speed = custom.speed ?? 0.7;
    const exposure = custom.exposure ?? 1.0;
    values[3] = speed;
    values[4] = custom.radius ?? 0.74;
    values[5] = custom.zoom ?? 0.48;
    values[6] = custom.warp ?? 0.55;
    values[7] = custom.ridgeAmt ?? 0.2;
    values[8] = custom.sharp ?? 1.9;
    values[9] = custom.shade ?? 0.16;
    values[10] = custom.sheen ?? 0.25;
    values[11] = custom.gloss ?? 0.42;
    values[14] = exposure;
    values[15] = resolvedStyle;
    values[16] = custom.edgeSoftness ?? 0.005;
    values[17] = custom.edgeGlow ?? 0.45;
    values[19] = (custom.glass === false || custom.glassEnabled === false) ? 0 : 1;
    values[20] = custom.glassOpacity ?? 0.72;
    values[21] = custom.contourDeform ?? 0.03;

    // Colores principales de la mezcla fluida
    const colA = hexToRgbaArray(custom.colorA, [values[40], values[41], values[42], values[43]]);
    values.set(colA, 40);

    const colB = hexToRgbaArray(custom.colorB, [values[44], values[45], values[46], values[47]]);
    values.set(colB, 44);

    const colC = hexToRgbaArray(custom.colorC, [values[48], values[49], values[50], values[51]]);
    values.set(colC, 48);

    const colD = hexToRgbaArray(custom.colorD, [values[52], values[53], values[54], values[55]]);
    values.set(colD, 52);

    // Color del destello de relieve
    if (custom.highlightColor) {
      const hi = hexToRgbaArray(custom.highlightColor, [values[56], values[57], values[58], values[59]]);
      values.set(hi, 56);
    }

    // Reflejos del caparazón de cristal
    if (custom.shellInner) {
      const si = hexToRgbaArray(custom.shellInner, [values[60], values[61], values[62], values[63]]);
      values.set(si, 60);
    }
    if (custom.shellMid) {
      const sm = hexToRgbaArray(custom.shellMid, [values[64], values[65], values[66], values[67]]);
      values.set(sm, 64);
    }
    if (custom.shellEdge) {
      const se = hexToRgbaArray(custom.shellEdge, [values[68], values[69], values[70], values[71]]);
      values.set(se, 68);
    }

    // Brillo satinado y especular
    const sheen = hexToRgbaArray(custom.sheenColor, [values[72], values[73], values[74], values[75]]);
    values.set(sheen, 72);

    if (custom.specColor) {
      const spec = hexToRgbaArray(custom.specColor, [values[76], values[77], values[78], values[79]]);
      values.set(spec, 76);
    }

    if (custom.canvasColor) {
      const bg = hexToRgbaArray(custom.canvasColor, [values[80], values[81], values[82], values[83]]);
      values.set(bg, 80);
    }

    // Halo y aura exterior
    const glow = hexToRgbaArray(custom.glowColor, [values[84], values[85], values[86], values[87]]);
    values.set(glow, 84);

    const uniformBuffer = this.device.createBuffer({
      size: values.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
    });

    const instance: OrbInstance = {
      canvas,
      context,
      uniformBuffer,
      bindGroup,
      values,
      baseSpeed: speed,
      baseExposure: exposure,
      targetSpeed: speed,
      targetExposure: exposure,
      motionPhase: 0,
      lastFrameAt: null,
      isVisible: true,
    };

    // Reactividad al hover
    const parent = canvas.closest('.codex-orb-link') || canvas.parentElement;
    if (parent) {
      parent.addEventListener('mouseenter', () => {
        instance.targetSpeed = instance.baseSpeed * 1.8;
        instance.targetExposure = instance.baseExposure * 1.35;
      });
      parent.addEventListener('mouseleave', () => {
        instance.targetSpeed = instance.baseSpeed;
        instance.targetExposure = instance.baseExposure;
      });
    }

    this.instances.push(instance);
    if (this.observer) this.observer.observe(canvas);
  }

  private startLoop() {
    if (this.isRunning) return;
    this.isRunning = true;

    const frame = (now: number) => {
      if (!this.isRunning || !this.device || !this.pipeline) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      for (const inst of this.instances) {
        if (!inst.isVisible) continue;

        const w = Math.max(1, Math.floor(inst.canvas.clientWidth * dpr));
        const h = Math.max(1, Math.floor(inst.canvas.clientHeight * dpr));
        if (inst.canvas.width !== w || inst.canvas.height !== h) {
          inst.canvas.width = w;
          inst.canvas.height = h;
        }

        const dt = inst.lastFrameAt === null ? 0 : Math.min(0.1, (now - inst.lastFrameAt) / 1000);
        inst.lastFrameAt = now;

        // Suave interpolación hacia el targetSpeed / targetExposure al hacer hover
        inst.values[3] += (inst.targetSpeed - inst.values[3]) * 0.1;
        inst.values[14] += (inst.targetExposure - inst.values[14]) * 0.1;

        inst.motionPhase += dt * Math.max(inst.values[3], 0);
        inst.values[0] = w;
        inst.values[1] = h;
        inst.values[2] = inst.motionPhase / Math.max(inst.values[3], 0.001);

        this.device.queue.writeBuffer(inst.uniformBuffer, 0, inst.values);

        const encoder = this.device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
          colorAttachments: [{
            view: inst.context.getCurrentTexture().createView(),
            clearValue: { r: 0, g: 0, b: 0, a: 0 },
            loadOp: 'clear',
            storeOp: 'store',
          }],
        });
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, inst.bindGroup);
        pass.draw(3);
        pass.end();
        this.device.queue.submit([encoder.finish()]);
      }

      this.animationFrame = requestAnimationFrame(frame);
    };

    this.animationFrame = requestAnimationFrame(frame);
  }

  private stopLoop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrame);
  }

  destroy() {
    this.stopLoop();
    this.observer?.disconnect();
    this.instances = [];
    this.device?.destroy();
  }
}

// Inicialización automática al cargar la página
let orbManagerInstance: LiquidOrbManager | null = null;

export function initLiquidOrbs() {
  if (typeof window === 'undefined') return;
  if (orbManagerInstance) {
    orbManagerInstance.destroy();
  }
  orbManagerInstance = new LiquidOrbManager();
  orbManagerInstance.init();
}
