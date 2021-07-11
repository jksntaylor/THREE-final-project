import './style.css'
import * as dat from 'dat.gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

import fireflyVert from './fireflies.vert'
import fireflyFrag from './fireflies.frag'
import portalVert from './portal.vert'
import portalFrag from './portal.frag'

/**
 * Base
 */
// Debug
const debugObject = {}
const gui = new dat.GUI({
    width: 400
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()
const bakedTexture = textureLoader.load('baked.jpg')
bakedTexture.flipY = false
bakedTexture.encoding = THREE.sRGBEncoding

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

debugObject.portalColorStart = '#9e00cf'
debugObject.portalColorEnd = '#CD84FF'

gui.addColor(debugObject, 'portalColorStart').onChange(() => portalMaterial.uniforms.uStartColor.value.set(debugObject.portalColorStart))
gui.addColor(debugObject, 'portalColorEnd').onChange(() => portalMaterial.uniforms.uEndColor.value.set(debugObject.portalColorEnd))

const portalMaterial = new THREE.ShaderMaterial({
    vertexShader: portalVert,
    fragmentShader: portalFrag,
    uniforms: {
        uTime: { value: 0 },
        uStartColor: { value: new THREE.Color(debugObject.portalColorStart) },
        uEndColor: { value: new THREE.Color(debugObject.portalColorEnd) }
    }
})


const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture })
const poleLightMaterial = new THREE.MeshBasicMaterial({ color: 0xF8E099 })
portalMaterial.side = THREE.DoubleSide

gltfLoader.load('portal.glb', gltf => {
    gltf.scene.children.find(c => c.name === 'baked').material = bakedMaterial
    gltf.scene.children.find(c => c.name === 'poleLightA').material = poleLightMaterial
    gltf.scene.children.find(c => c.name === 'poleLightB').material = poleLightMaterial
    gltf.scene.children.find(c => c.name === 'portalLight').material = portalMaterial
    scene.add(gltf.scene)
})

// Fireflies
const firefliesGeometry = new THREE.BufferGeometry()
const fireflyCount = 50
const positionArray = new Float32Array(fireflyCount * 3)
const scaleArray = new Float32Array(fireflyCount)

for( let i = 0; i < fireflyCount; i++ ) {
    positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4
    positionArray[i * 3 + 1] = Math.random() * 1.5
    positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4
    scaleArray[i] = Math.random()
}

firefliesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3))
firefliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1))

const firefliesMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: 200 },
    },
    vertexShader: fireflyVert,
    fragmentShader: fireflyFrag,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
})

gui.add(firefliesMaterial.uniforms.uSize, 'value').min(0).max(500).step(1).name('Firefly Size')

const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial)
scene.add(fireflies)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    firefliesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.minPolarAngle = 0
controls.maxPolarAngle = Math.PI / 2

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding

debugObject.clearColor = '#3a364d'
renderer.setClearColor(debugObject.clearColor)
gui.addColor(debugObject, 'clearColor').onChange(() => renderer.setClearColor(debugObject.clearColor))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    firefliesMaterial.uniforms.uTime.value = elapsedTime
    portalMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
