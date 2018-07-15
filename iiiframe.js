var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
window.iiiframe = (manifesturl, opts) => __awaiter(this, void 0, void 0, function* () {
    let options = {
        ecsProposalEnabled: false
    };
    options = Object.assign(options, opts);
    const data = yield manifesto.loadManifest(manifesturl);
    const manifest = manifesto.create(data);
    const entities = yield parseManifest(manifest);
    return entities;
    function parseManifest(manifest) {
        return __awaiter(this, void 0, void 0, function* () {
            const sequences = manifest.getSequences();
            const sequence = sequences[0];
            const canvases = sequence.getCanvases();
            const entities = [];
            yield Promise.all(canvases.map((canvas) => __awaiter(this, void 0, void 0, function* () {
                const entity = yield parseCanvas(canvas);
                entities.push(entity);
            })));
            return entities;
        });
    }
    function parseCanvas(canvas) {
        return __awaiter(this, void 0, void 0, function* () {
            const annos = canvas.getContent();
            // get the painting annotation (jpg, gltf, obj, pdf...)
            const painting = getPaintingAnnotation(annos);
            let entity = parsePaintingAnnotation(canvas, painting);
            if (options.ecsProposalEnabled) {
                // parse remaining annotations (scale, rotate, position...)
                yield Promise.all(annos.map((anno) => __awaiter(this, void 0, void 0, function* () {
                    parseAnnotation(anno, entity);
                })));
            }
            return entity;
        });
    }
    function getPaintingAnnotation(annos) {
        for (let i = 0; i < annos.length; i++) {
            const anno = annos[i];
            const motivation = anno.getMotivation().value;
            if (motivation.toLowerCase() === 'painting') {
                return anno;
            }
        }
    }
    // experimental
    function parseAnnotation(anno, entity) {
        return __awaiter(this, void 0, void 0, function* () {
            const motivation = anno.getMotivation().value;
            if (motivation.toLowerCase() === 'painting') {
                return;
            }
            const body = anno.getBody()[0];
            let json = yield iiiframe.utils.get(body.id);
            json = JSON.parse(json);
            switch (motivation) {
                case 'scale':
                    if (entity.nodeName === 'A-IMAGE') {
                        // add width and height
                        const width = document.createAttribute('width');
                        width.value = json.x;
                        entity.setAttributeNode(width);
                        const height = document.createAttribute('height');
                        height.value = json.y;
                        entity.setAttributeNode(height);
                    }
                    else {
                        // add scale component
                        const scale = document.createAttribute('scale');
                        scale.value = `${json.x} ${json.y} ${json.z}`;
                        entity.setAttributeNode(scale);
                    }
                    break;
                case 'rotation':
                    // add rotation component
                    break;
                case 'position':
                    const position = document.createAttribute('position');
                    position.value = `${json.x} ${json.y} ${json.z}`;
                    entity.setAttributeNode(position);
                    break;
            }
        });
    }
    function parsePaintingAnnotation(canvas, anno) {
        const body = anno.getBody()[0];
        const format = body.getFormat().value;
        let entity;
        switch (format.toLowerCase()) {
            case 'image/jpeg':
                entity = document.createElement('a-image');
                // src component
                const src = document.createAttribute('src');
                src.value = body.id;
                entity.setAttributeNode(src);
                // width/height
                const w = canvas.getWidth();
                const h = canvas.getHeight();
                if (w !== undefined && h !== undefined) {
                    const width = document.createAttribute('width');
                    width.value = w;
                    entity.setAttributeNode(width);
                    const height = document.createAttribute('height');
                    height.value = h;
                    entity.setAttributeNode(height);
                }
                // geometry component
                // https://github.com/aframevr/aframe/blob/bbc2f0325cdd3c4bd95a69ce4ce9705b0e6a041d/src/extras/primitives/primitives/a-image.js
                // const geometry = document.createAttribute('geometry');
                // geometry.value = 'primitive: plane;'
                // entity.setAttributeNode(geometry);
                // // material component
                // const material = document.createAttribute('material');
                // material.value = 'color: #FFF; shader: flat; side: double; transparent: true';
                // entity.setAttributeNode(material);
                break;
            case 'model/gltf+json':
                entity = document.createElement('a-entity');
                const gltfmodel = document.createAttribute('gltf-model');
                gltfmodel.value = body.id;
                entity.setAttributeNode(gltfmodel);
                break;
        }
        return entity;
    }
});
window.iiiframe.utils = {
    get: (url) => {
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.addEventListener('load', (progressEvent) => {
                if (xhr.status == 200) {
                    resolve(progressEvent.target.response);
                }
                else {
                    reject(Error(xhr.statusText));
                }
            });
            xhr.onerror = () => {
                reject(Error('Network Error'));
            };
            xhr.send();
        });
    },
    findGeometry: (children) => {
        const geometry = children[0].geometry;
        if (geometry) {
            return geometry;
        }
        else if (children[0].children) {
            return iiiframe.utils.findGeometry(children[0].children);
        }
        return null;
    },
    scaleAndPositionObject: (obj) => {
        const geometry = iiiframe.utils.findGeometry(obj.children);
        if (geometry) {
            geometry.computeBoundingBox();
            const sizeX = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
            const sizeY = geometry.boundingBox.max.y - geometry.boundingBox.min.y;
            const sizeZ = geometry.boundingBox.max.z - geometry.boundingBox.min.z;
            const diagonalSize = Math.sqrt(sizeX * sizeX + sizeY * sizeY + sizeZ * sizeZ);
            const scale = 1.0 / diagonalSize;
            const midX = (geometry.boundingBox.min.x + geometry.boundingBox.max.x) / 2;
            const midY = (geometry.boundingBox.min.y + geometry.boundingBox.max.y) / 2;
            const midZ = (geometry.boundingBox.min.z + geometry.boundingBox.max.z) / 2;
            obj.scale.multiplyScalar(scale);
            obj.position.x = -midX * scale;
            obj.position.y = -midY * scale;
            obj.position.z = -midZ * scale;
        }
    }
};
