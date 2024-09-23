<div align="center">
    <picture>
        <source media="(min-width: 769px) and (prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/a96c9a07-3072-4994-a1c0-b4da37ff93fe">
        <source media="(min-width: 769px) and (prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/c86485fe-ebfc-40e1-be34-857a65379061">
        <source media="(max-width: 768px) and (prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/0974fb8b-8277-4eaf-bf86-39d5dbc72b97">
        <img src="https://github.com/user-attachments/assets/edd98ed3-e062-4864-9bbc-13f988202a47" alt="Croct JavaScript SDK" title="Croct JavaScript SDK" width="100%">
    </picture>
    <strong>JavaScript SDK</strong><br/>
    Bring dynamic, personalized content to your applications.
</div>
<br/>
<div align="center">
    📘 <a href="https://croct.com/reference/sdk/javascript/installation">Quickstart</a>
    • 💬 <a href="https://croct.link/community">Slack group</a>
    • 📦 <a href="https://github.com/croct-tech/plug-js/releases">Releases</a>
</div>
<br />
<p align="center">
    <a href="https://www.npmjs.com/package/@croct/plug"><img alt="Version" src="https://img.shields.io/npm/v/@croct/plug"/></a>
    <a href="https://github.com/croct-tech/plug-js/actions/workflows/library-validations.yaml"><img alt="Build" src="https://github.com/croct-tech/plug-js/actions/workflows/library-validations.yaml/badge.svg?branch=master"/></a>
    <a href="https://codeclimate.com/repos/5e7251a86589d75edf000f9e/maintainability"><img alt="Maintainability" src="https://api.codeclimate.com/v1/badges/2288af031dccbec256d9/maintainability"/></a>
    <a href="https://codeclimate.com/repos/5e7251a86589d75edf000f9e/test_coverage"><img alt="Coverage" src="https://api.codeclimate.com/v1/badges/2288af031dccbec256d9/test_coverage"/></a>
    <img alt="Gzipped bundle size" src="https://img.badgesize.io/https:/cdn.croct.io/js/v1/lib/plug.js?style=flat&compression=gzip" />
</p>

## What is Croct?

Croct is a headless CMS that delivers static and dynamic content, enabling you to manage content, AB test, and personalize experiences with one API and seamless integration.


## Installation

There are two ways to install the Croct SDK: 

### NPM

The recommended way to install the SDK is via [NPM](https://npmjs.com). It pairs nicely with module bundlers such as 
Webpack or Browserify and includes Typescript typings.

In most cases, it should be as simple as running the following in your project:

```sh
npm install @croct/plug
```

Then, call [`croct.plug`](docs/plug.md#plug) passing the App ID to initialize the SDK:

```js
import croct from '@croct/plug';

croct.plug({appId: '<APP_ID>'});
```

### Script Tag

To install the SDK as a script tag, add the following line to the `<head>` tag of your site on any pages you plan to use the SDK to personalize or track events:

```html
<script src="https://cdn.croct.io/js/v1/lib/plug.js?appId=<APP_ID>"></script>
<script>croct.plug();</script>
```

You should replace the `<APP_ID>` placeholder with the respective App ID. For more information about the available options, see [`croct.plug`](docs/plug.md#plug).

## Getting Started

> 🏖️ **Just for your convenience**  
> We will use CodePen throughout the tutorial to let you play with the examples right in your browser.

Follow the steps below to connect the playground with CodePen:

1. [Open the playground](http://play.croct.com/)
2. Click on the _"Don't have an API Key?"_ link to proceed in sandbox mode
3. Enter the URL `https://codepen.io/pen`
4. Click on _"Let's play!"_

<br />

<p align="center">
    <img src="https://user-images.githubusercontent.com/943036/99390593-a8242780-28b7-11eb-8966-761aea2b3b3d.gif" alt="Connecting" title="Connecting" width="600" />
</p>

> 💡️ **Hint**  
> You will typically use an API key to connect to your development, staging, or production environments in real cases,
> but you can also use a local URL, such as `https://localhost/myapp`.

Now, try evaluating the expression below:

```
user is returning
```

After clicking on the _Evaluate_ button, you will see the result at the bottom of the page, which is either `true` or 
`false` depending on whether it is the first time playing with this example.

Let's now implement our first personalization feature. Click on the three-dots icon on the editor's top right corner 
and select _"Open in CodePen"_. Then, copy the code below and paste into the HTML panel:

```html
<button onclick="hey()">👋 Say hey</button>

<script>  
  function welcome() {
    if (confirm('Welcome! Do you want to take a look at our quick start guide?')) {
      window.open('https://croct.link/plug-js/quick-start');
    }
  }
  
  function welcomeBack() {
    if (confirm('Welcome back! How about joining us on Slack this time?')) {
      window.open('https://croct.link/community');
    }
  }
  
  function hey() {
    croct.evaluate('user is returning')
       .then(returning => returning ? welcomeBack() : welcome()); 
  }
</script>
```

Try clicking _"👋 Say Hey"_, and you should see a personalized greeting.

🎉 **Congratulations!** You have successfully implemented your first personalization feature using Croct. For a more 
in-depth walk-through, check out our [quick start guide](docs/quick-start.md). 

## Documentation

The following references provide guidance to help you get started, integrate, and troubleshoot problems:

- [Quick Start Guide](docs/quick-start.md)
- [Plug Reference](docs/plug.md)
- [Tracker Reference](docs/tracker.md)
- [Evaluator Reference](docs/evaluator.md)
- [Event Reference](docs/events.md)
- [Patch Reference](docs/patch.md)
- [User Reference](docs/user.md)
- [Session Reference](docs/session.md)
- [Testing](docs/testing.md)
- [Troubleshooting](docs/troubleshooting.md)

If you are new to the Croct platform, the [quick start guide](docs/quick-start.md) is a good starting point for 
application developers to begin learning the essential concepts.

## Support

If the [troubleshooting section](docs/troubleshooting.md) does not cover your problem, don't worry, there are 
alternative ways to get help from the Croct community.

### Stack Overflow

Someone else from the community may have already asked a similar question or may be able to help with your problem. 

The Croct team will also monitor posts with the "croct" tag. If there aren't any existing questions that help,
please [ask a new one](https://stackoverflow.com/questions/ask?tags=croct%20plugjs).

### GitHub

If you have what looks like a bug, or you would like to make a feature request, please 
[open a new issue on GitHub](https://github.com/croct-tech/plug-js/issues/new/choose).

Before you file an issue, a good practice is to search for issues to see whether others have the same or similar problems. 
If you are unable to find an open issue addressing the problem, then feel free to open a new one. 

### Slack Channel

Many people from the Croct community hang out on the Croct Slack Group. 
Feel free to [join us and start a conversation](https://croct.link/community).

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
