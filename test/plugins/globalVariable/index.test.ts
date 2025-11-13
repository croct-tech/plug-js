import {GlobalVariablePlugin, factory} from '../../../src/plugins/globalVariable';
import {Plug} from '../../../src';
import {PluginSdk} from '../../../src/plugin';

describe('GlobalVariable', () => {
    let mockPlug: jest.Mocked<Plug>;

    beforeEach(() => {
        mockPlug = {} as jest.Mocked<Plug>;

        delete window.croct;
        delete window.onCroctLoad;
    });

    afterEach(() => {
        delete window.croct;
        delete window.onCroctLoad;
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

    it('should not call any listeners when onCroctLoad is undefined', () => {
        const plugin = createPlugin();

        plugin.enable();

        expect(window.croct).toBe(mockPlug);
    });

    it('should call the callback passing the plug', () => {
        const callback = jest.fn();

        window.onCroctLoad = callback;

        const plugin = createPlugin();

        plugin.enable();

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith(mockPlug);
    });

    it('should not call listener if it is not a function', () => {
        window.onCroctLoad = 'not a function' as any;

        const plugin = createPlugin();

        // Should not throw error
        expect(() => plugin.enable()).not.toThrow();
        expect(window.croct).toBe(mockPlug);
    });

    it('should not overwrite window.croct if it was globally available before enable', () => {
        window.croct = mockPlug;

        const plugin = createPlugin();

        plugin.enable();

        expect(window.croct).toBe(mockPlug);

        plugin.disable();

        expect(window.croct).toBe(mockPlug);
    });

    it('should remove window.croct if it was not globally available before enable', () => {
        const plugin = createPlugin();

        plugin.enable();

        expect(window.croct).toBe(mockPlug);

        plugin.disable();

        expect(window.croct).toBeUndefined();
    });

    it('should keep onCroctLoad value after disable', () => {
        const callback = jest.fn();

        window.onCroctLoad = callback;

        const plugin = createPlugin();

        plugin.enable();

        expect(callback).toHaveBeenCalledTimes(1);

        plugin.disable();

        expect(window.onCroctLoad).toBe(callback);
    });

    it('should call listener assigned after enable is called', () => {
        const plugin = createPlugin();

        plugin.enable();

        const listener = jest.fn();

        window.onCroctLoad = listener;

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(mockPlug);
    });

    it('should handle non-function listener assigned after enable', () => {
        const plugin = createPlugin();

        plugin.enable();

        expect(() => {
            window.onCroctLoad = 'not a function' as any;
        }).not.toThrow();
    });
});
