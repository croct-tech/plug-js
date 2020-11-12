<p align="center">
    <a href="https://croct.com">
        <img src="https://cdn.croct.io/brand/logo/repo-icon-green.svg" alt="Croct" height="80" />
    </a>
    <br />
    <strong>Plug JS</strong>
    <br />
    A personalization toolkit for client-side JavaScript.
</p>
<p align="center">
    <a href="https://www.npmjs.com/package/@croct/plug"><img alt="Version" src="https://img.shields.io/npm/v/@croct/plug"/></a>
    <a href="https://github.com/croct-tech/plug-js/actions?query=workflow%3AValidations"><img alt="Build" src="https://github.com/croct-tech/plug-js/workflows/Validations/badge.svg"/></a>
    <a href="https://codeclimate.com/repos/5e7251a86589d75edf000f9e/maintainability"><img alt="Maintainability" src="https://api.codeclimate.com/v1/badges/2288af031dccbec256d9/maintainability"/></a>
    <a href="https://codeclimate.com/repos/5e7251a86589d75edf000f9e/test_coverage"><img alt="Coverage" src="https://api.codeclimate.com/v1/badges/2288af031dccbec256d9/test_coverage"/></a>
    <a href="https://bundlephobia.com/result?p=@croct/plug"><img alt="Gzipped Size" src="https://img.shields.io/bundlephobia/minzip/@croct/plug"/></a>
    <br />
    <br />
    <a href="https://github.com/croct-tech/plug-js/releases">📦 Releases</a>
    ·
    <a href="https://github.com/croct-tech/plug-js/issues/new?labels=bug&template=bug-report.md">🐞 Report Bug</a>
    ·
    <a href="https://github.com/croct-tech/plug-js/issues/new?labels=enhancement&template=feature-request.md">✨ Request Feature</a>
</p>

## About

Plug JS is the easiest way to collect, manage, and consume real-time data to fuel personalized experiences. 
A single line of code gives you a complete devkit for building natively personalized applications.

## Features

- **Zero configuration.** No setup steps required.
- **No backend necessary.** Deliver personalized experiences from static sites.
- **Fast queries.** Double-digit millisecond latency for real-time evaluations.
- **Fully extensible API.** Easily add and share new features via plugins.
- **Type-Safe.** Typescript typings included.
- **Playground integration** One-click to connect, no configuration needed.

<br />

<p align="center">
    <img src="https://user-images.githubusercontent.com/943036/98486013-70ebb180-21f9-11eb-9678-3a1371414b54.gif" alt="Playground" title="Playground" width="600" />
</p>

### Browser support

The client-side SDK is supported by all modern browsers that support the standardized WebSocket and Promise APIs. 
These browsers together represent more than 95% of global usage.

## Installation

There are two ways to install the Croct SDK: 

### NPM

The recommended way to install the SDK is via [NPM](https://npmjs.com). It pairs nicely with module bundlers such as 
Webpack or Browserify and includes Typescript typings.

In most cases, it should be as simple as running the following in your project:

```sh
npm install @croct/plug
```

### Script Tag

To install the SDK as a script tag, add the following line to the `<head>` tag of your site on any pages you plan 
to use the SDK to personalize or track events. Next, replace the `<APP_ID>` placeholder with the respective 
application's public ID.

```html
 <script src="https://cdn.croct.io/js/v1/lib/plug.js?appId=<APP_ID>"></script>
```

## Documentation

This reference documents all methods available in our client-side JavaScript SDK, and explains in detail how 
these methods work.

## Getting Help

If the troubleshooting section does not cover your problem, don't worry, there are alternative ways to get help from 
the Croct community.

### Stack Overflow

Someone else from the community may have already asked a similar question or may be able to help with your problem. 

The Croct team will also monitor posts tagged Croct. If there aren not any existing questions that help,
please [ask a new one](https://stackoverflow.com/questions/ask?tags=croct%20plugjs).

### GitHub

If you have what looks like a bug, or you would like to make a feature request, please 
[open a new issue on GitHub](https://github.com/croct-tech/plug-js/issues/new/choose).

Before you file an issue, a good practice is to search for issues to see whether others have the same or similar problems. 
If you are unable to find an open issue addressing the problem, then feel free to open a new one. 

### Slack Channel

Many people from the Croct community hang out on the Croct Slack Group. 
[Feel free to join us and start a conversation](https://launchpass.com/croct-community).

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
