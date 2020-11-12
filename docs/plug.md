# Plug API Reference

This reference documents all methods available in the Plug API and explains in detail how these methods work.

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

| Option                | Required       | Default Value         | Description
|-----------------------|----------------|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
| `appId`                 | depends      | none                  | The ID of the application you set up on Croct. This option is required unless you have loaded the SDK using a HTML snippet that already specifies the application ID.
| `debug`                 | no           | false                 | If `true`, turns on debug mode, which logs helpful messages to the console.
| `track`                 | no           | true                  | If `true`, enables the automatic event tracking on initialization.
| `token`                 | no           | none                  | The JWT token issued by Croct. If `null`, clears any token specified on previous calls.
| `userId`                | no           | none                  | The ID of the user logged into the application. Internally, the SDK will issue a token using the specified ID as the subject claim of the token. The `token` and `userId` options are mutually exclusive.
| `tokenScope`            | no           | global                | Defines how the SDK should synchronize the token across multiple tabs, see [token scopes](#token-scopes) for more details.
| `eventMetadata`         | no           | none                  | Any additional information that may be useful to include as part of the event metadata. A common use case is to record the version of the application for future reference.
| `logger`                | no           | none                  | A custom logger to handle log messages. By default, all logs are suppressed.
| `trackerEndpointUrl`    | no           | none                  | The URL of the tracker service, used by Croct's development team for testing purposes.
| `evaluationEndpointUrl` | no           | none                  | The URL of the evaluation service, used by Croct's development team for testing purposes.
| `bootstrapEndpointUrl`  | no           | none                  | The URL of the bootstrap service, used by Croct's development team for testing purposes.

### Token scopes

The token scope determines how the SDK synchronize the token across multiple tabs to match your application's behaviour.

> **Notice**  
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

The contextual scope is similar to the isolated except that new tabs inherit the user identification from 
the last viewed tab.
 
You should consider using this scope if your application allows users to access multiple accounts simultaneously 
in different tabs. This behavior resembles how Gmail works: if you are logged in with an account and open a link, 
the user remains the same as the origin page.

### Code Sample

Here's a minimal example showing how to initialize the SDK:

```js
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

The return is a promise to wait until all resources are released.

## identify

This method identifiers the user through a unique identifier.
 
The SDK will automatically emit `userSignedOut` and `userSignedIn` events when the user identity changes. Also, 
changing the user in the course of a session will cause the current session to end and a new one to start.
 
Notice that calling this method will issue a new token regardless of whether the specified ID is the same as the current one.

### Signature

The `identify` method has the following signature:

```ts
croct.identify(userId: string): void
```

## anonymize

This method resets the ID of the currently identified user.
 
Calling this method will not produce any effect or errors when the user is already anonymous.
 
The SDK will automatically emit `userSignedOut` and `userSignedIn` events when the user identity changes. Also, since the user identity changes, the current session will end, and a new one will start.

### Signature

This `anonymize` method has the following signature:

```ts
croct.anonymize(): void
```

## setToken

This method replaces any existing token with a new one.
 
The token must be a valid JWT token issued by the Croct authentication service.
 
The SDK will automatically emit `userSignedOut` and `userSignedIn` events when the user identity changes. Also, 
changing the user in the course of a session will cause the current session to end and a new one to start.
 
Note that passing `null` as the token will have the same effect as calling the `unsetToken` method.

### Signature

This `setToken` method has the following signature:

```ts
croct.setToken(token: string|null): void
```

## unsetToken

This method clears any existing token.
 
Calling this method will not produce any effect or errors when no token exists.
 
The SDK will automatically emit `userSignedOut` and `userSignedIn` events when the user identity changes. Also, 
since the user identity changes, the current session will end, and a new one will start.

### Signature

The `unsetToken` method has the following signature:

```ts
croct.unsetToken(): void
```

## getUserId

This method gets the ID of the currently identified user.
 
If you just want to check whether the user is anonymous, you can use the `isAnonymous` method instead.

### Signature

The `getUserId` method has the following signature:

```ts
croct.getUserId(): string|null
```

This method returns the ID that identifies the user or null if the user is anonymous

## isAnonymous

This method checks whether the current user is anonymous.

### Signature

The `isAnonymous` method has the following signature:

```ts
croct.isAnonymous(): boolean
```

This method returns `true` if the user is anonymous, `false` otherwise.

## evaluate

This method evaluates an expression written in CQL.

Check out our [quick start guide](quick-start.md) for an introduction to what is CQL and how it works.

> **Notice**  
> Currently, we impose a hard limit of 300 character on the length of expression.  
> We plan to remove this limitation in the near future.

### Signature

The `evaluation` method has the following signature:

```ts
croct.evaluate(expression: string, options?: EvaluationOptions): Promise<JsonResult>
```

These are the currently supported options:

| Option       | Type   | Description                                                                                                                                                                                                                                           |
|--------------|--------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `timeout`    | number | The maximum evaluation time in milliseconds. Once reached, the evaluator will abort the evaluator and reject the promise with a timeout error.                                                                                                        |
| `attributes` | JSON   | This option represents a map of attributes to inject in the evaluation context. For example, passing the attributes `{cities: ['New York', 'San Francisco']}` you can reference them in expressions like `context's cities include location's city`.  |

The return is a promise that resolves to the evaluation result.

### Code Sample

Here's a minimal example showing how evaluate an expression:

```js
croct.evaluate('session is starting').then(console.log);
```

## track

This method records actions your users perform on your application.

For a list of available events, see the [event reference](events.md).

### Signature

The `track` method has the following signature:

```ts
croct.track(event: string, payload: EventPayload): Promise<Event>
```

The return is a promise that resolves to the tracked event after successful transmission.

### Code Sample

Here's a minimal example showing how track an event:

```js
croct.track('goalCompleted', {goalId: 'newsletter-sign-up'});
```

## user

This property holds a reference to the user facade.

Please refer to the [User API reference](user.md) for more details.

### Code Sample

Here's a minimal example showing how to edit a user profile:

```js
croct.user.edit()
  .add('interests', 'JavaScript')
  .save()
```

## session

This property holds a reference to the session facade.

Please refer to the [Session API reference](session.md) for more details.

### Code Sample

Here's a minimal example showing how to edit a user profile:

```js
croct.session.edit()
  .set('plan', 'starter')
  .save()
```
