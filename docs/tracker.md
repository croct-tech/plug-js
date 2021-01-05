# Tracker API Reference

This reference documents all methods available in the Tracker API and explains in detail how these methods work.

## track

This method records actions your users perform on your application.

For a list of available events, see the [event reference](events.md).

### Signature

The `track` method has the following signature:

```ts
croct.tracker.track(event: string, payload: EventPayload): Promise<Event>
```

The return is a [Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) that 
resolves to the tracked event after successful transmission.

### Code Sample

Here's a minimal example showing how track an event:

```js
croct.tracker.track('goalCompleted', {goalId: 'newsletter-sign-up'});
```

## enable

This method enables automatic event tracking.

### Signature

The `enable` method has the following signature:

```ts
croct.tracker.enable(): void
```

### Code Sample

Here's an example showing how to enable automatic event tracking:

```js
croct.tracker.enable();
```

## disable

This method disables automatic event tracking.

> 💡️ **Hint**  
> You can still track events by calling the [`track`](#track) method even with automatic event tracking disabled.

### Signature

The `disable` method has the following signature:

```ts
croct.tracker.disable(): void
```

### Code Sample

Here's an example showing how to disable automatic event tracking:

```js
croct.tracker.disable();
```
