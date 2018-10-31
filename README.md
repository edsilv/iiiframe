# IIIF Manifest -> A-Frame Entities

[![iiiframe on npm](https://img.shields.io/npm/v/iiiframe.svg?style=flat)](https://www.npmjs.com/package/iiiframe)

```js
document.addEventListener('DOMContentLoaded', async (evt) => {
    const entities = await iiiframe('https://iiif-3d-manifests.netlify.com/collection/gltf/woody/index.json');
    const sceneEl = document.querySelector('a-scene');
    await iiiframe.utils.appendEntities(entities, sceneEl);
    iiiframe.utils.scaleAndPositionObject(entities[0]);
    iiiframe.utils.createOrbitCamera(sceneEl, entities[0]);
});
```

### Examples

    npm start

<!--
### Examples

https://edsilv.github.io/iiiframe/examples/

An implementation of https://github.com/edsilv/iiif-ecs-proposal (work in progress)

example: https://edsilv.github.io/iiiframe/examples/

Reads a IIIF manifest and for each canvas creates an A-Frame `Entity`. For each annotation on that canvas, (conforming to the IIIF-ECS extension motivations), creates an A-Frame `Component` with the corresponding [type](https://github.com/aframevr/aframe/tree/master/docs/components).

### TODO: 

- `display` (right-left, left-to-right, top-to-bottom, bottom-to-top, continuous) [custom component](https://aframe.io/docs/0.8.0/introduction/writing-a-component.html)
- `playback` (duration, continuous) (AV) [custom component](https://aframe.io/docs/0.8.0/introduction/writing-a-component.html)
-->