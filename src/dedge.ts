import { PlaneSide, Edge } from "./types";
import { vec3, ReadonlyVec3 } from 'gl-matrix';
// Directed Edges

export class DEdges {
  edgeMap: Map<number, Edge>;

  //Notice: pts is an unclosed point sequence.
  constructor(pts: vec3[], edges: Map<number, Edge> = undefined) {
    if(edges)
      this.initFromEdges(edges);
    else
      this.initFromPoints(pts);
  }

  initFromPoints(pts: vec3[]) {
    if (pts.length <= 3)
      console.error('Polygon contains at least 3 vertices rather then ', pts.length);

    this.edgeMap = new Map<number, Edge>();
    const anchor = {
      sPoint: pts[0],
      sPW: PlaneSide.NOWHERE,
      nextRef: undefined,
      prevRef: undefined,
      t: undefined
    };
    this.edgeMap.set(0, anchor);

    for (let i = 1; i < pts.length; ++i)
      this.add(pts[i]);

    this.closeCycle(anchor, this.edgeMap.get(pts.length-1));
  }

  initFromEdges(edges: Map<number, Edge>) {
    if (!edges || edges.size < 3)
      console.error('Polygon contains at least 3 edges rather than ', edges.size);

      this.edgeMap = new Map<number, Edge>(edges);
  }

  add(pt: vec3) {
    const edgeRef = this.edgeMap.size;
    const lastRef = edgeRef - 1;
    const last = this.edgeMap.get(lastRef);
    const edge = {
      sPoint: pt,
      sPW: PlaneSide.NOWHERE,
      nextRef: undefined,
      prevRef: lastRef,
      t: undefined
    };
    last.nextRef = edgeRef;
    this.edgeMap.set(edgeRef, edge);
  }

  appendToEdge(pt: vec3, last: Edge): Edge {
    const newEdge = {
      sPoint: pt,
      sPW: PlaneSide.NOWHERE,
      nextRef: undefined,
      prevRef: undefined,
      t: undefined
    };
    const id = this.edgeMap.size;
    const nextE = this.edgeMap.get(last.nextRef);

    newEdge.nextRef = last.nextRef;
    last.nextRef = id;
    newEdge.prevRef = nextE.prevRef;
    nextE.prevRef = id;

    this.edgeMap.set(id, newEdge);
    return newEdge;
  }

  removeEdge(eRef: number): boolean {
    return this.edgeMap.delete(eRef);
  }

  hasEdge(e: Edge): boolean {
    return Array.from(this.edgeMap.values()).includes(e);
  }

  closeCycle(first: Edge, last: Edge) {
    const firstRef = this.edgeMap.get(first.nextRef).prevRef;
    const lastRef = this.edgeMap.get(last.prevRef).nextRef;
    first.prevRef = lastRef;
    last.nextRef = firstRef;
  }

  anchor(): Edge {
    return this.edgeMap.values().next().value;
  }

  nextEdge(edge: Edge): Edge {
    return this.edgeMap.get(edge.nextRef);
  }

  prevEdge(edge: Edge): Edge {
    return this.edgeMap.get(edge.prevRef);
  }

  srcPoint(edge: Edge): vec3 { return edge.sPoint; }
  dstPoint(edge: Edge): vec3 { return this.nextEdge(edge).sPoint; }
  srcWhere(edge: Edge): PlaneSide { return edge.sPW; }
  dstWhere(edge: Edge): PlaneSide { return this.nextEdge(edge).sPW; }

  where(edge: Edge): PlaneSide { return this.srcWhere(edge) | this.dstWhere(edge); }

  split(edge: Edge, point: vec3) {
    const eRef = this.nextEdge(edge).prevRef;
    const nextE = this.nextEdge(edge);
    const nextERef = edge.nextRef;
    const newEdgeRef = this.edgeMap.size;

    const newEdge = {
      sPoint: point,
      sPW: PlaneSide.NOWHERE,
      nextRef: nextERef,
      prevRef: eRef,
      t: undefined
    };
    edge.nextRef = newEdgeRef;
    nextE.prevRef = newEdgeRef;
    this.edgeMap.set(newEdgeRef, newEdge);
  }
}

