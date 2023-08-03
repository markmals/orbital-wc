import { ComputedRef, Ref, ToRefs, computed, effect, effectScope, ref } from "@vue/reactivity"
import { TemplateResult, render as diff, nothing } from "lit-html"
import { z } from "zod"
import { Context, ContextEvent, UnknownContext } from "./context"

export interface SetupOptions<Props = {}> {
    instance: HTMLElement
    onMount: (callback: () => void) => void
    onCleanup: (callback: () => void) => void
    props: ToRefs<Props>
}

export function provide<T>({ context, data }: { context: Context<T>; data: () => T }): void {
    document.addEventListener("context-request", event => {
        const evt = event as ContextEvent<UnknownContext>
        const memoized = computed(data)
        if (evt.context.name === context.name) {
            evt.stopPropagation()
            const scope = effectScope()
            scope.run(() => effect(() => evt.callback(memoized.value, scope.stop)))
        }
    })
}

export function consume<T>({ context }: { context: Context<T> }): Ref<T> {
    const data = ref()
    const event = new ContextEvent(context, value => (data.value = value))
    document.dispatchEvent(event)
    return data
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
        attrs = new Map<string, Ref<any>>()

        constructor() {
            super()

            if (props) {
                for (const key of Object.keys(props.shape)) {
                    this.attrs.set(key, ref())
                }
            }

            const root = this.attachShadow({ mode: "open" })
            const render = setup({
                instance: this,
                props: Object.fromEntries(this.attrs),
                onMount: callback => this.inits.push(callback),
                onCleanup: callback => this.deinits.push(callback),
            })

            effect(() => diff(render(), root))
        }

        static get observedAttributes() {
            return !!props ? Object.keys(props.shape) : []
        }

        attributeChangedCallback(name: string, oldValue: any, newValue: any) {
            // console.log(name, oldValue, newValue)
            const signal = this.attrs.get(name)
            if (signal) signal.value = newValue
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
        when: ComputedRef<boolean>
        fallback?: TemplateResult | typeof nothing
    },
    children: () => TemplateResult
) {
    const template = computed(() => {
        if (when.value) {
            return children()
        }

        return fallback
    })

    return template.value
}
