import './polyfill';
import packageJSON from '../package.json';
import {DefaultGesturePreventer, EventListenerMap, EventListenerRegister, EventType, GlobalThis, TaskScheduler} from "./utils";
import {
    AddEventListenerOptionsOrBoolean,
    EventHandlersEventMaps,
    EventListenerEventMap,
    EventManagerInstance,
    ExtendedEventImplementation,
    ExtendedEventInstance,
    ExtendedEventMap,
    extendedEventMap,
    ExtendedEventType,
    ExtendedHTMLElementEventMap,
    ExtendedUIEventProperty
} from "./interfacecs";
import {ExtendedUIEvent, ExtendedMouseEvent, ExtendedTouchEvent} from "./event";
import {EventPath, EventPathList, EventPosition, Direction, Appearance, Orientation, Size} from "./geometry";

export {
    EventPath, EventPathList, EventPosition,
    Direction, Appearance, Orientation, Size,
    ExtendedMouseEvent, ExtendedTouchEvent, ExtendedUIEvent
};

const scheduler = new TaskScheduler(5);

export class EventManager {
    static instance: EventManagerInstance = {
        generalEventInstance: new WeakMap(),
        extendedEventInstance: new WeakMap()
    };

    static options = {
        strict: true,
        mouseLongpressTimeRequired: 750,
        mouseLongpressBelowDistance: 15,
        touchLongpressTimeRequired: 750,
        touchLongpressBelowDistance: 30,
        callWhenAddedUIEvent: true,
    };

    static resizeObserver: ResizeObserver | undefined = undefined;
    static intersectionObserver: IntersectionObserver | undefined = undefined;
    static version = packageJSON.version;

    static on(target: EventTarget, types: EventHandlersEventMaps, callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptionsOrBoolean): void {
        for (const type of EventManager.toArray(types)) {
            if (!!EventManager.extendedEventKey(type)) {
                EventManager.addExtendedEventListener(target, types, callback, options);
            } else {
                const eventType = EventType.get(target, type);
                if (!eventType) {
                    continue;
                }
                EventManager.addEventListener(target, type, callback, options);
            }
        }
    }

    private static addEventListener(target: EventTarget, type: string, callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptionsOrBoolean): void {
        new EventListenerRegister(target).addEventListener(type, EventManager.storeEventListener(target, type as EventHandlersEventMaps, callback, options), options)
    }

    private static removeEventListener(target: EventTarget, type: string, callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptionsOrBoolean): void {
        EventManager.off(target, type as EventHandlersEventMaps, callback, options);
    }

    private static dispatchEvent(target: EventTarget, event: Event) {
        new EventListenerRegister(target).dispatchEvent(event);
    }

    private static extendedEventKey(type: string): string | undefined {
        return extendedEventMap[type as keyof ExtendedEventMap];
    }

    private static addExtendedEventListener(target: EventTarget, types: EventHandlersEventMaps, callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptionsOrBoolean): void {
        for (const type of EventManager.toArray(types)) {
            EventManager.addEventListener(target, type, callback, options);

            switch (EventManager.extendedEventKey(type)) {
                case 'mouselongpress':
                    EventManager.addMouseLongpressEvent(target);
                    break;
                case 'mousepan':
                    EventManager.addMousePanEvent(target);
                    break;
                case 'touchlongpress':
                    EventManager.addTouchLongpressEvent(target);
                    break;
                case 'touchpan':
                    EventManager.addTouchPanEvent(target);
                    break;
                case 'touchpinch':
                    EventManager.addTouchPinchEvent(target);
                    break;
                case 'appearancechange':
                    EventManager.addAppearanceChange(target);
                    break;
                case 'orientationchange':
                    EventManager.addOrientationChange(target);
                    break;
                case 'resize':
                    EventManager.addResize(target);
                    break;
                case 'intersection':
                    EventManager.addIntersection(target);
                    break;
            }
        }
    }

    static off(target: EventTarget, types?: EventHandlersEventMaps, callback?: EventListenerOrEventListenerObject, options?: AddEventListenerOptionsOrBoolean): void {
        const listenerEventMap = EventManager.instance.generalEventInstance.get(target);

        if (!listenerEventMap) return;

        if (types) {
            EventManager.removeEventListenerFromType(target, types, callback, options);
        } else {
            const keys = listenerEventMap.keys();
            let key = keys.next();

            while (!key.done) {
                const types = key.value;
                EventManager.removeEventListenerFromType(target, types, callback, options);
                key = keys.next();
            }
        }
    }

