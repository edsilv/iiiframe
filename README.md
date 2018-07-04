# iiiframe

An implementation of https://github.com/edsilv/iiif-ecs-proposal (work in progress)

example: https://edsilv.github.io/iiiframe/examples/

Reads a IIIF manifest and for each canvas creates an A-Frame `Entity`. For each annotation on that manifest, (conforming to the IIIF-ECS extension motivations), creates an A-Frame `Component` with the corresponding [type](https://github.com/aframevr/aframe/tree/master/docs/components).

### TODO: 

- ~~single centered image~~
- `display` (right-left, left-to-right, top-to-bottom, bottom-to-top, continuous) [custom component](https://aframe.io/docs/0.8.0/introduction/writing-a-component.html)
- `playback` (duration, continuous) (AV) [custom component](https://aframe.io/docs/0.8.0/introduction/writing-a-component.html)