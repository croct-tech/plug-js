# Session API Reference

This reference documents all methods available in the Session API and explains in detail how these methods work.

## Index

- [edit](#edit)

## edit

This method creates a patch to apply changes to the session attributes.

> **Notice**  
> Patches are atomic, meaning either all operations are applied, or none are.

### Signature

The `edit` method has the following signature:

```ts
croct.session.edit(): Patch
```

The return is a patch for specifying the sequence of operations to apply to the session.
Calling save on the patch will return a [Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) 
that resolves to the `sessionAttributesChanged` event after successful transmission.

Refer to the [patch documentation](patch.md) for more details on how patching works.

### Code Sample

Here's a minimal example showing how to edit session attributes:

```js
croct.session.edit()
  .set('plan', 'starter')
  .save()
```
