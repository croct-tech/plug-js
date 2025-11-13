import {JsonObject, JsonValue} from '@croct/json';

type EntityMap = {
    post: ArticleEntity,
    article: ArticleEntity,
    product: ProductEntity,
    service: ProductEntity,
};

export type ProductEntity = {
    id?: string,
    sku?: string,
    name?: string,
    category?: string,
    brand?: string,
    variant?: string,
    displayPrice?: number,
    originalPrice?: number,
    url?: string,
    imageUrl?: string,
};

export type ArticleEntity = {
    id?: string,
    url?: string,
    title?: string,
    tags?: string[],
    categories?: string[],
    authors?: string[],
    publishTime?: number,
    updateTime?: number,
};

export type EntityType = keyof EntityMap;

export type Entity<T extends EntityType = EntityType> = {
    [K in T]: {type: K} & EntityMap[K];
}[T];

const typeMap: Record<EntityType, Set<string>> = {
    post: new Set([
        'BlogPosting',
        'LiveBlogPosting',
        'NewsArticle',
        'AnalysisNewsArticle',
        'AskPublicNewsArticle',
        'BackgroundNewsArticle',
        'OpinionNewsArticle',
        'ReportageNewsArticle',
        'ReviewNewsArticle',
        'SocialMediaPosting',
        'BlogPosting',
        'DiscussionForumPosting',
        'LiveBlogPosting',
    ]),
    article: new Set([
        'Article',
        'TechArticle',
        'APIReference',
        'Report',
        'AdvertiserContentArticle',
        'SatiricalArticle',
        'ScholarlyArticle',
        'MedicalScholarlyArticle',
    ]),
    product: new Set([
        'Product',
        'ProductCollection',
        'ProductModel',
        'ProductGroup',
        'SomeProducts',
        'Vehicle',
        'BusOrCoach',
        'Car',
        'Motorcycle',
        'MotorizedBicycle',
        'Car',
        'Motorcycle',
        'IndividualProduct',
        'DietarySupplement',
        'Drug',
    ]),
    service: new Set([
        'BroadcastService',
        'CableOrSatelliteService',
        'FinancialProduct',
        'FoodService',
        'GovernmentService',
        'TaxiService',
        'WebAPI',
    ]),
};

export function parseEntity(content: string): Entity | null {
    const data = parseJsonLd(content);

    if (data === null) {
        return null;
    }

    return extractEntity(data);
}

export function extractEntity(data: JsonObject): Entity | null {
    const type = getEntityType(data);

    switch (type) {
        case 'article':
        case 'post': {
            return {
                type: type,
                ...extractArticle(data),
            };
        }

        case 'product':
        case 'service': {
            return {
                type: type,
                ...extractProduct(data),
            };
        }
    }

    return null;
}

function getEntityType(data: JsonObject): EntityType | null {
    const type = getValue(data, '@type');

    for (const [entityType, typeSet] of Object.entries(typeMap) as Array<[EntityType, Set<string>]>) {
        if (contains(typeSet, type)) {
            return entityType;
        }
    }

    return null;
}

export function extractArticle(data: JsonObject): ArticleEntity {
    const postId = getValue(data, 'identifier');
    const post: ArticleEntity = {};

    if (typeof postId === 'string') {
        post.id = postId;
    }

    const title = getValue(data, 'headline', 'name');

    if (typeof title === 'string') {
        post.title = title;
    }

    const datePublished = getValue(data, 'datePublished', 'dateCreated');
    const dateModified = getValue(data, 'dateModified');
    const updateTime = parseTimestamp(dateModified);
    const publishTime = parseTimestamp(datePublished) ?? updateTime;

    if (publishTime !== null) {
        post.publishTime = publishTime;

        if (updateTime !== null && updateTime > publishTime) {
            post.updateTime = updateTime;
        }
    }

    const url = getValue(data, 'url', 'mainEntityOfPage');

    if (typeof url === 'string' && URL.canParse(url)) {
        post.url = url;
    } else if (isObject(url)) {
        const urlValue = getValue(url, 'url', '@id');

        if (typeof urlValue === 'string' && URL.canParse(urlValue)) {
            post.url = urlValue;
        }
    }

    // Extract tags (keywords)
    const tags: string[] = [];
    const keywords = getValue(data, 'keywords');

    if (typeof keywords === 'string') {
        tags.push(
            ...keywords.split(',')
                .map(keyword => keyword.trim())
                .filter(keyword => keyword.length > 0),
        );
    } else if (Array.isArray(keywords)) {
        for (const keyword of keywords) {
            if (typeof keyword === 'string') {
                tags.push(keyword);
            }
        }
    }

    if (tags.length > 0) {
        post.tags = tags;
    }

    // Extract categories (articleSection, genre, about)
    const categories: string[] = [];

    for (const key of ['articleSection', 'genre']) {
        const value = getValue(data, key);

        if (typeof value === 'string') {
            categories.push(value);
        } else if (Array.isArray(value)) {
            for (const item of value) {
                if (typeof item === 'string') {
                    categories.push(item);
                }
            }
        }
    }

    // Also check 'about' field for additional categories
    const about = getValue(data, 'about');

    if (isObject(about)) {
        const aboutName = getValue(about, 'name');

        if (typeof aboutName === 'string') {
            categories.push(aboutName);
        }
    } else if (Array.isArray(about)) {
        for (const item of about) {
            if (isObject(item)) {
                const itemName = getValue(item, 'name');

                if (typeof itemName === 'string') {
                    categories.push(itemName);
                }
            }
        }
    }

    if (categories.length > 0) {
        post.categories = categories;
    }

    // Extract authors
    const authors: string[] = [];
    const authorData = getValue(data, 'author', 'creator');
    const authorList = Array.isArray(authorData) ? authorData : [authorData];

    for (const author of authorList) {
        if (typeof author === 'string') {
            authors.push(author);
        } else if (isObject(author)) {
            const name = getValue(author, 'name');

            if (typeof name === 'string') {
                authors.push(name);
            }
        }
    }

    if (authors.length > 0) {
        post.authors = authors;
    }

    return post;
}

