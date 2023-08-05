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
import { createRoot, from } from "solid-js"
import { createContext } from "./context"
import { Accessor, createEffect, createMemo } from "./orbital"
import { consume, createElement, provide } from "./runtime"

export const routerContext = createContext<Router>("remix-router")

export function provideRouter(routes: AgnosticRouteObject[]) {
    const history = createBrowserHistory()
    const router = createRouter({ routes, history }).initialize()
    provide({ context: routerContext, data: () => router })
}

export function consumeRouterState(): Accessor<RouterState | undefined> {
    const [router] = consume({ context: routerContext })
    let dispose: (() => void) | undefined = undefined

    return from(set => {
        createEffect(() => {
            if (dispose) dispose()
            dispose = router()?.subscribe(state => set(state))
        })

        return dispose ?? (() => {})
    })
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

export function consumeLocation(): Accessor<Location | undefined> {
    const state = consumeRouterState()
    return createMemo(() => state()?.location)
}

export function consumeLoaderData<T extends (...args: any) => any>(
    id: string
): Accessor<Awaited<ReturnType<T>>> {
    const state = consumeRouterState()
    return createMemo(() => state()?.loaderData?.[id])
}

// FIXME: This currently only works one level deep
const Outlet = createElement(() => {
    const state = consumeRouterState()
    const childIds = createMemo(() => state()?.matches?.map(match => match.route.id))
    const name = createMemo(() => childIds()?.[1] ?? "")
    return () => html`<slot name=${name()}></slot>`
})

customElements.define("remix-outlet", Outlet)

export function linkHandler(e: Event) {
    e.preventDefault()
    let anchor = e
        .composedPath()
        .find((t): t is HTMLAnchorElement => t instanceof HTMLAnchorElement)

    createRoot(() => {
        const navigate = consumeNavigate()
        createEffect(() => {
            if (anchor === undefined) {
                throw new Error(
                    "(link handler) event must have an anchor element in its composed path."
                )
            }
            navigate()?.(new URL(anchor.href).pathname)
        })
    })
}
