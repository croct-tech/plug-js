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
    <a href="https://github.com/croct-tech/plug-js/releases">📦 Releases</a>
    ·
    <a href="https://github.com/croct-tech/plug-js/issues/new?labels=bug&template=bug-report.md">🐞 Report Bug</a>
    ·
    <a href="https://github.com/croct-tech/plug-js/issues/new?labels=enhancement&template=feature-request.md">✨ Request Feature</a>
</p>

## Table of Contents

- [Introduction](#introduction)
  * [Features](#features)
- [Installation](#installation)
  * [NPM](#npm)
  * [CDN](#cdn)
- [Getting started](#getting-started)
  * [A quick introduction to CQL](#a-quick-introduction-to-cql)
  * [Setting up](#setting-up)
    + [Starting a CodePen](#starting-a-codepen)
    + [Getting the CodePen URL](#getting-the-codepen-url)
    + [Connecting to the playground](#connecting-to-the-playground)
  * [Evaluating expressions](#evaluating-expressions)
    + [Evaluating expressions on the playground](#evaluating-expressions-on-the-playground)
  * [Evaluating expressions programmatically](#evaluating-expressions-programmatically)
  * [Collecting information](#collecting-information)
    + [Enriching profiles](#enriching-profiles)
    + [Enriching sessions](#enriching-sessions)
  * [Tracking events](#tracking-events)
  * [Identifying users](#identifying-users)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [Testing](#testing)
- [License](#license)

## Introduction

The Plug JS provides the building blocks for crafting personalized experiences. A single line of code gives you a 
complete personalization toolkit for building applications that reacts to the user's needs.

### Features

- **Zero configuration.** No setup steps required.
- **No backend necessary.** Deliver personalized experiences from static sites.
- **Fast queries.** Double-digit millisecond latency for real-time evaluations.
- **Fully extensible API.** Easily add and share new features via plugins.
- **Type-Safe.** Typescript typings included.
- **Builtin playground integration** One-click to connect, no configuration needed.

<p align="center">
    <img src="https://user-images.githubusercontent.com/943036/98485555-10a74080-21f6-11eb-92f9-7e67c369fcf1.gif" alt="Playground" title="Playground" />
</p>

## Installation

We currently offer two ways to install the library.

### NPM

The recommended way to install the SDK is via [NPM](https://npmjs.com). It pairs nicely with module bundlers such as 
Webpack or Browserify and includes Typescript typings.

Run the following command to install the latest version of the package:

```sh
npm install @croct/plug
```

### CDN

Add the following line to the `<head>` tag of your HTML document, replacing the `<APP_ID>` with the public app ID:

```html
<script src="https://cdn.croct.io/js/v1/lib/plug.js?appId=<APP_ID>"></script>
```

## Begginer's guide

Welcome to the beginner's guide to Croct SDK for JavaScript.

This guide aims to introduce the SDK's main features and explain how you can use the 
[playground](https://play.croct.com) to assist in developing new personalization features.

Although some JavaScript knowledge will make following along easier, this guide is well suited even for non-developers.

Let's start!

### A quick introduction to CQL

You may have already experienced a situation where someone with a marketing or product role wanted to provide a 
personalized experience for a particular audience, but that never got off the ground because it turned out to be 
much more complicated than expected.

That was the spark for creating the Contextual Query Language (CQL), an English-based language designed to abstract 
away from marketing, product, and development teams the complexities behind delivering personalized online experiences.

CQL makes it easy for everyone to write simple or sophisticated conditions in plain English in such a way that developers 
can use it directly in the code without any additional step.

```
# CQL expressions are self-explanatory
user's age is greater than 18
```

For developers, CQL serves as an abstraction layer between the application and the underlying personalization infrastructure:

```
user is returning and location's state is "California"
```

In the previous example, note that there are multiple ways for obtaining the visitor's location, such as the IP address 
or GPS coordinates. Although GPS coordinates provide more accurate information than the IP address, it depends on the 
user granting permission to the application to use the location service.

That's where CQL shines. You define the business rules, and the personalization engine takes care of the tedious work 
for you, such as selecting the best location source in the previous example.

Plus, it opens up new horizons for connecting 3rd party data providers to your personalization data layer:

```
# Score synchronized with your CRM
user's score

# Verified using your anti-fraud solution of choice
user is a fraud
```

Things get even more interesting when you realize that you can use the user context to apply machine learning models 
in real-time. We are working to support AI-powered evaluations like the following:

```
# It doesn't seem as complex as designing, training, and running ML models, does it?
user is churning
```

Because it is textual, you can use the same expression everywhere: straight in the code, playground, WordPress, 
or any other platform integrated with Croct.

In the next sections, we will explore how we can use CQL to craft personalized user journeys that inspire long-term, 
value-driven customer relationships.

### Setting up

You can use the SDK for building natively personalized applications or even for personalizing static HTML pages, 
such as a marketing landing page. Either way, to use the playground, we will need a URL to access our example. 
To make it simple, we will use the CodePen since it provides an easy way to expose a URL for playing with the examples 
provided throughout this guide.

#### Starting a CodePen

Let's start with a minimal base for our examples. For this, [create a new CodePen](https://codepen.io/pen) 
and paste the code below into the HTML panel:

```html

<!-- Load the SDK from CDN -->
<script src="https://cdn.croct.io/js/v1/lib/plug.js"></script>

<!-- Initialize the SDK using the Sandbox API key -->
<script>croct.plug({appId: '00000000-0000-0000-0000-000000000000'});</script>

<!-- A button to help us get the CodePen link -->  
<button onclick="prompt('Link to CodePen:', window.location.href)">
    Get CodePen link
</button>

<hr/>

<!-- The code used in the rest of the examples goes here -->
```

Throughout the guide, you will come across several interactive examples that you can try replacing the line 
`<!-- The code used in the rest of the examples goes here -->` with the example code.

#### Getting the CodePen URL

After you paste the HTML code, you should see a blank page with a button labeled _"Show CodePen URL"_. 
Click that button and copy the link.

#### Connecting to the playground

Now it's time to connect our CodePen page to the playground:

1. [Open the playground](http://play.croct.com/)
2. Click on the _"Don't have an API Key?"_ link to proceed in sandbox mode
3. Paste the CodePen link you copied
4. Click on _"Let's play!"_
5. Right-click on the button labeled _"cdpn.io/boomboom/v2/index.html"_, located at the top right of the page, 
and select _"Open link in new tab"_

After the page loads, you should see a notification saying _"Connection established"_, indicating the playground 
is now connected to the CodePen. 

> In real cases, you will use an API key to connect to your production application. You can also use a development URL, 
> such as `https://testing.myapp.com` or `https://localhost/myapp`.

Now, let's get our hands dirty and play around with CQL!

### Evaluating expressions

Now the playground is connected, we can start evaluating CQL expressions.

#### Evaluating expressions on the playground

To evaluate an expression in the playground, just type the expression in the editor and click the "Evaluate" button.
 
Try evaluating the expression below:

```
today
```

At the bottom of the page, you will see the result of the expression, which in this case is the current date.

Now, try evaluating the following expression:

```
today plus 1 day is equal to tomorrow
```

As expected, the result of the evaluation is `true`. Now, let's try a more interesting expression:

```
location's city
```

This time, the evaluation result should show your approximate location based on your IP address. 

You can also mix boolean expressions using conjunctions to form more sophisticated expressions:

```
user's interests include "rental" and location's city is "New York"
```

To see the list of expressions and variables available, click on the _"Cheat Sheet"_ link at the top of the page.

### Evaluating expressions programmatically

One of the coolest things about CQL is that you can programmatically evaluate expressions using the same expressions 
written in plain English.

Let's go back to CodePen to evaluate our first expression programmatically. Edit the code to include a personalization 
that will greet a visitor depending on whether it is the first time they access your application or not:

```html
<script>  
  croct.evaluate(`user is returning`)
    .then(returning => alert(returning ? 'Welcome back!' : 'Welcome!')); 
</script>
```

After CodePen updates the preview, you should see an alert saying _"Welcome!"_ or _"Welcome back!"_ depending on whether 
it is your first time playing around with CQL on CodePen.

Note that you are not limited to boolean expressions only. For example, let's edit the example again to show the 
number of visits:

```html
<script>  
  croct.evaluate(`user's stats' sessions`)
    .then(count => alert(`Visits: ${count}`));
</script>
```

The `croct.evaluate` method returns a `Promise` that resolves to the evaluation result. The second argument, 
omitted for the sake of simplicity in the example, allows passing evaluation options, like variables and timeout. 
Please refer to the API reference for more details.

### Collecting information

So far, we haven't collected any information explicitly. Even so, it is already possible to answer several 
interesting questions like:

- Has this visitor been seen before?  
`user's is returning`
- What is the approximate location of the visitor?  
`location's city`
- How long has it been since the session started?  
`session's duration`
- Did the visitor come through a marketing campaign?  
`campaign's name`

These are just a few of the many questions you can ask based on anonymous information automatically collected by the SDK.

> Croct does not automatically collect sensitive information that can identify the user, such as GPS coordinates or 
> values entered in fields. We open-sourced the SDK as an effort to bring more transparency about the data collected.

In addition to the information collected automatically, you can also enrich profiles and sessions with relevant 
information to personalize your product or offer progressively, as we will see on the next sections.

#### Enriching profiles

Let's go back to our example and see how we can enrich user profiles to expand your personalization capabilities:

```html
<button onclick="askBirthDate()">1. Ask my birth date</button>

<script>  
  function askBirthDate() { 
    const birthDate = prompt("What's your birth date?", "YYYY-MM-DD");

    croct.user.edit()
      .set('birthDate', birthDate)
      .save()
      .then(() => alert('Thank you!'));
  }
</script> 
```

Let's break this example down into parts. First, we introduced a button that calls the function `askBirthDate`. 
Then, we store the date of birth that the visitor informed in the variable "birthDate" and finally save the birth date 
to the visitor's profile.

Note that you did not have to provide an ID to persist information about the anonymous user because the SDK took care 
of that for you.

Now let's show the visitor's age based on the birth date entered:

```html
<button onclick="askBirthDate()">Ask my birth date</button>
<button onclick="showAge()">Show my age</button>

<script>  
  function askBirthDate() { 
    const birthDate = prompt("What's your birth date?", "YYYY-MM-DD");

    croct.user.edit()
      .set('birthDate', birthDate)
      .save()
      .then(() => alert('Thank you!'));
  }
  
  function showAge() { 
    croct.evaluate(`user's age`)
      .then(alert);
 }
</script>
```

Now, click on "Ask my birth date", enter your birth date and then click on "Show my age", and you should see 
your age based on the entered birth date. 

#### Enriching sessions

While working with personalization, it is common to collect session-specific information for evaluation or 
analysis purposes. For such cases, the SDK provides a way to store data that remains available for evaluation only for 
the session's duration.

In the following example, we will implement a way to understand the user's questions. We could then use 
this information to display content that could help answer these questions along the journey.

```html

<details onclick="addQuestion('pricing')">
    <summary>How much does Croct cost?</summary>
    <p>Try Croct free for 14 days, no credit card required.</p>
</details>

<details onclick="addQuestion('ease of use')">
    <summary>Do I need to be a developer to use Croct?</summary>
    <p>No, you don't need to be a developer to use Croct.</p>
</details>

<br/>

<button onclick="hasQuestion('pricing')">
  Do I have questions about pricing?
</button>

<button onclick="hasQuestion('ease of use')">
  Do I have questions about ease of use?
</button>

<script>  
  function addQuestion(question) {
    croct.session.edit()
      .add('questions', question)
      .save();
  }
  
  function hasQuestion(question) {
    croct.evaluate(`session's questions include '${question}'`).then(alert);
  }
</script> 
```

After updating the code on CodePen, you will see something that resembles an FAQ. Try clicking on the buttons and 
questions, and you will see that the answer will change according to the questions you have expanded. We could use 
a similar approach to personalize elements of the application to clarify those questions.

### Tracking events

Events are the fuel of personalization engines. It serves two primary purposes: recording facts for path analysis and feeding the evaluation data layer.
As already mentioned, the SDK automatically collects general-purpose events for you, such as viewed pages and idle periods, to name a few. For non-generic events, it is up to your application to decide which events to track. 

Let's take an example that shows how the personalization engine uses events to enrich the evaluation context
Go back to CodePen and update the code with our next example:

```html
<button onclick="updateCart([{id: 'coffee', product: 'Coffee', price: 5}])">
  ☕ Buy a coffee
</button>

<br /><br />

<button onclick="showOffers()">Show offers</button>
<button onclick="updateCart([])">Clear cart</button>

<script>  
  function showOffers() {
    // @todo Fix grammar to allow the quantifier at the end of the expression (greedily)
    croct.evaluate("cart is not empty and (no item in cart satisfies item's name matches 'Combo')")
      .then(eligible => {
        if (!eligible) {
          alert('No eligible offers.');
          
          return;
        }
      
       if (confirm('How about adding a delicious Croissant for $3 more?')) {
         updateCart([{id: 'combo', product: 'Coffee + Croissant Combo', price: 8}]);
       }
    });
  } 
  
  function updateCart(items) {
    croct.track('cartModified', {
      cart: {
        currency: 'USD',
        total: items.reduce((total, {price}) => total + price, 0),
        items: items.map(({id, product, price}, index) => ({
          index: 0,
          total: price,
          quantity: 1,
          product: {
            productId: id,
            name: product,
            displayPrice: price
          }
        })),
      }
    }).then(() => alert('Cart updated!'));
  }
</script> 
```

Go through the following steps to see the tracking and evaluation mechanisms working together:

1. Click on the button labeled _"Show offer"_. Since you have no items in your cart, you should see an alert saying _"No eligible offers"_.
2. Now add an item to the cart by clicking on _"☕ Buy a coffee"_.
3. Click _"Show offers"_ again, and this time you should see a message that says _"How about adding a delicious Croissant for $3 more?"_. Click _"Ok"_ to confirm.
4. Try clicking on _"Show offers"_  again. You should now see the message _"No eligible offers"_ as you have already upgraded to the combo.

Besides the standard events, you can track custom events for analytical purposes. The example below shows how you can 
use custom events to track likes:

```html
<button onclick="like('1234')">
👍 Like
</button>

<script>  
  function like(contentId) {
    croct.track('eventOccurred', {
      name: 'like',
      details: {
        contentId: contentId
      }
    }).then(() => alert('Tracked'));
  }
</script>
```

You can also include additional information that may be useful for your analysis, such as which content the user liked in the previous example.
Check out the API reference for a full list of all currently supported events.

### Identifying users

So far, all the examples we have seen involve anonymous users only. Suppose your application allows users to 
create accounts. In that case, the SDK provides a way to identify users using the same identifier as you use internally 
to assemble cross-channel data into a unified customer view.

The following example covers the steps to identify, retrieve identifiers, and anonymize users:

```html

<button onclick="identify()">
Identify
</button>

<button onclick="getUserId()">
Get user ID
</button>

<button onclick="anonymize()">
Anonymize
</button>

<script>  
  function identify() {
    croct.identify(prompt('Please enter your ID:'));
  }

  function getUserId() {
    alert(croct.getUserId());
  }
  
  function anonymize() {
    croct.anonymize();
  }
</script> 
```

When you identify a user, the personalization engine automatically takes care of unifying the sessions and 
migrating the information from the anonymous profile to the identified profile.

> Never use guessable attributes as an identifier, such as email, phone, or incremental IDs. Instead, 
> we strongly recommend using a cryptographically-secure UUID v4 generator.

## Troubleshooting

TBD

## API Reference

TBD


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
