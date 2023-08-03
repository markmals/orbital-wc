import {
    Location,
    Router,
    RouterNavigateOptions,
    To,
    createBrowserHistory,
    createRouter,
} from "@remix-run/router"
import { ComputedRef, Ref, computed, effect, effectScope, ref } from "@vue/reactivity"
import { TemplateResult, render as diff, html, nothing } from "lit-html"
import { Context, ContextEvent, UnknownContext, createContext } from "./context"

export interface CustomElement {
    constructor: Function
    attributeChangedCallback?(attributeName: string, oldValue: string, newValue: string): void
    connectedCallback?(): void
    disconnectedCallback?(): void
}

abstract class ReactiveElement extends HTMLElement implements CustomElement {
    connectedCallback() {
        const root = this.attachShadow({ mode: "open" })
        effect(() => diff(this.body, root))
    }

    abstract readonly body: TemplateResult

    protected provide<T>({ context, data }: { context: Context<T>; data: () => T }): void {
        this.addEventListener("context-request", event => {
            const evt = event as ContextEvent<UnknownContext>
            const memoized = computed(data)
            if (evt.context.name === context.name) {
                evt.stopPropagation()
                const scope = effectScope()
                scope.run(() => effect(() => evt.callback(memoized.value, scope.stop)))
            }
        })
    }

    protected consume<T>({ context }: { context: Context<T> }): Ref<T> {
        const data = ref()
        const event = new ContextEvent(context, value => (data.value = value))
        this.dispatchEvent(event)
        return data
    }
}

async function counterLoader() {
    await new Promise(resolve => setTimeout(resolve, 500))
    return { hello: "world" }
}

function childLoader() {
    return { goodbye: "cruel world" }
}

export const routerContext = createContext<Router>("remix-router")

const routes = [
    {
        id: "app-counter",
        path: "/",
        loader: counterLoader,
        children: [
            {
                id: "app-child",
                path: "/child",
                loader: childLoader,
            },
            {
                id: "app-other",
                path: "/other",
            },
        ],
    },
]

class Root extends ReactiveElement {
    constructor() {
        super()
        const history = createBrowserHistory()
        const router = createRouter({ routes, history }).initialize()
        this.provide({ context: routerContext, data: () => router })
    }

    get body() {
        return html`<app-counter></app-counter>`
    }
}

export const countContext = createContext<number>("my-count")

class Counter extends ReactiveElement {
    count = ref(0)
    data = ref({} as any)
    location = ref({} as Location)
    isVisible = computed(() => this.location.value.pathname === "/other")

    navigate = ref<{
        (to: number): Promise<void>
        (to: To | null, opts?: RouterNavigateOptions | undefined): Promise<void>
    }>()

    increment() {
        this.count.value = this.count.value + 1
    }

    constructor() {
        super()

        this.provide({ context: countContext, data: () => this.count.value })

        const router = this.consume({ context: routerContext })
        let dispose: (() => void) | undefined = undefined

        effect(() => {
            if (dispose) dispose()
            this.navigate.value = router.value.navigate
            dispose = router.value.subscribe((s: any) => {
                this.data.value = s.loaderData?.["app-counter"]
                this.location.value = s.location
            })
        })
    }

    linkHandler(e: Event) {
        e.preventDefault()
        let anchor = e
            .composedPath()
            .find((t): t is HTMLAnchorElement => t instanceof HTMLAnchorElement)
        if (anchor === undefined) {
            throw new Error(
                "(link handler) event must have an anchor element in its composed path."
            )
        }
        this.navigate.value?.(new URL(anchor.href).pathname)
    }

    get body() {
        return html`
            <style>
                .count {
                    color: var(--foo);
                    font-family: serif;
                    font-style: italic;
                    font-size: 32px;
                }

                .nav {
                    flex-direction: row;
                }

                :host {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    width: 50%;
                }
            </style>
            <div class="count">${this.count.value}</div>
            <button type="button" @click=${this.increment.bind(this)}>Increment</button>
            <code>Loader data: ${JSON.stringify(this.data.value, null, 4)}</code>
            <div class="nav">
                <a href="/" @click=${this.linkHandler.bind(this)}>Go home</a> |
                <a href="child" @click=${this.linkHandler.bind(this)}>Go to child</a> |
                <a href="other" @click=${this.linkHandler.bind(this)}>Go to other</a>
            </div>
            <remix-outlet>
                <app-child foo="${this.count.value}" slot="app-child"></app-child>
                ${this.isVisible.value ? html`<app-other slot="app-other"></app-other>` : nothing}
            </remix-outlet>
        `
    }
}

