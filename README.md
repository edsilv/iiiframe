# iiiframe

An implementation of https://github.com/edsilv/iiif-ecs-proposal (WIP)

Reads a IIIF manifest and for each canvas creates an A-Frame `Entity`. For each annotation on that manifest, (conforming to the IIIF-ECS extension motivations), creates an A-Frame `Component` with the corresponding [type](https://github.com/aframevr/aframe/tree/master/docs/components).

TODO: 

- A single centered image
- 3 images arranged horizontally
- 3 images arranged vertically
- checkbox toggle perspective and orthographic camera
- Create `display` and `playback` [custom components](https://aframe.io/docs/0.8.0/introduction/writing-a-component.html)