    private static removeEventListenerFromType(target: EventTarget, types: EventHandlersEventMaps, comparator?: EventListenerOrEventListenerObject, options?: AddEventListenerOptionsOrBoolean): void {
        const listenerEventMap = EventManager.instance.generalEventInstance.get(target);

        if (!listenerEventMap) return;

        for (const type of EventManager.toArray(types)) {
            const fns = [];
            const listeners = listenerEventMap.get(type);

            if (listeners) {
                const keys = listeners.keys();
                let key = keys.next();

                while (!key.done) {
                    const value = listeners.get(key.value, options);
                    if (value) {
                        const fn = EventManager.matchAndRemoveListener(target, type, value, comparator, options);
                        if (fn) {
                            fns.push(fn);
                        }
                    }
                    key = keys.next();
                }

                for (const fn of fns) {
                    listeners.delete(fn, options);
                }

                if (listeners.size() === 0) {
                    listenerEventMap.delete(types);
                }
            }

            if (listenerEventMap.size === 0) {
                EventManager.instance.generalEventInstance.delete(target);
            }

            const extendedEventKey = EventManager.extendedEventKey(type);
            if (extendedEventKey) {
                const keys = listenerEventMap.keys();
                let key = keys.next();
                let removeExtendedEvent = true;

                loop: while (!key.done) {
                    const types = key.value;
                    for (const type of EventManager.toArray(types)) {
                        if (extendedEventKey === EventManager.extendedEventKey(type)) {
                            removeExtendedEvent = false;
                            break loop;
                        }
                    }
                    key = keys.next();
                }

                if (removeExtendedEvent) {
                    EventManager.removeExtendedEvent(target, extendedEventKey as ExtendedEventType, options)
                }
            }
        }
    }

    private static matchAndRemoveListener(target: EventTarget, types: keyof ExtendedHTMLElementEventMap, callback: EventListenerOrEventListenerObject, comparator?: EventListenerOrEventListenerObject, options?: AddEventListenerOptionsOrBoolean): EventListenerOrEventListenerObject | undefined {
        if (!comparator || comparator === callback) {
            return EventManager.removeEventListenerOne(target, types, callback, options);
        }
        return;
    }

    private static removeEventListenerOne(target: EventTarget, types: keyof ExtendedHTMLElementEventMap, callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptionsOrBoolean): EventListenerOrEventListenerObject | undefined {
        const newCallback = EventManager.instance.generalEventInstance.get(target)?.get(types)?.get(callback, options);
        if (newCallback) {
            new EventListenerRegister(target).removeEventListener(types, newCallback, options);
            EventManager.instance.generalEventInstance.get(target)?.get(types)?.delete(callback, options);
        }
        return callback;
    }

    private static storeEventListener(target: EventTarget, types: EventHandlersEventMaps, callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptionsOrBoolean): EventListener {
        const listeners = EventManager.getOrCreateListenerMap(target, types);

        const newCallback = listeners.set(target, types, callback, options);

        EventManager.getOrCreateEventListenerEventMap(target).set(types, listeners);

        return newCallback;
    }

    private static getOrCreateListenerMap(target: EventTarget, types: EventHandlersEventMaps): EventListenerMap {
        const listenerEventMap = EventManager.getOrCreateEventListenerEventMap(target);
        const listeners = listenerEventMap.get(types);

        if (listeners) {
            return listeners;
        } else {
            const newMap: EventListenerMap = new EventListenerMap();
            listenerEventMap.set(types, newMap);

            return newMap;
        }
    }

    private static getOrCreateEventListenerEventMap(target: EventTarget): EventListenerEventMap {
        const listenerEventMap = EventManager.instance.generalEventInstance.get(target);

        if (listenerEventMap) {
            return listenerEventMap;
        } else {
            const newMap = new Map();
            EventManager.instance.generalEventInstance.set(target, newMap);

            return newMap;
        }
    }

    private static getExtendedEvent(target: EventTarget): ExtendedEventInstance | undefined {
        return EventManager.instance.extendedEventInstance.get(target);
    }

    private static addExtendedEvent(target: EventTarget, extendedEvent: ExtendedEventType, implementation: ExtendedEventImplementation): void {
        const existingEvents = EventManager.getExtendedEvent(target) || {} as ExtendedEventInstance;
        EventManager.instance.extendedEventInstance.set(target, {...existingEvents, [extendedEvent]: implementation});
    }

    private static hasExtendedEventImplementation(target: EventTarget, extendedEvent: ExtendedEventType): boolean {
        return !!EventManager.getExtendedEvent(target)?.[extendedEvent];
    }

    private static removeExtendedEvent(target: EventTarget, extendedEvent: ExtendedEventType, options?: AddEventListenerOptionsOrBoolean): void {
        const extendedInstance = EventManager.getExtendedEvent(target);

        if (extendedInstance) {
            const implementation = extendedInstance[extendedEvent];
            if (implementation) {
                for (const type in implementation) {
                    const callbacks = implementation[type as keyof ExtendedEventImplementation | 'callback'];
                    if (callbacks instanceof Array) {
                        for (const callback of callbacks) {
                            EventManager.removeEventListener(target, type, callback, options);
                        }
                    } else if (typeof callbacks === 'function') {
                        callbacks();
                    }
                }
            }
            delete extendedInstance[extendedEvent];

            if (Object.keys(extendedInstance).length === 0) {
                EventManager.instance.extendedEventInstance.delete(target);
            }
        }
    }

