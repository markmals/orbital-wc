import {
    Accessor,
    InitializedResource,
    InitializedResourceOptions,
    NoInfer,
    Resource,
    ResourceActions,
    ResourceFetcher,
    ResourceOptions,
    ResourceSource,
    Setter,
    SignalOptions,
    createResource,
    createSignal,
} from "solid-js"

export type Signal<Wrapped> = Accessor<Wrapped> & {
    set: Setter<Wrapped>
}

export function signal<T>(): Signal<T | undefined>
export function signal<T>(value: T, options?: SignalOptions<T>): Signal<T>
export function signal<T>(
    value?: T | undefined,
    options?: SignalOptions<T | undefined>
): Signal<T | undefined> {
    const [get, set] = createSignal(value, options)
    return Object.assign(get, { set })
}

export type ResourceReturn<T, R = unknown> = Resource<T> & ResourceActions<T | undefined, R>
export type InitializedResourceReturn<T, R = unknown> = InitializedResource<T> &
    ResourceActions<T, R>

export function resource<T, R = unknown>(
    fetcher: ResourceFetcher<true, T, R>,
    options: InitializedResourceOptions<NoInfer<T>, true>
): InitializedResourceReturn<T, R>
export function resource<T, R = unknown>(
    fetcher: ResourceFetcher<true, T, R>,
    options?: ResourceOptions<NoInfer<T>, true>
): ResourceReturn<T, R>
export function resource<T, S, R = unknown>(
    source: ResourceSource<S>,
    fetcher: ResourceFetcher<S, T, R>,
    options: InitializedResourceOptions<NoInfer<T>, S>
): InitializedResourceReturn<T, R>
export function resource<T, S, R = unknown>(
    source: ResourceSource<S>,
    fetcher: ResourceFetcher<S, T, R>,
    options?: ResourceOptions<NoInfer<T>, S>
): ResourceReturn<T, R>
export function resource(source: any, fetcher?: any, options?: any) {
    const [r, actions] = createResource(source, fetcher, options)
    return Object.assign(r, { ...actions })
}

export {
    createMemo as computed,
    createEffect as effect,
    createSelector as selector,
} from "solid-js"
