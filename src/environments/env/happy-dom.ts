import { importModule } from 'local-pkg';
import type { EnvironmentStencil } from '../types.js';

export default <EnvironmentStencil>async function (_global, options) {
  const { Window, GlobalWindow } = (await importModule('happy-dom')) as any;

  const happyDomOptions = {
    url: 'http://localhost:3000',
    ...options.happyDom,
  };

  const window = new (GlobalWindow || Window)(happyDomOptions);

  // happy-dom does not implement the Custom Element upgrade algorithm.
  // When the lazy-loader pattern is used (elements created before customElements.define
  // is called), browsers and jsdom automatically upgrade those elements by changing their
  // prototype and firing connectedCallback. Patch define() to emulate that step.
  const origDefine = window.customElements.define.bind(window.customElements);
  window.customElements.define = function (
    name: string,
    elementClass: CustomElementConstructor,
    options?: ElementDefinitionOptions,
  ) {
    console.log(`[happy-dom-upgrade] customElements.define called for <${name}>`);
    origDefine(name, elementClass, options);
    const existing = Array.from(window.document.querySelectorAll(name)) as any[];
    console.log(`[happy-dom-upgrade] found ${existing.length} existing <${name}> element(s) to upgrade`);
    for (const el of existing) {
      console.log(
        `[happy-dom-upgrade] upgrading <${name}>: isConnected=${el.isConnected}, has __s_ghr=${!!el.__s_ghr}, proto=${Object.getPrototypeOf(el)?.constructor?.name}`,
      );
      if (el.__s_ghr) {
        console.log(`[happy-dom-upgrade] skipping — already initialised by Stencil`);
        continue;
      }
      Object.setPrototypeOf(el, elementClass.prototype);
      console.log(
        `[happy-dom-upgrade] prototype set, has __registerHost=${typeof el.__registerHost === 'function'}, has __attachShadow=${typeof el.__attachShadow === 'function'}, has connectedCallback=${typeof el.connectedCallback === 'function'}`,
      );
      if (typeof el.__registerHost === 'function') el.__registerHost();
      if (typeof el.__attachShadow === 'function') el.__attachShadow();
      if (el.isConnected && typeof el.connectedCallback === 'function') el.connectedCallback();
      console.log(`[happy-dom-upgrade] done upgrading <${name}>`);
    }
  };

  return {
    window,
    teardown() {
      window.happyDOM.abort();
    },
  };
};
