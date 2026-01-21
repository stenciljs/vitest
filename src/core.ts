// install custom matchers and snapshot serializer
import './testing/matchers.js';
import './testing/snapshot-serializer.js';

export { h } from '@stencil/core';
export { render } from './testing/render.js';
export { serializeHtml, prettifyHtml, SerializeOptions } from './testing/html-serializer.js';
export type { RenderOptions, RenderResult } from './types.js';
