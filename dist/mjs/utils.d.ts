export declare class EventType {
    private static vendors;
    static polyfillEventTypeMap: {
        [K: string]: string[];
    };
    private static withVendor;
    private static capitalize;
    static get(target: EventTarget, type: string): string | undefined;
}
export declare class TaskScheduler {
    private lastExecutionTime;
    private readonly delayThreshold;
    private scheduledTask;
    private rafId;
    constructor(delayThreshold: number);
    scheduleTask(task: () => void): void;
    private executeTask;
    private runScheduledTask;
}
export declare class DefaultGesturePreventer {
    private static styleSheet;
    private static meta;
    private static isActivePreventDefaultPinchGesture;
    private static isActivePreventDefaultPanGesture;
    private static isActivePreventDefaultSelectGesture;
    private static preventDefault;
    private static emptyPromise;
    static activePreventDefaultPinchGesture(): Promise<unknown>;
    static inactivePreventDefaultPinchGesture(): void;
    static activePreventDefaultPanGesture(): Promise<unknown>;
    static inactivePreventDefaultPanGesture(): void;
    static activePreventDefaultSelectGesture(): Promise<unknown>;
    static inactivePreventDefaultSelectGesture(): void;
    private static getStyleSheet;
    private static splitViewportContent;
    private static joinViewportContent;
}
