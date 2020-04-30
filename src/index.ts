import {
    SdkFacade as Sdk,
    SdkFacadeConfiguration as Configuration,
    Logger,
    UserFacade,
    SessionFacade,
    TrackerFacade as Tracker,
    EvaluatorFacade as Evaluator,
    EvaluationFacadeOptions as EvaluationOptions,
    EvaluationErrorType,
    EvaluationError,
    ExpressionError,
    Event,
    EventType,
    ExternalEvent,
    ExternalEventPayload,
    ExternalEventType,
    EventListener,
    EventInfo,
    JsonValue,
} from '@croct-tech/sdk';
import {Plug, GlobalPlug} from './plug';

export {
    Sdk,
    Configuration,
    UserFacade,
    SessionFacade,
    Tracker,
    Logger,
    Evaluator,
    EvaluationOptions,
    Event,
    EventType,
    ExternalEventType,
    ExternalEventPayload,
    EventListener,
    EventInfo,
    ExternalEvent,
    EvaluationErrorType,
    EvaluationError,
    ExpressionError,
    JsonValue,
    Plug
};

export default new GlobalPlug();
