# IIIF Manifest -> A-Frame Entities

```html
<head>
    <title>My A-Frame Scene</title>
    <script src="https://aframe.io/releases/0.8.2/aframe.min.js"></script>
    <script src="https://unpkg.com/aframe-orbit-controls@1.0.0/dist/aframe-orbit-controls.min.js"></script>
    <script src="https://unpkg.com/manifesto.js/dist/client/manifesto.bundle.js"></script>
    <script src="https://unpkg.com/iiiframe"></script>
</head>

<body>
    <a-scene></a-scene>
    <script>
        document.addEventListener('DOMContentLoaded', async (evt) => {
            const scene = document.querySelector('a-scene');
            const entities = await iiiframe('https://edsilv.github.io/iiiframe/collection/gltf/fisherman/index.json');

            entities.forEach((entity) => {
                scene.appendChild(entity);

                entity.addEventListener('model-loaded', (obj) => {
                    const object3D = obj.target.object3D;
                    iiiframe.utils.scaleAndPositionObject(object3D);
                    camera = scene.querySelector('a-entity[camera]');
                    const cameraObj = camera.object3D;
                    cameraObj.position.set(0, 0, 0);
                    camera.setAttribute('orbit-controls', 'target: 0 0 0; initialPosition: 0 0 0.75;');
                });
            });
        });
    </script>
</body>
```

### Examples

https://edsilv.github.io/iiiframe/examples/

<!--
An implementation of https://github.com/edsilv/iiif-ecs-proposal (work in progress)

example: https://edsilv.github.io/iiiframe/examples/

Reads a IIIF manifest and for each canvas creates an A-Frame `Entity`. For each annotation on that canvas, (conforming to the IIIF-ECS extension motivations), creates an A-Frame `Component` with the corresponding [type](https://github.com/aframevr/aframe/tree/master/docs/components).

### TODO: 

- `display` (right-left, left-to-right, top-to-bottom, bottom-to-top, continuous) [custom component](https://aframe.io/docs/0.8.0/introduction/writing-a-component.html)
- `playback` (duration, continuous) (AV) [custom component](https://aframe.io/docs/0.8.0/introduction/writing-a-component.html)
-->