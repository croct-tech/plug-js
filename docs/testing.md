# Testing

For an enhanced developer experience, the SDK provides both debug and test modes to assist with testing.

## Debug mode

The debug mode enables fine-grained logging so developers can detect and diagnose errors and issues with the 
integration. Each log receives a severity level, so you can filter the log output only to see the log messages you 
care about.

The severity levels and their respective meanings are:

- **Debug**  
  Fine-grained messages that provide context to understand the steps leading to errors and warnings.
- **Info**  
  Informational messages that highlight the SDK's state and progress.
- **Warning**  
  Warnings about potential issues that might be problems or might not.
- **Error**  
  Abnormal or unexpected behaviors that need attention.

### Enabling debug mode

To enable the debug mode, you need to set `debug` to true when initializing the SDK:

## Test mode

The test mode enables the SDK to track events in a test environment to ensure that the integration is working 
as expected. It works by replacing the actual transport layer with a fake one to simulate successful calls.

### Enabling test mode

> ✨ If you use Jest or any other testing framework that sets the `NODE_ENV=test`, it should just work out of the box 
> without any additional configuration.

By default, the SDK automatically detects test environments based on the `NODE_ENV`. In any case, you can 
explicitly enable or disable you can either:

- Pass `test` as `true` when initializing the SDK
- Set the `CROCT_TEST_MODE` environment variable to `true`

The order of precedence is as follows:

1. If the `test` option is passed, that overrides any other environment settings
2. If the `CROCT_TEST_MODE` environment variable is set, that takes precedence over the automatic detection of the test environment
3. If neither `test` nor `CROCT_TEST_MODE` is set, the SDK detects the test environment automatically based on the `NODE_ENV`

## Testing events

This flexible design allows you to listen to events and test your integration easily.

Let's take the previous code as an example. You can check if your integration is working as expected by listening to 
the `userProfileChanged` event as follows:

```ts
test('should add an interest to the user profile', async () => {
    await croct.plug({
        appId: '00000000-0000-0000-0000-000000000000',
    });

    const listener = jest.fn();

    croct.tracker.addListener(listener);

    await croct.user.edit()
        .add('interest', 'tests')
        .save();

    expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
            status: 'confirmed',
            event: {
                type: 'userProfileChanged',
                patch: {
                    operations: [
                        {
                            path: 'interest',
                            type: 'add',
                            value: 'tests',
                        },
                    ],
                },
            },
        }),
    );
});
```

See the [Event reference](events.md) for the list of events triggered by the SDK. 
