# Events

Events tell the story of what happened during a user's journey. Besides helping understand how a user interacts 
with your application, these events also provide data to enrich the evaluation context and refine the models that 
continuously improve user experience.

The SDK automatically tracks most general-purpose events for you. All other events depend on your 
application's use case, so it is up to you to decide which events make sense for your use case.

## Event Summary

There are several event types that you can record within the customer journey:

| Event                      | Category      | Auto tracking | Description                           |
|----------------------------|---------------|---------------|---------------------------------------|
| `userSignedUp`             | User          | No            | Records a user sign up.               |
| `userSignedIn`             | User          | Yes           | Records a user sign in.               |
| `userSignedOut`            | User          | Yes           | Records a user sign out.              |
| `userProfileChanged`       | User          | Yes           | Records user profile changes.         |
| `pageLoaded`               | Web           | Yes           | Records a page load.                  |
| `pageOpened`               | Web           | Yes           | Records a page open.                  |
| `tabOpened`                | Web           | Yes           | Records a tab open.                   |
| `tabUrlChanged`            | Web           | Yes           | Records a tab's URL change.           |
| `tabVisibilityChanged`     | Web           | Yes           | Records a tab visibility change.      |
| `productViewed`            | E-commerce    | No            | Records a product view.               |
| `cartViewed`               | E-commerce    | No            | Records a cart view.                  |
| `checkoutStarted`          | E-commerce    | No            | Records a checkout start.             |
| `orderPlaced`              | E-commerce    | No            | Records a placed order.               |
| `goalCompleted`            | Analytics     | No            | Records a goal completion.            |
| `testGroupAssigned`        | Analytics     | No            | Records a test group assignment.      |
| `sessionAttributesChanged` | Miscellaneous | Yes           | Records session's attributes changes. |
| `nothingChanged`           | Miscellaneous | Yes           | Records a period of inactivity.       |
| `eventOccurred`            | Miscellaneous | No            | Records a custom event.               |

## Application-triggered events

Below are listed all the events that your application can track, depending on your use case.

### User Signed Up

You should track this event when a user creates an account on your application.

#### Properties

This event supports the following properties:

| Property                     | Type     | Constraints                              | Required | Description
|------------------------------|----------|------------------------------------------|----------|----------------------------------
| `userId`                     | `string` | 1 to 254 chars                           | Yes      | The user's ID
| `profile`                    | `object` |                                          | No       | The user's profile
| `profile.firstName`          | `String` | 1 to 50 chars                            | No       | The first name
| `profile.lastName`           | `String` | 1 to 50 chars                            | No       | The last name
| `profile.birthDate`          | `String` | Date format                              | No       | The birth date in `YYYY-MM-DD` format
| `profile.gender`             | `String` | `male`, `female`, `neutral` or `unknown` | No       | The gender
| `profile.email`              | `String` | 1 to 254 chars                           | No       | The email address
| `profile.alternateEmail`     | `String` | 1 to 254 chars                           | No       | The alternate email address
| `profile.phone`              | `String` | 1 to 30 chars                            | No       | The phone number
| `profile.alternatePhone`     | `String` | 1 to 30 chars                            | No       | The alternate phone number
| `profile.address`            | `object` |                                          | No       | The user's address.
| `profile.address.street`     | `String` | 1 to 100 chars                           | No       | The street
| `profile.address.district`   | `String` | 1 to 100 chars                           | No       | The district
| `profile.address.city`       | `String` | 1 to 100 chars                           | No       | The city
| `profile.address.region`     | `String` | 1 to 100 chars                           | No       | The region
| `profile.address.country`    | `String` | 1 to 100 chars                           | No       | The country
| `profile.address.postalCode` | `String` | 1 to 20 chars                            | No       | The postal code
| `profile.avatar`             | `String` | Valid URL                                | No       | The personal avatar URL
| `profile.company`            | `String` | 1 to 200 chars                           | No       | The company's name
| `profile.companyUrl`         | `String` | Valid URL                                | No       | The company's website URL
| `profile.jobTitle`           | `String` | 1 to 50 chars                            | No       | The job title
| `profile.custom`             | `object` | JSON                                     | No       | The map of custom attributes

#### Code Sample

Here are two examples of how to track this event:

<details>
    <summary>Minimal example</summary>
    ```js
    croct.track('userSignedUp', {
        userId: '1ed2fd65-a027-4f3a-a35f-c6dd97537392'
    });
    ```
</details>

<details>
    <summary>Complete example</summary>
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
                     continent: 'NA''
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
