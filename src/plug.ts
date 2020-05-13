import {
    EvaluationFacadeOptions as EvaluationOptions,
    ExternalEvent,
    ExternalEventPayload,
    ExternalEventType,
    JsonValue,
    SdkFacade,
    SdkFacadeConfiguration,
    SessionFacade,
    TrackerFacade,
    UserFacade,
} from '@croct-tech/sdk';

interface PluginConfigurations {
    [key: string]: any;
}

export type Configuration = SdkFacadeConfiguration & {
    plugins?: PluginConfigurations,
}

export interface Plug {
    readonly tracker: TrackerFacade;
    readonly user: UserFacade;
    readonly session: SessionFacade;
    readonly sdk: SdkFacade;
    readonly flushed: Promise<this>;
    readonly plugged: Promise<this>;

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
