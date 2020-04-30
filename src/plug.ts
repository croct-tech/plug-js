import {
    JsonValue,
    SdkFacade,
    SdkFacadeConfiguration as Configuration,
    EvaluationFacadeOptions as EvaluationOptions,
    SessionFacade,
    TrackerFacade,
    UserFacade,
    ExternalEvent,
    ExternalEventPayload,
    ExternalEventType,
} from '@croct-tech/sdk';

export interface Plug {
    readonly tracker: TrackerFacade;
    readonly user: UserFacade;
    readonly session: SessionFacade;
    readonly sdk: SdkFacade;
    readonly flushed: Promise<void>;

    plug(configuration: Configuration): void;

    isAnonymous(): boolean;

    getUserId(): string | null;

    identify(userId: string): void;

    anonymize(): void;

    setToken(token: string): void;

    unsetToken(): void;

    track<T extends ExternalEventType>(type: T, payload: ExternalEventPayload<T>): Promise<ExternalEvent<T>>;

    evaluate(expression: string, options?: EvaluationOptions): Promise<JsonValue>;

    unplug(): Promise<void>;
}

export class GlobalPlug implements Plug {
    private instance?: SdkFacade;

    public plug(configuration: Configuration): void {
        if (this.instance !== undefined) {
            const logger = this.instance.getLogger();

            logger.info('Croct is already plugged in.');

            return;
        }

        this.instance = SdkFacade.init(configuration);
    }

    public get flushed(): Promise<void> {
        return this.tracker.flushed;
    }

    public get sdk(): SdkFacade {
        if (this.instance === undefined) {
            throw new Error('Croct is not plugged in.');
        }

        return this.instance;
    }

    public get tracker(): TrackerFacade {
        return this.sdk.tracker;
    }

    public get user(): UserFacade {
        return this.sdk.user;
    }

    public get session(): SessionFacade {
        return this.sdk.session;
    }

    public isAnonymous(): boolean {
        return this.sdk.context.isAnonymous();
    }

    public getUserId(): string | null {
        return this.sdk.context.getUser();
    }

    public identify(userId: string): void {
        this.sdk.identify(userId);
    }

    public anonymize(): void {
        this.sdk.anonymize();
    }

    public setToken(token: string): void {
        this.sdk.setToken(token);
    }

    public unsetToken(): void {
        this.sdk.unsetToken();
    }

    public track<T extends ExternalEventType>(type: T, payload: ExternalEventPayload<T>): Promise<ExternalEvent<T>> {
        return this.sdk.track(type, payload);
    }

    public evaluate(expression: string, options: EvaluationOptions = {}): Promise<JsonValue> {
        return this.sdk.evaluate(expression, options);
    }

    public async unplug(): Promise<void> {
        if (this.instance === undefined) {
            return;
        }

        const logger = this.sdk.getLogger();

        try {
            await this.instance.close();
        } finally {
            delete this.instance;

            logger.info('🔌 Croct has been unplugged.');
        }
    }
}
