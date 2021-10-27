import { Edge, PlaneSide } from "./types";
import { DEdges } from "./dedge";
import { Plane } from "./plane";
import { vec3 } from 'gl-matrix';

interface PolyClassification {
  polyW: PlaneSide;
  onDEdges: Edge[];
}

export class Polygon {
  edges: DEdges;
  supportPlane: Plane;

  constructor(pts: vec3[], edges: Map<number, Edge> = undefined) {
    this.edges = new DEdges(pts, edges);
    this.supportPlane = new Plane(vec3.create(), 0);
    this.supportPlane.reinitialize(pts? pts : this.vertices());
  }

  plane(): Plane { return this.supportPlane; }

  isConvex(): boolean {
    const first = this.firstEdge();
    let e = first;
    let prev = undefined, cur = undefined;
    const n = this.supportPlane.getNormal();
    do {
      const next = this.edges.nextEdge(e);
      const v1 = vec3.subtract(vec3.create(), this.edges.dstPoint(e), this.edges.srcPoint(e));
      const v2 = vec3.subtract(vec3.create(), this.edges.dstPoint(next), this.edges.srcPoint(next));
      const cross = vec3.cross(vec3.create(), v1, v2);
      cur = vec3.dot(n, cross) > 0 ? 1 : -1;
      if (prev !== undefined && prev !== cur)
        return false;
      prev = cur;
    } while (e !== first);

    return true;
  }

  firstEdge(): Edge {
    return this.edges.anchor();
  }

  hasEdge(e: Edge): boolean {
    return this.edges.hasEdge(e);
  }

  /*
  /  Assign each srcPoint of every DEdge ABOVE, ON, or BELOW depending
  /  where they are in relation to the cut plane, and split any DEdges
  /  that cross the cut plane.
  */
  classifyPoints(cut: Plane): PolyClassification {
    const onDEdges = [];
    const first = this.firstEdge();
    first.sPW = cut.whichSide(first.sPoint);
    let polyW = first.sPW;
    let d = first;
    do {
      let nextE = this.edges.nextEdge(d);
      nextE.sPW = cut.whichSide(nextE.sPoint);
      polyW = polyW | nextE.sPW;

      if (this.edges.where(d) === PlaneSide.ABOVEBELOW) {
        // split edge
        this.split(cut, d);
        d = this.edges.nextEdge(d);
        onDEdges.push(d);
        d.sPW = PlaneSide.ON;
      } else if (d.sPW === PlaneSide.ON)
        onDEdges.push(d);

      d = this.edges.nextEdge(d);
    } while (d !== first);

    return { polyW, onDEdges };
  }

  split(cut: Plane, e: Edge) {
    const srcPt = this.edges.srcPoint(e);
    const dstPt = this.edges.dstPoint(e);
    const sgnDis = cut.sDistance(srcPt) * cut.sDistance(dstPt);

    if (sgnDis >= 0)
      console.error("this edge doesn't cross the cut plane!");

    const onP = cut.onPoint(srcPt, dstPt);
    this.edges.split(e, onP);
  }

  addBridge(leftBelow: Edge, rightAbove: Edge) {
    if (leftBelow.sPW !== PlaneSide.ON ||
      rightAbove.sPW !== PlaneSide.ON ||
      leftBelow === rightAbove)
      console.error("error: cannot bridge two edges!");

    const leftAbove = this.edges.prevEdge(leftBelow);
    const rightBelow = this.edges.prevEdge(rightAbove);

    const onAbove = this.edges.appendToEdge(leftBelow.sPoint, leftAbove);
    const onBelow = this.edges.appendToEdge(rightAbove.sPoint, rightBelow);
    this.edges.closeCycle(rightAbove, onAbove);
    this.edges.closeCycle(leftBelow, onBelow);

    onAbove.sPW = onBelow.sPW = PlaneSide.ON;
    this.maximize(this.edges.prevEdge(onAbove));
    this.maximize(onBelow);
  }

