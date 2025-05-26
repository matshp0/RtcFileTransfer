<script>
  import Router, { replace } from 'svelte-spa-router'
  import Upload from './routes/Upload.svelte'
  import Download from './routes/Download.svelte';
  import NotFound from './routes/404.svelte'


  const routes = {
    '/': Upload,
    '/receive/:id': Download,
    '/receive': NotFound,
    '*': NotFound
  }

</script>

<svelte:head>
  <title>File transfer</title>
</svelte:head>

<Router
  {routes}
/>

