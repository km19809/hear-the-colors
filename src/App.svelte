<script>
	import * as Tone from "tone";
	import { findPosition, rgbToHsv, hsvToAudio } from "./utils.js";

	let canvasElement;

	let instrument = null;
	let effector = null;
	let distortionRatio = 0.5;
	let isHzLinear = false;
	let minHz = 50;
	let maxHz = 5000;

	let filename = "";

	async function initTone() {
		await Tone.start();
		console.log("audio is ready");
		effector = new Tone.Distortion(0.5).toDestination();
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
	function playPixel(ctx, x, y) {
		const p = ctx.getImageData(x, y, 1, 1).data;
		const [r, g, b] = p;
		const hsv = rgbToHsv({ r: r, g: g, b: b });
		if (instrument) {
			const { hz, velocity, distortion } = hsvToAudio(
				hsv,
				isHzLinear,
				minHz,
				maxHz,
				distortionRatio
			);

			instrument.triggerRelease();
			if (effector) {
				const { h, s, v } = hsv;
				console.debug(
					`%c■%c At(${x},${y}) hsv:(${h.toFixed(2)},${s.toFixed(
						2
					)},${v.toFixed(2)}), hz:${hz.toFixed(
						2
					)}, v:${velocity.toFixed(2)}`,
					`color: rgb(${r},${g},${b}); background-color: black;`,
					"color:black; background-color: white;"
				);
				effector.distortion = distortion;
			}
			instrument.triggerAttack(hz, Tone.now(), velocity);
		}
	}
	function onTouchMove(event) {
		event.preventDefault();
		const pos = findPosition(this);
		const x = event.touches[0].pageX - pos.x;
		const y = event.touches[0].pageY - pos.y;
		const ctx = this.getContext("2d");
		playPixel(ctx, x, y);
	}
	function onMouseMove(event) {
		const pos = findPosition(this);
		const x = event.pageX - pos.x;
		const y = event.pageY - pos.y;
		const ctx = this.getContext("2d");
		playPixel(ctx, x, y);
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
				const imgHeight = img.height,
					imgWidth = img.width;
				const hwRatio = imgHeight / imgWidth;
				console.debug(`i${imgWidth} c${canvasElement.width}`);
				const siblingWidth =
					canvasElement.previousElementSibling.clientWidth;
				if (imgWidth > siblingWidth) {
					canvasElement.width = siblingWidth;
					canvasElement.height = Math.floor(
						canvasElement.width * hwRatio
					);
				} else {
					canvasElement.width = imgWidth;
					canvasElement.height = imgHeight;
				}
				console.debug(`i${imgWidth} c${canvasElement.width}`);
				const ctx = canvasElement.getContext("2d");
				ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
				ctx.drawImage(
					img,
					0,
					0,
					imgWidth,
					imgHeight,
					0,
					0,
					ctx.canvas.width,
					ctx.canvas.height
				);
			});
			img.src = evt.target.result;
		});
		filename = this.files[0].name;
		FR.readAsDataURL(this.files[0]);
	}
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta charset="UTF-8" />
	<title>Hear the colors!</title>
</svelte:head>
<main id="main">
	<input
		type="file"
		id="fileUpload"
		accept="image/*"
		on:click={initTone}
		on:change={readImage}
	/>
	<details class="border">
		<summary><b>Options</b></summary>
		<label class="inline" for="linearHz">Increase Hz linearly: </label>
		<input type="checkbox" id="linearHz" bind:checked={isHzLinear} /><br />
		<label class="inline" for="distortionAmount">Distortion amount: </label>
		<input
			type="range"
			id="distortionAmount"
			min="0"
			max="1"
			step="0.05"
			bind:value={distortionRatio}
		/><br />
		<label class="inline" for="minHz">Minimum Hz: </label>
		<input
			type="number"
			min="20"
			max={maxHz - 1}
			bind:value={minHz}
			id="minHz"
		/><br />
		<label class="inline" for="maxHz">Maximum Hz: </label>
		<input
			type="number"
			min={minHz}
			max="20000"
			bind:value={maxHz}
			id="maxHz"
		/>
	</details>

	<label class="button" for="fileUpload"
		><b>{filename ? filename : "Choose image files to start!"}</b></label
	>
	<canvas
		id="canvas"
		bind:this={canvasElement}
		on:touchmove|nonpassive={onTouchMove}
		on:mousemove={onMouseMove}
		on:mouseleave={stopSound}
	/>
</main>

<style>
	:global(body) {
		background-color: #fefced;
	}
	main {
		text-align: center;
		padding: 0.5em;
		max-width: 240px;
		margin: 0 auto;
	}
	canvas {
		display: block;
		margin-inline: auto;
	}

	details > input {
		margin: 0.1em 0 0.1em 0;
		vertical-align: middle;
	}

	details > label {
		font-weight: bold;
	}
	input[type="file"] {
		display: none;
		margin: 0 0 0.1em 0;
	}
	details {
		margin: 0 0 0.5em 0;
		border-radius: 0.2em;
		background-color: white;
		color: #e8439b;
	}
	summary {
		background-color: #e8439b;

		color: white;
	}
	.inline {
		display: inline;
	}
	.border {
		border: 2px #9c1e61 solid;
	}
	.button {
		background-color: #2cd4e8;
		border: 2px #258f9c solid;
		border-radius: 0.2em;
		margin: 0 0 0.5em 0;
		color: white;
	}
	@media (min-width: 320px) {
		main {
			max-width: 300px;
		}
	}
	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