  complexCut(cut: Plane, onDs: Edge[], above: Polygon[], below: Polygon[]) {
    this.sortDEdges(onDs, vec3.cross(vec3.create(), cut.getNormal(), this.plane().getNormal()));
    let startOnD = 0;
    let useSrc = null;

    while (1) {
      const srcD = useSrc ? useSrc : this.getSrcEdge(onDs, startOnD);
      if (srcD === null)
        break;
      if (useSrc)
        useSrc = null;

      ++startOnD;
      const dstD = this.getDstEdge(onDs, startOnD);
      if (dstD === null)
        console.error("cannot find dst edge to close the cut!");
      ++startOnD;

      this.addBridge(srcD, dstD);
      if (this.edges.prevEdge(this.edges.prevEdge(srcD)).sPW === PlaneSide.ABOVE)
        useSrc = this.edges.prevEdge(srcD);
      else if (dstD.sPW === PlaneSide.BELOW)
        useSrc = dstD;
    }

    const addPolygon = function(results: Polygon[], e: Edge, poly: Polygon){
      let isExist = false;
      results.forEach(rPoly => {
        if (rPoly.hasEdge(e))
          isExist = true;
      });
      if (!isExist) {
        const edges = poly.getEdges(e);
        results.push(new Polygon(null, edges));
      }
    }

    // Collect new Polygons:
    onDs.forEach(e => {
      if (e.sPW === PlaneSide.ON) {
        if (this.edges.dstWhere(e) === PlaneSide.ABOVE)
          addPolygon(above, e, this);
        else if (this.edges.dstWhere(e) === PlaneSide.BELOW)
          addPolygon(below, e, this);
      }
    });
  }

  /*
  / Sort directed edges that have srcPoints ON the cut plane
  / left to right (in direction of cutDir) by their source points.
  */
  sortDEdges(onDs: Edge[], cutDir: vec3) {
    const refP = onDs[0].sPoint;
    onDs.forEach(e => {
      e.t = vec3.dot(cutDir, vec3.subtract(vec3.create(), e.sPoint, refP));
    });

    onDs.sort((a, b) => {
      if (a.t > b.t)
        return 1;
      else if (a.t === b.t && a.sPW === PlaneSide.ABOVE)
        return 1;
      else
        return -1;
    });
  }

  // Get the next directed edge that starts a cut.
  // This assumes all vertices on the cut Plane have manifold sectors.
  getSrcEdge(onDs: Edge[], start: number) {
    const nOnDs = onDs.length;
    while (start < nOnDs) {
      const prevW = this.edges.prevEdge(onDs[start]).sPW;
      const nextW = this.edges.nextEdge(onDs[start]).sPW;

      if ((prevW === PlaneSide.ABOVE && nextW === PlaneSide.BELOW) ||
        (prevW === PlaneSide.ABOVE && nextW === PlaneSide.ON &&
          this.edges.nextEdge(onDs[start]).t < onDs[start].t) ||
        (prevW === PlaneSide.ON && nextW === PlaneSide.BELOW &&
          this.edges.prevEdge(onDs[start]).t < onDs[start].t))
        return onDs[start];
      ++start;
    }
    return null;
  }

  // Get the next directed edge that ends a cut.
  getDstEdge(onDs: Edge[], start: number) {
    const nOnDs = onDs.length;
    while (start < nOnDs) {
      const prevW = this.edges.prevEdge(onDs[start]).sPW;
      const nextW = this.edges.nextEdge(onDs[start]).sPW;
      if ((prevW === PlaneSide.BELOW && nextW === PlaneSide.ABOVE) ||
        (prevW === PlaneSide.BELOW && nextW === PlaneSide.BELOW) ||
        (prevW === PlaneSide.ABOVE && nextW === PlaneSide.ABOVE) ||
        (prevW === PlaneSide.BELOW && nextW === PlaneSide.ON &&
          onDs[start].t < this.edges.nextEdge(onDs[start]).t) ||
        (prevW === PlaneSide.ON && nextW === PlaneSide.ABOVE &&
          onDs[start].t < this.edges.prevEdge(onDs[start]).t))
        return onDs[start];
      ++start;
    }
    return null;
  }

  maximize(d: Edge) {
    const dN = this.edges.nextEdge(d);
    const dNref = d.nextRef;
    if (d.sPW === PlaneSide.ON && dN.sPW === PlaneSide.ON
      && this.edges.dstWhere(dN) === PlaneSide.ON) {
      // Merge two adjacent and colinear DEdges:
      this.edges.closeCycle(this.edges.nextEdge(dN), d);
    }
  }

  // output polygon's vertices (unclosed ring)
  vertices(e: Edge = null): vec3[] {
    const anchor = e ? e : this.firstEdge();
    const pts = [];
    pts.push(anchor.sPoint);
    let next = this.edges.nextEdge(anchor);
    while (next !== anchor) {
      pts.push(next.sPoint);
      next = this.edges.nextEdge(next);
    }
    return pts;
  }

  getEdges(e: Edge = null): Map<number, Edge> {
    const eMap = new Map<number, Edge>();
    const anchor = e ? e : this.firstEdge();
    let next = this.edges.nextEdge(anchor);
    let nextRef = anchor.nextRef;
    const eRef = next.prevRef;
    eMap.set(eRef, anchor);
    while (next !== anchor) {
      eMap.set(nextRef, next);
      nextRef = next.nextRef;
      next = this.edges.nextEdge(next);
    }
    return eMap;
  }
}

