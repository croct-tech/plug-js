<p align="center">
    <a href="https://croct.com">
        <img src="https://cdn.croct.io/brand/logo/repo-icon-green.svg" alt="Croct" height="80" />
    </a>
    <br />
    <strong>Plug JS</strong>
    <br />
    The hassle-free way to integrate Croct into any web application.
</p>
<p align="center">
    <a href="https://www.npmjs.com/package/@croct/plug"><img alt="Version" src="https://img.shields.io/npm/v/@croct/plug"/></a>
    <a href="https://github.com/croct-tech/plug-js/actions?query=workflow%3AValidations"><img alt="Build" src="https://github.com/croct-tech/plug-js/workflows/Validations/badge.svg"/></a>
    <a href="https://codeclimate.com/repos/5e7251a86589d75edf000f9e/maintainability"><img alt="Maintainability" src="https://api.codeclimate.com/v1/badges/2288af031dccbec256d9/maintainability"/></a>
    <a href="https://codeclimate.com/repos/5e7251a86589d75edf000f9e/test_coverage"><img alt="Coverage" src="https://api.codeclimate.com/v1/badges/2288af031dccbec256d9/test_coverage"/></a>
    <a href="https://bundlephobia.com/result?p=@croct/plug"><img alt="Gzipped Size" src="https://img.shields.io/bundlephobia/minzip/@croct/plug"/></a>
    <br />
    <br />
    <a href="https://github.com/croct-tech/plug-js/releases">📦Releases</a>
    ·
    <a href="https://github.com/croct-tech/plug-js/issues/new?labels=bug&template=bug-report.md">🐞Report Bug</a>
    ·
    <a href="https://github.com/croct-tech/plug-js/issues/new?labels=enhancement&template=feature-request.md">✨Request Feature</a>
</p>

## Introduction
The Plug JS provides the building blocks for crafting personalized experiences. A single line of code gives you a complete personalization toolkit for building applications that reacts to the user's needs.

### Features
- **Zero configuration.** No setup steps required.
- **No backend necessary.** Deliver personalized experiences from static sites.
- **Fast queries.** Double-digit millisecond latency for real-time evaluations.
- **Fully extensible API.** Easily add and share new features via plugins.
- **Type-Safe.** Typescript typings included.

## Installation

We currently offer two ways to install the library.

## CDN
Add the following line to the `<head>` tag of your HTML document:

```html
<script src="https://cdn.croct.io/js/v1/lib/plug.js"></script>
```

This guarantees the application will always use the latest version of the library.

## NPM
[NPM](https://npmjs.com) is the recommended installation method when building large scale applications with Croct. It pairs nicely with module bundlers such as Webpack or Browserify and includes Typescript typings.

Run the following command to install the latest version of the package:

```sh
npm install @croct/plug
```

## Usage Example

Displaying a welcome message for returning users only:

```js
(async () => {
    croct.plug({appId: '<APP_ID>'});
    
    if (await croct.evaluate('user is returning')) {
        alert('Welcome back!');
    }
})();

```

## Contributing
Contributions to the package are always welcome! 

- Report any bugs or issues on the [issue tracker](https://github.com/croct-tech/plug-js/issues).
- For major changes, please [open an issue](https://github.com/croct-tech/plug-js/issues) first to discuss what you would like to change.
- Please make sure to update tests as appropriate.

## Testing

Before running the test suites, the development dependencies must be installed:

```sh
npm install
```

Then, to run all tests:

```sh
npm test
```

## License

This project is released under the [MIT License](LICENSE).