    private static addMouseLongpressEvent(target: EventTarget): void {
        if (!EventManager.hasExtendedEventImplementation(target, 'mouselongpress')) {
            let mouseDownPosition: EventPosition | undefined;
            let timeout: number | undefined;
            let isMouseDown = false;

            const clear = () => {
                EventManager.removeEventListener(target, 'mousemove', onMouseMove);
                EventManager.removeEventListener(target, 'mouseup', onMouseUp);
                EventManager.removeEventListener(target, 'mouseleave', onMouseLeave);
                if (timeout) window.clearTimeout(timeout);
            };

            const onMouseDown = (event: Event) => {
                isMouseDown = true;
                mouseDownPosition = EventPosition.fromMouseEvent(event);
                clear();
                EventManager.addEventListener(target, 'mousemove', onMouseMove, {passive: false});

                timeout = window.setTimeout(() => {
                    EventManager.dispatchEvent(target, new ExtendedMouseEvent('mouselongpressstart', event));
                    EventManager.removeEventListener(target, 'mouseup', clear);
                    EventManager.removeEventListener(target, 'mouseleave', clear);
                    EventManager.addEventListener(target, 'mouseup', onMouseUp, {passive: false});
                    EventManager.addEventListener(target, 'mouseleave', onMouseLeave, {passive: false});
                }, EventManager.options.mouseLongpressTimeRequired);
            };

            const onMouseUp = (event: Event) => {
                if (mouseDownPosition) {
                    EventManager.dispatchEvent(target, new ExtendedMouseEvent('mouselongpressend', event, [new EventPath(mouseDownPosition, EventPosition.fromMouseEvent(event))]));
                }
                clear();
            };

            const onMouseLeave = (event: Event) => {
                if (mouseDownPosition) {
                    EventManager.dispatchEvent(target, new ExtendedMouseEvent('mouselongpressleave', event, [new EventPath(mouseDownPosition, EventPosition.fromMouseEvent(event))]));
                }
                clear();
            };

            const setMouseDownState = () => {
                isMouseDown = false;
            };

            const onMouseMove = (event: Event) => {
                if (!isMouseDown) {
                    clear();
                    return;
                }

                if (mouseDownPosition) {
                    const mouseMovePosition = EventPosition.fromMouseEvent(event);

                    if (mouseDownPosition.timeDiff(mouseMovePosition) < EventManager.options.mouseLongpressTimeRequired && mouseDownPosition.distance(mouseMovePosition) > EventManager.options.mouseLongpressBelowDistance) {
                        clear();
                    } else if (mouseDownPosition.timeDiff(mouseMovePosition) >= EventManager.options.mouseLongpressTimeRequired) {
                        if (EventManager.options.strict) {
                            EventManager.dispatchEvent(target, new ExtendedMouseEvent('mouselongpressmove', event, [new EventPath(mouseDownPosition!, mouseMovePosition)]));
                        } else {
                            scheduler.scheduleTask(() => {
                                if (isMouseDown) {
                                    EventManager.dispatchEvent(target, new ExtendedMouseEvent('mouselongpressmove', event, [new EventPath(mouseDownPosition!, mouseMovePosition)]));
                                }
                            });
                        }
                    }
                }
            };

            EventManager.addEventListener(target, 'mousedown', onMouseDown, {passive: false});
            EventManager.addEventListener(target, 'mouseup', clear, {passive: false});
            EventManager.addEventListener(target, 'mouseleave', clear, {passive: false});
            EventManager.addEventListener(target, 'mouseup', setMouseDownState, {passive: false});
            EventManager.addEventListener(target, 'mouseleave', setMouseDownState, {passive: false});

            EventManager.addExtendedEvent(target, 'mouselongpress', {
                'mousedown': [onMouseDown],
                'mouseup': [onMouseUp, setMouseDownState, clear],
                'mouseleave': [onMouseUp, setMouseDownState, clear],
                'mousemove': [onMouseMove]
            });
        }
    }

