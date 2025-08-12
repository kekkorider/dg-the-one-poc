<template>
	<div class="container">
		<canvas
			class="canvas"
			ref="canvas"
			:width="windowWidth"
			:height="windowHeight"
		/>

		<div class="knob" style="pointer-events: none">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 748 748">
				<g clip-path="url(#a)">
					<path
						stroke="#FFFFC4"
						stroke-dasharray="3 9"
						stroke-width="15"
						d="M374 740c202.136 0 366-163.864 366-366S576.136 8 374 8 8 171.864 8 374s163.864 366 366 366Z"
						opacity=".5"
					/>
				</g>

				<defs>
					<clipPath id="a">
						<path fill="#fff" d="M0 0h748v748H0z" />
					</clipPath>
				</defs>
			</svg>
		</div>

		<div class="knob" ref="knobRef">
			<svg
				style="pointer-events: none"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 748 748"
			>
				<g filter="url(#b)">
					<circle cx="374" cy="94" r="25" fill="#FFFFC4" />
				</g>

				<defs>
					<filter
						id="b"
						width="550"
						height="550"
						x="99"
						y="-181"
						color-interpolation-filters="sRGB"
						filterUnits="userSpaceOnUse"
					>
						<feFlood flood-opacity="0" result="BackgroundImageFix" />
						<feColorMatrix
							in="SourceAlpha"
							result="hardAlpha"
							values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
						/>
						<feOffset />
						<feGaussianBlur stdDeviation="7.81" />
						<feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0" />
						<feBlend
							in2="BackgroundImageFix"
							result="effect1_dropShadow_319_20"
						/>
						<feColorMatrix
							in="SourceAlpha"
							result="hardAlpha"
							values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
						/>
						<feOffset />
						<feGaussianBlur stdDeviation="15.621" />
						<feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0" />
						<feBlend
							in2="effect1_dropShadow_319_20"
							result="effect2_dropShadow_319_20"
						/>
						<feColorMatrix
							in="SourceAlpha"
							result="hardAlpha"
							values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
						/>
						<feOffset />
						<feGaussianBlur stdDeviation="54.673" />
						<feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0" />
						<feBlend
							in2="effect2_dropShadow_319_20"
							result="effect3_dropShadow_319_20"
						/>
						<feColorMatrix
							in="SourceAlpha"
							result="hardAlpha"
							values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
						/>
						<feOffset />
						<feGaussianBlur stdDeviation="109.345" />
						<feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0" />
						<feBlend
							in2="effect3_dropShadow_319_20"
							result="effect4_dropShadow_319_20"
						/>
						<feColorMatrix
							in="SourceAlpha"
							result="hardAlpha"
							values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
						/>
						<feOffset />
						<feGaussianBlur stdDeviation="125" />
						<feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0" />
						<feBlend
							in2="effect4_dropShadow_319_20"
							result="effect5_dropShadow_319_20"
						/>
						<feColorMatrix
							in="SourceAlpha"
							result="hardAlpha"
							values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
						/>
						<feOffset />
						<feGaussianBlur stdDeviation="125" />
						<feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0" />
						<feBlend
							in2="effect5_dropShadow_319_20"
							result="effect6_dropShadow_319_20"
						/>
						<feBlend
							in="SourceGraphic"
							in2="effect6_dropShadow_319_20"
							result="shape"
						/>
					</filter>
				</defs>
			</svg>
		</div>
	</div>
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
	vec3,
	remapClamp,
} from 'three/tsl'
import { OrbitControls } from 'three/addons/controls/OrbitControls'
import { easeInExpo } from 'tsl-easings'

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

const knobRef = useTemplateRef('knobRef')

const { width: windowWidth, height: windowHeight } = useWindowSize()
const { pixelRatio: dpr } = useDevicePixelRatio()
const params = useUrlSearchParams('history')

const { gsap, Observer, Draggable } = useGSAP()

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
	createKnob()

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

	const geometry = new THREE.PlaneGeometry(20, 10, 150, 200)
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
		const curveIntensity = remapClamp(uv().y, 0.98, 1, 0, 1)

		const noise = mx_noise_vec3(
			positionLocal.add(time.mul(uniforms.seaSpeed)),
			uniforms.seaAmplitude
		).mul(noiseIntensity)

		const curve = easeInExpo(curveIntensity)

		return positionLocal.add(noise).add(vec3(0, curve, 0).mul(0.1))
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

const createKnob = () => {
	Draggable.create(get(knobRef), {
		type: 'rotation',
		inertia: true,
		snap: value => {
			return Math.round(value / 120) * 120
		},
		throwResistance: 50000,
	})
}
</script>

<style scoped>
.container {
	display: grid;
	place-items: center;
}

.canvas {
	grid-column: 1 / -1;
	grid-row: 1 / -1;
	height: 100dvh;
	width: 100dvw;
}

.knob {
	aspect-ratio: 1;
	grid-column: 1 / -1;
	grid-row: 1 / -1;
	width: clamp(100px, 20dvw, 300px);
}
</style>
