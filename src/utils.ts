import {AddEventListenerOptionsOrBoolean, EventHandlersEventMaps} from "./interfacecs";
import {EventManager} from "./index";

type ViewportContentMap = { [K: string]: string };

export const GlobalThis = (() => {
    if (typeof window !== 'undefined') {
        return window;
    }

    if (typeof global !== 'undefined') {
        return global;
    }

    if (typeof globalThis !== 'undefined') {
        return globalThis;
    }

    // eslint-disable-next-line no-restricted-globals
    if (typeof self !== 'undefined') {
        // eslint-disable-next-line no-restricted-globals
        return self;
    }

    return this;
})() as any;

export class EventType {
    private static vendors = ['', 'webkit', 'moz', 'ms', 'MS', 'o', 'O'];

    static polyfillEventTypeMap: { [K: string]: string[] } = {
        'wheel': ['wheel', 'mousewheel', 'DOMMouseScroll'],
        'pointerlockchange': EventType.withVendor('pointer', 'lock', 'change'),
        'pointerlockerror': EventType.withVendor('pointer', 'lock', 'error'),
        'pointercancel': EventType.withVendor('pointer', 'cancel'),
        'pointerdown': EventType.withVendor('pointer', 'down'),
        'pointerhover': EventType.withVendor('pointer', 'hover'),
        'pointermove': EventType.withVendor('pointer', 'move'),
        'pointerout': EventType.withVendor('pointer', 'out'),
        'pointerover': EventType.withVendor('pointer', 'over'),
        'pointerup': EventType.withVendor('pointer', 'up'),
        'lostpointercapture': EventType.withVendor('lost', 'pointer', 'capture'),
        'gotpointercapture': EventType.withVendor('got', 'pointer', 'capture'),
        'fullscreenchange': EventType.withVendor('fullscreen', 'change'),
        'fullscreenerror': EventType.withVendor('fullscreen', 'error'),
        'transitionstart': EventType.withVendor('transition', 'start'),
        'transitionrun': EventType.withVendor('transition', 'run'),
        'transitionend': EventType.withVendor('transition', 'end'),
        'transitioncancel': EventType.withVendor('transition', 'cancel'),
        'animationstart': EventType.withVendor('animation', 'start'),
        'animationiteration': EventType.withVendor('animation', 'iteration'),
        'animationend': EventType.withVendor('animation', 'end'),
        'animationcancel': EventType.withVendor('animation', 'cancel')
    }

    private static withVendor(...strings: string[]) {
        return EventType.vendors.flatMap(vendor => [
            vendor + strings.join(''),
            vendor + strings.map(string => EventType.capitalize(string)).join('')
        ]);
    }

    private static capitalize(string: string) {
        return string.replace(/\b[a-z]/, s => s.toUpperCase());
    }

    static get(target: EventTarget, type: string) {
        const types = EventType.polyfillEventTypeMap[type];

        if (types) {
            for (let type of types) {
                if (('on' + type) in target) {
                    return type;
                }
            }
        } else if (('on' + type) in target) {
            return type;
        }

        return;
    }
}

export class TaskScheduler {
    private lastExecutionTime: number = 0;
    private readonly delayThreshold: number;
    private scheduledTask: (() => void) | null = null;
    private rafId: number | null = null;
    private readonly requestAnimationFrame;
    private readonly cancelAnimationFrame;
    private readonly now;