    private static addMousePanEvent(target: EventTarget): void {
        if (!EventManager.hasExtendedEventImplementation(target, 'mousepan')) {
            let mouseDownPosition: EventPosition | undefined;
            let previousPosition: EventPosition | undefined;
            let mousepanPath: EventPath[] = [];
            let isGestureActive = false;
            let isMouseDown = false;

            const clear = () => {
                mousepanPath = [];
                isGestureActive = false;
                EventManager.removeEventListener(target, 'mousemove', onMouseMove);
                EventManager.removeEventListener(target, 'mouseup', onMouseUp);
                EventManager.removeEventListener(target, 'mouseleave', onMouseLeave);
            };

            const onMouseDown = (event: Event) => {
                isMouseDown = true;
                mouseDownPosition = EventPosition.fromMouseEvent(event);
                previousPosition = mouseDownPosition;
                clear();
                EventManager.addEventListener(target, 'mousemove', onMouseMove, {passive: false});
                EventManager.addEventListener(target, 'mouseup', onMouseUp, {passive: false});
                EventManager.addEventListener(target, 'mouseleave', onMouseLeave, {passive: false});
            };

            const onMouseUp = (event: Event) => {
                if (isGestureActive && mouseDownPosition) {
                    parseDirection(event)
                    EventManager.dispatchEvent(target, new ExtendedMouseEvent('mousepanend', event, [new EventPath(mouseDownPosition, EventPosition.fromMouseEvent(event))]));
                }
                clear();
            };

            const onMouseLeave = (event: Event) => {
                if (isGestureActive && mouseDownPosition) {
                    parseDirection(event)
                    EventManager.dispatchEvent(target, new ExtendedMouseEvent('mousepanleave', event, [new EventPath(mouseDownPosition, EventPosition.fromMouseEvent(event))]));
                }
                clear();
            };

            const setMouseDownState = () => {
                isMouseDown = false;
            };

            const parseDirection = (event: Event) => {
                if (mouseDownPosition) {
                    let newMousepanPath = [];
                    let position;
                    for (const path of mousepanPath) {
                        if (!position) {
                            position = path.start;
                        }

                        const newPath = new EventPath(position, path.end);
                        if (newPath.distance >= 25) {
                            newMousepanPath.push(newPath);
                            position = null;
                        }
                    }

                    const directions = new Set(newMousepanPath.map(path => Direction.get4Direction(path.degree)));

                    if (directions.size === 1) {
                        let type;

                        if (directions.has(0)) {
                            type = 'mousepanup';
                        } else if (directions.has(2)) {
                            type = 'mousepanright';
                        } else if (directions.has(4)) {
                            type = 'mousepandown';
                        } else if (directions.has(6)) {
                            type = 'mousepanleft';
                        }

                        if (type) {
                            EventManager.dispatchEvent(target, new ExtendedMouseEvent(type, event, newMousepanPath));
                        }
                    }
                }
            };

            const onMouseMove = (event: Event) => {
                if (previousPosition && mouseDownPosition) {

                    const mouseMovePosition = EventPosition.fromMouseEvent(event);
                    const path = new EventPath(previousPosition, mouseMovePosition);
                    const length = mousepanPath.length;

                    previousPosition = mouseMovePosition;

                    if (length === 0 && path.distance > 0) {
                        EventManager.dispatchEvent(target, new ExtendedMouseEvent('mousepanstart', event, mousepanPath));
                    }

                    if (path.distance > 0) {
                        isGestureActive = true;
                        mousepanPath.push(path);

                        if (EventManager.options.strict) {
                            EventManager.dispatchEvent(target, new ExtendedMouseEvent('mousepanmove', event, mousepanPath));
                        } else {
                            scheduler.scheduleTask(() => {
                                if (isMouseDown) {
                                    EventManager.dispatchEvent(target, new ExtendedMouseEvent('mousepanmove', event, mousepanPath));
                                }
                            });
                        }
                    }
                }
            };

            EventManager.addEventListener(target, 'mousedown', onMouseDown, {passive: false});
            EventManager.addEventListener(target, 'mouseup', setMouseDownState, {passive: false});
            EventManager.addEventListener(target, 'mouseleave', setMouseDownState, {passive: false});

            EventManager.addExtendedEvent(target, 'mousepan', {
                'mousedown': [onMouseDown],
                'mouseup': [onMouseUp, setMouseDownState],
                'mouseleave': [onMouseLeave, setMouseDownState],
                'mousemove': [onMouseMove]
            });
        }
    }

