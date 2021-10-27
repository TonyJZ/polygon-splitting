import { vec3, ReadonlyVec3 } from 'gl-matrix';

// Point/Plane Classification
export enum PlaneSide   {
  NOWHERE,
  ABOVE      = 0x01,
  ON         = 0x02,
  ONABOVE    = 0x03,		// ON    | ABOVE
  BELOW      = 0x04,
  ABOVEBELOW = 0x05,		// ABOVE | BELOW
  ONBELOW    = 0x06,		// ON    | BELOW
  CROSS      = 0x07		  // ABOVE | ON    | BELOW
};

export type Edge = {
  sPoint:   vec3;         // Source Point
  sPW:      PlaneSide;		// Where is Source Point?
  nextRef:  number;		    // Next Edge ref on cycle
  prevRef:  number;		    // Previous Edge ref on cycle
  t:        number;		    // Related to sPoint. Used in complexCut(...)
}