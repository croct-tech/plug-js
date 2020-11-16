# Quick Start Guide

Welcome to the beginner's guide to Croct SDK for JavaScript.

This guide aims to introduce the SDK's main features and explain how you can use the 
[playground](https://play.croct.com) to assist you in developing new personalization features.

Although some JavaScript knowledge will make following along easier, this guide is well suited even for non-developers.

Let's start!

## Table of Contents

- [Introduction](#introduction)
- [Setting up](#setting-up)
- [Evaluating Expressions](#evaluating-expressions)
  * [Evaluating Expressions on the Playground](#evaluating-expressions-on-the-playground)
  * [Evaluating Expressions Programmatically](#evaluating-expressions-programmatically)
- [Collecting Information](#collecting-information)
  * [Enriching Profiles](#enriching-profiles)
  * [Enriching Sessions](#enriching-sessions)
- [Tracking Events](#tracking-events)
- [Identifying Users](#identifying-users)

## Introduction

You may have already experienced a situation where someone from the marketing or product team wanted to provide a 
personalized experience for a particular audience, but that never got off the ground because it turned out to be 
much more complicated than expected.

That was the spark for creating the Contextual Query Language (CQL), an English-based language designed to abstract 
away from marketing, product, and development teams the complexities behind delivering personalized experiences online.

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
for you, such as managing permissions and selecting the best location source in the previous example.

Plus, it opens up new horizons for connecting 3rd party data providers to your personalization data layer:

```
# Score synchronized with your CRM
user's score

# Verified using your anti-fraud solution of choice
user is a fraud
```

Things get even more interesting when you realize that you can use the same context to run machine learning models 
in real-time. We are working to support AI-powered evaluations like the following:

```
# It doesn't seem as complex as designing, training, and running ML models, does it?
user is churning
```

Because it is textual, you can use the same expression everywhere: straight in the code, playground, WordPress, 
or any other platform integrated with Croct.

In the next sections, we will explore how we can use CQL to craft personalized user journeys that inspire long-term, 
value-driven customer relationships.

## Setting Up

> For convenience, we will use CodePen for playing with the examples provided throughout this guide.

Follow the steps below to connect the playground with CodePen:

1. [Open the playground](http://play.croct.com/)
2. Click on the _"Don't have an API Key?"_ link to proceed in sandbox mode
3. Enter the URL `https://codepen.io/pen`
4. Click on _"Let's play!"_
5. Finally, click on the button labeled _"codepen.io/pen"_ at the top right of the page

After the page loads, you should notice an indication on the playground tab that you have an unseen notification.
Switching back to the playground tab, you should see a notification saying _"Connection established"_ that indicates 
the playground is now connected to the CodePen editor. 

> In real cases, you will use an API key to connect to your production application. You can also use a development URL, 
> such as `https://testing.myapp.com` or `https://localhost/myapp`.

Now, let's get our hands dirty and play around with CQL!

## Evaluating Expressions

The next sections show how you can evaluate CQL expressions using the playground or directly in the code.

### Evaluating Expressions on the Playground

To evaluate an expression on the playground, just type the expression in the editor and click the "Evaluate" button.
 
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

### Evaluating Expressions Programmatically

One of the coolest things about CQL is that you can programmatically evaluate expressions using the same expressions 
written in plain English.

Let's go back to the CodePen editor to evaluate our first expression programmatically. In our first example, 
we are going to greet a visitor depending on whether it is the first time accessing your application or not.

Simply copy the code below and paste into the HTML panel to see it in action:

```html
<script>  
  croct.evaluate(`user is returning`)
    .then(returning => alert(returning ? 'Welcome back!' : 'Welcome!')); 
</script>
```

After CodePen updates the preview, you should see an alert saying _"Welcome!"_ or _"Welcome back!"_ depending on whether 
it is your first time playing around with CQL on CodePen.

Note that you are not limited to boolean expressions only. For example, let's update the example again to show 
how many sessions you have had:

```html
<script>  
  croct.evaluate(`user's stats' sessions`)
    .then(count => alert(`Visits: ${count}`));
</script>
```

The [`croct.evaluate`](docs/plug.md#evaluate) method returns a [Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) 
that resolves to the evaluation result. The second argument, omitted for the sake of simplicity, allows passing 
evaluation options, like variables and timeout. For all options, refer to the [Evaluation API reference](docs/evaluator.md#evaluate).

## Collecting Information

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
> values entered in fields. We have [open-sourced the SDK](https://github.com/croct-tech/sdk-js) as an effort to bring 
> more transparency about data collection.

In addition to the information collected automatically, you can also enrich profiles and sessions with relevant 
information to personalize your product or offer progressively, as we will see on the next sections.

### Enriching Profiles

Let's update our example and see how we can enrich user profiles to expand your personalization capabilities:

```html
<button onclick="askBirthDate()">Ask my birth date</button>

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

Now, let's break this example down a little and understand what's going on. First, we introduce a button to call the 
function `askBirthDate`. We then store the birth date answered in the variable `birthDate` and finally enrich the 
visitor's profile with that information.

> Note that you did not have to provide an ID to persist information about the anonymous user because the SDK took care 
of that for you.

We can now show the visitor's age based on the entered birth date:

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

Now, click on _"Ask my birth date"_, enter your birth date and then click on _"Show my age"_, and you should see
your age.

### Enriching Sessions

While working with personalization, it is common to collect session-specific information for evaluation or 
analysis purposes. For such cases, the SDK provides a way to store data that remains available for evaluation only for 
the session's duration.

In the following example, we will implement a way to understand the user's doubts. We can then use this information to 
display content that helps answer those questions along the journey.

After updating the code on CodePen with the code below, you should see something that resembles an FAQ: 

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

Try clicking on the buttons and questions, and you will see that the answer will change according to the questions you 
have expanded. We could use a similar approach to personalize elements of the application to clarify those questions.

## Tracking Events

Events are the fuel of personalization engines. It serves two primary purposes: recording facts for path analysis and 
feeding the evaluation data layer. As already mentioned, the SDK automatically collects general-purpose events for you, 
such as viewed pages and idle periods, to name a few. For non-generic events, it is up to decide which events can 
benefit your application.
 
The following example demonstrates how the personalization engine uses events to enrich the evaluation context.
Back on CodePen, update the code with the next example:

```html
<button onclick="updateCart([{id: 'coffee', product: 'Coffee', price: 5}])">
  ☕ Buy a coffee
</button>

<br /><br />

<button onclick="showOffers()">Show offers</button>
<button onclick="updateCart([])">Clear cart</button>

<script>  
  function showOffers() {
    // @todo allow quantifiers at the end of the expression (greedily)
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

Once the example loads, follow the steps below to see how the tracking and evaluation mechanisms work together:

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
Check out the [documentation](docs/events.md#eventoccurred) for more details.

## Identifying Users

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
