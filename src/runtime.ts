import { TemplateResult, render as diff, nothing } from "lit-html"
import { Signal, createEffect, createMemo, createRoot, createSignal } from "solid-js"
import { z } from "zod"
import { Context, ContextEvent, UnknownContext } from "./context"

export interface SetupOptions<Props = {}> {
    instance: HTMLElement
    onMount: (callback: () => void) => void
    onCleanup: (callback: () => void) => void
    props: Props
}

export function provide<T>({ context, data }: { context: Context<T>; data: () => T }): void {
    document.addEventListener("context-request", event => {
        createRoot(dispose => {
            const evt = event as ContextEvent<UnknownContext>
            const memoized = createMemo(data)
            if (evt.context.name === context.name) {
                evt.stopPropagation()
                createEffect(() => evt.callback(memoized(), dispose))
            }
        })
    })
}

export function consume<T>({ context }: { context: Context<T> }): Signal<T | undefined> {
    const [data, setData] = createSignal<T>()
    const event = new ContextEvent(context, value => setData(value as any))
    document.dispatchEvent(event)
    return [data, setData] as Signal<T | undefined>
}

export function createElement(
    setup: (options: SetupOptions) => () => TemplateResult
): CustomElementConstructor
export function createElement<Props extends z.ZodTypeAny>(options: {
    props: Props
    setup: (setupOptions: SetupOptions<z.infer<typeof options.props>>) => () => TemplateResult
}): CustomElementConstructor
export function createElement(options: any): CustomElementConstructor {
    let props: z.ZodObjectDef | undefined
    let setup: (options: SetupOptions<any>) => () => TemplateResult

    if (typeof options === "function") {
        setup = options
    } else {
        props = options.props
        setup = options.setup
    }

    return class extends HTMLElement {
        inits: (() => void)[] = []
        deinits: (() => void)[] = []
        attrs = new Map<string, Signal<any>>()

        constructor() {
            super()

            const root = this.attachShadow({ mode: "open" })

            createRoot(dispose => {
                this.deinits.push(dispose)

                if (props) {
                    for (const key of Object.keys(props.shape)) {
                        this.attrs.set(key, createSignal())
                    }
                }

                let reactiveProps = {}
                for (const [key, [get, set]] of this.attrs) {
                    Object.defineProperty(reactiveProps, key, { get, set })
                }

                const render = setup({
                    instance: this,
                    props: reactiveProps,
                    onMount: callback => this.inits.push(callback),
                    onCleanup: callback => this.deinits.push(callback),
                })

                createEffect(() => diff(render(), root))
            })
        }

        static get observedAttributes() {
            return !!props ? Object.keys(props.shape) : []
        }

        attributeChangedCallback(name: string, oldValue: any, newValue: any) {
            // console.log(name, oldValue, newValue)
            const signal = this.attrs.get(name)
            if (signal) {
                const [_, setAttr] = signal
                setAttr(newValue)
            }
        }

        connectedCallback() {
            for (const initialize of this.inits) {
                initialize()
            }
        }

        disconnectedCallback() {
            for (const dispose of this.deinits) {
                dispose()
            }
        }
    }
}

export function show(
    {
        when,
        fallback = nothing,
    }: {
        when: () => boolean
        fallback?: TemplateResult | typeof nothing
    },
    children: () => TemplateResult
) {
    const template = createMemo(() => {
        if (when()) {
            return children()
        }

        return fallback
    })

    return template()
}
