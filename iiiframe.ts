
type Entity = import('aframe').Entity;

declare var iiiframe: any;

interface options {
    ecsProposalEnabled: boolean;
}

window.iiiframe = async (manifesturl: string, opts?: options): Promise<Entity[]> => {

    let options: options =  {
        ecsProposalEnabled: false
    }

    options = Object.assign(options, opts);

    const data = await manifesto.loadManifest(manifesturl);
    const manifest = manifesto.create(data);
    const entities: Entity[] = await parseManifest(manifest);

    return entities;

    async function parseManifest(manifest): Promise<Entity[]> {

        const sequences = manifest.getSequences();
        const sequence = sequences[0];
        const canvases = sequence.getCanvases();
        const entities: Entity[] = [];
        
        await Promise.all(canvases.map(async canvas => {
            const entity = await parseCanvas(canvas);
            entities.push(entity);
        }));

        return entities;
    }

    async function parseCanvas(canvas) {

        const annos = canvas.getContent();

        // get the painting annotation (jpg, gltf, obj, pdf...)
        const painting = getPaintingAnnotation(annos);
        let entity = parsePaintingAnnotation(canvas, painting);

        if (options.ecsProposalEnabled) {
            // parse remaining annotations (scale, rotate, position...)
            await Promise.all(annos.map(async anno => {
                parseAnnotation(anno, entity);
            }));
        }

        return entity;
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
    async function parseAnnotation(anno, entity) {
        
        const motivation = anno.getMotivation().value;

        if (motivation.toLowerCase() === 'painting') {
            return;
        }

        const body = anno.getBody()[0];

        let json: any = await iiiframe.utils.fetch(body.id);
        json = JSON.parse(json);

        switch (motivation) {
            case 'scale' :

                if (entity.nodeName === 'A-IMAGE') {
                    // add width and height
                    const width = document.createAttribute('width');
                    width.value = json.x;
                    entity.setAttributeNode(width);

                    const height = document.createAttribute('height');
                    height.value = json.y;
                    entity.setAttributeNode(height);
                } else {
                    // add scale component
                    const scale = document.createAttribute('scale');
                    scale.value = `${json.x} ${json.y} ${json.z}`;
                    entity.setAttributeNode(scale);
                }
                
                break;
            case 'rotation' :
                // add rotation component
                break;
            case 'position' :
                const position = document.createAttribute('position');
                position.value = `${json.x} ${json.y} ${json.z}`;
                entity.setAttributeNode(position);
                break;
        }
        
    }

    function parsePaintingAnnotation(canvas, anno) {
        const body = anno.getBody()[0];
        const format = body.getFormat().value;
        let entity;
        
        switch (format.toLowerCase()) {
            case 'image/jpeg' :
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
            case 'model/gltf+json' :
                entity = document.createElement('a-entity');
                const gltfmodel = document.createAttribute('gltf-model');
                gltfmodel.value = body.id;
                entity.setAttributeNode(gltfmodel);
                break;
        }
        
        return entity;
    }

}

window.iiiframe.utils = {

    fetch: (url: string): Promise<void> => {
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

    appendEntities: (entities: Entity | Entity[], container: Entity): Promise<void> => {

        return new Promise((resolve) => {

            let entitiesLoaded: number = 0;

            if (!Array.isArray(entities)) {
                entities = [entities];
            }

            entities.forEach((entity) => {

                entity.addEventListener('model-loaded', () => {
                    entitiesLoaded++;
                });

                if (entity.nodeName === 'A-IMAGE') {
                    entity.addEventListener('loaded', () => {
                        entitiesLoaded++;
                    });
                }

                container.appendChild(entity);
            });

            const loadAwaiter = setInterval(() => {
                if (entitiesLoaded === (<Entity[]>entities).length) {
                    clearInterval(loadAwaiter);
                    resolve();
                }
            }, 100);

        });
    },

    /**
     * @param  {Element} sceneEl
     * @param  {THREE.Object3D} object
     * @param  {number} multiplier? - Multiply the magnitude of the object bounding vector by this number
     * @returns Entity
     */
    createOrbitCamera: (sceneEl: Element, object: Entity | THREE.Object3D, multiplier?: number): Entity => {
        object = iiiframe.utils.coerceToObject3D(object);
        const cameraEl: Entity = sceneEl.querySelector('a-entity[camera]');
        const camera = cameraEl.object3D;
        camera.position.set(0, 0, 0);
        const multiplierDefault: number = 10;
        const fov = iiiframe.utils.getFov(object, multiplier || multiplierDefault);
        const cameraZ = iiiframe.utils.getCameraZ(object, multiplier || multiplierDefault);
        cameraEl.setAttribute('camera', `fov: ${fov};`);
        cameraEl.setAttribute('orbit-controls', `target: 0 0 0; initialPosition: 0 0 ${cameraZ}; enableDamping: true`);
        return cameraEl;
    },

    findGeometry: (children): THREE.Geometry | null => {
        const geometry = children[0].geometry;
        if (geometry) {
            return geometry;
        } else if (children[0].children) {
            return iiiframe.utils.findGeometry(children[0].children);
        }
        return null;
    },

    coerceToObject3D: (object: Entity | THREE.Object3D): THREE.Object3D => {

        if ((<any>object).isEntity) {
            object = (<Entity>object).object3D;
        }

        return <THREE.Object3D>object;
    },

    scaleAndPositionObject: (object: Entity | THREE.Object3D): void => {

        const obj: THREE.Object3D = iiiframe.utils.coerceToObject3D(object);
        const geometry: THREE.Geometry | null = iiiframe.utils.findGeometry(obj.children);

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
        
    },

    getBoundingBox: (obj: THREE.Object3D): THREE.Box3 => {
        return new THREE.Box3().setFromObject(obj);
    },

    getBoundingMag: (obj: THREE.Object3D): number => {
        const size: THREE.Vector3 = new THREE.Vector3();
        iiiframe.utils.getBoundingBox(obj).getSize(size).length();
        return size.length();
    },

    /**
     * @param  {THREE.Object3D} obj
     * @param  {number} multiplier - Multiply the magnitude of the object bounding vector by this number
     * @returns number
     */
    getCameraZ: (obj: THREE.Object3D, multiplier: number): number => {
        return iiiframe.utils.getBoundingMag(obj) * multiplier;
    },

    /**
     * @param  {THREE.Object3D} obj
     * @param  {number} multiplier - Multiply the magnitude of the object bounding vector by this number
     * @returns number
     */
    getFov: (obj: THREE.Object3D, multiplier: number): number => {

        const dist: number = iiiframe.utils.getCameraZ(obj, multiplier);
        const mag: number = iiiframe.utils.getBoundingMag(obj);
        let fov: number = 2 * Math.atan(mag / (2 * dist)) * (180 / Math.PI);

        return fov;
    }
}