    private static addTouchLongpressEvent(target: EventTarget): void {
        if (!EventManager.hasExtendedEventImplementation(target, 'touchlongpress')) {
            let touchStartPosition: EventPosition | undefined;
            let previousPosition: EventPosition | undefined;
            let timeout: number | undefined;
            let isGestureActive = false;
            let isTouchDown = false;

            const clear = () => {
                isGestureActive = false;
                EventManager.removeEventListener(target, 'touchmove', onTouchMove);
                EventManager.removeEventListener(target, 'touchend', onTouchEnd);
                EventManager.removeEventListener(target, 'touchcancel', onTouchCancel);
                if (timeout) window.clearTimeout(timeout);
            };

            const onTouchStart = (event: Event) => {
                if (event instanceof TouchEvent && event.touches.length === 1) {
                    DefaultGesturePreventer.activePreventDefaultSelectGesture().then(() => {
                        isTouchDown = true;
                        touchStartPosition = EventPosition.fromTouchEvent(event, 0);
                        previousPosition = touchStartPosition;
                        clear();
                        EventManager.addEventListener(target, 'touchmove', onTouchMove, {passive: false});

                        timeout = window.setTimeout(() => {
                            if (isTouchDown) {
                                isGestureActive = true;
                                EventManager.dispatchEvent(target, new ExtendedTouchEvent('touchlongpressstart', event));
                                EventManager.removeEventListener(target, 'touchend', clear);
                                EventManager.removeEventListener(target, 'touchcancel', clear);
                                EventManager.addEventListener(target, 'touchend', onTouchEnd, {passive: false});
                                EventManager.addEventListener(target, 'touchcancel', onTouchCancel, {passive: false});
                            }
                        }, EventManager.options.touchLongpressTimeRequired);
                    });
                } else if (isGestureActive) {
                    onTouchCancel(event);
                } else {
                    clear();
                }
            };

            const onTouchEnd = (event: Event) => {
                if (touchStartPosition && previousPosition) {
                    EventManager.dispatchEvent(target, new ExtendedTouchEvent('touchlongpressend', event, [new EventPath(touchStartPosition, previousPosition)]));
                }
                clear();
            };

            const onTouchCancel = (event: Event) => {
                if (touchStartPosition && previousPosition) {
                    EventManager.dispatchEvent(target, new ExtendedTouchEvent('touchlongpresscancel', event, [new EventPath(touchStartPosition, previousPosition)]));
                }
                clear();
            };

            const setTouchDownState = () => {
                isTouchDown = false;
                DefaultGesturePreventer.inactivePreventDefaultSelectGesture();
            };

            const onTouchMove = (event: Event) => {
                if (event instanceof TouchEvent && event.touches.length === 1) {
                    if (!isTouchDown) {
                        clear();
                        return;
                    }

                    if (touchStartPosition) {
                        const touchMovePosition = EventPosition.fromTouchEvent(event, 0);

                        if (touchStartPosition.timeDiff(touchMovePosition) < EventManager.options.touchLongpressTimeRequired && touchStartPosition.distance(touchMovePosition) > EventManager.options.touchLongpressBelowDistance) {
                            clear();
                        } else if (touchStartPosition.timeDiff(touchMovePosition) >= EventManager.options.touchLongpressTimeRequired && previousPosition) {
                            const touchMovePosition = EventPosition.fromTouchEvent(event, 0);
                            const path = new EventPath(previousPosition, touchMovePosition);

                            if (path.distance > 0) {
                                if (EventManager.options.strict) {
                                    EventManager.dispatchEvent(target, new ExtendedTouchEvent('touchlongpressmove', event, [new EventPath(touchStartPosition!, touchMovePosition)]));
                                } else {
                                    scheduler.scheduleTask(() => {
                                        if (isTouchDown) {
                                            EventManager.dispatchEvent(target, new ExtendedTouchEvent('touchlongpressmove', event, [new EventPath(touchStartPosition!, touchMovePosition)]));
                                        }
                                    });
                                }
                            }
                        }

                        previousPosition = touchMovePosition;
                    }
                }
            };

            const preventDefault = (event: Event) => event.preventDefault();

            EventManager.addEventListener(target, 'contextmenu', preventDefault, {passive: false});
            EventManager.addEventListener(target, 'touchstart', onTouchStart, {passive: false});
            EventManager.addEventListener(target, 'touchend', clear, {passive: false});
            EventManager.addEventListener(target, 'touchcancel', clear, {passive: false});
            EventManager.addEventListener(target, 'touchend', setTouchDownState, {passive: false});
            EventManager.addEventListener(target, 'touchcancel', setTouchDownState, {passive: false});

            EventManager.addExtendedEvent(target, 'touchlongpress', {
                'contextmenu': [preventDefault],
                'touchstart': [onTouchStart],
                'touchend': [onTouchEnd, setTouchDownState, clear],
                'touchcancel': [onTouchCancel, setTouchDownState, clear],
                'touchmove': [onTouchMove]
            });
        }
    }

