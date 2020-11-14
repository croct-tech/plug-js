# Events

Events tell the story of what happened during a user's journey. Besides helping understand how a user interacts 
with your application, these events also provide data to enrich the evaluation context and refine the models that 
continuously improve user experience.

The SDK tracks most of the general-purpose events automatically for you. All other events depend on your use case, so 
it is up to you to decide which events make sense for your application.

## Summary

There are several event types that you can record within the customer journey:

| Event                      | Category      | Auto tracking | Description                           |
|----------------------------|---------------|---------------|---------------------------------------|
| `userSignedUp`             | User          | No            | Records a user sign up.               |
| `userSignedIn`             | User          | Yes           | Records a user sign in.               |
| `userSignedOut`            | User          | Yes           | Records a user sign out.              |
| `userProfileChanged`       | User          | Yes           | Records user profile changes.         |
| `tabOpened`                | Web           | Yes           | Records a tab open.                   |
| `tabUrlChanged`            | Web           | Yes           | Records a tab's URL change.           |
| `tabVisibilityChanged`     | Web           | Yes           | Records a tab visibility change.      |
| `pageOpened`               | Web           | Yes           | Records a page open.                  |
| `pageLoaded`               | Web           | Yes           | Records a page load.                  |
| `productViewed`            | E-commerce    | No            | Records a product view.               |
| `cartViewed`               | E-commerce    | No            | Records a cart view.                  |
| `checkoutStarted`          | E-commerce    | No            | Records a checkout start.             |
| `orderPlaced`              | E-commerce    | No            | Records a placed order.               |
| `goalCompleted`            | Analytics     | No            | Records a goal completion.            |
| `testGroupAssigned`        | Analytics     | No            | Records a test group assignment.      |
| `sessionAttributesChanged` | Miscellaneous | Yes           | Records session's attributes changes. |
| `nothingChanged`           | Miscellaneous | Yes           | Records a period of inactivity.       |
| `eventOccurred`            | Miscellaneous | No            | Records a custom event.               |

## Events

### User Events

The User category has the following events:

#### userSignedUp

This event records that a user has signed up.

You should track this event when a user signs up for your application.

If the user profile does not exist, the engine will create a new one with the provided information. 
This event does not affect existing profiles.

For the personalization engine, the semantics of this event does not encompass the 
[`userSignedIn`](#usersignedin) event. If your application automatically signs in users after registration, make sure 
to call the [`identify`](plug.md#identify) method after the sign-up.

##### Properties

This event supports the following properties:

| Property                     | Type     | Constraints                              | Required | Description
|------------------------------|----------|------------------------------------------|----------|----------------------------------
| `userId`                     | `string` | 1 and 254 chars                          | Yes      | The user ID.
| `profile`                    | `object` | JSON object                              | No       | The user profile.
| `profile.firstName`          | `String` | 1 to 50 chars                            | No       | The first name.
| `profile.lastName`           | `String` | 1 to 50 chars                            | No       | The last name.
| `profile.birthDate`          | `String` | A valid date in the form `YYYY-MM-DD`    | No       | The birth date.
| `profile.gender`             | `String` | `male`, `female`, `neutral` or `unknown` | No       | The gender.
| `profile.email`              | `String` | 1 to 254 chars                           | No       | The email address.
| `profile.alternateEmail`     | `String` | 1 to 254 chars                           | No       | The alternate email address.
| `profile.phone`              | `String` | 1 to 30 chars                            | No       | The phone number.
| `profile.alternatePhone`     | `String` | 1 to 30 chars                            | No       | The alternate phone number.
| `profile.address`            | `object` | JSON object                              | No       | The user address.
| `profile.address.street`     | `String` | 1 to 100 chars                           | No       | The street.
| `profile.address.district`   | `String` | 1 to 100 chars                           | No       | The district.
| `profile.address.city`       | `String` | 1 to 100 chars                           | No       | The city.
| `profile.address.region`     | `String` | 1 to 100 chars                           | No       | The region.
| `profile.address.country`    | `String` | 1 to 100 chars                           | No       | The country.
| `profile.address.postalCode` | `String` | 1 to 20 chars                            | No       | The postal code.
| `profile.avatar`             | `String` | Well-formed URL                          | No       | The personal avatar URL.
| `profile.company`            | `String` | 1 to 200 chars                           | No       | The company's name.
| `profile.companyUrl`         | `String` | Well-formed URL                          | No       | The company's website URL.
| `profile.jobTitle`           | `String` | 1 to 50 chars                            | No       | The job title.
| `profile.custom`             | `object` | JSON object                              | No       | The map of custom attributes.

##### Code Sample

Here are two examples of how to track this event:

<details>
    <summary>Minimal Example</summary>

```js
croct.track('userSignedUp', {
    userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392'
});
```
</details>

<details>
    <summary>Complete Example</summary>

```js
croct.track('userSignedUp', {
    userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392',
    profile: {
        firstName: 'Carol',
        lastName: 'Doe',
        birthDate: '2000-08-31',
        gender: 'female',
        email: 'carol@croct.com',
        alternateEmail: 'example@croct.com',
        phone: '+15555983800',
        alternatePhone: '+15555983800',
        address: {
             street: '123 Some Street',
             district: 'Kings Oak',
             city: 'San Francisco',
             state: 'California',
             region: 'California',
             country: 'US',
             continent: 'NA'
        },
        avatar: 'http://croct.com/carol.png',
        company: 'Croct',
        companyUrl: 'http://croct.com',
        jobTitle: 'Head of Marketing',
        custom: {
            points: 1,
            favoriteEmoji: '🐊',
        }
    }
});
```
</details>

#### userSignedIn

This event records that a user signed in.

The SDK automatically tracks this event when you call either the [`identify`](plug.md#identify) or 
[`setToken`](plug.md#settoken) method.

#### userSignedOut

This event records that a user signed out.

The SDK automatically tracks this event when you call either the [`anonymize`](plug.md#identify) or 
[`setToken`](plug.md#settoken) method.

#### userProfileChanged

This event records that a user profile changed.

The SDK automatically tracks this event when you call [`save`](patch.md#save) on the patch returned by the 
[`user.edit`](user.md#edit) method.

### Web Events

The Web category has the following events:

#### tabOpened

This event records that a user opened a new tab.

The SDK automatically tracks this event when the user open the application in a new tab.

#### tabUrlChanged

This event records that the tab URL changed.

The SDK automatically tracks this event when the user navigates between pages.

#### tabVisibilityChanged

This event records that the tab visibility changed.

The SDK automatically tracks this event when user minimizes the window or switches to another tab.

#### pageOpened

This event records that a user opened a page.

The SDK automatically tracks this event once per page on the initialization.

#### pageLoaded

This event records that a page finished loading.

The SDK automatically tracks this event when the page has been completely loaded, without waiting for stylesheets or 
images to finish loading.

### E-commerce Events
