# Orbital

_\#UseThePlatform_

Orbital is a bespoke, minimal UI runtime for web apps that tries to use the platform as much as possible. Orbital builds on top of web component technologies such as [custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements), [shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM), [`<slot>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot), and more to create a reactive runtime with [very fast UI updates](https://lit.dev/docs/libraries/standalone-templates/#render-dynamic-data) that is easy to use without any build steps (unless you want build steps, in which it also provides full Vite support, with a meta-framework on the roadmap).

## Example

```ts
import { createElement, createSignal, createMemo, html, z } from "orbital"

// Runtime prop validation with Zod
const galleryProps = z.object({
    sculpture: z.object({
        name: z.string(),
        artist: z.string(),
        description: z.string(),
        url: z.url(),
        alt: z.string(),
    }),
})

const Gallery = createElement({
    props: galleryProps,
    setup: ({ props }) => {
        const [showMore, setShowMore] = createSignal(false)
        const color = createMemo(() => showMore() ? "red" : "blue")

        function toggleShowMore() {
            setShowMore(show => !show)
        }

        return () => html`
            <!-- Scoped styles re-render reactively, just like the template -->
            <style>
                button {
                    color: white;
                    background-color: ${color()};
                    font-family: sans-serif;
                }
            </style>
            <section>
                <h2>
                    <i>${props.sculpture.name}</i>
                    by ${props.sculpture.artist}
                </h2>
                <button @click=${toggleShowMore}>
                    ${show({ when: showMore, fallback: html`Show` }, () => html`Hide`)} details
                </button>
                ${show({ when: showMore }, () => html`<p>${props.sculpture.description}</p>`)}
                <img src="${props.sculpture.url}" alt="${props.sculpture.alt}" />
            </section>
        `
    },
})

customElements.define("app-gallery", Gallery)
```

## TODO

**UI Framework:**

-   [x] Reactive primitives
-   [x] Client-side rendering
-   [x] Event handlers
-   [x] Global context
-   [x] Reactive scoped styles
-   [x] Children (`<slot>`)
-   [x] Client-side routing
-   [x] Parallel route loaders
-   [x] Lifecycle functions
-   [x] Reactive attributes
-   [ ] Reactive properties
-   [ ] Scoped context
-   [ ] Synchronous context
-   [ ] Nested routing
-   [ ] Form actions
-   [ ] Error boundaries
-   [ ] [Hot module reloading](https://github.com/sync/plugin-lit-refresh)
-   [ ] VS Code extension
-   [ ] [Unstyled components](https://react-spectrum.adobe.com/react-aria/react-aria-components.html)
-   [ ] Suspense/asyncronous rendering

**Meta-Framework:**

-   [ ] [Astro support](https://dev.to/thepassle/server-side-rendering-vanilla-custom-elements-in-astro-5hgg)
-   [ ] [File system routing](https://remix.run/docs/en/1.19.1/file-conventions/route-files-v2)
-   [ ] Server-side loaders & actions
-   [ ] [Server-side rendering (and pre-rendering)](https://lit.dev/docs/ssr/client-usage/#standalone-lit-templates)
-   [ ] Runtime-agnostic deployment adapters
-   [ ] [Out-of-order streaming](https://remix.run/docs/en/1.19.1/guides/streaming#using-defer)
-   [ ] [Partial hydration](https://jasonformat.com/islands-architecture/)
-   [ ] [Progressive hydration](https://www.patterns.dev/posts/progressive-hydration)
-   [ ] [Hybrid routing](https://hackmd.io/@0u1u3zEAQAO0iYWVAStEvw/rJFCoM4Di#B-Routing)
-   [ ] [Hot data revalidation](https://remix.run/docs/en/main/other-api/dev-v2)
