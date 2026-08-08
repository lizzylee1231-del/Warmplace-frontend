const DEFAULT_ROUTE = "/";

function parseHash(hash) {
  const raw = hash.replace(/^#/, "") || DEFAULT_ROUTE;
  const [pathnamePart, queryString = ""] = raw.split("?");
  const pathname = pathnamePart.startsWith("/") ? pathnamePart : `/${pathnamePart}`;

  return {
    pathname,
    query: new URLSearchParams(queryString),
    routeKey: `${pathname}?${queryString}`,
  };
}

export function navigateTo(path) {
  window.location.hash = path;
}

export function createRouter({ outlet, routes }) {
  let activeRouteKey = "";
  let hasRendered = false;
  let transitionTimer = 0;
  let enterTimer = 0;
  let activePage = null;

  function render() {
    const { pathname, query, routeKey } = parseHash(window.location.hash);
    const Page = routes[pathname] ?? routes[DEFAULT_ROUTE];

    if (routeKey === activeRouteKey) {
      return;
    }

    activeRouteKey = routeKey;
    window.clearTimeout(transitionTimer);
    window.clearTimeout(enterTimer);

    function mountPage() {
      activePage?.destroy?.();
      activePage = Page({
        navigateTo,
        query,
        pathname,
      });
      outlet.replaceChildren(activePage);
      outlet.classList.remove("is-leaving");
      outlet.classList.add("is-entering");

      enterTimer = window.setTimeout(() => {
        outlet.classList.remove("is-entering");
      }, 180);
    }

    if (!hasRendered) {
      hasRendered = true;
      mountPage();
      return;
    }

    outlet.classList.add("is-leaving");
    transitionTimer = window.setTimeout(() => {
      mountPage();
    }, 120);
  }

  return {
    start() {
      window.addEventListener("hashchange", render);

      if (!window.location.hash) {
        window.location.hash = DEFAULT_ROUTE;
      }

      render();
    },
  };
}
