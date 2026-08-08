// install custom matchers and snapshot serializer
import './testing/matchers.js';
import './testing/snapshot-serializer.js';

export { h, Fragment } from '@stencil/core';
export { render, waitForStable, waitForExist } from './testing/render.js';
export { serializeHtml, prettifyHtml, SerializeOptions } from './testing/html-serializer.js';
export type { RenderOptions, RenderResult } from './types.js';
export { getComponentSpies, clearComponentSpies } from './testing/spy-helper.js';
export type { SpyConfig, ComponentSpies } from './testing/spy-helper.js';
