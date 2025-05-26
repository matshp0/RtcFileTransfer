<script>
  export let progress = 100;
  export let size = 500;

  const STROKE_WIDTH = 10;

  const radius = size / 2 - STROKE_WIDTH;
  const start_x = STROKE_WIDTH;
  const start_y = size / 2;

  $: dif = 180 - (180 * (progress / 100));
  $: x = (start_x + radius) + radius * Math.cos(dif * Math.PI / 180);
  $: y = start_y - radius * Math.sin(dif * Math.PI / 180);

  $: pathData = `M ${start_x} ${start_y} A ${radius} ${radius} 0 0 1 ${x} ${y}`;

  $: roundedProgress = Math.ceil(progress);
</script>

<svg width="{size}" height="{size / 2}" xmlns="http://www.w3.org/2000/svg">
  <path d="M {start_x} {start_y} A {radius} {radius} 0 0 1 {size - STROKE_WIDTH} {start_y}" fill="none" stroke="#e6e6e6" stroke-width={STROKE_WIDTH} />
  <path d={pathData} fill="none" stroke="orange" stroke-width={STROKE_WIDTH} />
  <text
    x={Math.ceil(size / 2)}
    y={Math.ceil(size * 0.67 / 2)}
    text-anchor="middle"
    dominant-baseline="middle"
    font-size="24"
    font-family="monospace"
    fill="#333"
  >
    {roundedProgress}%
  </text>
</svg>

<style>
    svg {
        display: block;
        margin: auto;
    }
</style>
