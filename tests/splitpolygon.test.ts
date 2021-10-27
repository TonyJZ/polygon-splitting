import { expect } from 'chai';
import * as sp from '../src/index';
import { asVec3 } from '../src/common';
import { vec3 } from 'gl-matrix';



describe("Split polygon by plane", () => {

  it("should output 3 polygons for U shaped input", () => {
    const vertices = [
      [0, 0, 0],
      [3, 0, 0],
      [3, 2, 0],
      [2, 2, 0],
      [2, 1, 0],
      [1, 1, 0],
      [1, 2, 0],
      [0, 2, 0],
    ];
    const pts = asVec3(vertices);
    const poly = new sp.Polygon(pts);
    const plane = new sp.Plane(vec3.fromValues(0, 1, 0), -1.5);
    const { abovePolys, onPolys, belowPolys } = sp.splitPolygon(poly, plane);

    expect(abovePolys, "2 polygons in front of the plane").to.have.lengthOf(2);
    expect(belowPolys, "1 polygon in back of the plane").to.have.lengthOf(1);
    /*
     * Proof that the CSG.js polygon/plane splitting doesn't work for
     * concave polygons, and hence it's not suitable for wall face splitting.
     */
  });

});


