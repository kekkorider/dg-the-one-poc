<template>
	<canvas
		class="canvas"
		ref="canvas"
		:width="windowWidth"
		:height="windowHeight"
	/>
</template>

<script setup>
import { useTemplateRef, onMounted, nextTick, watch } from 'vue'
import {
	useWindowSize,
	useDevicePixelRatio,
	useUrlSearchParams,
	get,
} from '@vueuse/core'
import * as THREE from 'three/webgpu'
import {
	Fn,
	time,
	positionLocal,
	mx_noise_vec3,
	uniform,
	reflector,
	mix,
	smoothstep,
	color,
	blendOverlay,
	uv,
} from 'three/tsl'
import { OrbitControls } from 'three/addons/controls/OrbitControls'

import { useGSAP } from '@/composables/useGSAP'
import { textureLoader } from '@/assets/loaders'

const canvasRef = useTemplateRef('canvas')
let perfPanel,
	scene,
	camera,
	cameraRotationZ = { value: 0 },
	renderer,
	controls,
	seaMesh,
	ambLight
const textures = new Map()

const { width: windowWidth, height: windowHeight } = useWindowSize()
const { pixelRatio: dpr } = useDevicePixelRatio()
const params = useUrlSearchParams('history')

const { gsap, Observer } = useGSAP()

const uniforms = Object.freeze({
	seaAmplitude: uniform(0.1),
	seaSpeed: uniform(0.3),
})

//
// Lifecycle
//
onMounted(async () => {
	await nextTick()

	createScene()
	createCamera()
	createRenderer()

	await loadTextures()

	createLight()
	createSea()
	createBg()

	createMouse()

	// createControls()

	gsap.ticker.fps(60)

	gsap.ticker.add(time => {
		perfPanel?.begin()

		updateScene(time)
		renderer.renderAsync(scene, camera)

		perfPanel?.end()
	})

	if (Object.hasOwn(params, 'debug')) {
		const { Debug } = await import('@/assets/Debug')
		new Debug(uniforms, ambLight)

		if (!renderer.isWebGPURenderer) {
			const { ThreePerf } = await import('three-perf')

			perfPanel = new ThreePerf({
				anchorX: 'left',
				anchorY: 'top',
				domElement: document.body,
				renderer,
			})
		}
	}
})

//
// Watchers
//
watch(dpr, value => {
	renderer.setPixelRatio(value)
})

watch([windowWidth, windowHeight], value => {
	camera.aspect = value[0] / value[1]
	camera.updateProjectionMatrix()

	renderer.setSize(value[0], value[1])
})

//
// Methods
//
function updateScene(time = 0) {
	cameraRotationZ.value *= 0.97

	camera.lookAt(0, 1, -10)
	camera.rotation.z = cameraRotationZ.value
	controls?.update()
}

function createScene() {
	scene = new THREE.Scene()
}

function createCamera() {
	camera = new THREE.PerspectiveCamera(
		40,
		get(windowWidth) / get(windowHeight),
		0.1,
		100
	)

	camera.position.set(0, 2, 5)
}

function createRenderer() {
	renderer = new THREE.WebGPURenderer({
		canvas: get(canvasRef),
		alpha: true,
		antialias: true,
	})

	renderer.toneMapping = THREE.AgXToneMapping
	renderer.setClearColor(0x121212, 1)
	renderer.setSize(get(windowWidth), get(windowHeight))
}

async function loadTextures() {
	const result = await textureLoader.load('/bg-upscaled-landscape.png')
	result.colorSpace = THREE.SRGBColorSpace
	textures.set('bg', result)
}

function createControls() {
	controls = new OrbitControls(camera, renderer.domElement)
	controls.enableDamping = true
}

function createSea() {
	// Reflection
	const reflection = reflector({
		resolution: 0.5,
		bounces: false,
		generateMipmaps: false,
	})
	reflection.target.rotateX(-Math.PI / 2)
	reflection.target.position.y = 1
	scene.add(reflection.target)

	const geometry = new THREE.PlaneGeometry(20, 10, 100, 100)
	geometry.rotateX(-Math.PI / 2)

	const material = new THREE.MeshStandardNodeMaterial()

	material.colorNode = Fn(() => {
		const base = reflection
		const light = color(0xffffff)

		const bl = blendOverlay(base, light.mul(10))

		const result = mix(base, bl, smoothstep(-0.04, 0.2, positionLocal.y))

		return result
	})()

	material.positionNode = Fn(() => {
		const noiseIntensity = smoothstep(0.995, 0.75, uv().y)

		const noise = mx_noise_vec3(
			positionLocal.add(time.mul(uniforms.seaSpeed)),
			uniforms.seaAmplitude
		).mul(noiseIntensity)

		return positionLocal.add(noise)
	})()

	seaMesh = new THREE.Mesh(geometry, material)

	scene.add(seaMesh)
}

const createLight = () => {
	ambLight = new THREE.AmbientLight(0xffffff, 1.5)
	scene.add(ambLight)
}

function createBg() {
	const geometry = new THREE.PlaneGeometry(4.729, 2.88)
	geometry.scale(5, 5, 1)

	const material = new THREE.MeshBasicNodeMaterial({
		map: textures.get('bg'),
	})

	const mesh = new THREE.Mesh(geometry, material)
	mesh.position.y = 2
	mesh.position.z = -5

	scene.add(mesh)
}

const createMouse = () => {
	Observer.create({
		type: 'pointer',
		onMove: e => {
			const { x, y } = e

			const xNDC = (x / get(windowWidth)) * 2 - 1
			const yNDC = -(y / get(windowHeight)) * 2 + 1

			cameraRotationZ.value -= e.velocityX * 0.0000003

			gsap.to(camera.position, {
				x: () => xNDC * 1.35,
				overwrite: true,
				duration: 1,
			})
		},
	})
}
</script>

<style scoped>
.canvas {
	height: 100dvh;
	width: 100dvw;
}
</style>
