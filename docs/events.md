## Events

Here is the summary of the supported events for the various categories within the customer journey:

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
