## [1.1.12](https://github.com/stenciljs/vitest/compare/v1.1.11...v1.1.12) (2026-02-13)


### Bug Fixes

* adjust mock-doc env when running without harness. Add env comments tests ([#11](https://github.com/stenciljs/vitest/issues/11)) ([fc2a0f8](https://github.com/stenciljs/vitest/commit/fc2a0f81b559e6f889c8167cee22b21589ffc314))

## [1.1.11](https://github.com/stenciljs/vitest/compare/v1.1.10...v1.1.11) (2026-02-13)


### Bug Fixes

* bump stencil version ([445a880](https://github.com/stenciljs/vitest/commit/445a880564951149466dffb518f914aad2005d9e))

## [1.1.10](https://github.com/stenciljs/vitest/compare/v1.1.9...v1.1.10) (2026-02-13)


### Bug Fixes

* bump accepted core versions ([48a99e1](https://github.com/stenciljs/vitest/commit/48a99e14f7728a747c593730a4f3681b143e8fb3))

## [1.1.9](https://github.com/stenciljs/vitest/compare/v1.1.8...v1.1.9) (2026-02-10)


### Bug Fixes

* **render:** allow to spy on more than 1 event ([#10](https://github.com/stenciljs/vitest/issues/10)) ([217e46c](https://github.com/stenciljs/vitest/commit/217e46cff9cf3d01c666ccc693ce8114211fe945))

## [1.1.8](https://github.com/stenciljs/vitest/compare/v1.1.7...v1.1.8) (2026-02-09)


### Bug Fixes

* **bin:** added support for windows path ([#9](https://github.com/stenciljs/vitest/issues/9)) ([b5fd792](https://github.com/stenciljs/vitest/commit/b5fd7924ab607d7e6ba0bb61c46885ebf7d0f64d))

## [1.1.7](https://github.com/stenciljs/vitest/compare/v1.1.6...v1.1.7) (2026-02-06)


### Bug Fixes

* **bin:** update import statement for base config in temporary stencil config ([#7](https://github.com/stenciljs/vitest/issues/7)) ([2f4d7b0](https://github.com/stenciljs/vitest/commit/2f4d7b0b87f4cfd29e488820fbaa0d4cca47b1e0))

## [1.1.6](https://github.com/stenciljs/vitest/compare/v1.1.5...v1.1.6) (2026-02-06)


### Bug Fixes

* **bin:** fix config merge ([9df7203](https://github.com/stenciljs/vitest/commit/9df7203539a293f60b2ebf20b5ebb0a449396222))
* **bin:** remove old code ([ed8b9c0](https://github.com/stenciljs/vitest/commit/ed8b9c019f20410fc9adeeb179b5485905d07c89))
* **bin:** remove unused lines ([e7ac6a4](https://github.com/stenciljs/vitest/commit/e7ac6a42eee44b5852db4b57ce1bb6e12c37f3e2))
* handle errors during build step ([3f1eef5](https://github.com/stenciljs/vitest/commit/3f1eef5a1fd4f9a979283d7a4c6b1861beaeeced))

## [1.1.5](https://github.com/stenciljs/vitest/compare/v1.1.4...v1.1.5) (2026-01-22)


### Bug Fixes

* core module extension ([3a9414e](https://github.com/stenciljs/vitest/commit/3a9414ea5d39fabce13d5233f6b0c92a90ec64d8))

## [1.1.4](https://github.com/stenciljs/vitest/compare/v1.1.3...v1.1.4) (2026-01-22)


### Bug Fixes

* auto-find vitest-environment-stencil ([41f8f4a](https://github.com/stenciljs/vitest/commit/41f8f4aad9e3d98ee6031eface24add2a33a3111))

## [1.1.3](https://github.com/stenciljs/vitest/compare/v1.1.2...v1.1.3) (2026-01-22)


### Bug Fixes

* return class instance when possible ([bfc68d1](https://github.com/stenciljs/vitest/commit/bfc68d194ce01b6b229b23f672ee52175b3103f2))
* vitest module augmentation order ([c36472d](https://github.com/stenciljs/vitest/commit/c36472dabd25aa522f6841bc1221ef7d40e1de81))

## [1.1.2](https://github.com/stenciljs/vitest/compare/v1.1.1...v1.1.2) (2026-01-20)


### Bug Fixes

* config to auto load / find `vitest-environment-stencil` ([7692065](https://github.com/stenciljs/vitest/commit/7692065afdede66d913a7ebb0c104172d849d309))
* remove `toBeVisible` in favour of the browser locator from vitest ([875d319](https://github.com/stenciljs/vitest/commit/875d319719b2fb3c3349c08cb5d9432cf0a832ae))

## [1.1.1](https://github.com/stenciljs/vitest/compare/v1.1.0...v1.1.1) (2026-01-17)


### Bug Fixes

* matchers typing and add more docs / examples ([612a5d2](https://github.com/stenciljs/vitest/commit/612a5d222dead24246ef91656cc7cc200b22ad6d))

# [1.1.0](https://github.com/stenciljs/vitest/compare/v1.0.0...v1.1.0) (2026-01-13)


### Bug Fixes

* package.json workspace references ([4cec091](https://github.com/stenciljs/vitest/commit/4cec091d29c57749d054961a211a156ae8266faf))


### Features

* expose serializeHtml and prettifyHtml ([c2772a1](https://github.com/stenciljs/vitest/commit/c2772a1878844007468dc3c5d99d8c049064221e))
* serialize non-shadow, polyfilled components ([5621f34](https://github.com/stenciljs/vitest/commit/5621f3485cfcf2eb677b784cdf29838a15b9ba78))

# [1.0.0](https://github.com/stenciljs/vitest/compare/v0.1.0...v1.0.0) (2026-01-10)


### Features

* bump to v1 ([87af5d2](https://github.com/stenciljs/vitest/commit/87af5d2c941a4f0feb6a44b928c1a22d72d6c8a4))


### BREAKING CHANGES

* first major version

# [0.1.0](https://github.com/stenciljs/vitest/compare/v0.0.5...v0.1.0) (2026-01-10)


### Initial Release

* custom config flags. Auto snap/screenshot ignoring ([a705fc0](https://github.com/stenciljs/vitest/commit/a705fc042d929a4dd8dd9703cea96d6950ac2b96))
