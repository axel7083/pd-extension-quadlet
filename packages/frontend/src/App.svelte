<script lang="ts">
// app.css includes tailwind css dependencies that we use
import './app.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { router } from 'tinro';
import Route from './lib/Route.svelte';
import { onDestroy, onMount } from 'svelte';
import { getRouterState, rpcBrowser } from './api/client';
import QuadletDetails from '/@/pages/QuadletDetails.svelte';
import QuadletsList from '/@/pages/QuadletsList.svelte';
import QuadletCreate from '/@/pages/QuadletCreate.svelte';
import { Messages } from '/@shared/src/messages';
import type { Unsubscriber } from 'svelte/store';

router.mode.hash();
let isMounted = $state(false);
const unsubscribers: Unsubscriber[] = [];

onMount(async () => {
  // Load router state on application startup
  const state = await getRouterState();
  router.goto(state.url);
  isMounted = true;

  unsubscribers.push(
    rpcBrowser.subscribe(Messages.ROUTE_UPDATE, location => {
      router.goto(location);
    }).unsubscribe
  );
});

onDestroy(() => {
  unsubscribers.forEach(unsubscriber => unsubscriber());
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
