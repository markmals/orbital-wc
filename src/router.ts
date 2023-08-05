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
import { html } from "lit-html"
import { createStore } from "solid-js/store"
import { createContext } from "./context"
import { Accessor, createEffect, createMemo } from "./orbital"
import { consume, createElement, provide } from "./runtime"

export const routerContext = createContext<Router>("remix-router")

export function provideRouter(routes: AgnosticRouteObject[]) {
    const history = createBrowserHistory()
    const router = createRouter({ routes, history }).initialize()
    provide({ context: routerContext, data: () => router })
}

export function consumeRouterState(): RouterState | undefined {
    const [router] = consume({ context: routerContext })

    const [store, setStore] = createStore(router()?.state)
    let dispose: (() => void) | undefined = undefined

    createEffect(() => {
        if (dispose) dispose()
        dispose = router()?.subscribe(s => {
            setStore(s)
        })
    })

    return store
}

export function consumeNavigate(): Accessor<
    | {
          (to: number): Promise<void>
          (to: To | null, opts?: RouterNavigateOptions | undefined): Promise<void>
      }
    | undefined
> {
    const [router] = consume({ context: routerContext })
    return createMemo(() => router()?.navigate)
}

export function consumeLocation(): Location | undefined {
    return consumeRouterState()?.location
}

export function consumeLoaderData<T extends (...args: any) => any>(
    id: string
): Accessor<Awaited<ReturnType<T>>> {
    return createMemo(() => consumeRouterState()?.loaderData?.[id])
}

// FIXME: This currently only works one level deep
const Outlet = createElement(() => {
    const state = consumeRouterState()
    const childIds = createMemo(() => state?.matches?.map(match => match.route.id))
    const name = createMemo(() => childIds()?.[1] ?? "")
    return () => html`<slot name=${name()}></slot>`
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
    navigate()?.(new URL(anchor.href).pathname)
}
