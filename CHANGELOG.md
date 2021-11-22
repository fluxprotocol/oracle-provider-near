# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [3.1.0](https://github.com/fluxprotocol/oracle-provider-near/compare/v3.0.1...v3.1.0) (2021-11-22)


### Features

* **core:** Update core to v2.0.1 ([ae9a70d](https://github.com/fluxprotocol/oracle-provider-near/commit/ae9a70d3a5385451788241fb6030e92b3cacbf4c))

### [3.0.1](https://github.com/fluxprotocol/oracle-provider-near/compare/v3.0.0...v3.0.1) (2021-11-22)


### Bug Fixes

* **dependencies:** Fix issue with using wrong core ([8973b73](https://github.com/fluxprotocol/oracle-provider-near/commit/8973b738a21aa6ad5bf61f223bc6b957ccdd44a2))

## [3.0.0](https://github.com/fluxprotocol/oracle-provider-near/compare/v2.5.0...v3.0.0) (2021-11-22)


### ⚠ BREAKING CHANGES

* **request:** Support for first party oracle required changes in the decision making for finalization

### Features

* **request:** Add support for first party oracle ([dada907](https://github.com/fluxprotocol/oracle-provider-near/commit/dada90708a059a5d3a7b0bb3b7f9b99d13be3312))
* **rpc:** Implement Active/Finalized data requests ([1628d70](https://github.com/fluxprotocol/oracle-provider-near/commit/1628d70103434657f3338976c39a1a567f313ba2))

## [2.5.0](https://github.com/fluxprotocol/oracle-provider-near/compare/v2.4.0...v2.5.0) (2021-11-09)


### Features

* **request:** Add requiredEnvVariables ([c43ea22](https://github.com/fluxprotocol/oracle-provider-near/commit/c43ea22b61b633ef479a3789ba8eeacad364fc80))

## [2.4.0](https://github.com/fluxprotocol/oracle-provider-near/compare/v2.3.3...v2.4.0) (2021-11-08)


### Features

* **request:** Add tags and requester ([90abfd4](https://github.com/fluxprotocol/oracle-provider-near/commit/90abfd4eb6c3072a99c41a77a750110673e79574))

### [2.3.3](https://github.com/fluxprotocol/oracle-provider-near/compare/v2.3.2...v2.3.3) (2021-10-26)


### Bug Fixes

* **rpc:** Fix issue where an RPC fail would result in the node restarting ([287b3d5](https://github.com/fluxprotocol/oracle-provider-near/commit/287b3d57eb39b0194f58ae14a067897f561dc8f8))

### [2.3.2](https://github.com/fluxprotocol/oracle-provider-near/compare/v2.3.1...v2.3.2) (2021-10-18)


### Bug Fixes

* **core:** Update core to v1.6.1 which fixes issues with final arbitrator finalization ([2956f01](https://github.com/fluxprotocol/oracle-provider-near/commit/2956f01148048113acbb149dda613b51b79c9851))

### [2.3.1](https://github.com/fluxprotocol/oracle-provider-near/compare/v2.3.0...v2.3.1) (2021-10-04)


### Bug Fixes

* **package:** Fix issue where package-lock was still using the old provider ([8894fe7](https://github.com/fluxprotocol/oracle-provider-near/commit/8894fe7b34cede48383ae6ba128bc4e73ee664dd))

## [2.3.0](https://github.com/fluxprotocol/oracle-provider-near/compare/v2.2.0...v2.3.0) (2021-10-04)


### Features

* **core:** Updated core to latest version v1.6.0 ([afc9c42](https://github.com/fluxprotocol/oracle-provider-near/commit/afc9c421b9919ff109823b3ab05be0fabbf3171e))

## [2.2.0](https://github.com/fluxprotocol/oracle-provider-near/compare/v2.1.3...v2.2.0) (2021-09-30)


### Features

* **near:** Update near-api-js to v0.43.0 which supports the removal of console logs ([d2ce834](https://github.com/fluxprotocol/oracle-provider-near/commit/d2ce834476e1685ce609ee8efeb84327611a0264))

### [2.1.3](https://github.com/fluxprotocol/oracle-provider-near/compare/v2.1.2...v2.1.3) (2021-09-29)


### Bug Fixes

* **unstake:** Fix issue where deprecated function was being used ([cf5a7c7](https://github.com/fluxprotocol/oracle-provider-near/commit/cf5a7c74e7a29e98a4fa80c9b67719cd4cbfdeba))

### [2.1.2](https://github.com/fluxprotocol/oracle-provider-near/compare/v2.1.1...v2.1.2) (2021-09-29)


### Bug Fixes

* **claim:** Fix issue where being slashed would always fail claiming ([c510157](https://github.com/fluxprotocol/oracle-provider-near/commit/c510157d41466b10c8fd4a73efe90258d0902a0f))

### [2.1.1](https://github.com/fluxprotocol/oracle-provider-near/compare/v2.1.0...v2.1.1) (2021-09-17)

## [2.1.0](https://github.com/fluxprotocol/oracle-provider-near/compare/v2.0.2...v2.1.0) (2021-08-31)


### Features

* **stake:** Add ability to stake a percentage of your balance when balance is running out ([2aabcb5](https://github.com/fluxprotocol/oracle-provider-near/commit/2aabcb5cf59e8411b696408d87d3624fe772b81b))

### [2.0.2](https://github.com/fluxprotocol/oracle-provider-near/compare/v2.0.1...v2.0.2) (2021-08-31)


### Bug Fixes

* **stake:** Fix issue where overstaking happend on the first round ([ccc512e](https://github.com/fluxprotocol/oracle-provider-near/commit/ccc512eb6a0a390fad9e363a8e9155d243f149a1))

### [2.0.1](https://github.com/fluxprotocol/oracle-provider-near/compare/v2.0.0...v2.0.1) (2021-08-31)


### Bug Fixes

* **rpc:** Fix issue where fetching requests would halt due not enough gas ([27f911c](https://github.com/fluxprotocol/oracle-provider-near/commit/27f911c92a418c67c029f56df57feae17de989f4))

## [2.0.0](https://github.com/fluxprotocol/oracle-provider-near/compare/v1.2.3...v2.0.0) (2021-08-30)


### ⚠ BREAKING CHANGES

* **config:** This will remove the NEAR_STAKE_AMOUNT

### Features

* **config:** Add NEAR_MAX_STAKE_AMOUNT ([70649fe](https://github.com/fluxprotocol/oracle-provider-near/commit/70649fe1512b5bc4dbd1e44d4559b6df346e312a))

### [1.2.3](https://github.com/fluxprotocol/oracle-provider-near/compare/v1.2.2...v1.2.3) (2021-08-25)


### Bug Fixes

* **balance:** Fix issue where balances where not correctly tracked ([f7661f8](https://github.com/fluxprotocol/oracle-provider-near/commit/f7661f85220dff2ab243eb39b76d94234937eeb1))

### [1.2.2](https://github.com/fluxprotocol/oracle-provider-near/compare/v1.2.1...v1.2.2) (2021-08-25)


### Bug Fixes

* **outcome:** Fix issue where outcome numbers where double multiplied ([6393d32](https://github.com/fluxprotocol/oracle-provider-near/commit/6393d3217a591a56e4c33945f92f1417ffbf3265))

### [1.2.1](https://github.com/fluxprotocol/oracle-provider-near/compare/v1.2.0...v1.2.1) (2021-08-18)


### Bug Fixes

* **package:** Fix issue with out of sync package lock ([23ac10a](https://github.com/fluxprotocol/oracle-provider-near/commit/23ac10a3dc9d052a3ef9115b746e66c34a85fc53))

## [1.2.0](https://github.com/fluxprotocol/oracle-provider-near/compare/v1.1.0...v1.2.0) (2021-08-18)


### Features

* **core:** Use latest core version (v1.1.0) ([6bb7f56](https://github.com/fluxprotocol/oracle-provider-near/commit/6bb7f5677bdf6e6294658aec385fb1d791b22401))

## 1.1.0 (2021-08-18)


### Features

* Working NEAR Provider using RPC ([81a2e4b](https://github.com/fluxprotocol/oracle-provider-near/commit/81a2e4b030bff6c585bff239b39c979eff1b9616))
