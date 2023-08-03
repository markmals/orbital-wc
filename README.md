# Orbital

*\#UseThePlatform*

Orbital is a bespoke, minimal UI runtime for web apps that tries to use the platform as much as possible. Orbital builds on top of web component technologies such as [custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements), [shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM), [`<slot>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot), and more to create a reactive runtime with [very fast UI updates](https://lit.dev/docs/libraries/standalone-templates/#render-dynamic-data) that is easy to use without any build steps (unless you want build steps, in which it also provides full Vite support, with a meta-framework on the roadmap).

## TODO

**UI Framework:**

- [x] Reactive primitives
- [x] Client-side rendering
- [x] Event handlers
- [x] Global context
- [x] Reactive scoped styles
- [x] Children (`<slot>`)
- [x] Client-side routing
- [x] Parallel route loaders
- [x] Lifecycle functions
- [x] Reactive props
- [ ] Scoped context
- [ ] Synchronous context
- [ ] Nested routing
- [ ] Form actions
- [ ] Error boundaries
- [ ] [Hot module reloading](https://github.com/sync/plugin-lit-refresh)
- [ ] VS Code extension
- [ ] Suspense/asyncronous rendering
- [ ] [Unstyled components](https://react-spectrum.adobe.com/react-aria/react-aria-components.html)
- [ ] [Realtime, offline caching](https://replicache.dev)
- [ ] [Animation primitives](https://motion.dev/guides/quick-start)
- [ ] [Full dependency injection system](https://angular.io/guide/dependency-injection-providers)
- [ ] [Directives](https://angular.io/guide/attribute-directives)

**Meta-Framework:**

- [ ] [File system routing](https://remix.run/docs/en/1.19.1/file-conventions/route-files-v2)
- [ ] Server-side loaders & actions
- [ ] [Server-side rendering (and pre-rendering)](https://dev.to/thepassle/server-side-rendering-vanilla-custom-elements-in-astro-5hgg)
- [ ] Runtime-agnostic deployment adapters
- [ ] [Out-of-order streaming](https://remix.run/docs/en/1.19.1/guides/streaming#using-defer)
- [ ] [Partial hydration](https://jasonformat.com/islands-architecture/)
- [ ] [Progressive hydration](https://www.patterns.dev/posts/progressive-hydration)
- [ ] [Hybrid routing](https://hackmd.io/@0u1u3zEAQAO0iYWVAStEvw/rJFCoM4Di#B-Routing)
- [ ] [Hot data revalidation](https://remix.run/docs/en/main/other-api/dev-v2)
