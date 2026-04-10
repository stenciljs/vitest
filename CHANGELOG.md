## [1.11.1](https://github.com/stenciljs/vitest/compare/v1.11.0...v1.11.1) (2026-04-10)


### Bug Fixes

* sort html attributes ([#51](https://github.com/stenciljs/vitest/issues/51)) ([573d009](https://github.com/stenciljs/vitest/commit/573d009029ab3c03dd05b24eda452a6a47b3bf3c))

# [1.11.0](https://github.com/stenciljs/vitest/compare/v1.10.0...v1.11.0) (2026-04-10)


### Bug Fixes

* better error handling ([#48](https://github.com/stenciljs/vitest/issues/48)) ([0051eef](https://github.com/stenciljs/vitest/commit/0051eef645fd98e3e9c766d18e32bb95bbcacce6))


### Features

* vite plugin ([#50](https://github.com/stenciljs/vitest/issues/50)) ([814bf34](https://github.com/stenciljs/vitest/commit/814bf34c14d6eb984fd18ee41e5385ef7bb6c184))

# [1.10.0](https://github.com/stenciljs/vitest/compare/v1.9.3...v1.10.0) (2026-04-01)


### Features

* support v5 ([#46](https://github.com/stenciljs/vitest/issues/46)) ([c57fa27](https://github.com/stenciljs/vitest/commit/c57fa27fc65f0311a75fbbe19f5f8c19be2bdf76))

## [1.9.3](https://github.com/stenciljs/vitest/compare/v1.9.2...v1.9.3) (2026-03-27)


### Bug Fixes

* `waitForReady` skips `whenDefined` and `componentOnReady` checks ([#44](https://github.com/stenciljs/vitest/issues/44)) ([9b5009e](https://github.com/stenciljs/vitest/commit/9b5009e2f2c030d4e5298bf775da2cdd58e85311))

## [1.9.2](https://github.com/stenciljs/vitest/compare/v1.9.1...v1.9.2) (2026-03-26)


### Bug Fixes

* hush npm warnings re pnpm env vars ([#43](https://github.com/stenciljs/vitest/issues/43)) ([30d743e](https://github.com/stenciljs/vitest/commit/30d743e12ad0e684d6681c0bd5ba87abac8632ce))

## [1.9.1](https://github.com/stenciljs/vitest/compare/v1.9.0...v1.9.1) (2026-03-25)


### Bug Fixes

* fix pure node tests (check for `customElements`) ([#42](https://github.com/stenciljs/vitest/issues/42)) ([2b29190](https://github.com/stenciljs/vitest/commit/2b2919057fefd2f9228f97544033f4015a12d47e))

# [1.9.0](https://github.com/stenciljs/vitest/compare/v1.8.3...v1.9.0) (2026-03-24)


### Features

* component spying and mocking ([#38](https://github.com/stenciljs/vitest/issues/38)) ([0656b7a](https://github.com/stenciljs/vitest/commit/0656b7ae707c9a1202690a7c6519153d318442bc))
* init mock setup ([#40](https://github.com/stenciljs/vitest/issues/40)) ([29369f1](https://github.com/stenciljs/vitest/commit/29369f1f700019faef3acb50ee888dba8f85ccf9))
* use stencil hydrated config to assess readiness ([#41](https://github.com/stenciljs/vitest/issues/41)) ([e6aac4e](https://github.com/stenciljs/vitest/commit/e6aac4e750e8c304f3788118e5fb2798b29ac603))

## [1.8.3](https://github.com/stenciljs/vitest/compare/v1.8.2...v1.8.3) (2026-03-19)


### Bug Fixes

* stencil env for node-20 ([#36](https://github.com/stenciljs/vitest/issues/36)) ([4be04c7](https://github.com/stenciljs/vitest/commit/4be04c7b1d7c5f5f8d6b6e7cb6078700362de4d2))

## [1.8.2](https://github.com/stenciljs/vitest/compare/v1.8.1...v1.8.2) (2026-03-19)


### Bug Fixes

* pass `--no-build` to stencil, not vite ([#35](https://github.com/stenciljs/vitest/issues/35)) ([9134a4f](https://github.com/stenciljs/vitest/commit/9134a4f7161f8ce6e13d321c2c513de20a728947))

## [1.8.1](https://github.com/stenciljs/vitest/compare/v1.8.0...v1.8.1) (2026-03-19)


### Bug Fixes

* update to make work with vitest 4.1 without warnings ([#34](https://github.com/stenciljs/vitest/issues/34)) ([0a1aa89](https://github.com/stenciljs/vitest/commit/0a1aa89cee190474cf341aef7ef2997f96fe4be5))

# [1.8.0](https://github.com/stenciljs/vitest/compare/v1.7.2...v1.8.0) (2026-03-17)


### Features

* add cli flags as global variables ([#33](https://github.com/stenciljs/vitest/issues/33)) ([704ea9d](https://github.com/stenciljs/vitest/commit/704ea9d4f5ad795b8b1145bd829a0642d68436d8))

## [1.7.2](https://github.com/stenciljs/vitest/compare/v1.7.1...v1.7.2) (2026-03-17)


### Bug Fixes

* ignore `readme.md` files for `--watch` combined with `--prod` ([#32](https://github.com/stenciljs/vitest/issues/32)) ([27387e0](https://github.com/stenciljs/vitest/commit/27387e02449d083b350f4c87a6be72170275f7bf))

## [1.7.1](https://github.com/stenciljs/vitest/compare/v1.7.0...v1.7.1) (2026-03-13)


### Bug Fixes

* `waitForStable` to also check for visibility ([#31](https://github.com/stenciljs/vitest/issues/31)) ([5d723b7](https://github.com/stenciljs/vitest/commit/5d723b7be56bc0a311e8489d29b351d84ffb6ece))

# [1.7.0](https://github.com/stenciljs/vitest/compare/v1.6.2...v1.7.0) (2026-03-13)


### Features

* `toHaveLightTextContent` & `toEqualLightText` ([#30](https://github.com/stenciljs/vitest/issues/30)) ([0b97093](https://github.com/stenciljs/vitest/commit/0b97093b27e681ddb378e14cd502df0ecb9167b7))

## [1.6.2](https://github.com/stenciljs/vitest/compare/v1.6.1...v1.6.2) (2026-03-12)


### Bug Fixes

* vitest only watch js files ([#29](https://github.com/stenciljs/vitest/issues/29)) ([a7de7e3](https://github.com/stenciljs/vitest/commit/a7de7e32c661dba4034c67e591bc722a0acb0408))

## [1.6.1](https://github.com/stenciljs/vitest/compare/v1.6.0...v1.6.1) (2026-03-12)


### Bug Fixes

* stop test re-runs on *.map.js file change ([#28](https://github.com/stenciljs/vitest/issues/28)) ([3d81f5c](https://github.com/stenciljs/vitest/commit/3d81f5c3f070977c3b0352a8bbad234718998373))

# [1.6.0](https://github.com/stenciljs/vitest/compare/v1.5.0...v1.6.0) (2026-03-12)


### Features

* auto add test files to stencil watch-ignore ([#26](https://github.com/stenciljs/vitest/issues/26)) ([e3a60fb](https://github.com/stenciljs/vitest/commit/e3a60fbbf6287e23fff499aa97ef6c8908bb8df3))

# [1.5.0](https://github.com/stenciljs/vitest/compare/v1.4.0...v1.5.0) (2026-03-11)


### Features

* `render()` - allow template string ([#25](https://github.com/stenciljs/vitest/issues/25)) ([4fe00cc](https://github.com/stenciljs/vitest/commit/4fe00cc7cded73a0fb0f9474631f929f3353fec1))

# [1.4.0](https://github.com/stenciljs/vitest/compare/v1.3.0...v1.4.0) (2026-03-10)


### Features

* `waitForExist` utility ([#24](https://github.com/stenciljs/vitest/issues/24)) ([b8978ab](https://github.com/stenciljs/vitest/commit/b8978ab3a6bcb794b8268fd36243df9ef605cc28))

# [1.3.0](https://github.com/stenciljs/vitest/compare/v1.2.0...v1.3.0) (2026-03-10)


### Features

* `waitForStable` for browser mode ([#23](https://github.com/stenciljs/vitest/issues/23)) ([c8e3a9c](https://github.com/stenciljs/vitest/commit/c8e3a9c111fd150c0c1b8e732294dbdd0112de2b))

# [1.2.0](https://github.com/stenciljs/vitest/compare/v1.1.21...v1.2.0) (2026-03-10)


### Features

* **render:** add `waitForReady` option to wait for first render in browser mode (defaults to `true`) ([#22](https://github.com/stenciljs/vitest/issues/22)) ([32e36c1](https://github.com/stenciljs/vitest/commit/32e36c1425e28857cc21c6c1550ceace47e35389))

## [1.1.21](https://github.com/stenciljs/vitest/compare/v1.1.20...v1.1.21) (2026-02-17)


### Bug Fixes

* prettifyHtml self closing tag indentation ([#21](https://github.com/stenciljs/vitest/issues/21)) ([2e81500](https://github.com/stenciljs/vitest/commit/2e8150002c8a4d15412efcd8d10164ae055b481c))

## [1.1.20](https://github.com/stenciljs/vitest/compare/v1.1.19...v1.1.20) (2026-02-16)


### Bug Fixes

* stop `toEqualHtml` string comparison from stripping outer tags ([#20](https://github.com/stenciljs/vitest/issues/20)) ([d163696](https://github.com/stenciljs/vitest/commit/d1636966ffde0773832590817d3fe71bdb5277e8))

## [1.1.19](https://github.com/stenciljs/vitest/compare/v1.1.18...v1.1.19) (2026-02-16)


### Bug Fixes

* serializer preserve svg element tagName case ([#19](https://github.com/stenciljs/vitest/issues/19)) ([1247db9](https://github.com/stenciljs/vitest/commit/1247db9bc8c96db061a9c800e4095e0bde84b5e8))

## [1.1.18](https://github.com/stenciljs/vitest/compare/v1.1.17...v1.1.18) (2026-02-16)


### Bug Fixes

* add shadowrootdelegatesfocus to serializer ([#17](https://github.com/stenciljs/vitest/issues/17)) ([8855698](https://github.com/stenciljs/vitest/commit/8855698c2e756bbd68962ec79c89d3317be0f245))
* serialize namespaced attrs like `xlink:href` ([#18](https://github.com/stenciljs/vitest/issues/18)) ([6e04a9c](https://github.com/stenciljs/vitest/commit/6e04a9c37a92f79a60824013a7523e09fcdc603c))

## [1.1.17](https://github.com/stenciljs/vitest/compare/v1.1.16...v1.1.17) (2026-02-15)


### Bug Fixes

* serializer self closing tags ([#16](https://github.com/stenciljs/vitest/issues/16)) ([a0079d1](https://github.com/stenciljs/vitest/commit/a0079d17ae8930c6226bb833d79f7760c698d2f4))

## [1.1.16](https://github.com/stenciljs/vitest/compare/v1.1.15...v1.1.16) (2026-02-15)


### Bug Fixes

* serialize comments ([#15](https://github.com/stenciljs/vitest/issues/15)) ([6696f67](https://github.com/stenciljs/vitest/commit/6696f679124713f67218878f0ece18653309b600))

## [1.1.15](https://github.com/stenciljs/vitest/compare/v1.1.14...v1.1.15) (2026-02-15)


### Bug Fixes

* do not include empty values (e.g. `=""`) on boolean attributes ([#14](https://github.com/stenciljs/vitest/issues/14)) ([587ac4c](https://github.com/stenciljs/vitest/commit/587ac4cb46242ced11f754c1cdbc99e755dc86cb))

## [1.1.14](https://github.com/stenciljs/vitest/compare/v1.1.13...v1.1.14) (2026-02-13)


### Bug Fixes

* chai / mock-doc Event conflicts ([#13](https://github.com/stenciljs/vitest/issues/13)) ([aa452a9](https://github.com/stenciljs/vitest/commit/aa452a9a33a373de8cd9f895c66ed046704aee44))

## [1.1.13](https://github.com/stenciljs/vitest/compare/v1.1.12...v1.1.13) (2026-02-13)


### Bug Fixes

* override chai globals in mock-docs ([#12](https://github.com/stenciljs/vitest/issues/12)) ([86bcbd2](https://github.com/stenciljs/vitest/commit/86bcbd22e7701031179811c6bcb6610a897bdecc))

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
