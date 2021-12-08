# Patch

Patches allow you to modify a particular entity, such as user profiles or session attributes, without knowing 
its current state.

Most operations require specifying the path to the target attribute. The path format is similar to the way you are 
already used to access nested structures in JavaScript.

For objects and maps, you should use the `object.property` notation:

```js
patch.set('custom.pet', 'crocodile');
```

For lists, you should use the `list[index]` notation:

```js
patch.set('custom.pets[0]', 'crocodile');
```

Notice that the processing performed by a patch is atomic to prevent entities from ending up in an inconsistent state. 
So either all operations are applied, or none of them are.

## API Reference

This reference documents all methods available in the Patch API and explains in detail how these methods work.

### Index

- [set](#set)
- [unset](#unset)
- [clear](#clear)
- [add](#add)
- [combine](#combine)
- [merge](#merge)
- [increment](#increment)
- [decrement](#decrement)
- [save](#save)

### set

This method sets a value at a given path.

This operation will overwrite the value in the specified path. Note that this operation will fail if the 
parent path does not exist or is not a list or map. For example, given the path `foo.bar`, if the value at `foo` 
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
patch.set('custom.pet', 'crocodile');
```

### unset

This method deletes a given path.

The difference between `unset` and `clear` is that `unset` deletes the path, 
while `clear` removes the value by setting it to null or removing all its elements.

Note that the operation will not fail if the path does not exist.

#### Signature

The `unset` method has the following signature:

```ts
patch.unset(path: string): this
```

The return is the path instance itself to allow operation chaining.

#### Code Sample

Here's a minimal example showing how to unset a value:

```js
patch.unset('custom.pets');
```

### clear

This method clears the value at given path.

The following table shows how the operation behaves in different scenarios:

Current Value     | Result
------------------|-------------
`null`            | `null`
`[]`              | `[]`
`['a']`           | `[]`
`'foo'`           | `null`

Note that the operation will not fail if the path does not exist.

#### Signature

The `clear` method has the following signature:

```ts
patch.clear(): this
```

The return is the path instance itself to allow operation chaining.

#### Code Sample

Here's a minimal example showing how to clear a given path:

```js
patch.clear('custom.pets');
```

### add

This method adds a value to a collection.

The following table shows how the operation behaves in different scenarios:

Current Value     | Given Value     | Result
------------------|-----------------|-------------------
`null`            | `'a'`           | `['a']`
`'a'`             | `null`        | `['a']`
`'a'`             | `'b'`           | `['a', 'b']`
`['a']`           | `null`          | `['a']`
`[]`              | `'a'`           | `['a']`
`['a', 'b']`      | `'a'`           | `['a', 'b', 'a']`

#### Signature

The `add` method has the following signature:

```ts
patch.add(path: string, element: JsonValue): this
```

The return is the path instance itself to allow operation chaining.

#### Code Sample

Here's a minimal example showing how to add a value to a collection:

```js
patch.add('custom.pets', 'crocodile');
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
patch.combine(path: string, value: JsonValue): this
```

The return is the path instance itself to allow operation chaining.

#### Code Sample

Here's a minimal example showing how to combine sets:

```js
patch.combine('custom.pets', ['crocodile', 'iguana']);
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

The `merge` method has the following signature:

```ts
patch.merge(path: string, value: JsonArray | JsonMap): this
```

The return is the path instance itself to allow operation chaining.

#### Code Sample

Here's a minimal example showing how to merge maps:

```js
patch.merge('preferences', {color: 'green'});
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
patch.increment(path: string, value: number = 1): this
```

The return is the path instance itself to allow operation chaining.

#### Code Sample

Here's a minimal example showing how to increment a value:

```js
patch.increment('custom.score', 10);
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
patch.decrement(path: string, value: number = 1): this
```

The return is the path instance itself to allow operation chaining.

#### Code Sample

Here's a minimal example showing how to decrement a value:

```js
patch.decrement('custom.score', 10);
```

### save

This method builds the patch and emits an event to record the specified changes.

Notice that the processing performed by a patch is atomic to prevent entities from ending up in an inconsistent state. 
So either all operations are applied, or none of them are.

#### Signature

The `save` method has the following signature:

```ts
patch.save(): Promise<Event>
```

The return is a [Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) that 
resolves to the tracked event after successful transmission.

#### Code Sample

Here's a minimal example showing how save the specified changes:

```js
patch.save();
```
