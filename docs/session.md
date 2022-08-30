# Session API Reference

This reference documents all methods available in the Session API and explains in detail how these methods work.

## Index

- [edit](#edit)

## edit

This method creates a patch to apply changes to the session attributes.

The following restrictions apply to session attributes:

- Each session allows up to 10 custom attributes
- Attribute names should be strings up to 20 characters long, starting with a letter or underscore and optionally 
followed by letters, digits, or underscores
- Attributes can be primitives (strings, numbers, booleans, and null) or composites (lists and maps).
- Strings should be up to 100 characters long
- Lists can contain up to 30 elements, including primitives, lists of primitives, or maps of primitives
- Maps can contain up to 30 elements, including primitives, lists of primitives, or maps of primitives
- Map keys should be strings up to 50 characters long

We recommend using descriptive names in camel case, like `plan`, `recommendPlan` and, `pickedPlan`.  Following these
recommendations will make your attributes look like the standard ones, which results in queries with better readability.

Notice that the attribute names are case-insensitive, meaning both `recommendPlan` and `recommendplan` refer to the same 
attribute and could ultimately override each other. 

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
