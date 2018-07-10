let manifesturl;
const scalefactor = 100;
const ecsProposalEnabled = false;

async function parseManifest(manifest) {

    const sequences = manifest.getSequences();
    const sequence = sequences[0];
    const canvases = sequence.getCanvases();
    const entities = [];
    
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
    let entity = parsePaintingAnnotation(painting);

    if (ecsProposalEnabled) {
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

async function parseAnnotation(anno, entity) {
    
    const motivation = anno.getMotivation().value;

    if (motivation.toLowerCase() === 'painting') {
        return;
    }

    const body = anno.getBody()[0];

    let json = await get(body.id);
    json = JSON.parse(json);

    switch (motivation) {
        case 'scale' :

            if (entity.nodeName === 'A-IMAGE') {
                // add width and height
                const width = document.createAttribute('width');
                width.value = json.x / scalefactor;
                entity.setAttributeNode(width);

                const height = document.createAttribute('height');
                height.value = json.y / scalefactor;
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

function parsePaintingAnnotation(anno) {
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

function get(url) {
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
}

async function iiiframe(m) {

    manifesturl = m;

    const data = await manifesto.loadManifest(manifesturl);
    const manifest = manifesto.create(data);
    const entities = await parseManifest(manifest);

    return entities;
}