    constructor(delayThreshold: number) {
        this.delayThreshold = delayThreshold;

        const now = (
            Date.now
            || function () {
                return new Date().getTime();
            }
        );

        const start = now();

        this.now = () => {
            if (GlobalThis.performance && GlobalThis.performance.now) {
                return GlobalThis.performance.now()
            }
            return now() - start;
        }

        let lastTime = 0;

        this.requestAnimationFrame = (
            GlobalThis.requestAnimationFrame
            || GlobalThis.webkitRequestAnimationFrame
            || GlobalThis.mozRequestAnimationFrame
            || GlobalThis.oRequestAnimationFrame
            || GlobalThis.msRequestAnimationFrame
            || ((callback: FrameRequestCallback) => {
                const currentTime = this.now();
                const timeToCall = Math.max(0, 16 - (currentTime - lastTime));

                const id = window.setTimeout(function () {
                    callback(currentTime + timeToCall);
                }, timeToCall);

                lastTime = currentTime + timeToCall;

                return id;
            })
        );

        this.cancelAnimationFrame = (
            GlobalThis.cancelAnimationFrame
            || GlobalThis.webkitCancelAnimationFrame
            || GlobalThis.webkitCancelRequestAnimationFrame
            || GlobalThis.mozCancelAnimationFrame
            || GlobalThis.mozCancelRequestAnimationFrame
            || GlobalThis.oCancelAnimationFrame
            || GlobalThis.oCancelRequestAnimationFrame
            || GlobalThis.msCancelAnimationFrame
            || GlobalThis.msCancelRequestAnimationFrame
            || ((id: number) => {
                clearTimeout(id);
            })
        );

    }

    scheduleTask(task: () => void): void {
        const currentTime = this.now();

        if (currentTime - this.lastExecutionTime >= this.delayThreshold) {
            if (this.rafId !== null) {
                this.cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
            this.executeTask(task);
        } else {
            this.scheduledTask = task;
            if (this.rafId === null) {
                this.rafId = this.requestAnimationFrame(() => this.runScheduledTask());
            }
        }
    }

    private executeTask(task: () => void): void {
        this.lastExecutionTime = this.now();
        task();
    }

    private runScheduledTask(): void {
        if (this.scheduledTask) {
            this.executeTask(this.scheduledTask);
            this.scheduledTask = null;
            this.rafId = null;
        }
    }
}

export class DefaultGesturePreventer {
    private static styleSheet: CSSStyleSheet;
    private static meta: WeakMap<HTMLMetaElement, ViewportContentMap> = new WeakMap();
    private static isActivePreventDefaultPinchGesture = false;
    private static isActivePreventDefaultPanGesture = false;
    private static isActivePreventDefaultSelectGesture = false;
    private static preventDefault = (event: Event) => event.preventDefault();
    private static emptyPromise = new Promise(() => {
    });

    static activePreventDefaultPinchGesture() {
        if (DefaultGesturePreventer.isActivePreventDefaultPinchGesture) return DefaultGesturePreventer.emptyPromise;

        DefaultGesturePreventer.isActivePreventDefaultPinchGesture = true;
        document.addEventListener('touchmove', DefaultGesturePreventer.preventDefault, {passive: false});
        document.addEventListener('touchstart', DefaultGesturePreventer.preventDefault, {passive: false});

        return new Promise(async resolve => {
            const metas: NodeListOf<HTMLMetaElement> = document.querySelectorAll<HTMLMetaElement>('meta[name="viewport"]');

            if (metas.length === 0) {
                const meta: HTMLMetaElement = document.createElement('meta');
                meta.setAttribute('name', 'viewport');
                meta.setAttribute('content', 'user-scalable=no');

                document.head.append(meta);
                DefaultGesturePreventer.meta.set(meta, {});
            }

            metas
                .forEach(meta => {
                    const content = meta.getAttribute('content');
                    if (content) {
                        const contentMap = DefaultGesturePreventer.splitViewportContent(content);

                        DefaultGesturePreventer.meta.set(meta, contentMap);
                        contentMap['user-scalable'] = 'no';
                        meta.setAttribute('content', DefaultGesturePreventer.joinViewportContent(contentMap));
                    }
                });

            setTimeout(resolve);
        });
    }

