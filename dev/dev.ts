import * as sp from '../src/index';
import { asVec3 } from '../src/common';
import { polys } from './polygonConfig';
import { colors, randomColor } from './colors';
import { vec3 } from 'gl-matrix';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function app() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0.0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(0, 5, 20);

  window.addEventListener('resize', onWindowResize);
  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

  }

  var controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 10;
  controls.maxDistance = 500;

  var light = new THREE.DirectionalLight(0xffffff, 0.75);
  light.position.set(0, 20, 0);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  var helper = new THREE.GridHelper(40, 40);
  scene.add(helper);
  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  render();

  function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
  }

  const pts = asVec3(polys[4]);
  const poly = new sp.Polygon(pts);
  const cutPlane = new sp.Plane(vec3.fromValues(0, 1, 0), -3.0);
  const orgOffset = vec3.fromValues(-5, 0, 0);
  const aboveOffset = vec3.fromValues(-5, 0.25, -2);
  const belowOffset = vec3.fromValues(-5, -0.25, -2);
  const onOffset = vec3.fromValues(5, 0, 0);

  const polygon = createPolygon(poly, orgOffset, colors.blue);
  scene.add(polygon);
  const cut = createPlane(cutPlane, orgOffset, colors.red);
  scene.add(cut);

  const { abovePolys, onPolys, belowPolys } = sp.splitPolygon(poly, cutPlane);

  abovePolys.forEach( pl => {
    const poly = createPolygon(pl, aboveOffset, randomColor());
    scene.add(poly);
  })

  onPolys.forEach( pl => {
    const poly = createPolygon(pl, onOffset, randomColor());
    scene.add(poly);
  })

  belowPolys.forEach( pl => {
    const poly = createPolygon(pl, belowOffset, randomColor());
    scene.add(poly);
  })
};

function createPlane(cut: sp.Plane, offset: vec3, color: number): THREE.Mesh {
  const n = cut.normal;
  const d = cut.d;

  const px = 5, py = 5;

  const geometry = new THREE.PlaneGeometry( px, py );
  const material = new THREE.MeshBasicMaterial( {color: color, side: THREE.DoubleSide} );
  const plane = new THREE.Mesh( geometry, material );
  plane.lookAt(n[0], n[1], n[2]);
  plane.position.set(offset[0] - n[0]*d + px*0.5, offset[1] - n[1]*d, offset[2] - n[2]*d);

  return plane;
}

function createPolygon(p: sp.Polygon, offset: vec3, color: number): THREE.Line {
  const verts = p.vertices();
  const positions = [];
  const colors = [];
  const cl = new THREE.Color(color);

  for (let i = 0, l = verts.length; i < l; i++) {
    const point = verts[i];
    positions.push(point[0], point[1], point[2]);
    colors.push(cl.r, cl.g, cl.b);
  }
  positions.push(verts[0][0], verts[0][1], verts[0][2]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const matLineBasic = new THREE.LineBasicMaterial({ vertexColors: true });

  const line = new THREE.Line(geo, matLineBasic);
  line.computeLineDistances();

  line.position.set(offset[0], offset[1], offset[2]);

  return line;
}

app();