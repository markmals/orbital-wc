import {
    AgnosticRouteObject,
    Location,
    Router,
    RouterNavigateOptions,
    RouterState,
    To,
    createBrowserHistory,
    createRouter,
} from "@remix-run/router"
import { ComputedRef, Ref, computed, effect, ref } from "@vue/reactivity"
import { html } from "lit-html"
import { createContext } from "./context"
import { consume, createElement, provide } from "./runtime"

export const routerContext = createContext<Router>("remix-router")

export function provideRouter(routes: AgnosticRouteObject[]) {
    const history = createBrowserHistory()
    const router = createRouter({ routes, history }).initialize()
    provide({ context: routerContext, data: () => router })
}

export function consumeRouterState(): Ref<RouterState> {
    const router = consume({ context: routerContext })
    const state = ref(router.value.state)

    let dispose: (() => void) | undefined = undefined

    effect(() => {
        if (dispose) dispose()
        dispose = router.value.subscribe(s => {
            state.value = s as any
        })
    })

    return state as any
}

export function consumeNavigate(): ComputedRef<{
    (to: number): Promise<void>
    (to: To | null, opts?: RouterNavigateOptions | undefined): Promise<void>
}> {
    const router = consume({ context: routerContext })
    return computed(() => router.value.navigate)
}

export function consumeLocation(): ComputedRef<Location> {
    const state = consumeRouterState()
    return computed(() => state.value.location)
}

export function consumeLoaderData<T extends (...args: any) => any>(
    id: string
): Ref<Awaited<ReturnType<T>>> {
    const state = consumeRouterState()
    return computed(() => state.value.loaderData?.[id])
}

// FIXME: This currently only works one level deep
const Outlet = createElement(() => {
    const state = consumeRouterState()
    const childIds = computed(() => state.value?.matches?.map(match => match.route.id))
    const name = computed(() => childIds.value?.[1] ?? "")
    return () => html`<slot name=${name.value}></slot>`
})

customElements.define("remix-outlet", Outlet)

export function linkHandler(e: Event) {
    const navigate = consumeNavigate()

    e.preventDefault()
    let anchor = e
        .composedPath()
        .find((t): t is HTMLAnchorElement => t instanceof HTMLAnchorElement)
    if (anchor === undefined) {
        throw new Error("(link handler) event must have an anchor element in its composed path.")
    }
    navigate.value?.(new URL(anchor.href).pathname)
}