    static inactivePreventDefaultPinchGesture() {
        if (!DefaultGesturePreventer.isActivePreventDefaultPinchGesture) return;

        DefaultGesturePreventer.isActivePreventDefaultPinchGesture = false;
        document.removeEventListener('touchmove', DefaultGesturePreventer.preventDefault);
        document.removeEventListener('touchstart', DefaultGesturePreventer.preventDefault);

        document.querySelectorAll<HTMLMetaElement>('meta[name="viewport"]')
            .forEach(meta => {
                if (DefaultGesturePreventer.meta.has(meta)) {
                    const content = DefaultGesturePreventer.meta.get(meta)!;

                    if (Object.keys(content).length === 0) {
                        meta.remove();
                    } else {
                        meta.setAttribute('content', DefaultGesturePreventer.joinViewportContent(content));
                    }
                }
            });
    }

    static activePreventDefaultPanGesture() {
        if (DefaultGesturePreventer.isActivePreventDefaultPanGesture) return DefaultGesturePreventer.emptyPromise;

        DefaultGesturePreventer.isActivePreventDefaultPanGesture = true;

        return new Promise(resolve => {
            document.addEventListener('touchstart', DefaultGesturePreventer.preventDefault, {passive: false});
            setTimeout(resolve);
        });
    }

    static inactivePreventDefaultPanGesture() {
        if (!DefaultGesturePreventer.isActivePreventDefaultPanGesture) return;

        DefaultGesturePreventer.isActivePreventDefaultPanGesture = false;

        document.removeEventListener('touchstart', DefaultGesturePreventer.preventDefault);
    }

    static activePreventDefaultSelectGesture() {
        if (DefaultGesturePreventer.isActivePreventDefaultSelectGesture) return DefaultGesturePreventer.emptyPromise;

        DefaultGesturePreventer.isActivePreventDefaultSelectGesture = true;
        document.addEventListener('touchstart', DefaultGesturePreventer.preventDefault, {passive: false});

        return new Promise(resolve => {
            DefaultGesturePreventer.getStyleSheet().insertRule('html{-webkit-touch-callout:none;-webkit-user-select:none;-webkit-tap-highlight-color:rgba(0,0,0,0);-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;}');
            setTimeout(resolve);
        });
    }

    static inactivePreventDefaultSelectGesture() {
        if (!DefaultGesturePreventer.isActivePreventDefaultSelectGesture) return;

        DefaultGesturePreventer.isActivePreventDefaultSelectGesture = false;
        document.removeEventListener('touchstart', DefaultGesturePreventer.preventDefault);

        try {
            DefaultGesturePreventer.getStyleSheet().deleteRule(0);
        } catch (e) {
        }
    }

    private static getStyleSheet(): CSSStyleSheet {
        if (!DefaultGesturePreventer.styleSheet) {
            const style: HTMLStyleElement = document.createElement('style');
            document.head.append(style);
            DefaultGesturePreventer.styleSheet = style.sheet as CSSStyleSheet;
        }

        return DefaultGesturePreventer.styleSheet;
    }

    private static splitViewportContent(content: string): ViewportContentMap {
        return content
            .split(',')
            .map(content => {
                const kv = content.trim().split('=');
                return {[kv[0]]: kv[1]};
            })
            .reduce((prev, curr) => Object.assign(prev, curr), {});
    }

    private static joinViewportContent(contentMap: ViewportContentMap): string {
        return Object.keys(contentMap)
            .map(key => key + '=' + contentMap[key])
            .join(', ');
    }
}

export class EventListenerMap {
    private map: Map<EventListenerOrEventListenerObject, { [K in 'capture' | 'release']: EventListener | undefined }> = new Map();

    get(callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptionsOrBoolean) {
        const optionsObject = this.parseOptions(options);
        const callbackObject = this.map.get(callback);

        if (optionsObject.capture) {
            return callbackObject?.capture;
        }

        return callbackObject?.release;
    }

