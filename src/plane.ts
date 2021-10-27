import { vec3, ReadonlyVec3 } from 'gl-matrix';
import { PlaneSide } from './types';

// Provide a minimal 3D plane support sufficine for the Gem.
//
// Any point p that is known topologically to lie on a plane pN+d~0
// is included in the plane by enlarging the epsilon, so the
// equation |pN+d| <= eps holds.  The point/plane relationship must
// be established by the application code.

export class Plane {
  normal:  ReadonlyVec3;
  d:       number;
  eps:     number;

  constructor(n: ReadonlyVec3, d: number) {
    this.normal = vec3.clone(n);
    this.d = d;
    this.eps = 0.0;
  }

  // Computes the plane equation using Newell's averaging algorithm.
  reinitialize(pts: vec3[]) {
    if (pts.length <= 2)
      console.error("not enough points ");

    let avrPnt = vec3.fromValues(0,0,0);
    let n = vec3.fromValues(0,0,0);
    for (let i = 0; i < pts.length; ++i ) {
      avrPnt = vec3.add(vec3.create(), avrPnt, pts[i]);
      const cross = vec3.cross(vec3.create(), pts[i], pts[(i+1)%pts.length]);
      n = vec3.add(vec3.create(), n, cross);
    }
    this.normal = vec3.normalize(vec3.create(), n);
    this.d = vec3.dot(this.normal, vec3.scale(vec3.create(), avrPnt, (-1.0/pts.length)));

    pts.forEach(p => this.updateEpsilon(p));
  }

  updateEpsilon(p: vec3) {
    const d = this.sDistance(p);
    if (Math.abs(d) > this.eps)
      this.eps = Math.abs(d);
  }

  getNormal(): ReadonlyVec3 { return this.normal; }

  // Signed distance from the point to the plane.
  sDistance(p: ReadonlyVec3): number {
    return vec3.dot(this.normal, p) + this.d;
  }

  // Compute the intersection point with the transversal line (p,q).
  onPoint(p: ReadonlyVec3, q: ReadonlyVec3): vec3 {

    const v = vec3.subtract(vec3.create(), q, p);
    const c = vec3.dot(this.normal, v);

    if (c === 0.0) //the line is parallel to the plane
      return vec3.fromValues(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);

    const t = -this.sDistance(p) / c;
    return vec3.add(vec3.create(), p, vec3.scale(vec3.create(), v, t));
  }

  // Which side of the plane is this point on?
  whichSide(p: ReadonlyVec3): PlaneSide {
    const d = this.sDistance( p );
    return d < -this.eps ? PlaneSide.BELOW : (d > this.eps ? PlaneSide.ABOVE : PlaneSide.ON);
  }
}








