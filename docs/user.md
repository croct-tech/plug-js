# User API Reference

This reference documents all methods available in the User API and explains in detail how these methods work.

## Index

- [isAnonymous](#isanonymous)
- [isIdentified](#isidentified)
- [edit](#edit)

## isAnonymous

This method checks whether the user is anonymous.

If you want to check if the user is identified, consider using the [`isIdentified`](#isidentified) instead.

### Signature

The `isAnonymous` method has the following signature:

```ts
croct.user.isAnonymous(): boolean
```

This method returns `true` if the user is anonymous, `false` otherwise.

## isIdentified

This method checks whether the user is identified.

If you want to check if the user is anonymous, consider using the [`isAnonymous`](#isanonymous) method instead.

### Signature

The `isIdentified` method has the following signature:

```ts
croct.user.isIdentified(): boolean
```

This method returns `true` if the user is identified, `false` otherwise.

## edit

This method creates a patch to apply changes to the user's profile.

> **Notice**  
> Patches are atomic, meaning either all operations are applied, or none are.

These are the currently supported attributes:

Variable            | Type     | Description
--------------------|----------|-------------------------------------------------------------
`firstName`         | `string` | The first name
`lastName`          | `string` | The last name
`birthDate`         | `string` | The birth date in the form of `YYYY-MM-DD`
`gender`            | `string` | The gender, must be either `male`, `female` or `neutral`
`email`             | `string` | The email address
`alternateEmail`    | `string` | The alternate email address
`phone`             | `string` | The phone number
`alternatePhone`    | `string` | The alternate phone number
`address`           | `object` | The personal address
`address.street`    | `string` | The street name
`address.district`  | `object` | The district name
`address.city`      | `object` | The city name
`address.region`    | `object` | The region or state name
`address.country`   | `object` | The country name
`address.country`   | `object` | The postal code
`avatar`            | `string` | The personal avatar URL
`company`           | `string` | The company name
`companyUrl`        | `string` | The company website URL
`jobTitle`          | `string` | The job title
`interests`         | `array`  | The set of unique interests
`activities`        | `array`  | The set of unique activities
`custom.*`          | `object` | The custom attributes

### Signature

The `edit` method has the following signature:

```ts
croct.user.edit(): Patch
```

The return is a patch for specifying the sequence of operations to apply to the user's profile.
Calling save on the patch will return a promise that resolves to the `userProfileChanged` event 
after successful transmission.

See the [patch documentation](patch.md) for more details. 

### Code Sample

Here's a minimal example showing how to edit a user profile:

```js
croct.user.edit()
  .set('company', 'Croct')
  .add('interests', 'JavaScript')
  .set('custom.favoriteColor', 'green')
  .save()
```
