import {ContentFetcher} from '@croct/sdk/contentFetcher';
import {Logger} from '@croct/sdk/logging';
import {FetchResponse} from '../../src/plug';
import {SlotContent} from '../../src/slot';
import {fetchContent, FetchOptions} from '../../src/api';

const mockFetch: ContentFetcher['fetch'] = jest.fn();

jest.mock(
    '@croct/sdk/contentFetcher',
    () => ({
        __esModule: true,
        /*
         * eslint-disable-next-line prefer-arrow-callback --
         * The mock can't be an arrow function because calling new on
         * an arrow function is not allowed in JavaScript.
         */
        ContentFetcher: jest.fn(function constructor(this: ContentFetcher) {
            this.fetch = mockFetch;
        }),
    }),
);

describe('fetchContent', () => {
    const apiKey = '00000000-0000-0000-0000-000000000000';

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should forward a server-side content request', async () => {
        const slotId = 'slot-id';

        const options: FetchOptions = {
            apiKey: apiKey,
            baseEndpointUrl: 'https://croct.example.com',
            timeout: 100,
            fallback: {
                _component: 'component-id',
            },
        };

        const result: FetchResponse<typeof slotId> = {
            content: {
                _component: 'component',
                id: 'test',
            },
        };

        jest.mocked(mockFetch).mockResolvedValue(result);

        await expect(fetchContent(slotId, options)).resolves.toEqual(result);

        expect(ContentFetcher).toHaveBeenCalledWith({
            apiKey: options.apiKey,
            baseEndpointUrl: options.baseEndpointUrl,
        });

        expect(mockFetch).toHaveBeenCalledWith(slotId, {
            timeout: options.timeout,
        });
    });

    it('should forward a static content request', async () => {
        const slotId = 'slot-id';

        const options: FetchOptions = {
            apiKey: apiKey,
            static: true,
            fallback: {
                _component: 'component-id',
            },
        };

        const result: FetchResponse<typeof slotId> = {
            content: {
                _component: 'component',
                id: 'test',
            },
        };

        jest.mocked(mockFetch).mockResolvedValue(result);

        await expect(fetchContent(slotId, options)).resolves.toEqual(result);

        expect(ContentFetcher).toHaveBeenCalledWith({
            apiKey: options.apiKey,
        });

        expect(mockFetch).toHaveBeenCalledWith(slotId, {
            static: true,
        });
    });

    it('should forward a client-side content request', async () => {
        const slotId = 'slot-id';

        const options: FetchOptions = {
            appId: '00000000-0000-0000-0000-000000000000',
            timeout: 100,
            fallback: {
                _component: 'component-id',
            },
        };

        const result: FetchResponse<typeof slotId> = {
            content: {
                _component: 'component',
                id: 'test',
            },
        };

        jest.mocked(mockFetch).mockResolvedValue(result);

        await expect(fetchContent(slotId, options)).resolves.toEqual(result);

        expect(ContentFetcher).toHaveBeenCalledWith({
            appId: options.appId,
        });

        expect(mockFetch).toHaveBeenCalledWith(slotId, {
            timeout: options.timeout,
        });
    });

    it('should extract the slot ID and version', async () => {
        const slotId = 'slot-id';
        const version = '1';
        const versionedSlotId = `${slotId}@${version}`;

        const options: FetchOptions = {
            apiKey: apiKey,
            timeout: 100,
        };

        const result: FetchResponse<typeof slotId> = {
            content: {
                _component: 'component',
                id: 'test',
            },
        };

        jest.mocked(mockFetch).mockResolvedValue(result);

        await expect(fetchContent(versionedSlotId, options)).resolves.toEqual(result);

        expect(ContentFetcher).toHaveBeenCalledWith({
            apiKey: options.apiKey,
        });

        expect(mockFetch).toHaveBeenCalledWith(slotId, {
            timeout: options.timeout,
            version: version,
        });
    });

    it('should fetch content omitting the latest alias', async () => {
        const slotId = 'slot-id';
        const version = 'latest';
        const versionedSlotId = `${slotId}@${version}`;

        const options: FetchOptions = {
            apiKey: apiKey,
            timeout: 100,
        };

        const result: FetchResponse<typeof slotId> = {
            content: {
                _component: 'component',
                id: 'test',
            },
        };

        jest.mocked(mockFetch).mockResolvedValue(result);

        await expect(fetchContent(versionedSlotId, options)).resolves.toEqual(result);

        expect(ContentFetcher).toHaveBeenCalledWith({
            apiKey: options.apiKey,
        });

        expect(mockFetch).toHaveBeenCalledWith(slotId, {
            timeout: options.timeout,
        });
    });

    it('should return the fallback value on error', async () => {
        const slotId = 'slot-id';
        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const fallback: SlotContent = {
            _component: 'component-id',
            id: 'fallback',
        };

        const options: FetchOptions = {
            apiKey: apiKey,
            timeout: 100,
            fallback: fallback,
            logger: logger,
        };

        jest.mocked(mockFetch).mockRejectedValue(new Error('Reason'));

        await expect(fetchContent(slotId, options)).resolves.toEqual({
            content: fallback,
        });

        expect(logger.error).toHaveBeenCalledWith(`Failed to fetch content for slot "${slotId}@latest": reason`);
    });
});