    set(target: EventTarget, type: EventHandlersEventMaps, callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptionsOrBoolean) {
        let callbackFunction = this.parseCallback(callback);
        const optionsObject = this.parseOptions(options);

        const isPassiveSupported = EventListenerRegister.passiveSupported.get(target.constructor);
        const isOnceSupported = EventListenerRegister.onceSupported.get(target.constructor);

        let newCallbackFunction: EventListener = function (event: Event) {
            if (!isPassiveSupported && optionsObject.passive) {
                event.preventDefault = function () {
                };
            }
            callbackFunction(event);
            if (!isOnceSupported && optionsObject.once) {
                target.removeEventListener(event.type, newCallbackFunction as EventListenerOrEventListenerObject);
            }
        };

        if (isPassiveSupported && isOnceSupported) {
            newCallbackFunction = callbackFunction;
        }

        if (optionsObject.capture) {
            this.map.set(callback, {'capture': newCallbackFunction, release: this.map.get(callback)?.release});
        } else {
            this.map.set(callback, {capture: this.map.get(callback)?.capture, 'release': newCallbackFunction});
        }

        return callbackFunction;
    }

    delete(callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptionsOrBoolean) {
        const optionsObject = this.parseOptions(options);
        const callbackObject = this.map.get(callback);

        if (optionsObject.capture) {
            delete callbackObject?.capture;
        } else {
            delete callbackObject?.release;
        }

        if (callbackObject) {
            if (Object.keys(callbackObject).length === 0) {
                this.map.delete(callback);
            } else {
                this.map.set(callback, callbackObject);
            }
        }
    }

    keys() {
        return this.map.keys();
    }

    size() {
        return this.map.size;
    }

    private parseCallback(callback: EventListenerOrEventListenerObject) {
        if (typeof callback === 'function') {
            return callback;
        }

        return callback.handleEvent;
    }

    private parseOptions(options?: AddEventListenerOptionsOrBoolean) {
        if (options === undefined) {
            return {};
        }

        if (typeof options === 'boolean') {
            return {capture: options};
        }

        return options;
    }
}

export class EventListenerRegister {
    static passiveSupported: Map<Function, boolean> = new Map();
    static onceSupported: Map<Function, boolean> = new Map();

    private readonly target: any

    addEventListener = (type: string, callback: any, options?: any) => {
        if ('addEventListener' in this.target) {
            this.target.addEventListener(type, callback, options);
            return;
        }
        if ('attachEvent' in this.target) {
            this.target.attachEvent('on' + type, callback);
            return;
        }
        if ('addListener' in this.target) {
            this.target.addListener(callback);
            return;
        }
        return;
    }

    removeEventListener = (type: string, callback: any, options?: any) => {
        if ('removeEventListener' in this.target) {
            this.target.removeEventListener(type, callback, options);
            return;
        }
        if ('detachEvent' in this.target) {
            this.target.detachEvent('on' + type, callback);
            return;
        }
        if ('removeListener' in this.target) {
            this.target.removeListener(callback);
            return;
        }
        return () => {
        };
    }

    dispatchEvent = (event: Event) => {
        if ('dispatchEvent' in this.target) {
            this.target.dispatchEvent(event);
            return;
        }
        if ('fireEvent' in this.target) {
            this.target.fireEvent('on' + event.type);
            return;
        }
        return;
    }

    constructor(target: EventTarget) {
        this.target = target;
        this.checkSupportedOptions(target);
    }

    private checkSupportedOptions(target: EventTarget) {
        if (EventListenerRegister.onceSupported.get(target.constructor) === undefined || EventListenerRegister.passiveSupported.get(target.constructor) === undefined) {
            EventListenerRegister.passiveSupported.set(target.constructor, false);
            EventListenerRegister.onceSupported.set(target.constructor, false);

            try {
                const empty = () => {
                };

                const options = Object.create({}, {
                    passive: {
                        get() {
                            EventListenerRegister.passiveSupported.set(target.constructor, true);
                            return undefined;
                        }
                    },
                    once: {
                        get() {
                            EventListenerRegister.onceSupported.set(target.constructor, true);
                            return undefined;
                        }
                    },
                });

                this.addEventListener('test', empty, options);
                this.removeEventListener('test', empty, options);
            } catch (e) {
            }
        }
    }
}

