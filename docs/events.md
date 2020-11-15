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

## User Events

The user category has the following events:

### userSignedUp

This event records that a user has signed up.

You should track this event when a user signs up for your application.

If the user profile does not exist, the engine will create a new one with the provided information. 
This event does not affect existing profiles.

For the personalization engine, the semantics of this event does not encompass the 
[`userSignedIn`](#usersignedin) event. If your application automatically signs in users after registration, make sure 
to call the [`identify`](plug.md#identify) method after the sign-up.

#### Properties

This event supports the following properties:

| Property                     | Type     | Constraints                                     | Required | Description
|------------------------------|----------|-------------------------------------------------|----------|--------------------------------------------------------------
| `userId`                     | `string` | 1 and 254 chars                                 | Yes      | The ID that uniquely identifies the user on your application.
| `profile`                    | `object` |                                                 | No       | The user profile.
| `profile.firstName`          | `String` | 1 to 50 chars                                   | No       | The first name.
| `profile.lastName`           | `String` | 1 to 50 chars                                   | No       | The last name.
| `profile.birthDate`          | `String` | Valid date in the form `YYYY-MM-DD`             | No       | The birth date.
| `profile.gender`             | `String` | Either `male`, `female`, `neutral` or `unknown` | No       | The gender.
| `profile.email`              | `String` | 1 to 254 chars                                  | No       | The email address.
| `profile.alternateEmail`     | `String` | 1 to 254 chars                                  | No       | The alternate email address.
| `profile.phone`              | `String` | 1 to 30 chars                                   | No       | The phone number.
| `profile.alternatePhone`     | `String` | 1 to 30 chars                                   | No       | The alternate phone number.
| `profile.address`            | `object` |                                                 | No       | The user address.
| `profile.address.street`     | `String` | 1 to 100 chars                                  | No       | The address' street.
| `profile.address.district`   | `String` | 1 to 100 chars                                  | No       | The address' district.
| `profile.address.city`       | `String` | 1 to 100 chars                                  | No       | The address' city.
| `profile.address.region`     | `String` | 1 to 100 chars                                  | No       | The address' region.
| `profile.address.country`    | `String` | 1 to 100 chars                                  | No       | The address' country.
| `profile.address.postalCode` | `String` | 1 to 20 chars                                   | No       | The address' postal code.
| `profile.avatar`             | `String` | Well-formed URL                                 | No       | The personal avatar URL.
| `profile.company`            | `String` | 1 to 200 chars                                  | No       | The company's name.
| `profile.companyUrl`         | `String` | Well-formed URL                                 | No       | The company's website URL.
| `profile.jobTitle`           | `String` | 1 to 50 chars                                   | No       | The job title.
| `profile.custom`             | `object` | JSON object                                     | No       | The map of custom attributes.

#### Code Sample

Here are some examples of how to track this event:

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

### userSignedIn

This event records that a user signed in.

The SDK automatically tracks this event when you call either the [`identify`](plug.md#identify) or 
[`setToken`](plug.md#settoken) method.

### userSignedOut

This event records that a user signed out.

The SDK automatically tracks this event when you call either the [`anonymize`](plug.md#identify) or 
[`setToken`](plug.md#settoken) method.

### userProfileChanged

This event records that a user profile has changed.

The SDK automatically tracks this event when you call [`save`](patch.md#save) on the patch returned by the 
[`user.edit`](user.md#edit) method.

## Web Events

The web category has the following events:

### tabOpened

This event records that a user opened a new tab.

The SDK automatically tracks this event when the user open the application in a new tab.

### tabUrlChanged

This event records that the tab URL changed.

The SDK automatically tracks this event when the user navigates between pages.

### tabVisibilityChanged

This event records that the tab visibility changed.

The SDK automatically tracks this event when user minimizes the window or switches to another tab.

### pageOpened

This event records that a user opened a page.

The SDK automatically tracks this event once per page on the initialization.

### pageLoaded

This event records that a page finished loading.

The SDK automatically tracks this event when the page has been completely loaded, without waiting for stylesheets or 
images to finish loading.

## E-commerce Events

The e-commerce category has the following events:

## productViewed

This event records the user viewed a product.

You should track this event when a user opens a product page or view a preview modal.

#### Properties

This event supports the following properties:

| Property                 | Type     | Required | Constraints      | Description
|--------------------------|----------|----------|------------------|----------------------------------------------------------------------
| `product`                | `object` | Yes      |                  | The product details.
| `product.productId`      | `string` | Yes      | 1 to 50 chars    | The ID that uniquely identifies the product on your store.
| `product.sku`            | `string` | No       | 1 to 50 chars    | The code that uniquely identifies the product variant on your store.
| `product.name`           | `string` | Yes      | 1 to 200 chars   | The name of the product.
| `product.category`       | `string` | No       | 1 to 100 chars   | The category of the product.
| `product.brand`          | `string` | No       | 1 to 100 chars   | The brand associated with the product.
| `product.variant`        | `string` | No       | 1 to 50 chars    | The variant of the product, such as size, color and style.
| `product.displayPrice`   | `number` | Yes      | Non-negative     | The price of the product displayed in the store.
| `product.originalPrice`  | `number` | No       | Non-negative     | The original price of the product.
| `product.url`            | `string` | No       | Well-formed URL  | The URL of the product page.
| `product.imageUrl`       | `string` | No       | Well-formed URL  | The URL of the main product image.

**Note:**

- The `sku` and `productId` do not have to be different. Usually, the `product` is the internal identifier, like `12345,` and the SKU is a public-facing identifier like `SM-124-GREEN`.
- The `displayPrice` is the price the user pays, while the `originalPrice` is usually the regular retail price.


#### Code Sample

Here are some examples of how to track this event:

<details>
    <summary>Minimal Example</summary>

```js
croct.track('productViewed', {
  product: {
    productId: '12345',
    name: 'Smartphone 9',
    displayPrice: 599.00
  }
});
```
</details>

<details>
    <summary>Complete Example</summary>

```js
croct.track('productViewed', {
  product: {
    productId: '12345',
    sku: 'a9b2745f-9d0b-4bfe-8ebd-7376dd932169',
    name: 'Smartphone 9',
    category: 'Smartphone',
    brand: 'Pear',
    variant: '64GB Green',
    displayPrice: 599.00,
    originalPrice: 699.00,
    url: 'https://www.acme.com/product/smartphone9',
    imageUrl: 'https://www.acme.com/images/smartphone9-64gb-green.png'
  }
});
```
</details>

## cartViewed

This event records the user viewed the shopping cart.

You should track this event when a user views the shopping cart page or summary.

#### Properties

This event supports the following properties:

| Property                              | Type     | Required | Constraints                      | Description                                                                                                                                                                                                                                                                                                                                                 
|---------------------------------------|----------|----------|----------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
| `cart`                                | `object` | Yes      |                                  | The cart information.
| `cart.currency`                       | `string` | Yes      | 1 to 10 chars                    | The currency in which the monetary values are expressed in the shopping cart. We recommend using the 3-letter currency codes defined by the [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) standard. For currencies having no official recognition in [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217), consider using ISO-like codes adopted locally or commercially, such as `XBT` for BitCoin.
| `cart.items`                          | `array`  | Yes      |                                  | The list of items.
| `cart.items[*].product`               | `object` | Yes      |                                  | The product details.
| `cart.items[*].product.productId`     | `string` | Yes      | 1 to 50 chars                    | The ID that uniquely identifies the product on your store.
| `cart.items[*].product.sku`           | `string` | No       | 1 to 50 chars                    | The code that uniquely identifies the product variant on your store.
| `cart.items[*].product.name`          | `string` | Yes      | 1 to 200 chars                   | The name of the product.
| `cart.items[*].product.category`      | `string` | No       | 1 to 100 chars                   | The category of the product.
| `cart.items[*].product.brand`         | `string` | No       | 1 to 100 chars                   | The brand associated with the product.
| `cart.items[*].product.variant`       | `string` | No       | 1 to 50 chars                    | The variant of the product, such as size, color and style.
| `cart.items[*].product.displayPrice`  | `number` | Yes      | Non-negative                     | The price of the product displayed in the store.
| `cart.items[*].product.originalPrice` | `number` | No       | Non-negative                     | The original price of the product.
| `cart.items[*].product.url`           | `string` | No       | Well-formed URL                  | The URL of the product page.
| `cart.items[*].product.imageUrl`      | `string` | No       | Well-formed URL                  | The URL of the main product image.
| `cart.items[*].index`                 | `number` | Yes      | Non-negative                     | The index, starting from zero, representing the cart in which the item was added to the shopping cart.
| `cart.items[*].quantity`              | `number` | Yes      | Positive                         | The number of units of the item.
| `cart.items[*].total`                 | `number` | Yes      | Non-negative                     | The total for the item. It includes discounts and any other adjustment.
| `cart.items[*].discount`              | `number` | No       | Non-negative                     | The amount of the discount applied to the item.
| `cart.items[*].coupon`                | `number` | No       | 1 to 50 chars                    | The coupon applied to the item.
| `cart.subtotal`                       | `number` | No       | Non-negative                     | The total of all items and quantities in the shopping cart including applied item promotions. Applied cart discounts, estimated shipping, and applied shipping discounts should be excluded from the subtotal amount.
| `cart.shippingPrice`                  | `number` | No       | Non-negative                     | The total shipping price for the items in the shopping cart, including any handling charges.
| `cart.taxes`                          | `object` | No       | Non-empty string keys and values | The taxes associated with the transaction.
| `cart.costs`                          | `object` | No       | Non-empty string keys and values | The costs associated with the transaction, such as manufacturing costs, shipping expenses not borne by the customer, or any other costs.
| `cart.discount`                       | `number` | No       | Non-negative                     | The amount of the discount applied to the shopping cart.
| `cart.total`                          | `number` | Yes      | Non-negative                     | The total revenue or grand total associated with the transaction. It includes shipping, tax, and any other adjustment.
| `cart.coupon`                         | `string` | No       | 1 to 50 chars                    | The coupon applied to the shopping cart.
| `cart.lastUpdateTime`                 | `number` | No       | Non-negative                     | The time when the shopping cart was last updated, in milliseconds since epoch.

**Note:**

- The `sku` and `productId` do not have to be different. Usually, the `product` is the internal identifier, like `12345,` and the SKU is a public-facing identifier like `SM-124-GREEN`.
- The `displayPrice` is the price the user pays, while the `originalPrice` is usually the regular retail price.
- When you don't specify a value for the `lastUpdateTime` property, the SDK considers the time at which you tracked the event as the last update time.

#### Code Sample

Here are some examples of how to track this event:

<details>
    <summary>Minimal Example</summary>

```js
croct.track('cartViewed', {
  cart: {
    currency: 'USD',
    total: 776.49,
    items: [
      {
        index: 0,
        total: 699.00,
        quantity: 1,
        product: {
          productId: '12345',
          name: 'Smartphone 9',
          displayPrice: 699.00
        }
      }
    ]
  }
});
```
</details>

<details>
    <summary>Complete Example</summary>

```js
croct.track('cartViewed', {
  cart: {
    currency: 'USD',
    items: [
      {
        index: 0,
        quantity: 1,
        total: 699.00,
        discount: 100.00,
        coupon: 'PROMO',
        product: {
          productId: '12345',
          sku: 'SM-124-GREEN',
          name: 'Smartphone 9',
          category: 'Smartphone',
          brand: 'Acme',
          variant: '64GB Green',
          displayPrice: 699.00,
          originalPrice: 799.00,
          url: 'https://www.acme.com/product/smartphone9',
          imageUrl: 'https://www.acme.com/images/smartphone9-64gb-green.png'
        }
      },
      {
        index: 1,
        quantity: 1,
        total: 39.00,
        discount: 10.00,
        coupon: 'PROMO',
        product: {
          productId: '98765',
          sku: '03132db8-2c37-4aef-9827-60d0206683d9',
          name: 'Silicone Case',
          category: 'Cases',
          brand: 'Acme',
          variant: 'Black',
          displayPrice: 39.00,
          originalPrice: 49.00,
          url: 'https://www.acme.com/product/silicone-case',
          imageUrl: 'https://www.acme.com/images/silicone-case-black'
        }
      }
    ],
    taxes: {
      state: 53.51,
      local: 23.98
    },
    costs: {
      manufacturing: 275.81,
      cos: 85.37
    },
    subtotal: 848.00,
    shippingPrice: 59.99,
    discount: 169.99,
    total: 815.49,
    coupon: 'FREE-SHIPPING',
    lastUpdateTime: 123456789
  }
});
```
</details>

## checkoutStarted

This event records the checkout process started.

You should track this event on the page that the user lands on after clicking on the checkout button.

#### Properties

This event supports the following properties:

| Property                              | Type     | Required | Constraints                      | Description                                                                                                                                                                                                                                                                                                                                                 
|---------------------------------------|----------|----------|----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
| `orderId`                             | `string` | No       |                                  | The ID that uniquely identifies the order on your store.
| `cart`                                | `object` | Yes      |                                  | The cart information.
| `cart.currency`                       | `string` | Yes      | 1 to 10 chars                    | The currency in which the monetary values are expressed in the shopping cart. We recommend using the 3-letter currency codes defined by the [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) standard. For currencies having no official recognition in [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217), consider using ISO-like codes adopted locally or commercially, such as `XBT` for BitCoin.
| `cart.items`                          | `array`  | Yes      |                                  | The list of items in the shopping cart.
| `cart.items[*].product`               | `object` | Yes      |                                  | The product details.
| `cart.items[*].product.productId`     | `string` | Yes      | 1 to 50 chars                    | The ID that uniquely identifies the product on your store.
| `cart.items[*].product.sku`           | `string` | No       | 1 to 50 chars                    | The code that uniquely identifies the product variant on your store.
| `cart.items[*].product.name`          | `string` | Yes      | 1 to 200 chars                   | The name of the product.
| `cart.items[*].product.category`      | `string` | No       | 1 to 100 chars                   | The category of the product.
| `cart.items[*].product.brand`         | `string` | No       | 1 to 100 chars                   | The brand associated with the product.
| `cart.items[*].product.variant`       | `string` | No       | 1 to 50 chars                    | The variant of the product, such as size, color and style.
| `cart.items[*].product.displayPrice`  | `number` | Yes      | Non-negative                     | The price of the product displayed in the store.
| `cart.items[*].product.originalPrice` | `number` | No       | Non-negative                     | The original price of the product.
| `cart.items[*].product.url`           | `string` | No       | Well-formed URL                  | The URL of the product page.
| `cart.items[*].product.imageUrl`      | `string` | No       | Well-formed URL                  | The URL of the main product image.
| `cart.items[*].index`                 | `number` | Yes      | Non-negative                     | The index, starting from zero, representing the cart in which the item was added to the shopping cart.
| `cart.items[*].quantity`              | `number` | Yes      | Positive                         | The number of units of the item.
| `cart.items[*].total`                 | `number` | Yes      | Non-negative                     | The total for the item. It includes discounts and any other adjustment.
| `cart.items[*].discount`              | `number` | No       | Non-negative                     | The amount of the discount applied to the item.
| `cart.items[*].coupon`                | `number` | No       | 1 to 50 chars                    | The coupon applied to the item.
| `cart.subtotal`                       | `number` | No       | Non-negative                     | The total of all items and quantities in the shopping cart including applied item promotions. Applied cart discounts, estimated shipping, and applied shipping discounts should be excluded from the subtotal amount.
| `cart.shippingPrice`                  | `number` | No       | Non-negative                     | The total shipping price for the items in the shopping cart, including any handling charges.
| `cart.taxes`                          | `object` | No       | Non-empty string keys and values | The taxes associated with the transaction.
| `cart.costs`                          | `object` | No       | Non-empty string keys and values | The costs associated with the transaction, such as manufacturing costs, shipping expenses not borne by the customer, or any other costs.
| `cart.discount`                       | `number` | No       | Non-negative                     | The amount of the discount applied to the shopping cart.
| `cart.total`                          | `number` | Yes      | Non-negative                     | The total revenue or grand total associated with the transaction. It includes shipping, tax, and any other adjustment.
| `cart.coupon`                         | `string` | No       | 1 to 50 chars                    | The coupon applied to the shopping cart.
| `cart.lastUpdateTime`                 | `number` | No       | Non-negative                     | The timestamp when the shopping cart was last updated, in milliseconds since epoch.

**Note:**

- The `sku` and `productId` do not have to be different. Usually, the `product` is the internal identifier, 
like `12345`, and the SKU is a public-facing identifier like `SM-124-GREEN`.
- The `displayPrice` is the price the user pays, while the `originalPrice` is usually the regular retail price.
- It may seem unusual to specify the order ID at the start of the checkout process, but some e-commerce platforms 
generate the order ID at the start or even before the process begins.

#### Code Sample

Here are some examples of how to track this event:

<details>
    <summary>Minimal Example</summary>

```js
croct.track('checkoutStarted', {
  cart: {
    currency: 'USD',
    total: 776.49,
    items: [
      {
        index: 0,
        total: 699.00,
        quantity: 1,
        product: {
          productId: '12345',
          name: 'Smartphone 9',
          displayPrice: 699.00
        }
      }
    ]
  }
});
```
</details>

<details>
    <summary>Complete Example</summary>

```js
croct.track('checkoutStarted', {
  orderId: '123',
  cart: {
    currency: 'USD',
    items: [
      {
        index: 0,
        quantity: 1,
        total: 699.00,
        discount: 100.00,
        coupon: 'PROMO',
        product: {
          productId: '12345',
          sku: 'SM-124-GREEN',
          name: 'Smartphone 9',
          category: 'Smartphone',
          brand: 'Acme',
          variant: '64GB Green',
          displayPrice: 699.00,
          originalPrice: 799.00,
          url: 'https://www.acme.com/product/smartphone9',
          imageUrl: 'https://www.acme.com/images/smartphone9-64gb-green.png'
        }
      },
      {
        index: 1,
        quantity: 1,
        total: 39.00,
        discount: 10.00,
        coupon: 'PROMO',
        product: {
          productId: '98765',
          sku: '03132db8-2c37-4aef-9827-60d0206683d9',
          name: 'Silicone Case',
          category: 'Cases',
          brand: 'Acme',
          variant: 'Black',
          displayPrice: 39.00,
          originalPrice: 49.00,
          url: 'https://www.acme.com/product/silicone-case',
          imageUrl: 'https://www.acme.com/images/silicone-case-black'
        }
      }
    ],
    taxes: {
      state: 53.51,
      local: 23.98
    },
    costs: {
      manufacturing: 275.81,
      cos: 85.37
    },
    subtotal: 848.00,
    shippingPrice: 59.99,
    discount: 169.99,
    total: 815.49,
    coupon: 'FREE-SHIPPING',
    lastUpdateTime: 123456789
  }
});
```
</details>

## orderPlaced

This event records a placed order.

You should track this event when the user places an order. 

#### Properties

This event supports the following properties:

| Property                               | Type     | Required | Constraints                            | Description                                                                                                                                                                                                                                                                                                                                                 
|----------------------------------------|----------|----------|----------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
| `order`                                | `object` | Yes      |                                        | The order details.
| `order.orderId`                        | `string` | Yes      |                                        | The ID that uniquely identifies the order on your store.
| `order.currency`                       | `string` | Yes      | 1 to 10 chars                          | The currency in which the monetary values are expressed in the order. We recommend using the 3-letter currency codes defined by the [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) standard. For currencies having no official recognition in [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217), consider using ISO-like codes adopted locally or commercially, such as `XBT` for BitCoin.
| `order.items`                          | `array`  | Yes      |                                        | The list of items.
| `order.items[*].product`               | `object` | Yes      |                                        | The product details.
| `order.items[*].product.productId`     | `string` | Yes      | 1 to 50 chars                          | The ID that uniquely identifies the product on your store.
| `order.items[*].product.sku`           | `string` | No       | 1 to 50 chars                          | The code that uniquely identifies the product variant on your store.
| `order.items[*].product.name`          | `string` | Yes      | 1 to 200 chars                         | The name of the product.
| `order.items[*].product.category`      | `string` | No       | 1 to 100 chars                         | The category of the product.
| `order.items[*].product.brand`         | `string` | No       | 1 to 100 chars                         | The brand associated with the product.
| `order.items[*].product.variant`       | `string` | No       | 1 to 50 chars                          | The variant of the product, such as size, color and style.
| `order.items[*].product.displayPrice`  | `number` | Yes      | Non-negative                           | The price of the product displayed in the store.
| `order.items[*].product.originalPrice` | `number` | No       | Non-negative                           | The original price of the product.
| `order.items[*].product.url`           | `string` | No       | Well-formed URL                        | The URL of the product page.
| `order.items[*].product.imageUrl`      | `string` | No       | Well-formed URL                        | The URL of the main product image.
| `order.items[*].index`                 | `number` | Yes      | Non-negative                           | The index, starting from zero, representing the order in which the item was added to the shopping cart.
| `order.items[*].quantity`              | `number` | Yes      | Positive                               | The number of units of the item ordered.
| `order.items[*].total`                 | `number` | Yes      | Non-negative                           | The total for the item. It includes discounts and any other adjustment.
| `order.items[*].discount`              | `number` | No       | Non-negative                           | The amount of the discount applied to the item.
| `order.items[*].coupon`                | `number` | No       | 1 to 50 chars                          | The coupon applied to the item.
| `order.subtotal`                       | `number` | No       | Non-negative                           | The total of all items and quantities in the order including applied item promotions. Applied order discounts, estimated shipping, and applied shipping discounts should be excluded from the subtotal amount.
| `order.shippingPrice`                  | `number` | No       | Non-negative                           | The total shipping price for the items in the order, including any handling charges.
| `order.taxes`                          | `object` | No       | Non-empty string keys and values       | The taxes associated with the transaction.
| `order.costs`                          | `object` | No       | Non-empty string keys and values       | The costs associated with the transaction, such as manufacturing costs, shipping expenses not borne by the customer, or any other costs.
| `order.discount`                       | `number` | No       | Non-negative                           | The amount of the discount applied to the order.
| `order.total`                          | `number` | Yes      | Non-negative                           | The total revenue or grand total associated with the transaction. It includes shipping, tax, and any other adjustment.
| `order.coupon`                         | `string` | No       | 1 to 50 chars                          | The coupon applied to the order.
| `order.paymentMethod`                  | `string` | No       | 1 to 50 chars                          | The payment method used in the payment.
| `order.installments`                   | `number` | No       | Non-negative                           | The number of installments of the transaction.
| `order.status`                         | `string` | No       | Either `placed`, `paid` or `completed` | The current status of the order.

**Note:**

- The `sku` and `productId` do not have to be different. Usually, the `product` is the internal identifier, 
like `12345`, and the SKU is a public-facing identifier like `SM-124-GREEN`.
- The `displayPrice` is the price the user pays, while the `originalPrice` is usually the regular retail price.
- The `paymentMethod` property accepts arbitrary values, such as `credit-card`, `credit-balance`,  `visa`, `paypal` or `bitcoin`.

#### Code Sample

Here are some examples of how to track this event:

<details>
    <summary>Minimal Example</summary>

```js
croct.track('orderPlaced', {
  order: {
    orderId: '123',
    currency: 'USD',
    total: 776.49,
    items: [
      {
        index: 0,
        total: 699.00,
        quantity: 1,
        product: {
          productId: '12345',
          name: 'Smartphone 9',
          displayPrice: 699.00
        }
      }
    ]
  }
});
```
</details>

<details>
    <summary>Complete Example</summary>

```js
croct.track('orderPlaced', {
  order: {
    orderId: '123',
    currency: 'USD',
    items: [
      {
        index: 0,
        quantity: 1,
        total: 699.00,
        discount: 100.00,
        coupon: 'PROMO',
        product: {
          productId: '12345',
          sku: 'a9b2745f-9d0b-4bfe-8ebd-7376dd932169',
          name: 'Smartphone 9',
          category: 'Smartphone',
          brand: 'Acme',
          variant: '64GB Green',
          displayPrice: 699.00,
          originalPrice: 799.00,
          url: 'https://www.acme.com/product/smartphone9',
          imageUrl: 'https://www.acme.com/images/smartphone9-64gb-green'
        }
      },
      {
        index: 1,
        quantity: 1,
        total: 39.00,
        discount: 10.00,
        coupon: 'PROMO',
        product: {
          productId: '98765',
          sku: 'CS-987-BLACK',
          name: 'Silicone Case',
          category: 'Cases',
          brand: 'Acme',
          variant: 'Black',
          displayPrice: 39.00,
          originalPrice: 49.00,
          url: 'https://www.acme.com/product/silicone-case',
          imageUrl: 'https://www.acme.com/images/silicone-case-black.png'
        }
      }
    ],
    taxes: {
      state: 53.51,
      local: 23.98
    },
    costs: {
      manufacturing: 275.81,
      cos: 85.37
    },
    subtotal: 848.00,
    shippingPrice: 59.99,
    discount: 169.99,
    total: 815.49,
    coupon: 'FREE-SHIPPING',
    paymentMethod: 'credit-card',
    installments: 1,
    status: 'paid'
  }
});
```
</details>

## Analytics Events

The analytics category has the following events:

### goalCompleted

This event records a completed activity, called a conversion.

You should track this event when a user completes a desired goal, such as filling out a form or downloading a resource.

#### Properties

This event supports the following properties:

| Property   | Type     | Required | Constraints      | Description
|------------|----------|----------|------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
| `goalId`   | `string` | Yes      | 1 to 50 chars    | The ID of the goal.
| `currency` | `string` | No       | 1 to 10 chars    | The currency in which the monetary value is expressed. We recommend using the 3-letter currency codes defined by the [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) standard. For currencies having no official recognition in [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217), consider using ISO-like codes adopted locally or commercially, such as `XBT` for BitCoin.
| `value`    | `number` | No       | Non-negative     | The monetary value associated with the completion of the goal. This can represent an estimated value or a symbolic value. For example, if the sales team can close 10% of people who sign up for a newsletter, and the average transaction is $500, then a possible value for newsletter sign-ups can be $50 (i.e., 10% of $500).

#### Code Sample

Here are some examples of how to track this event:

<details>
    <summary>Minimal Example</summary>

```js
croct.track('goalCompleted', {
    goalId: 'newsletter-sign-up',
});
```
</details>

<details>
    <summary>Complete Example</summary>

```js
croct.track('goalCompleted', {
    goalId: 'newsletter-sign-up',
    currency: 'USD',
    value: 9.99
});
```
</details>

### testGroupAssigned

This event records the test group assigned to a user.

You should track this event once, at the start of an experiment, such as an A/B or multivariate test.


#### Properties

This event supports the following properties:

| Property    | Type     | Required | Constraints   | Description
|-------------|----------|----------|---------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
| `testId`    | `string` | Yes      | 1 to 50 chars | The ID of the experiment.
| `groupId`   | `string` | Yes      | 1 to 50 chars | The ID of the group assigned to the user. For A/B tests, it is commonly the test variant, like `green-button`. For multivariate tests, we recommend joining the variants using the vertical bar character, for example, `crocodile-image\|button-green`. 

#### Code Sample

Here are a few examples of how to track this event:

<details>
    <summary>A/B Test Example</summary>

```js
croct.track('testGroupAssigned', {
    testId: 'home-banner-test',
    groupId: 'green-button',
});
```
</details>

<details>
    <summary>Multivariate Test Example</summary>

```js
croct.track('testGroupAssigned', {
    testId: 'home-banner-test',
    groupId: 'crocodile-image|green-button',
});
```
</details>

## Miscellaneous Events

The miscellaneous category has the following events:

### sessionAttributesChanged

This event records that session attributes have changed.

The SDK automatically tracks this event when you call [`save`](patch.md#save) on the patch returned by the 
[`session.edit`](session.md#edit) method.

### nothingChanged

This event records that the user has been inactive for a while.

The SDK automatically tracks this event after a period of inactivity. The event's frequency decreases as the 
idle period increases until reaching a maximum of four events per hour.

### eventOccurred

This event records the occurrence of a domain-specific event.

You must track this event whenever you want to record that something happened for later analysis.

#### Properties

This event supports the following properties:

| Property            | Type     | Required  | Constraints       | Description
|---------------------|----------|-----------|-------------------|----------------------------------------------------------
| `name`              | `string` | Yes       | 1 to 50 chars     | The name of the event.
| `personalizationId` | `string` | No        | 1 to 50 chars     | The name of the audience associated with the event.
| `audience`          | `string` | No        | 1 to 50 chars     | The audience associated with the event. For example, "loyal-shoppers" or "mothers".
| `testId`            | `string` | No        | 1 to 50 chars     | The ID of the test associated with the event.
| `groupId`           | `string` | No        | 1 to 50 chars     | The ID of the test group associated with the event. 
| `details`           | `object` | No        | Map of primitives | The details about the event.

The following additional restrictions apply to the `details` property:

- It allows up to 10 attributes
- Attribute names should be strings of up to 300 characters, starting with a letter or underscore and
optionally followed by more letters or underscores
- Attribute values can be strings of up to 300 characters, numbers, booleans, and null.  

#### Code Sample

Here are a few examples of how to track this event:

<details>
    <summary>Minimal Example</summary>

```js
croct.track('eventOccurred', {
    name: 'userLiked',
});
```
</details>

<details>
    <summary>Complete Example</summary>

```js
croct.track('eventOccurred', {
        "name": "personalizationApplied",
        "personalizationId": "banner-home",
        "audience": "loyal-users",
        "testId": "test-banner-home",
        "groupId": "A",
    });
```
</details>
