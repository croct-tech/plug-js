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

The following restrictions apply to custom attributes:

- Each profile allows up to 10 custom attributes
- Attribute names should be strings up to 20 characters long, starting with a letter or underscore and optionally 
followed by letters, digits, or underscores
- Attributes can be primitives (strings, numbers, booleans, and null) or composites (lists and maps).
- Strings should be up to 100 characters long
- Lists can contain up to 30 elements, including primitives, lists of primitives, or maps of primitives
- Maps can contain up to 30 elements, including primitives, lists of primitives, or maps of primitives
- Map keys should be strings up to 50 characters long
 
We recommend using descriptive names in camel case, like `pets`, `favoriteColor` and, `loyaltyNumber`.  Following these
recommendations will make your custom attributes look like the standard ones, which results in queries with better 
readability.

Notice that the attribute names are case-insensitive, meaning both `loyaltyNumber` and `loyaltynumber` refer to the same 
attribute and could ultimately override each other. 

### Signature

The `edit` method has the following signature:

```ts
croct.user.edit(): Patch
```

The return is a patch for specifying the sequence of operations to apply to the user's profile.
Calling save on the patch will return a [Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) 
that resolves to the `userProfileChanged` event after successful transmission.

Refer to the [patch documentation](patch.md) for more details on how patching works.

### Code Sample

Here's a minimal example showing how to edit a user profile:

```js
croct.user.edit()
  .set('company', 'Croct')
  .add('interests', 'JavaScript')
  .add('custom.pets', 'crocodile')
  .save()
```
