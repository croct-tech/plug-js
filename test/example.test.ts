import {GlobalPlug} from '../src/plug';
import {EventListener, EventInfo} from '../src/sdk/tracking';

describe('The Croct plug', () => {
    let croct: GlobalPlug;

    beforeEach(() => {
        croct = new GlobalPlug();
    });

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
});
});