class Child extends ReactiveElement {
    count: Ref<number>
    color: ComputedRef<string>
    data = ref({} as any)
    foo = ref()

    constructor() {
        super()

        this.count = this.consume({ context: countContext })
        this.color = computed(() => ((this.count.value ?? 0) % 2 === 0 ? "blue" : "red"))

        const router = this.consume({ context: routerContext })
        let dispose: (() => void) | undefined = undefined

        effect(() => {
            if (dispose) dispose()
            dispose = router.value.subscribe((s: any) => {
                this.data.value = s.loaderData?.["app-child"]
            })
        })

        // reactive props
        effect(() => console.log(this.foo.value))
    }

    static observedAttributes = ["foo"]
    attributeChangedCallback(name: string, oldValue: any, newValue: any) {
        if (name === "foo") this.foo.value = newValue
    }

    get body() {
        return html`
            <style>
                .count {
                    color: ${this.color.value};
                    font-family: sans-serif;
                    font-weight: bold;
                    font-size: 32px;
                }
            </style>
            <div class="count">${this.count.value}</div>
            <code id="child-loader-data">
                Loader data: ${JSON.stringify(this.data.value, null, 4)}
            </code>
        `
    }
}

class Other extends ReactiveElement {
    connectedCallback() {
        super.connectedCallback()
        console.log("<app-other> [created]")
    }

    disconnectedCallback() {
        console.log("<app-other> [destroyed]")
    }

    get body() {
        return html`
            <style>
                span {
                    border: 2px solid #f00;
                    padding: 0.5rem;
                }
            </style>
            <span>Another route</span>
        `
    }
}

class Outlet extends ReactiveElement {
    name = ref()

    constructor() {
        super()

        const router = this.consume({ context: routerContext })
        let dispose: (() => void) | undefined = undefined

        effect(() => {
            if (dispose) dispose()
            dispose = router.value.subscribe((s: any) => {
                this.name.value = s.matches?.map((match: any) => match.route.id)?.[1] ?? ""
            })
        })
    }

    get body() {
        return html`<slot name=${this.name.value}></slot>`
    }
}

customElements.define("app-root", Root)
customElements.define("app-counter", Counter)
customElements.define("app-child", Child)
customElements.define("app-other", Other)
customElements.define("remix-outlet", Outlet)

// type ClassAutoAccessorDecorator<T> = (
//     value: {
//         get: () => T
//         set: (value: T) => void
//     },
//     context: {
//         kind: "accessor"
//         name: string | symbol
//         static: boolean
//         private: boolean
//         access: { get: () => T; set: (value: T) => void }
//         addInitializer(initializer: () => void): void
//     }
// ) => {
//     get?: () => T
//     set?: (value: T) => void
//     init?: (initialValue: unknown) => unknown
// } | void

// function attr<Type>(): any {
//     return (
//         value: ClassAccessorDecoratorTarget<any, Type>,
//         context: ClassAccessorDecoratorContext<any, Type>
//     ) => {
//         const signal = ref()

//         context.addInitializer(function (this: any) {
//             // const constructor = this.constructor
//             // const prototype = Object.getPrototypeOf(this)
//             // if (constructor.observedAttributes) {
//             //     constructor.observedAttributes.push(context.name)
//             // } else {
//             //     constructor.observedAttributes = [context.name]
//             // }
//             // const callback = function (attr, oldValue, newValue) {
//             //     signal.value = newValue
//             //     console.log(attr, newValue)
//             // }
//             // prototype.attributeChangedCallback = callback
//             // console.dir(this)
//         })

//         return {
//             get(): any {
//                 return signal.value
//             },
//             set(value: any) {
//                 signal.value = value
//             },
//         }
//     }
// }
