# User API Reference

This reference documents all methods available in the User API and explains in detail how these methods work.

## isAnonymous

This method checks whether the user is anonymous.

If you want to check if the user is identified, consider using the [`isIdentified`](#isidentified) method instead of 
negating the result.

### Signature

The `isAnonymous` method has the following signature:

```ts
croct.user.isAnonymous(): boolean
```

This method returns `true` if the user is anonymous, `false` otherwise.

## isIdentified

This method checks whether the user is identified.

If you want to check if the user is anonymous, consider using the [`isAnonymous`](#isanonymous) method instead of 
negating the result.

### Signature

The `isIdentified` method has the following signature:

```ts
croct.user.isIdentified(): boolean
```

This method returns `true` if the user is identified, `false` otherwise.

## edit

This method creates a patch to apply changes to the user's profile.

### Signature

The `edit` method has the following signature:

```ts
croct.user.edit(): Patch
```

The return is a patch for specifying the sequence of operations to apply to the user's profile.
See the [patch documentation](patch.md) for more details. 

### Code Sample

Here's a minimal example showing how to edit a user profile:

```js
croct.user.edit()
  .add('interests', 'JavaScript')
  .save()
```
