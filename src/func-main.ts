import {
    computed,
    consume,
    consumeLoaderData,
    consumeLocation,
    createContext,
    createElement,
    effect,
    html,
    linkHandler,
    provide,
    provideRouter,
    ref,
    show,
    z,
} from "./orbital"

export const countContext = createContext<number>("my-count")

const Counter = createElement(() => {
    const count = ref(0)
    const increment = () => (count.value = count.value + 1)
    provide({ context: countContext, data: () => count.value })

    const data = consumeLoaderData<typeof counterLoader>("app-counter")

    const location = consumeLocation()
    const isVisible = computed(() => location.value.pathname === "/other")

    return () => html`
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
        <div class="count">${count.value}</div>
        <button type="button" @click=${increment}>Increment</button>
        <code>Loader data: ${JSON.stringify(data.value, null, 4)}</code>
        <div class="nav">
            <a href="/" @click=${linkHandler}>Go home</a> |
            <a href="child" @click=${linkHandler}>Go to child</a> |
            <a href="other" @click=${linkHandler}>Go to other</a>
        </div>
        <remix-outlet>
            <app-child foo="${count.value}" slot="app-child"></app-child>
            <!-- conditional to demonstrate lifecycle functions -->
            ${show({ when: isVisible }, () => html`<app-other slot="app-other"></app-other>`)}
        </remix-outlet>
    `
})

const Child = createElement({
    props: z.object({ foo: z.string() }),
    setup: ({ props: { foo } }) => {
        const count = consume({ context: countContext })
        const color = computed(() => ((count.value ?? 0) % 2 === 0 ? "blue" : "red"))

        const data = consumeLoaderData<typeof childLoader>("app-child")

        // reactive props
        effect(() => console.log(foo.value))

        return () => html`
            <style>
                .count {
                    color: ${color.value};
                    font-family: sans-serif;
                    font-weight: bold;
                    font-size: 32px;
                }
            </style>
            <div class="count">${count.value}</div>
            <code id="child-loader-data">
                Loader data: ${JSON.stringify(data.value, null, 4)}
            </code>
        `
    },
})

const Other = createElement(({ onMount, onCleanup }) => {
    onMount(() => console.log("<app-other> [created]"))
    onCleanup(() => console.log("<app-other> [destroyed]"))

    return () =>
        html`
            <style>
                span {
                    border: 2px solid #f00;
                    padding: 0.5rem;
                }
            </style>
            <span>Another route</span>
        `
})

async function counterLoader() {
    await new Promise(resolve => setTimeout(resolve, 500))
    return { hello: "world" }
}

function childLoader() {
    return { goodbye: "cruel world" }
}

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
        element: Counter,
    },
]

const Root = createElement(() => {
    provideRouter(routes)
    return () => html`<app-counter></app-counter>`
})

customElements.define("app-root", Root)
customElements.define("app-counter", Counter)
customElements.define("app-child", Child)
customElements.define("app-other", Other)

// class Injector<T> {
//     scopes = new Map<string, any>()

//     register<Func extends Function>(value: T, func: Func): Func {
//         return ((...args: any) => {

//         }) as any
//     }

//     inject(): T {
//         this.scopes.get()
//     }
// }

// let injector: Injector<HTMLElement>

// function createElement(setup: () => () => string) {
//     return class extends HTMLElement {
//         constructor() {
//             super()
//             let s = injector.register(this, setup)
//             let render = s()
//             console.log(render())
//         }
//     }
// }

// function dispatchLocalEvent() {
//     let self = injector.inject()
//     self.dispatchEvent(new Event("foo"))
// }

// const Cmp = createElement(() => {
//     dispatchLocalEvent()
//     return () => 'hello'
// })
