import * as T from 'three';
import { outlineFragment, outlineVertex, planetVertex, toonFragment } from './shaders';

/** Stepped lighting and shadow halftone, shared by the ship, fleet and asteroid belt. */
export function makeToonMaterial(color: string, pixelRatio: number, doubleSided = false) {
  return new T.ShaderMaterial({
    vertexShader: planetVertex,
    fragmentShader: toonFragment,
    uniforms: { uColor: { value: new T.Color(color) }, uPixelRatio: { value: pixelRatio } },
    side: doubleSided ? T.DoubleSide : T.FrontSide,
  });
}

/** Inverted hull outlines remain two CSS pixels wide at any distance or resolution. */
export function makeOutlineMaterial(viewport: T.Vector2, pixelRatio: number) {
  return new T.ShaderMaterial({
    vertexShader: outlineVertex,
    fragmentShader: outlineFragment,
    uniforms: { uViewport: { value: viewport }, uWidth: { value: 2 * pixelRatio } },
    side: T.BackSide,
    depthWrite: true,
  });
}
