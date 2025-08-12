import { Pane } from 'tweakpane'

export class Debug {
	constructor(uniforms) {
		const pane = new Pane()

		pane.addBinding(uniforms.seaAmplitude, 'value', {
			label: 'Sea amplitude',
			min: 0.1,
			max: 1.5,
			step: 0.01,
		})

		pane.addBinding(uniforms.seaSpeed, 'value', {
			label: 'Sea speed',
			min: 0.25,
			max: 1.5,
			step: 0.01,
		})
	}
}
