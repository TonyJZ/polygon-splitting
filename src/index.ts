import { Polygon } from "./polygon";
import { Plane } from "./plane";
import { PlaneSide } from "./types";
export * from './polygon'
export * from './plane'

export function splitPolygon(g: Polygon, cut: Plane):
{abovePolys: Polygon[], onPolys: Polygon[], belowPolys: Polygon[]} {
  const abovePolys = [];
  const onPolys = [];
  const belowPolys = [];
  const {polyW, onDEdges} = g.classifyPoints(cut);
  switch(polyW) {
    case PlaneSide.ONABOVE:
    case PlaneSide.ABOVE:
      abovePolys.push(g);
      break;
    case PlaneSide.ON:
      onPolys.push(g);
      break;
    case PlaneSide.ONBELOW:
    case PlaneSide.BELOW:
      onPolys.push(g);
      break;
    default: /* case CROSS */
      if (onDEdges.length < 2)
        console.error("This is not a simple polygon!");
      g.complexCut(cut, onDEdges, abovePolys, belowPolys);
  }

  return {abovePolys, onPolys, belowPolys};
}