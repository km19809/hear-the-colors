<script>
import * as Tone from "tone";
	import { findPosition, rgbToHsv, hsvToAudio } from "./utils.js";

	let canvasElement;
	let instrument = null;
	let effector = null;
	let distortionRatio=0.5;
	let isHzLinear=false;
	let minHz=50;
	let maxHz=5000;

	async function initTone() {
		await Tone.start();
		console.log("audio is ready");
		effector=new Tone.Distortion(0.5).toDestination();
		instrument = new Tone.Synth({
			volume: 0,
			detune: 0,
			portamento: 0.05,
			envelope: {
				attack: 0.05,
				attackCurve: "exponential",
				decay: 0.2,
				decayCurve: "linear",
				release: 0.5,
				releaseCurve: "linear",
				sustain: 0.2,
			},
			oscillator: {
				partialCount: 7,
				partials: [
					0.8105694691387023, 0, -0.0900632743487447, 0,
					0.03242277876554809, 0, -0.016542234064055146,
				],
				phase: 0,
				type: "amtriangle7",
				harmonicity: 0.5,
				modulationType: "sine3",
			},
		}).connect(effector);
	}
    function playPixel(ctx,x,y){
		const p = ctx.getImageData(x, y, 1, 1).data;
		const [r, g, b] = p;
		const hsv = rgbToHsv({ r: r, g: g, b: b });
		if (instrument) {
			const { hz, velocity, distortion } = hsvToAudio(hsv,isHzLinear,minHz,maxHz,distortionRatio);
			
			instrument.triggerRelease();
			if (effector){
				effector.distortion=distortion;
			}
			instrument.triggerAttack(hz, Tone.now(), velocity);
		}
	}
	function onTouchMove(event) {
		event.preventDefault()
		const pos = findPosition(this);
		const x = event.touches[0].pageX - pos.x;
		const y = event.touches[0].pageY - pos.y;
		const ctx = this.getContext("2d");
		playPixel(ctx,x,y)
	}
	function onMouseMove(event) {
		const pos = findPosition(this);
		const x = event.pageX - pos.x;
		const y = event.pageY - pos.y;
		const ctx = this.getContext("2d");
		playPixel(ctx,x,y)
	}

	function stopSound() {
		if (instrument) {
			instrument.triggerRelease();
		}
	}

	function readImage() {
		if (!this.files || !this.files[0]) return;

		const FR = new FileReader();
		FR.addEventListener("load", (evt) => {
			const img = new Image();
			img.addEventListener("load", () => {
				canvas.width = img.width;
				canvas.height = img.height;
				const ctx = canvas.getContext("2d");
				ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
				ctx.drawImage(img, 0, 0);
			});
			img.src = evt.target.result;
		});
		FR.readAsDataURL(this.files[0]);
	}
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta charset="UTF-8" />
	<title>Hear the colors!</title>
</svelte:head>
<main>
	<p>Choose image files to start!</p>
	<p class="border">
		<b>Options</b><br/>
		<label for="linearHz">Increase Hz linearly: </label>
		<input type="checkbox" id="linearHz" bind:checked={isHzLinear}><br/>
		<label for="distortionAmount">Distortion amount: </label>
		<input type="range" id="distortionAmount" min="0" max="1" step="0.05" bind:value={distortionRatio}><br/>
		<label for="minHz">Minimum Hz: </label>
		<input type="number" min="20" max={maxHz-1} bind:value={minHz} id="minHz"><br/>
		<label for="maxHz">Maximum Hz: </label>
		<input type="number" min={minHz} max="20000" bind:value={maxHz} id="maxHz">	
	</p>
	<input
		type="file"
		id="fileUpload"
		accept="image/*"
		on:click={initTone}
		on:change={readImage}
	/>
	<canvas
		id="canvas"
		bind:this={canvasElement}
		on:touchmove={onTouchMove}
		on:mousemove={onMouseMove}
		on:mouseleave={stopSound}
	/>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}
	canvas {
		display: block;
	}
	label {display: inline;}
    .border {
		border: 2px black solid;
	}
	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
