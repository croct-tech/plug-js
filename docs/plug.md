# Plug API Reference

This reference documents all methods and properties available in the Plug API and explains in detail how they work.

# Index

- [plug](#plug)
- [unplug](#unplug)
- [identify](#identify)
- [anonymize](#anonymize)
- [setToken](#settoken)
- [unsetToken](#unsettoken)
- [getUserId](#getuserid)
- [isAnonymous](#isanonymous)
- [evaluate](#evaluate)
- [fetch](#fetch)
- [track](#track)
- [user](#user)
- [session](#session)

## plug

This method initializes the SDK according to the provided options.
 
You should initialize the SDK only once in the application, usually on the application startup. 
Subsequent calls to this method will fail without reporting errors. 

To reconfigure the plug, you can call the [`unplug`](#unplug) method to reset the SDK to its initial state 
before initializing it with the new configuration.

### Signature

The `plug` method has the following signature:

```ts
croct.plug(configuration?: Configuration): void
```
 
These are the currently supported options:

| Option                  | Type         | Required | Default Value | Description                                                                                                                                                                                               |
|-------------------------|--------------|----------|---------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `appId`                 | string       | Depends  | None          | The ID of the application you set up on Croct. This option is required unless you have loaded the SDK using a HTML snippet that already specifies the application ID.                                     |
| `debug`                 | boolean      | No       | `false`       | If `true`, turns on debug mode, which logs helpful messages to the console. See [Testing](testing.md#debug-mode) for more details.                                                                        |
| `test`                  | boolean      | No       | `false`       | If `true`, enables the test mode. See [Testing](testing.md#test-mode) for more details.                                                                                                                   |
| `track`                 | boolean      | No       | `true`        | If `true`, enables the automatic event tracking on initialization.                                                                                                                                        |
| `token`                 | string\|null | No       | None          | The JWT token issued by Croct. If `null`, clears any token specified on previous calls.                                                                                                                   |
| `userId`                | string       | No       | None          | The ID of the user logged into the application. Internally, the SDK will issue a token using the specified ID as the subject claim of the token. The `token` and `userId` options are mutually exclusive. |
| `tokenScope`            | string       | No       | `global`      | Defines how the SDK should synchronize the token across multiple tabs, see [token scopes](#token-scopes) for more details.                                                                                |
| `eventMetadata`         | JSON         | No       | None          | Any additional information that may be useful to include as part of the event metadata. A common use case is to record the version of the application for future reference.                               |
| `logger`                | object       | No       | None          | A custom logger to handle log messages. By default, all logs are suppressed.                                                                                                                              |
| `urlSanitizer`          | function     | No       | None          | A function to sanitize URLs that allows removing sensitive information from URLs, such as tokens, that should not be sent to the platform.                                                                |
| `trackerEndpointUrl`    | string       | No       | None          | The URL of the tracker service, used by Croct's development team for testing purposes.                                                                                                                    |
| `evaluationEndpointUrl` | string       | No       | None          | The URL of the evaluation service, used by Croct's development team for testing purposes.                                                                                                                 |
| `bootstrapEndpointUrl`  | string       | No       | None          | The URL of the bootstrap service, used by Croct's development team for testing purposes.                                                                                                                  |

### Token scopes

The token scope determines how the SDK synchronize the token across multiple tabs to match your application's behaviour.

> ℹ️️ **Note**  
> Although the SDK supports multiple identified users in different tabs, such separation does not apply 
> to anonymous users. For the SDK, there is only one anonymous user per browser, regardless of the scope.

#### Global scope 

An application is said to have a global user scope if it supports only one user at a time, in contrast to applications 
that allow you to switch between multiple accounts in the same session.

In practice, as all tabs share the same scope, it means that if you identify or anonymize a user on one tab, 
it will reflect on all other tabs.


#### Isolated scope

The isolated scope inhibits the synchronization of tokens between tabs. You should use an isolated scope if your 
application does not keep users signed in across multiple tabs.

#### Contextual

The contextual scope is similar to the isolated except that new tabs keep the user identification from 
the last viewed tab.
 
You should consider using this scope if your application allows users to access multiple accounts simultaneously 
in different tabs. This behavior resembles how Gmail works: if you are logged in with an account and open a link, 
the user remains the same as the origin page.

### Code Sample

Here's a minimal example showing how to initialize the SDK:

```ts
croct.plug({appId: '00000000-0000-0000-0000-000000000000'});
```

## unplug

This method releases managed resources and resets the SDK to its initial state.
 
Calling this method on an uninitialized SDK instance will not have any effect.

### Signature

The `unplug` method has the following signature:

```ts
croct.unplug(): Promise<void>
```

The return is a [Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) to 
wait until all resources are released.

## identify

This method identifiers the user through a unique identifier.
 
The SDK will automatically emit `userSignedOut` and `userSignedIn` events when the user identity changes. Also, 
changing the user in the course of a session will cause the current session to end and a new one to start.
 
Calling this method will issue a new token regardless of whether the specified ID is the same as the current one.

### Signature

The `identify` method has the following signature:

```ts
croct.identify(userId: string): void
```

## anonymize

This method clears the ID of the currently identified user.
 
The SDK will automatically emit a `userSignedOut` event. Also, changing the user in the course of a session 
will cause the current session to end and a new one to start.

Calling this method will not produce any effect or errors when the user is already anonymous.

### Signature

This `anonymize` method has the following signature:

```ts
croct.anonymize(): void
```

## setToken

This method replaces any existing token with a new one.
 
The token must be a valid JWT token issued by the Croct authentication service.

Passing `null` as the token will have the same effect as calling the [`unsetToken`](#unsettoken) method.

### Signature

This `setToken` method has the following signature:

```ts
croct.setToken(token: string | null): void
```

## unsetToken

This method clears any existing token.
 
The SDK will automatically emit a `userSignedOut` event. Also, changing the user in the course of a session 
will cause the current session to end and a new one to start.

Calling this method will not produce any effect or errors when no token exists.

### Signature

The `unsetToken` method has the following signature:

```ts
croct.unsetToken(): void
```

## getUserId

This method gets the ID of the currently identified user.
 
If you just want to check whether the user is anonymous, consider using the [`isAnonymous`](#isanonymous) method instead.

### Signature

The `getUserId` method has the following signature:

```ts
croct.getUserId(): string | null
```

This method returns the ID that identifies the user or `null` if the user is anonymous

## isAnonymous

This method checks whether the current user is anonymous.

### Signature

The `isAnonymous` method has the following signature:

```ts
croct.isAnonymous(): boolean
```

This method returns `true` if the user is anonymous, `false` otherwise.

## evaluate

This method evaluates a query written in CQL.

Check out our [quick start guide](quick-start.md) for an introduction to what is CQL and how it works.

> ℹ️️ **Note**  
> We currently impose a hard limit of 500 characters on the length of query.
> We plan to remove this limitation in the near future.

### Signature

The `evaluation` method has the following signature:

```ts
croct.evaluate(query: string, options?: EvaluationOptions): Promise<JsonResult>
```

These are the currently supported options:

| Option       | Type   | Description                                                                                                                                                                                                                           |
|--------------|--------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `timeout`    | number | The maximum evaluation time in milliseconds. Once reached, the evaluator will abort the evaluation and reject the promise with a timeout error.                                                                                       |
| `attributes` | JSON   | The map of attributes to inject in the evaluation context. For example, passing the attributes `{cities: ['New York', 'San Francisco']}` will allow you to reference them in queries like `context's cities include location's city`. |

The return is a [Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) that 
resolves to the evaluation result.

### Code Sample

Here's a minimal example showing how evaluate a query:

```ts
croct.evaluate('session is starting').then(console.log);
```

## fetch

This method fetches the content for a slot.

### Signature

The `fetch` method has the following signature:

```ts
croct.fetch(id: string, options?: FetchOptions): Promise<{content: JsonObject}>
```

You can specify the version of the slot by passing a versioned ID in the form `id@version`. For example,
passing `home-banner@1` will fetch the content for the `home-banner` slot in version 1. Not specifying a
version number is the same as passing `home-banner@latest`, which will load the latest version of the slot.

> ✅ **Best practice**  
> It's strongly recommended to specify a slot version for production deployments. 
> That way, you ensure the front end will always receive content with the expected 
> schema while your team can freely evolve the content's schema in parallel.

These are the currently supported options:

| Option            | Type   | Description                                                                                                                                                                                                                           |
|-------------------|--------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `preferredLocale` | string | The preferred locale for the content. If not specified, the default locale will be used.                                                                                                                                              |
| `attributes`      | JSON   | The map of attributes to inject in the evaluation context. For example, passing the attributes `{cities: ['New York', 'San Francisco']}` will allow you to reference them in queries like `context's cities include location's city`. |
| `timeout`         | number | The maximum evaluation time in milliseconds. Once reached, the plug will abort the fetch and reject the promise with a timeout error.                                                                                                 |

A slot represents a personalizable element of the interface. Each slot has a predefined structure whose content may vary 
according to a personalization strategy. 

The return is a [Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) that 
resolves to the slot content in the format as follows:

```ts
{
    content: {[key: string]: JsonValue},
}
```

It is common for your slot structure to change over time. To provide a smooth workflow and ensure your application 
won't break during new releases, we've introduced the concept of slot versioning.

Our versioning system automatically increments the slot version number whenever you make a backward-incompatible change. 
For example, if you add a new field to the slot structure, the version number increases by one. When your application 
requests content, we take the requested slot version and return the latest available compatible content. 

To take advantage of this feature, make sure to specify the slot version when requesting content:

```ts
croct.fetch('my-slot', {version: '1'});
```

### Code Sample

The following example assumes that a slot with ID `home-banner` and the following schema exists:

```ts
type HomeBanner = {
    title: string,
    subtitle: string,
    image: string,
    cta: {
        text: string,
        href: string,
    }
}
```

Here's a minimal example showing how to fetch the content for the slot `home-banner`:

```ts
croct.fetch('home-banner').then(console.log);
```

In this example, you should see the following output:

```json
{
    "content": {
        "title": "Unlock the Power of Personalization",
        "subtitle": "Dive into the world of one-to-one engagement.",
        "image": "https://croct.com/signup.png",
        "cta": {
            "text": "Try Croct now",
            "href": "/signup"
        }
    }
}
```

#### 💡 ProTip

You can specify the type of slot content in the method call to strongly type the promise's result:

```ts
croct.fetch<HomeBanner>('home-hero').then(console.log);
```

You can also declare the type of all available slots in a declaration file using module augmentation for an even more 
robust solution:

```ts
// slots.d.ts
declare module '@croct/plug/slot' {
    interface SlotMap {
        'home-banner': HomeBanner;
    }
}

export {};
```

If you use an IDE with Typescript code completion support, you will get autocomplete suggestions for 
slot IDs and content properties as a bonus:

![Autocomplete](https://user-images.githubusercontent.com/943036/110214204-54e3de00-7e82-11eb-82d1-f25264c3865b.gif)

## track

This method records actions your users perform on your application.

For a list of available events, see the [event reference](events.md).

### Signature

The `track` method has the following signature:

```ts
croct.track(event: string, payload: EventPayload): Promise<Event>
```

The return is a [Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) that 
resolves to the tracked event after successful transmission.

### Code Sample

Here's a minimal example showing how track an event:

```ts
croct.track('goalCompleted', {goalId: 'newsletter-sign-up'});
```

## user

This property holds a reference to the user facade.

Please refer to the [User API reference](user.md) for more details.

### Code Sample

Here's a minimal example showing how to edit a user profile:

```ts
croct.user.edit()
  .add('interests', 'JavaScript')
  .save()
```

## session

This property holds a reference to the session facade.

Please refer to the [Session API reference](session.md) for more details.

### Code Sample

Here's a minimal example showing how to edit a user profile:

```ts
croct.session.edit()
  .set('plan', 'starter')
  .save()
```
