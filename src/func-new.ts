import { TemplateResult, html as coreHtml, svg as coreSvg, render as diff } from "lit-html"
import { AsyncDirective, directive } from "lit-html/async-directive.js"
import {
    Accessor,
    createContext,
    createEffect,
    createRoot,
    createSignal,
    untrack,
    useContext,
} from "solid-js"

// Valibot props?

type Component<Props = void> = (props: Props, children?: TemplateResult | string) => TemplateResult

function createComponent<C extends Component<Props>, Props>(component: C): C {
    return ((props, children) => untrack(() => component(props, children))) as C
}

function render(component: Component<void>, mount: HTMLElement | DocumentFragment) {
    diff(
        createRoot(() => component()),
        mount
    )
}

class WatchDirective extends AsyncDirective {
    private getter?: Accessor<unknown>
    private dispose?: () => void

    override render(getter: Accessor<unknown>) {
        if (getter !== this.getter) {
            this.dispose?.()
            this.getter = getter

            // Whether the effect() callback is called because of this render
            // pass, or because of a separate signal update.
            let updateFromLit = true
            createRoot(dispose => {
                this.dispose = dispose

                createEffect(() => {
                    // Unconditionally subscribe to the signal
                    let value = getter()
                    // The effect() callback is called synchronously during subscribe.
                    // Ignore the first call since we return the value below in that case.
                    if (updateFromLit === false) {
                        this.setValue(value)
                    }
                })
            })
            updateFromLit = false
        }

        return untrack(getter)
    }

    protected override disconnected(): void {
        this.dispose?.()
    }

    protected override reconnected(): void {
        // Since we disposed the subscription in disconnected() we need to
        // resubscribe here. We don't ignore the synchronous callback call because
        // the observable might have changed while the directive is disconnected.
        //
        // There are two possible reasons for a disconnect:
        //   1. The host element was disconnected.
        //   2. The directive was not rendered during a render
        // In the first case the element will not schedule an update on reconnect,
        // so we need the synchronous call here to set the current value.
        // In the second case, we're probably reconnecting *because* of a render,
        // so the synchronous call here will go before a render call, and we'll get
        // two sets of the value (setValue() here and the return in render()), but
        // this is ok because the value will be dirty-checked by lit-html.
        if (this.getter) {
            createRoot(dispose => {
                this.dispose = dispose

                createEffect(() => {
                    this.setValue(this.getter!())
                })
            })
        }
    }
}

/**
 * Renders a signal and subscribes to it, updating the part when the signal
 * changes.
 */
export const watch = directive(WatchDirective)

/**
 * Wraps a lit-html template tag function (`html` or `svg`) to add support for
 * automatically wrapping Signal instances in the `watch()` directive.
 */
export const withWatch =
    (tag: typeof coreHtml | typeof coreSvg) =>
    (strings: TemplateStringsArray, ...values: unknown[]): TemplateResult => {
        return tag(
            strings,
            ...values.map((v, idx) => {
                const isFunc = typeof v === "function"
                const noArgs = isFunc && v.length === 0

                let parts = strings.raw[idx].split(" ")
                let prevPart = parts[parts.length - 1]

                const isEvent = prevPart.startsWith("@")
                const isProperty = prevPart.startsWith(".")

                const shouldWrap = noArgs && !isEvent && !isProperty

                console.log(v, shouldWrap)

                return shouldWrap ? watch(v as any) : v
            })
        )
    }

export const html = withWatch(coreHtml)

let ctx = createContext("hello")

const App = createComponent(() => {
    let [count, setCount] = createSignal(1)

    function increment() {
        setCount(ct => ct + 1)
    }

    console.log("create app component")

    return (
        ctx.Provider({
            get value() {
                return "goodbye"
            },
            get children() {
                return html`
                    <h1>${count}</h1>
                    <button type="button" @click=${increment}>Increment</button>
                    <span>${Parent(html`<div>Foobar</div>`)}</span>
                ` as any
            },
        }) as any
    )()
})

const Parent = createComponent((children: TemplateResult) => {
    console.log("create parent component")
    let value = useContext(ctx)
    return html`
        <h1>${children}</h1>
        <span>${value}</span>
    `
})

render(App, document.getElementById("app")!)