    private static addTouchPanEvent(target: EventTarget): void {
        if (!EventManager.hasExtendedEventImplementation(target, 'touchpan')) {
            let touchStartPosition: EventPosition | undefined;
            let previousPosition: EventPosition | undefined;
            let touchpanPath: EventPath[] = [];
            let isGestureActive = false;
            let isTouchDown = false;

            const clear = () => {
                touchpanPath = [];
                isGestureActive = false;
                EventManager.removeEventListener(target, 'touchmove', onTouchMove);
                EventManager.removeEventListener(target, 'touchend', onTouchEnd);
                EventManager.removeEventListener(target, 'touchcancel', onTouchCancel);
            };

            const onTouchStart = (event: Event) => {
                if (event instanceof TouchEvent && event.touches.length === 1) {
                    DefaultGesturePreventer.activePreventDefaultPanGesture().then(() => {
                        isTouchDown = true;
                        touchStartPosition = EventPosition.fromTouchEvent(event, 0);
                        previousPosition = touchStartPosition;
                        clear();
                        EventManager.addEventListener(target, 'touchmove', onTouchMove, {passive: false});
                        EventManager.addEventListener(target, 'touchend', onTouchEnd, {passive: false});
                        EventManager.addEventListener(target, 'touchcancel', onTouchCancel, {passive: false});
                    });
                } else if (isGestureActive) {
                    onTouchCancel(event);
                }
            };

            const onTouchEnd = (event: Event) => {
                if (isGestureActive && touchStartPosition && previousPosition) {
                    parseDirection(event);
                    EventManager.dispatchEvent(target, new ExtendedTouchEvent('touchpanend', event, [new EventPath(touchStartPosition, previousPosition)]));
                }
                clear();
            };

            const onTouchCancel = (event: Event) => {
                if (isGestureActive && touchStartPosition && previousPosition) {
                    EventManager.dispatchEvent(target, new ExtendedTouchEvent('touchpancancel', event, [new EventPath(touchStartPosition, previousPosition)]));
                }
                clear();
            };

            const setTouchDownState = () => {
                isTouchDown = false;
                DefaultGesturePreventer.inactivePreventDefaultPanGesture();
            };

            const parseDirection = (event: Event) => {
                if (touchStartPosition) {
                    let newTouchpanPath = [];
                    let position;
                    for (const path of touchpanPath) {
                        if (!position) {
                            position = path.start;
                        }

                        const newPath = new EventPath(position, path.end);
                        if (newPath.distance >= 25) {
                            newTouchpanPath.push(newPath);
                            position = null;
                        }
                    }

                    const directions = new Set(newTouchpanPath.map(path => Direction.get4Direction(path.degree)));

                    if (directions.size === 1) {
                        let type;

                        if (directions.has(0)) {
                            type = 'touchpanup';
                        } else if (directions.has(2)) {
                            type = 'touchpanright';
                        } else if (directions.has(4)) {
                            type = 'touchpandown';
                        } else if (directions.has(6)) {
                            type = 'touchpanleft';
                        }

                        if (type) {
                            EventManager.dispatchEvent(target, new ExtendedMouseEvent(type, event, newTouchpanPath));
                        }
                    }
                }
            };

            const onTouchMove = (event: Event) => {
                if (event instanceof TouchEvent && event.touches.length === 1) {
                    if (previousPosition && touchStartPosition) {
                        const touchMovePosition = EventPosition.fromTouchEvent(event, 0);
                        const path = new EventPath(previousPosition, touchMovePosition);
                        const length = touchpanPath.length;

                        previousPosition = touchMovePosition;

                        if (length === 0 && path.distance > 0) {
                            EventManager.dispatchEvent(target, new ExtendedTouchEvent('touchpanstart', event, touchpanPath));
                        }

                        if (path.distance > 0) {
                            isGestureActive = true;
                            touchpanPath.push(path);

                            if (EventManager.options.strict) {
                                EventManager.dispatchEvent(target, new ExtendedTouchEvent('touchpanmove', event, touchpanPath));
                            } else {
                                scheduler.scheduleTask(() => {
                                    if (isTouchDown) {
                                        EventManager.dispatchEvent(target, new ExtendedTouchEvent('touchpanmove', event, touchpanPath));
                                    }
                                });
                            }
                        }
                    }
                }
            };

            const preventDefault = (event: Event) => event.preventDefault();

            EventManager.addEventListener(target, 'contextmenu', preventDefault, {passive: false});
            EventManager.addEventListener(target, 'touchstart', onTouchStart, {passive: false});
            EventManager.addEventListener(target, 'touchend', setTouchDownState, {passive: false});
            EventManager.addEventListener(target, 'touchcancel', setTouchDownState, {passive: false});

            EventManager.addExtendedEvent(target, 'touchpan', {
                'contextmenu': [preventDefault],
                'touchstart': [onTouchStart],
                'touchend': [onTouchEnd, setTouchDownState],
                'touchcancel': [onTouchCancel, setTouchDownState],
                'touchmove': [onTouchMove]
            });
        }
    }

