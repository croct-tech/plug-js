# Testing

For an enhanced developer experience, the SDK provides both debug and test modes to assist you with testing.

## Debug mode

The debug mode enables fine-grained logging to help developers detect and diagnose issues with the integration.
Each log receives a severity level, so you can filter the log output to only see the log messages you 
care about.

The severity levels and their respective meanings are:

- 🧐 **Debug**  
  Fine-grained messages that provide context to understand the steps leading to errors and warnings.
- 🤓 **Info**  
  Informational messages that highlight the SDK's state and progress.
- 🤔 **Warning**  
  Potential issues that might be problems or might not.
- 😱 **Error**  
  Abnormal or unexpected behaviors that need attention.

### Enabling debug mode

To enable the debug mode, you need to set `debug` to true when [initializing the SDK](plug.md#plug):

```ts
croct.plug({debug: true});
```

You can now check the console output at runtime for the debug logs.

## Test mode

The test mode enables the SDK to track events in test environments to ensure that the integration is working 
as expected. It works by replacing the actual transport layer with a fake one to simulate successful calls.

### Enabling test mode

> ✨ If you use Jest or any other testing framework that sets the `NODE_ENV=test`, it should just work out of the box 
> without any additional configuration.

By default, the SDK automatically detects test environments based on the `NODE_ENV`. To explicitly enable or disable 
the test mode, you can either:

- Pass `test` as `true` when [initializing the SDK](plug.md#plug)
- Set the `CROCT_TEST_MODE` environment variable to `true`

The order of precedence is as follows:

1. If the `test` option is passed, that overrides any other environment settings
2. If the `CROCT_TEST_MODE` environment variable is set, that takes precedence over the automatic detection of 
test environments
3. If neither `test` nor `CROCT_TEST_MODE` is set, the SDK detects the test environment automatically based on
the `NODE_ENV`

### Testing events

The SDK tracks an event for every operation executed on the server side.

For example, executing the code below will trigger the [`userProfileChanged`](events.md#userprofilechanged) event with changes to the user profile:

```ts
croct.user.edit()
   .add('interest', 'tests')
   .save()
```

This flexible design allows you to listen to events and test your integration without the tedious work of mocking the API, which is particularly cumbersome for chained or nested operations like in the previous example. 

A better solution consists of listening to the event with a test spy. Taking the previous code as an example, you can check if your integration is working as expected by listening to the target event:

```ts
import {EventListener, EventInfo} from '@croct/plug/sdk/tracking';

test('should add an interest to the user profile', async () => {
    await croct.plug({
        appId: '00000000-0000-0000-0000-000000000000',
    });

    const listener: EventListener = jest.fn();

    croct.tracker.addListener(listener);

    await croct.user.edit()
        .add('interest', 'tests')
        .save();

    expect(listener).toHaveBeenCalledWith(
        expect.objectContaining<Partial<EventInfo<'userProfileChanged'>>>({
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
})
```

You can find more details about the available SDK events in the [Event reference](events.md).
