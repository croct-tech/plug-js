import {GlobalVariablePlugin, factory} from '../../../src/plugins/globalVariable';
import {Plug} from '../../../src';
import {PluginSdk} from '../../../src/plugin';

describe('GlobalVariable', () => {
    let mockPlug: jest.Mocked<Plug>;

    beforeEach(() => {
        mockPlug = {} as jest.Mocked<Plug>;

        delete window.croct;
        delete window.croctListener;
    });

    afterEach(() => {
        delete window.croct;
        delete window.croctListener;
    });

    function createPlugin(): GlobalVariablePlugin {
        return factory({
            sdk: {plug: mockPlug} as unknown as PluginSdk,
            options: {},
        });
    }

    it('should set window.croct to the plug instance', () => {
        const plugin = createPlugin();

        plugin.enable();

        expect(window.croct).toBe(mockPlug);
    });

    it('should not call any listeners when croctListener is undefined', () => {
        const plugin = createPlugin();

        plugin.enable();

        expect(window.croct).toBe(mockPlug);
    });

    it('should call a single function listener with the plug', () => {
        const listener = jest.fn();

        window.croctListener = listener;

        const plugin = createPlugin();

        plugin.enable();

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(mockPlug);
    });

    it('should call multiple function listeners in an array with the plug', () => {
        const listener1 = jest.fn();
        const listener2 = jest.fn();
        const listener3 = jest.fn();

        window.croctListener = [listener1, listener2, listener3];

        const plugin = createPlugin();

        plugin.enable();

        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener1).toHaveBeenCalledWith(mockPlug);
        expect(listener2).toHaveBeenCalledTimes(1);
        expect(listener2).toHaveBeenCalledWith(mockPlug);
        expect(listener3).toHaveBeenCalledTimes(1);
        expect(listener3).toHaveBeenCalledWith(mockPlug);
    });

    it('should skip non-function listeners in array', () => {
        const listener1 = jest.fn();
        const listener2 = 'not a function';
        const listener3 = jest.fn();

        window.croctListener = [listener1, listener2 as any, listener3];

        const plugin = createPlugin();

        plugin.enable();

        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener1).toHaveBeenCalledWith(mockPlug);
        expect(listener3).toHaveBeenCalledTimes(1);
        expect(listener3).toHaveBeenCalledWith(mockPlug);
    });

    it('should not call listener if it is not a function (single listener)', () => {
        window.croctListener = 'not a function' as any;

        const plugin = createPlugin();

        // Should not throw error
        expect(() => plugin.enable()).not.toThrow();
        expect(window.croct).toBe(mockPlug);
    });

    it('should handle empty array of listeners', () => {
        window.croctListener = [];

        const plugin = createPlugin();

        plugin.enable();

        expect(window.croct).toBe(mockPlug);
    });

    it('should remove window.croct', () => {
        const plugin = createPlugin();

        plugin.enable();

        expect(window.croct).toBe(mockPlug);

        plugin.disable();

        expect(window.croct).toBeUndefined();
    });

    it('should remove window.croctListener on disable', () => {
        const listener = jest.fn();

        window.croctListener = listener;

        const plugin = createPlugin();

        plugin.enable();

        expect(listener).toHaveBeenCalledTimes(1);

        plugin.disable();

        expect(window.croctListener).toBeUndefined();
    });

    it('should call listener assigned after enable is called', () => {
        const plugin = createPlugin();

        plugin.enable();

        const listener = jest.fn();

        window.croctListener = listener;

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(mockPlug);
    });

    it('should call multiple listeners assigned after enable', () => {
        const plugin = createPlugin();

        plugin.enable();

        const listener1 = jest.fn();
        const listener2 = jest.fn();

        window.croctListener = [listener1, listener2];

        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener1).toHaveBeenCalledWith(mockPlug);
        expect(listener2).toHaveBeenCalledTimes(1);
        expect(listener2).toHaveBeenCalledWith(mockPlug);
    });

    it('should call listener each time it is assigned', () => {
        const plugin = createPlugin();

        plugin.enable();

        const listener1 = jest.fn();

        window.croctListener = listener1;

        expect(listener1).toHaveBeenCalledTimes(1);

        const listener2 = jest.fn();

        window.croctListener = listener2;

        expect(listener1).toHaveBeenCalledTimes(1); // Should not be called again
        expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should handle non-function listener assigned after enable', () => {
        const plugin = createPlugin();

        plugin.enable();

        expect(() => {
            window.croctListener = 'not a function' as any;
        }).not.toThrow();
    });
});