    private static addTouchPinchEvent(target: EventTarget): void {
        if (!EventManager.hasExtendedEventImplementation(target, 'touchpinch')) {
            let touchStartPosition: EventPosition[] = [];
            let touchStartPath: EventPath | undefined;
            let previousPosition: EventPosition[] = [];
            let touchpinchPath: EventPath[] = [];
            let isGestureActive = false;
            let isTouchDown = false;

            const clear = () => {
                touchStartPosition = [];
                previousPosition = [];
                touchpinchPath = [];
                isGestureActive = false;
                EventManager.removeEventListener(target, 'touchmove', onTouchMove);
                EventManager.removeEventListener(target, 'touchend', onTouchEnd);
                EventManager.removeEventListener(target, 'touchcancel', onTouchCancel);
                DefaultGesturePreventer.inactivePreventDefaultPinchGesture();
            };

            const onTouchStart = (event: Event) => {
                if (event instanceof TouchEvent && event.touches.length > 1) {
                    DefaultGesturePreventer.activePreventDefaultPinchGesture().then(() => {
                        const touchLength = event.touches.length;

                        isTouchDown = true;
                        clear();

                        for (let i = 0; i < touchLength; i++) {
                            touchStartPosition.push(EventPosition.fromTouchEvent(event, i));
                        }
                        previousPosition = touchStartPosition;
                        touchStartPath = new EventPath(touchStartPosition[0], touchStartPosition[1]);
                        EventManager.addEventListener(target, 'touchmove', onTouchMove, {passive: false});
                        EventManager.addEventListener(target, 'touchend', onTouchEnd, {passive: false});
                        EventManager.addEventListener(target, 'touchcancel', onTouchCancel, {passive: false});
                    });
                }
            };

            const onTouchEnd = (event: Event) => {
                if (isGestureActive && touchStartPosition && previousPosition) {
                    EventManager.dispatchEvent(target, new ExtendedTouchEvent('touchpinchend', event, [new EventPath(EventPosition.center(touchStartPosition[0], touchStartPosition[1]), EventPosition.center(previousPosition[0], previousPosition[1]))]));
                }
                clear();
            };

            const onTouchCancel = (event: Event) => {
                if (isGestureActive && touchStartPosition && previousPosition) {
                    EventManager.dispatchEvent(target, new ExtendedTouchEvent('touchpinchcancel', event, [new EventPath(EventPosition.center(touchStartPosition[0], touchStartPosition[1]), EventPosition.center(previousPosition[0], previousPosition[1]))]));
                }
                clear();
            };

            const setTouchDownState = () => {
                isTouchDown = false;
                DefaultGesturePreventer.inactivePreventDefaultPinchGesture();
            };

            const onTouchMove = (event: Event) => {
                if (previousPosition.length > 1 && touchStartPosition.length > 1 && touchStartPath && event instanceof TouchEvent && event.touches.length > 1) {
                    const touchLength = event.touches.length;
                    const touchMovePosition = [];
                    const paths = [];
                    const length = touchpinchPath.length;

                    for (let i = 0; i < touchLength; i++) {
                        const position = EventPosition.fromTouchEvent(event, i);
                        touchMovePosition.push(position);
                        paths.push(new EventPath(position, touchMovePosition[i]));
                    }

                    const path = new EventPath(touchMovePosition[0], touchMovePosition[1]);

                    previousPosition = touchMovePosition;

                    if (length === 0 && !touchStartPath.equals(path)) {
                        EventManager.dispatchEvent(target, new ExtendedTouchEvent('touchpinchstart', event, touchpinchPath));
                    }

                    if (!(length === 0 && touchStartPath.equals(path)) && !(length > 0 && touchpinchPath[length - 1].equals(path))) {
                        isGestureActive = true;
                        touchpinchPath.push(path);

                        if (EventManager.options.strict) {
                            EventManager.dispatchEvent(target, new ExtendedTouchEvent('touchpinchmove', event, touchpinchPath));
                        } else {
                            scheduler.scheduleTask(() => {
                                if (isTouchDown) {
                                    EventManager.dispatchEvent(target, new ExtendedTouchEvent('touchpinchmove', event, touchpinchPath));
                                }
                            });
                        }
                    }
                }
            };

            const preventDefault = (event: Event) => event.preventDefault();

            EventManager.addEventListener(target, 'contextmenu', preventDefault, {passive: false});
            EventManager.addEventListener(target, 'touchstart', onTouchStart, {passive: false});
            EventManager.addEventListener(target, 'touchend', setTouchDownState, {passive: false});
            EventManager.addEventListener(target, 'touchcancel', setTouchDownState, {passive: false});

            EventManager.addExtendedEvent(target, 'touchpinch', {
                'contextmenu': [preventDefault],
                'touchstart': [onTouchStart],
                'touchend': [onTouchEnd, setTouchDownState],
                'touchcancel': [onTouchCancel, setTouchDownState],
                'touchmove': [onTouchMove]
            });
        }
    }

    private static addAppearanceChange(target: EventTarget): void {
        const global = window as any;
        const matchMedia = global.matchMedia || global.msMatchMedia;

        if (!matchMedia) return;

        const matchPrefersColorSchemeDark = matchMedia('(prefers-color-scheme: dark)');

        const getAppearance = (event: any) => {
            if (event.matches) {
                return Appearance.Dark;
            }

            return Appearance.Light;
        }

        const onChange = (event: Event) => {
            EventManager.dispatchEvent(target, new ExtendedUIEvent('appearancechange', event, {appearance: getAppearance(event)}));
        }

        matchPrefersColorSchemeDark.addEventListener('change', onChange, {passive: false});

        if (EventManager.options.callWhenAddedUIEvent) {
            EventManager.dispatchEvent(target, new ExtendedUIEvent('appearancechange', new MediaQueryListEvent('change'), {appearance: getAppearance(matchPrefersColorSchemeDark)}));
        }

        EventManager.addExtendedEvent(matchPrefersColorSchemeDark, 'appearancechange', {
            'change': [onChange]
        });
    }

