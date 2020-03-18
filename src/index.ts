import {
    ExternalEvent as Event,
    ExternalEventPayload as EventPayload,
    ExternalEventType as EventType,
    JsonValue,
    SdkFacade,
    SdkFacadeConfiguration as Configuration,
    EvaluationFacadeOptions as EvaluationOptions,
    SessionFacade,
    TrackerFacade,
    UserFacade,
} from '@croct-tech/sdk';

class CroctPlug {
    private facade?: SdkFacade;

    public plug(configuration: Configuration): void {
        if (this.facade !== undefined) {
            const logger = this.facade.getLogger();

            logger.info('Croct is already plugged in.');

            return;
        }

        this.facade = SdkFacade.initialize(configuration);
    }

    private get instance(): SdkFacade {
        if (this.facade === undefined) {
            throw new Error('Croct is not plugged in.');
        }

        return this.facade;
    }

    public get tracker(): TrackerFacade {
        return this.instance.tracker;
    }

    public get user(): UserFacade {
        return this.instance.user;
    }

    public get session(): SessionFacade {
        return this.instance.session;
    }

    public isAnonymous(): boolean {
        return this.instance.context.isAnonymous();
    }

    public getUserId(): string | null {
        return this.instance.context.getUser();
    }

    public identify(userId: string): void {
        this.instance.identify(userId);
    }

    public anonymize(): void {
        this.instance.anonymize();
    }

    public setToken(token: string): void {
        this.instance.setToken(token);
    }

    public unsetToken(): void {
        this.instance.unsetToken();
    }

    public track(eventType: EventType, payload: EventPayload): Promise<Event> {
        return this.instance.track(eventType, payload);
    }

    public evaluate(expression: string, options: EvaluationOptions = {}): Promise<JsonValue> {
        return this.instance.evaluate(expression, options);
    }

    public async unplug(): Promise<void> {
        if (this.facade === undefined) {
            return;
        }

        const logger = this.instance.getLogger();

        try {
            await this.facade.close();
        } finally {
            delete this.facade;

            logger.info('🔌 App has been unplugged from Croct.');
        }
    }
}

export default new CroctPlug();
