# Evaluator API Reference

This reference documents all methods available in the Evaluator API and explains in detail how these methods work.

## evaluate

This method evaluates a CQL expression.

Currently, the expression has a hard limit of 300 characters.

### Signature

The `evaluation` method has the following signature:

```ts
croct.evaluator.evaluate(expression: string, options?: EvaluationOptions): Promise<JsonResult>
```

The return is a promise that resolves to the evaluation result.

These are the currently supported options:

| Option       | Type   | Description                                                                                                                                                                                                                                           |
|--------------|--------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `timeout`    | number | The maximum evaluation time in milliseconds. Once reached, the evaluator will abort the evaluator and reject the promise with a timeout error.                                                                                                        |
| `attributes` | JSON   | This option represents a map of attributes to inject in the evaluation context. For example, passing the attributes `{cities: ['New York', 'San Francisco']}` you can reference them in expressions like `context's cities include location's city`.  |

### Code Sample

Here's a minimal example showing how evaluate an expression:

```js
croct.evaluator.evaluate('session is starting').then(console.log);
```