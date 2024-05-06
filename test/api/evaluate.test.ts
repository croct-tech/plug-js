import {Evaluator} from '@croct/sdk/evaluator';
import {Logger} from '@croct/sdk/logging';
import {evaluate, EvaluationOptions} from '../../src/api';

const mockEvaluate: Evaluator['evaluate'] = jest.fn();

jest.mock(
    '@croct/sdk/evaluator',
    () => ({
        __esModule: true,
        /*
         * eslint-disable-next-line prefer-arrow-callback --
         * The mock can't be an arrow function because calling new on
         * an arrow function is not allowed in JavaScript.
         */
        Evaluator: jest.fn(function constructor(this: Evaluator) {
            this.evaluate = mockEvaluate;
        }),
    }),
);

describe('evaluate', () => {
    const apiKey = '00000000-0000-0000-0000-000000000000';
    const appId = '00000000-0000-0000-0000-000000000000';

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should forward a server-side evaluation request', async () => {
        const options: EvaluationOptions = {
            apiKey: apiKey,
            timeout: 100,
            baseEndpointUrl: 'https://croct.example.com',
        };

        const query = 'true';

        jest.mocked(mockEvaluate).mockResolvedValue(true);

        await expect(evaluate(query, options)).resolves.toBe(true);

        expect(Evaluator).toHaveBeenCalledWith({
            apiKey: options.apiKey,
            baseEndpointUrl: options.baseEndpointUrl,
        });

        expect(mockEvaluate).toHaveBeenCalledWith(query, {
            timeout: options.timeout,
        });
    });

    it('should forward a client-side evaluation request', async () => {
        const options: EvaluationOptions = {
            appId: appId,
            timeout: 100,
            baseEndpointUrl: 'https://croct.example.com',
        };

        const query = 'true';

        jest.mocked(mockEvaluate).mockResolvedValue(true);

        await expect(evaluate(query, options)).resolves.toBe(true);

        expect(Evaluator).toHaveBeenCalledWith({
            appId: options.appId,
            baseEndpointUrl: options.baseEndpointUrl,
        });

        expect(mockEvaluate).toHaveBeenCalledWith(query, {
            timeout: options.timeout,
        });
    });

    it('should return the fallback value on error', async () => {
        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const options: EvaluationOptions = {
            apiKey: apiKey,
            fallback: false,
            logger: logger,
        };

        jest.mocked(mockEvaluate).mockRejectedValue(new Error('Reason'));

        await expect(evaluate('"this is a long query"', options)).resolves.toBe(false);

        expect(logger.error).toHaveBeenCalledWith('Failed to evaluate query ""this is a long quer...": reason');
    });
});
