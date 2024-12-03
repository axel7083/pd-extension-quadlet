<script lang="ts">
// app.css includes tailwind css dependencies that we use
import './app.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { router } from 'tinro';
import Route from './lib/Route.svelte';
import { onMount } from 'svelte';
import { getRouterState } from './api/client';
import QuadletDetails from '/@/pages/QuadletDetails.svelte';
import QuadletsList from '/@/pages/QuadletsList.svelte';
import QuadletCreate from '/@/pages/QuadletCreate.svelte';

router.mode.hash();
let isMounted = false;

onMount(() => {
  // Load router state on application startup
  const state = getRouterState();
  router.goto(state.url);
  isMounted = true;
});
</script>

<Route path="/*" breadcrumb="" isAppMounted={isMounted} let:meta>
  <main class="flex flex-col w-screen h-screen overflow-hidden bg-[var(--pd-content-bg)]">
    <div class="flex flex-row w-full h-full overflow-hidden">
      <!-- list all quadlets -->
      <Route path="/" breadcrumb="Quadlets">
        <QuadletsList />
      </Route>

      <!-- create quadlet -->
      <Route path="/quadlets/create" firstmatch let:meta>
        <QuadletCreate/>
      </Route>

      <!-- quadlets details -->
      <Route path="/quadlets/:providerId/:connection/:id/*" firstmatch let:meta>
        <QuadletDetails providerId={meta.params.providerId} connection={meta.params.connection} id={meta.params.id}/>
      </Route>
    </div>
  </main>
</Route>
