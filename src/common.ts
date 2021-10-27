import { vec3 } from 'gl-matrix';

export function asVec3(xs: number[][]) {
  return xs.map(p => vec3.fromValues(p[0], p[1], p[2]))
}

export function squareXY(d = 1) {
  return asVec3([[0,0,0],[d,0,0],[d,d,0], [0,d,0]]);
}

export function cube(d: number) {
  return asVec3([[0,0,0], [d,d,d]]);
}

export function alterZ(poly: readonly vec3[], d: number) {
  let pos = true;
  for (let p of poly) {
    p[2] = pos ? d : -d;
    pos = !pos;
  }
  return poly;
}

export function elideNegZero(p: vec3) {
  return vec3.fromValues(
    p[0] === 0 ? 0 : p[0],
    p[1] === 0 ? 0 : p[1],
    p[2] === 0 ? 0 : p[2]);
}
