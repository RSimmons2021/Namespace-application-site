import * as THREE from 'three';
import { GeometryBuilder, Primitives, StandardLayout, type Geometry } from 'null-graph/geometry';

/** NullGraph owns primitive generation; Three.js consumes the same interleaved arrays. */
export function bridgeGeometry(source: Pick<Geometry, 'vertices' | 'indices'>) {
  const geometry = new THREE.BufferGeometry();
  const buffer = new THREE.InterleavedBuffer(source.vertices, 8);
  geometry.setAttribute('position', new THREE.InterleavedBufferAttribute(buffer, 3, 0));
  geometry.setAttribute('normal', new THREE.InterleavedBufferAttribute(buffer, 3, 3));
  geometry.setAttribute('uv', new THREE.InterleavedBufferAttribute(buffer, 2, 6));
  geometry.setIndex(new THREE.BufferAttribute(source.indices, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

export const makeSphere = () => bridgeGeometry(Primitives.createSphere(StandardLayout, 1, 72, 48));
export const makeRing = (inner: number, outer: number) => bridgeGeometry(Primitives.createRing(StandardLayout, inner, outer, 160));
export const makeAsteroid = () => bridgeGeometry(Primitives.createIcosahedron(StandardLayout, 1));

/** Compact procedural ship, using the geometry builder and silhouette of NullGraph's Comic Flight demo. */
export function makeShip() {
  const builder = new GeometryBuilder(StandardLayout);
  const triangle = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    const normal = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const n = normal.toArray() as [number, number, number];
    const i = builder.addVertex({ position: a.toArray() as [number, number, number], normal: n, uv: [0, 0] });
    const j = builder.addVertex({ position: b.toArray() as [number, number, number], normal: n, uv: [1, 0] });
    const k = builder.addVertex({ position: c.toArray() as [number, number, number], normal: n, uv: [0, 1] });
    builder.addTriangle(i, j, k);
  };
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const nose = v(0, 0, 5), top = v(0, 1.2, 1), cockpit = v(0, .8, -1);
  const bottom = v(0, -.8, 1), tail = v(0, .8, -3), keel = v(0, -.5, -3);
  const shoulder = v(1.2, 0, 2), wing = v(4.5, -.2, -2), rear = v(1.5, 0, -3), fin = v(1.5, 2, -3.5);
  const faces = [[nose, shoulder, top], [nose, bottom, shoulder], [top, shoulder, cockpit], [shoulder, wing, cockpit], [cockpit, wing, tail], [wing, rear, tail], [bottom, keel, shoulder], [shoulder, keel, wing], [wing, keel, rear], [tail, rear, keel], [tail, fin, rear], [rear, fin, tail]];
  for (const [a, b, c] of faces) {
    triangle(a, b, c);
    triangle(v(-a.x, a.y, a.z), v(-c.x, c.y, c.z), v(-b.x, b.y, b.z));
  }
  const data = builder.build();
  return bridgeGeometry({ vertices: data.v, indices: data.i });
}