    private static addOrientationChange(target: EventTarget): void {
        const global = window as any;
        const matchMedia = global.matchMedia || global.msMatchMedia;

        if (!matchMedia) return;

        const matchOrientationPortrait = matchMedia('(orientation: portrait)');

        const getOrientation = (event: any) => {
            if (event.matches) {
                return Orientation.Portrait;
            }

            return Orientation.Landscape;
        }

        const onChange = (event: any) => {
            EventManager.dispatchEvent(target, new ExtendedUIEvent('orientationchange', event, {orientation: getOrientation(event)}));
        }

        matchOrientationPortrait.addEventListener('change', onChange, {passive: false});

        if (EventManager.options.callWhenAddedUIEvent) {
            EventManager.dispatchEvent(target, new ExtendedUIEvent('appearancechange', new MediaQueryListEvent('change'), {appearance: getOrientation(matchOrientationPortrait)}));
        }

        EventManager.addExtendedEvent(matchOrientationPortrait, 'orientationchange', {
            'change': [onChange]
        });
    }

    private static addResize(target: EventTarget): void {
        if (target === window || !('ResizeObserver' in window)) return;

        const element = target as Element;
        const onResize = (element: Element) => {
            const dispatchEvent = () => EventManager.dispatchEvent(target, new ExtendedUIEvent('resize', new Event('resize'), {size: new Size(element)}));

            if (EventManager.options.strict) {
                dispatchEvent();
            } else {
                scheduler.scheduleTask(dispatchEvent);
            }
        }

        let connect = false;
        let observer: ResizeObserver;

        if (EventManager.resizeObserver) {
            observer = EventManager.resizeObserver;
        } else {
            observer = new ResizeObserver(() => {
                if (connect || EventManager.options.callWhenAddedUIEvent) {
                    onResize(element);
                }
                connect = true;
            });

            EventManager.resizeObserver = observer;
        }

        observer.observe(element);

        EventManager.addExtendedEvent(target, 'resize', {
            'callback': () => observer.unobserve(element)
        });
    }

    private static addIntersection(target: EventTarget): void {
        if (target === window || !('IntersectionObserver' in window)) return;

        const element = target as Element;
        const onIntersection = (entry: IntersectionObserverEntry) => {
            const dispatchEvent = () => EventManager.dispatchEvent(target, new ExtendedUIEvent('intersectionchange', new Event('intersectionchange'), {size: new Size(entry.intersectionRect), ration: entry.intersectionRatio}));

            if (EventManager.options.strict) {
                dispatchEvent();
            } else {
                scheduler.scheduleTask(dispatchEvent);
            }
        }

        let connect = false;
        let observer: IntersectionObserver;

        if (EventManager.intersectionObserver) {
            observer = EventManager.intersectionObserver;
        } else {
            observer = new IntersectionObserver(entries => {
                if (connect || EventManager.options.callWhenAddedUIEvent) {
                    if (entries.length > 0) {
                        const entry = entries[0];
                        onIntersection(entry);
                    }
                }
                connect = true;
            }, {
                threshold: Array.from({length: 1001}, (_, i) => i / 1000)
            });

            EventManager.intersectionObserver = observer;
        }

        observer.observe(element);

        EventManager.addExtendedEvent(target, 'intersection', {
            'callback': () => {
                observer.unobserve(element);
            }
        });
    }

    private static toArray<T>(input: T | T[]): T[] {
        return Array.isArray(input) ? input : [input];
    }
}

(() => {
    GlobalThis.ExtendedMouseEvent = ExtendedMouseEvent;
    GlobalThis.ExtendedTouchEvent = ExtendedTouchEvent;
    GlobalThis.ExtendedUIEvent = ExtendedUIEvent;
    GlobalThis.EventManager = EventManager;
    GlobalThis.EventPath = EventPath;
    GlobalThis.EventPathList = EventPathList;
    GlobalThis.EventPosition = EventPosition;
    GlobalThis.Direction = Direction;
    GlobalThis.Appearance = Appearance;
    GlobalThis.Orientation = Orientation;
    GlobalThis.Size = Size;

    EventTarget.prototype.on = function (types: EventHandlersEventMaps, callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptionsOrBoolean) {
        EventManager.on(this, types, callback, options);
    };

    EventTarget.prototype.off = function (types?: EventHandlersEventMaps, callback?: EventListenerOrEventListenerObject, options?: AddEventListenerOptionsOrBoolean) {
        EventManager.off(this, types, callback, options);
    };
})();

declare global {
    interface Window {
        EventManager: EventManager;
        ExtendedMouseEvent: ExtendedMouseEvent;
        ExtendedTouchEvent: ExtendedTouchEvent;
        ExtendedUIEvent: ExtendedUIEvent<Extract<string, keyof UIEvent>, ExtendedUIEventProperty>;
        EventPosition: EventPosition;
        EventPath: EventPath;
        EventPathList: EventPathList;
        Direction: Direction;
        Appearance: Appearance;
        Orientation: Orientation;
        Size: Size;
    }

    interface EventTarget {
        on: (types: EventHandlersEventMaps, callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptionsOrBoolean) => void;
        off: (types?: EventHandlersEventMaps, callback?: EventListenerOrEventListenerObject, options?: AddEventListenerOptionsOrBoolean) => void;
    }
}