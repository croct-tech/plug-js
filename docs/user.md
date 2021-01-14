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

| Attribute            | Type     | Constraints                                       | Description
|----------------------|----------|---------------------------------------------------|-----------------------------------
| `firstName`          | `String` | Between 1 and 50 characters long                  | The first name.
| `lastName`           | `String` | Between 1 and 50 characters long                  | The last name.
| `birthDate`          | `String` | Valid date in the form `YYYY-MM-DD`               | The birth date.
| `gender`             | `String` | Either `male`, `female`, `neutral` or `unknown`   | The gender.
| `email`              | `String` | Between 1 and 254 characters long                 | The email address.
| `alternateEmail`     | `String` | Between 1 and 254 characters long                 | The alternate email address.
| `phone`              | `String` | Between 1 and 30 characters long                  | The phone number.
| `alternatePhone`     | `String` | Between 1 and 30 characters long                  | The alternate phone number.
| `address`            | `object` |                                                   | The user address.
| `address.street`     | `String` | Between 1 and 100 characters long                 | The address' street.
| `address.district`   | `String` | Between 1 and 100 characters long                 | The address' district.
| `address.city`       | `String` | Between 1 and 100 characters long                 | The address' city.
| `address.region`     | `String` | Between 1 and 100 characters long                 | The address' region.
| `address.country`    | `String` | Between 1 and 100 characters long                 | The address' country.
| `address.postalCode` | `String` | Between 1 and 20 characters long                  | The address' postal code.
| `avatar`             | `String` | Well-formed URL                                   | The personal avatar URL.
| `company`            | `String` | Between 1 and 200 characters long                 | The company's name.
| `companyUrl`         | `String` | Well-formed URL                                   | The company's website URL.
| `jobTitle`           | `String` | Between 1 and 50 characters long                  | The job title.
| `interests`          | `array`  | Up to 30 strings between 1 and 30 characters long | The user's interests
| `activities`         | `array`  | Up to 30 strings between 1 and 30 characters long | The user's activities
| `custom.*`           | `object` | Up to 10 attributes                               | The map of custom attributes.

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