export function extractProduct(data: JsonObject): ProductEntity {
    const product: ProductEntity = {};

    const productId = getValue(data, 'productID', 'identifier');

    if (typeof productId === 'string') {
        product.id = productId;
    }

    const productName = getValue(data, 'name');

    if (typeof productName === 'string') {
        product.name = productName;
    }

    // Extract price information
    const prices: number[] = [];
    const urls: string[] = [];

    // Handle null/undefined offers
    const offersList = Array.isArray(data.offers) ? data.offers : [data.offers];

    for (const offer of offersList) {
        if (!isObject(offer)) {
            continue;
        }

        const url = getValue(offer, 'url');

        if (typeof url === 'string') {
            urls.push(url);
        }

        for (const key of ['price', 'lowPrice', 'highPrice']) {
            const value = parseNumber(getValue(offer, key));

            if (value !== null && value >= 0) {
                prices.push(value);
            }
        }

        const specifications = getValue(offer, 'priceSpecification');
        const specList = Array.isArray(specifications) ? specifications : [specifications];

        for (const specification of specList) {
            if (!isObject(specification)) {
                continue;
            }

            for (const key of ['price', 'minPrice', 'maxPrice']) {
                const value = parseNumber(getValue(specification, key));

                if (value !== null && value >= 0) {
                    prices.push(value);
                }
            }
        }
    }

    if (prices.length > 0) {
        const displayPrice = Math.min(...prices);
        const originalPrice = Math.max(...prices);

        product.displayPrice = displayPrice;

        // Only set originalPrice if it's meaningfully different
        if (originalPrice > displayPrice) {
            product.originalPrice = originalPrice;
        }
    }

    // Extract variant information
    const variant: string[] = [];

    for (const key of ['color', 'pattern', 'size', 'material', 'model']) {
        const value = getValue(data, key);

        if (typeof value === 'string') {
            variant.push(value);
        } else if (isObject(value)) {
            const name = getValue(value, 'name');

            if (typeof name === 'string') {
                variant.push(name);
            }
        }
    }

    if (variant.length > 0) {
        product.variant = variant.join(', ');
    }

    const productSku = getValue(data, 'sku');

    if (typeof productSku === 'string') {
        product.sku = productSku;
    }

    const category = getValue(data, 'category');

    if (typeof category === 'string') {
        product.category = category;
    } else if (isObject(category)) {
        const name = getValue(category, 'name');

        if (typeof name === 'string') {
            product.category = name;
        }
    }

    const brand = getValue(data, 'brand');

    if (typeof brand === 'string') {
        product.brand = brand;
    } else if (isObject(brand)) {
        const name = getValue(brand, 'name');

        if (typeof name === 'string') {
            product.brand = name;
        }
    }

    const productUrl = getValue(data, 'url');

    if (typeof productUrl === 'string') {
        // Prioritize product URL over offer URLs
        urls.unshift(productUrl);
    }

    for (const url of urls) {
        if (URL.canParse(url)) {
            product.url = url;

            break;
        }
    }

    const images = Array.isArray(data.image) ? data.image : [data.image];

    for (const image of images) {
        if (typeof image === 'string' && URL.canParse(image)) {
            product.imageUrl = image;

            break;
        }

        if (isObject(image)) {
            const imageUrl = getValue(image, 'url');

            if (typeof imageUrl === 'string' && URL.canParse(imageUrl)) {
                product.imageUrl = imageUrl;

                break;
            }
        }
    }

    return product;
}

function parseJsonLd(content: string): JsonObject | null {
    try {
        const data = JSON.parse(content);

        if (isObject(data)) {
            return data;
        }
    } catch {
        // Ignore parsing errors
    }

    return null;
}

function contains(set: Set<JsonValue>, value: JsonValue): boolean {
    if (typeof value === 'string') {
        return set.has(value);
    }

    return false;
}

function isObject(value: JsonValue | unknown): value is JsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseTimestamp(value: unknown): number | null {
    if (typeof value === 'string') {
        // Parse ISO 8601 date string
        const date = Date.parse(value);

        if (!Number.isNaN(date)) {
            return date;
        }
    }

    return null;
}

function parseNumber(value: unknown): number | null {
    if (typeof value === 'number') {
        return value;
    }

    if (typeof value === 'string') {
        const parsedValue = Number.parseFloat(value);

        if (!Number.isNaN(parsedValue)) {
            return parsedValue;
        }
    }

    return null;
}

function getValue(object: JsonObject, ...keys: string[]): JsonValue | null {
    for (const key of keys) {
        const value = object[key];

        if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
            continue;
        }

        return value;
    }

    return null;
}
