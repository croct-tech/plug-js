# Patch

Patches allow you to modify a particular entity, such as user profiles or session attributes, without knowing 
its current state.

Most operations require specifying the path to the target attribute. The path format is similar to the way you are 
already used to access nested structures in JavaScript.

For objects and maps, you should use the `object.property` notation:

```js
patch.set('address.street', '5th ave');
```

For lists, you should use the `list[index]` notation:

```js
patch.set('custom.priorities[0]', 'personalization');
```

Notice that the processing performed by a patch is atomic to prevent entities from ending up in an inconsistent state. 
So either all operations are applied, or none of them are.

## API Reference

This reference documents all methods available in the Patch API and explains in detail how these methods work.

### set

This method sets a value at a given path.

This operation will overwrite the value in the specified path. Note that this operation will fail if the 
parent path does not exist or is not a list or map. For example, for a given path `foo.bar`, if the value at `foo` 
does not exist or is not a map, the operation will fail.

#### Signature

The `set` method has the following signature:

```ts
patch.set(path: string, value: JsonValue): Patch
```

The return is the path instance itself to allow operation chaining.

#### Code Sample

Here's a minimal example showing how to set a value:

```js
patch.set('company', 'Croct');
```

### unset

This method removes a given path.

Note that the operation will not fail if the path does not exist.

The difference between `unset` and `clear` is that `unset` deletes the path, 
while `clear` removes the value by setting it to null or removing all its elements.

#### Signature

The `unset` method has the following signature:

```ts
patch.unset(path: string): Patch
```

The return is the path instance itself to allow operation chaining.

#### Code Sample

Here's a minimal example showing how to unset a value:

```js
patch.unset('company');
```

### clear

This method clears the value at given path.

Note that the operation will not fail if the path does not exist.

The following table shows how the operation behaves in different scenarios:

Current Value     | Result
------------------|-------------
`null`            | `null`
`[]`              | `[]`
`['a']`           | `[]`
`'foo'`           | `null`

#### Signature

The `clear` method has the following signature:

```ts
patch.clear(): Patch
```

The return is the path instance itself to allow operation chaining.

#### Code Sample

Here's a minimal example showing how to clear a value at a given path:

```js
patch.clear('interests');
```

### add

This method adds a value to a given path.

The following table shows how the operation behaves in different scenarios:

Current Value     | Given Value     | Result
------------------|-----------------|-------------------
`[]`              | `'a'`           | `['a']`
`null`            | `'a'`           | `['a']`
`'a'`             | `'b'`           | `['a', 'b']`
`null`            | `['a']`         | `['a']`
`['a']`           | `null`          | `['a', null]`

#### Signature

The `add` method has the following signature:

```ts
patch.add(path: string, element: JsonValue): Patch
```

The return is the path instance itself to allow operation chaining.

#### Code Sample

Here's a minimal example showing how to add a value to a collection:

```js
patch.add('interests', 'JavaScript');
```

### combine

This method combines two set of values.

The following table shows how the operation behaves in different scenarios:

Current Value     | Given Value     | Result
------------------|-----------------|-------------------
`[]`              | `[]`            | `[]`
`null`            | `null`          | `[]`
`null`            | `['a']`         | `['a']`
`['a']`           | `null`          | `['a']`
`'a'`             | `'b'`           | `['a', 'b']`
`['a']`           | `'b'`           | `['a', 'b']`
`'a'`             | `['b']`         | `['a', 'b']`
`'a'`             | `['a']`         | `['a']`
`[]`              | `['a', 'a']`    | `['a']`
`[null]`          | `['a']`         | `['a']`
`['a']`          | `['b', null]`    | `['a', 'b']`

#### Signature

The `combine` method has the following signature:

```ts
patch.combine(path: string, value: JsonValue): Patch
```

The return is the path instance itself to allow operation chaining.

#### Code Sample

Here's a minimal example showing how to combine sets:

```js
patch.combine('interests', ['JavaScript', 'Node']);
```

### merge

This method merges two maps or lists.

The following table shows how the operation behaves in different scenarios:

Current Value     | Given Value     | Result
------------------|-----------------|-------------------
`{}`              | `{}`            | `{}`
`null`            | `{a: 1}`        | `{a: 1}`
`{}`              | `{a: 1}`        | `{a: 1}`
`{a: 1}`          | `{b: 2}`        | `{a: 1, b: 2}`
`{} `             | `{}`            | `{}`
`null`            | `[1]`           | `[1]`
`1`               | `[2]`           | `[1, 2]`
`[]`              | `[1]`           | `[1]`
`[1]`             | `[2]`           | `[1, 2]`

#### Signature

The `combine` method has the following signature:

```ts
patch.combine(path: string, value: JsonArray|JsonMap): Patch
```

The return is the path instance itself to allow operation chaining.

#### Code Sample

Here's a minimal example showing how to merge maps:

```js
patch.merge('address', {street: '5th Ave'});
```

### increment

This method increments a value by a given amount.

The following table shows how the operation behaves in different scenarios:

Current Value     | Amount          | Result
------------------|-----------------|-------------------
`null`            | 10              | 10
`0`               | 10              | 10
`-1`              | 10              | 9

#### Signature

The `increment` method has the following signature:

```ts
patch.increment(path: string, value: number = 1): Patch
```

The return is the path instance itself to allow operation chaining.

#### Code Sample

Here's a minimal example showing how to increment a value:

```js
patch.increment('score', 10);
```

### decrement

This method decrements a value by a given amount.

The following table shows how the operation behaves in different scenarios:

Current Value     | Amount          | Result
------------------|-----------------|-------------------
`null`            | 10              | -10
`0`               | 10              | -10
`1`               | 10              | -9

#### Signature

The `increment` method has the following signature:

```ts
patch.decrement(path: string, value: number = 1): Patch
```

The return is the path instance itself to allow operation chaining.

#### Code Sample

Here's a minimal example showing how to decrement a value:

```js
patch.decrement('score', 10);
```
