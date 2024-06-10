import {DefaultGesturePreventer, EventType, TaskScheduler} from "./utils";
import {AddEventListenerOptionsOrBoolean, EventHandlersEventMaps, EventListenerEventMap, EventManagerInstance, ExtendedEventImplementation, ExtendedEventInstance, ExtendedEventMap, extendedEventMap, ExtendedEventType, ExtendedHTMLElementEventMap} from "./interfacecs";
import {ExtendedMouseEvent, ExtendedTouchEvent} from "./event";
import {EventPath, EventPathList, EventPosition, PathDirection} from "./geometry";

export { EventPath, EventPathList, EventPosition, PathDirection, ExtendedMouseEvent, ExtendedTouchEvent };

(() => {
    if (typeof window !== 'undefined' && typeof window.TouchEvent === 'undefined') {
        class TouchEvent extends UIEvent {
            constructor(type: string, init?: TouchEventInit) {
                super(type, init);
            }
        }

        (window as any).TouchEvent = TouchEvent;
    }
})();

// class
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
    };

    static passiveSupported = false;
    static onceSupported = false;

    static add(target: EventTarget, types: EventHandlersEventMaps, callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptionsOrBoolean): void {
        for (const type of EventManager.toArray(types)) {
            if (!!EventManager.extendedEventKey(type)) {
                EventManager.addExtendedEventListener(target, types, callback);
            } else {
                const eventType = EventType.get(target, type);
                if (!eventType) {
                    continue;
                }
                target.addEventListener(type, callback, options);
            }

            EventManager.storeEventListener(target, type, callback);
        }
    }

    private static extendedEventKey(type: string): string | undefined {
        return extendedEventMap[type as keyof ExtendedEventMap];
    }

    private static addExtendedEventListener(target: EventTarget, types: EventHandlersEventMaps, callback: EventListenerOrEventListenerObject): void {
        for (const type of EventManager.toArray(types)) {
            target.addEventListener(type, callback);

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
                    EventManager.addTouchpinchEvent(target);
                    break;
            }
        }
    }

    static remove(target: EventTarget, types?: EventHandlersEventMaps, callback?: EventListenerOrEventListenerObject): void {
        const listenerEventMap = EventManager.instance.generalEventInstance.get(target);

        if (!listenerEventMap) return;

        if (types) {
            EventManager.removeEventListenerFromType(target, types, callback);
        } else {
            const keys = listenerEventMap.keys();
            let key = keys.next();

            while (!key.done) {
                const types = key.value;
                EventManager.removeEventListenerFromType(target, types, callback);
                key = keys.next();
            }
        }
    }

    private static removeEventListenerFromType(target: EventTarget, types: EventHandlersEventMaps, comparator: EventListenerOrEventListenerObject | undefined): void {
        const listenerEventMap = EventManager.instance.generalEventInstance.get(target);

        if (!listenerEventMap) return;

        for (const type of EventManager.toArray(types)) {
            const fns = [];
            const listeners = listenerEventMap.get(type);

            if (listeners) {
                for (const listener of listeners) {
                    const fn = EventManager.matchAndRemoveListener(target, type, comparator, listener);
                    if (fn) {
                        fns.push(fn);
                    }
                }

                for (const fn of fns) {
                    listeners.splice(listeners.indexOf(fn), 1);
                }

                if (listeners.length === 0) {
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
                    EventManager.removeExtendedEvent(target, extendedEventKey as ExtendedEventType)
                }
            }
        }
    }

    private static matchAndRemoveListener(target: EventTarget, types: keyof ExtendedHTMLElementEventMap, comparator: EventListenerOrEventListenerObject | undefined, callback: EventListenerOrEventListenerObject): EventListenerOrEventListenerObject | undefined {
        if (!comparator || comparator === callback) {
            return EventManager.removeEventListenerOne(target, types, callback);
        }
        return;
    }

    private static removeEventListenerOne(target: EventTarget, types: keyof ExtendedHTMLElementEventMap, callback: EventListenerOrEventListenerObject): EventListenerOrEventListenerObject | undefined {
        target.removeEventListener(types, callback);
        EventManager.instance.generalEventInstance.get(target)?.delete(types);
        return callback;
    }

    private static storeEventListener(target: EventTarget, types: EventHandlersEventMaps, callback: EventListenerOrEventListenerObject): void {
        const listeners = [...EventManager.getOrCreateListenerMap(target, types), callback];

        EventManager.getOrCreateEventListenerEventMap(target).set(types, listeners);
    }

    private static getOrCreateListenerMap(target: EventTarget, types: EventHandlersEventMaps): EventListenerOrEventListenerObject[] {
        const listenerEventMap = EventManager.getOrCreateEventListenerEventMap(target);
        const listeners = listenerEventMap.get(types);

        if (listeners) {
            return listeners;
        } else {
            const newArray: EventListenerOrEventListenerObject[] = [];
            listenerEventMap.set(types, newArray);

            return newArray;
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

    private static removeExtendedEvent(target: EventTarget, extendedEvent: ExtendedEventType): void {
        const extendedInstance = EventManager.getExtendedEvent(target);

        if (extendedInstance) {
            const implementation = extendedInstance[extendedEvent];
            if (implementation) {
                for (const type in implementation) {
                    const callbacks = implementation[type as keyof ExtendedEventImplementation];
                    if (callbacks) {
                        for (const callback of callbacks) {
                            target.removeEventListener(type, callback);
                        }
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
                target.removeEventListener('mousemove', onMouseMove);
                target.removeEventListener('mouseup', onMouseUp);
                target.removeEventListener('mouseleave', onMouseLeave);
                if (timeout) window.clearTimeout(timeout);
            };

            const onMouseDown = (event: Event) => {
                isMouseDown = true;
                mouseDownPosition = EventPosition.fromMouseEvent(event);
                clear();
                target.addEventListener('mousemove', onMouseMove, {passive: false});

                timeout = window.setTimeout(() => {
                    target.dispatchEvent(new ExtendedMouseEvent('mouselongpressstart', event));
                    target.removeEventListener('mouseup', clear);
                    target.removeEventListener('mouseleave', clear);
                    target.addEventListener('mouseup', onMouseUp, {passive: false});
                    target.addEventListener('mouseleave', onMouseLeave, {passive: false});
                }, EventManager.options.mouseLongpressTimeRequired);
            };

            const onMouseUp = (event: Event) => {
                if (mouseDownPosition) {
                    target.dispatchEvent(new ExtendedMouseEvent('mouselongpressend', event, [new EventPath(mouseDownPosition, EventPosition.fromMouseEvent(event))]));
                }
                clear();
            };

            const onMouseLeave = (event: Event) => {
                if (mouseDownPosition) {
                    target.dispatchEvent(new ExtendedMouseEvent('mouselongpressleave', event, [new EventPath(mouseDownPosition, EventPosition.fromMouseEvent(event))]));
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
                            target.dispatchEvent(new ExtendedMouseEvent('mouselongpressmove', event, [new EventPath(mouseDownPosition!, mouseMovePosition)]));
                        } else {
                            scheduler.scheduleTask(() => {
                                if (isMouseDown) {
                                    target.dispatchEvent(new ExtendedMouseEvent('mouselongpressmove', event, [new EventPath(mouseDownPosition!, mouseMovePosition)]));
                                }
                            });
                        }
                    }
                }
            };

            target.addEventListener('mousedown', onMouseDown, {passive: false});
            target.addEventListener('mouseup', clear, {passive: false});
            target.addEventListener('mouseleave', clear, {passive: false});
            target.addEventListener('mouseup', setMouseDownState, {passive: false});
            target.addEventListener('mouseleave', setMouseDownState, {passive: false});

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
                target.removeEventListener('mousemove', onMouseMove);
                target.removeEventListener('mouseup', onMouseUp);
                target.removeEventListener('mouseleave', onMouseLeave);
            };

            const onMouseDown = (event: Event) => {
                isMouseDown = true;
                mouseDownPosition = EventPosition.fromMouseEvent(event);
                previousPosition = mouseDownPosition;
                clear();
                target.addEventListener('mousemove', onMouseMove, {passive: false});
                target.addEventListener('mouseup', onMouseUp, {passive: false});
                target.addEventListener('mouseleave', onMouseLeave, {passive: false});
            };

            const onMouseUp = (event: Event) => {
                if (isGestureActive && mouseDownPosition) {
                    parseDirection(event)
                    target.dispatchEvent(new ExtendedMouseEvent('mousepanend', event, [new EventPath(mouseDownPosition, EventPosition.fromMouseEvent(event))]));
                }
                clear();
            };

            const onMouseLeave = (event: Event) => {
                if (isGestureActive && mouseDownPosition) {
                    parseDirection(event)
                    target.dispatchEvent(new ExtendedMouseEvent('mousepanleave', event, [new EventPath(mouseDownPosition, EventPosition.fromMouseEvent(event))]));
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

                    const directions = new Set(newMousepanPath.map(path => PathDirection.get4Direction(path.degree)));

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
                            target.dispatchEvent(new ExtendedMouseEvent(type, event, newMousepanPath));
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
                        target.dispatchEvent(new ExtendedMouseEvent('mousepanstart', event, mousepanPath));
                    }

                    if (path.distance > 0) {
                        isGestureActive = true;
                        mousepanPath.push(path);

                        if (EventManager.options.strict) {
                            target.dispatchEvent(new ExtendedMouseEvent('mousepanmove', event, mousepanPath));
                        } else {
                            scheduler.scheduleTask(() => {
                                if (isMouseDown) {
                                    target.dispatchEvent(new ExtendedMouseEvent('mousepanmove', event, mousepanPath));
                                }
                            });
                        }
                    }
                }
            };

            target.addEventListener('mousedown', onMouseDown, {passive: false});
            target.addEventListener('mouseup', setMouseDownState, {passive: false});
            target.addEventListener('mouseleave', setMouseDownState, {passive: false});

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
                target.removeEventListener('touchmove', onTouchMove);
                target.removeEventListener('touchend', onTouchEnd);
                target.removeEventListener('touchcancel', onTouchCancel);
                if (timeout) window.clearTimeout(timeout);
            };

            const onTouchStart = (event: Event) => {
                if (event instanceof TouchEvent && event.touches.length === 1) {
                    DefaultGesturePreventer.activePreventDefaultSelectGesture().then(() => {
                        isTouchDown = true;
                        touchStartPosition = EventPosition.fromTouchEvent(event, 0);
                        previousPosition = touchStartPosition;
                        clear();
                        target.addEventListener('touchmove', onTouchMove, {passive: false});

                        timeout = window.setTimeout(() => {
                            if (isTouchDown) {
                                isGestureActive = true;
                                target.dispatchEvent(new ExtendedTouchEvent('touchlongpressstart', event));
                                target.removeEventListener('touchend', clear);
                                target.removeEventListener('touchcancel', clear);
                                target.addEventListener('touchend', onTouchEnd, {passive: false});
                                target.addEventListener('touchcancel', onTouchCancel, {passive: false});
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
                    target.dispatchEvent(new ExtendedTouchEvent('touchlongpressend', event, [new EventPath(touchStartPosition, previousPosition)]));
                }
                clear();
            };

            const onTouchCancel = (event: Event) => {
                if (touchStartPosition && previousPosition) {
                    target.dispatchEvent(new ExtendedTouchEvent('touchlongpresscancel', event, [new EventPath(touchStartPosition, previousPosition)]));
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
                                    target.dispatchEvent(new ExtendedTouchEvent('touchlongpressmove', event, [new EventPath(touchStartPosition!, touchMovePosition)]));
                                } else {
                                    scheduler.scheduleTask(() => {
                                        if (isTouchDown) {
                                            target.dispatchEvent(new ExtendedTouchEvent('touchlongpressmove', event, [new EventPath(touchStartPosition!, touchMovePosition)]));
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

            target.addEventListener('contextmenu', preventDefault, {passive: false});
            target.addEventListener('touchstart', onTouchStart, {passive: false});
            target.addEventListener('touchend', clear, {passive: false});
            target.addEventListener('touchcancel', clear, {passive: false});
            target.addEventListener('touchend', setTouchDownState, {passive: false});
            target.addEventListener('touchcancel', setTouchDownState, {passive: false});

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
                target.removeEventListener('touchmove', onTouchMove);
                target.removeEventListener('touchend', onTouchEnd);
                target.removeEventListener('touchcancel', onTouchCancel);
            };

            const onTouchStart = (event: Event) => {
                if (event instanceof TouchEvent && event.touches.length === 1) {
                    DefaultGesturePreventer.activePreventDefaultPanGesture().then(() => {
                        isTouchDown = true;
                        touchStartPosition = EventPosition.fromTouchEvent(event, 0);
                        previousPosition = touchStartPosition;
                        clear();
                        target.addEventListener('touchmove', onTouchMove, {passive: false});
                        target.addEventListener('touchend', onTouchEnd, {passive: false});
                        target.addEventListener('touchcancel', onTouchCancel, {passive: false});
                    });
                } else if (isGestureActive) {
                    onTouchCancel(event);
                }
            };

            const onTouchEnd = (event: Event) => {
                if (isGestureActive && touchStartPosition && previousPosition) {
                    parseDirection(event);
                    target.dispatchEvent(new ExtendedTouchEvent('touchpanend', event, [new EventPath(touchStartPosition, previousPosition)]));
                }
                clear();
            };

            const onTouchCancel = (event: Event) => {
                if (isGestureActive && touchStartPosition && previousPosition) {
                    target.dispatchEvent(new ExtendedTouchEvent('touchpancancel', event, [new EventPath(touchStartPosition, previousPosition)]));
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

                    const directions = new Set(newTouchpanPath.map(path => PathDirection.get4Direction(path.degree)));

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
                            target.dispatchEvent(new ExtendedMouseEvent(type, event, newTouchpanPath));
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
                            target.dispatchEvent(new ExtendedTouchEvent('touchpanstart', event, touchpanPath));
                        }

                        if (path.distance > 0) {
                            isGestureActive = true;
                            touchpanPath.push(path);

                            if (EventManager.options.strict) {
                                target.dispatchEvent(new ExtendedTouchEvent('touchpanmove', event, touchpanPath));
                            } else {
                                scheduler.scheduleTask(() => {
                                    if (isTouchDown) {
                                        target.dispatchEvent(new ExtendedTouchEvent('touchpanmove', event, touchpanPath));
                                    }
                                });
                            }
                        }
                    }
                }
            };

            const preventDefault = (event: Event) => event.preventDefault();

            target.addEventListener('contextmenu', preventDefault, {passive: false});
            target.addEventListener('touchstart', onTouchStart, {passive: false});
            target.addEventListener('touchend', setTouchDownState, {passive: false});
            target.addEventListener('touchcancel', setTouchDownState, {passive: false});

            EventManager.addExtendedEvent(target, 'touchpan', {
                'contextmenu': [preventDefault],
                'touchstart': [onTouchStart],
                'touchend': [onTouchEnd, setTouchDownState],
                'touchcancel': [onTouchCancel, setTouchDownState],
                'touchmove': [onTouchMove]
            });
        }
    }

    private static addTouchpinchEvent(target: EventTarget): void {
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
                target.removeEventListener('touchmove', onTouchMove);
                target.removeEventListener('touchend', onTouchEnd);
                target.removeEventListener('touchcancel', onTouchCancel);
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
                        target.addEventListener('touchmove', onTouchMove, {passive: false});
                        target.addEventListener('touchend', onTouchEnd, {passive: false});
                        target.addEventListener('touchcancel', onTouchCancel, {passive: false});
                    });
                }
            };

            const onTouchEnd = (event: Event) => {
                if (isGestureActive && touchStartPosition && previousPosition) {
                    target.dispatchEvent(new ExtendedTouchEvent('touchpinchend', event, [new EventPath(EventPosition.center(touchStartPosition[0], touchStartPosition[1]), EventPosition.center(previousPosition[0], previousPosition[1]))]));
                }
                clear();
            };

            const onTouchCancel = (event: Event) => {
                if (isGestureActive && touchStartPosition && previousPosition) {
                    target.dispatchEvent(new ExtendedTouchEvent('touchpinchcancel', event, [new EventPath(EventPosition.center(touchStartPosition[0], touchStartPosition[1]), EventPosition.center(previousPosition[0], previousPosition[1]))]));
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
                        target.dispatchEvent(new ExtendedTouchEvent('touchpinchstart', event, touchpinchPath));
                    }

                    if (!(length === 0 && touchStartPath.equals(path)) && !(length > 0 && touchpinchPath[length - 1].equals(path))) {
                        isGestureActive = true;
                        touchpinchPath.push(path);

                        if (EventManager.options.strict) {
                            target.dispatchEvent(new ExtendedTouchEvent('touchpinchmove', event, touchpinchPath));
                        } else {
                            scheduler.scheduleTask(() => {
                                if (isTouchDown) {
                                    target.dispatchEvent(new ExtendedTouchEvent('touchpinchmove', event, touchpinchPath));
                                }
                            });
                        }
                    }
                }
            };

            const preventDefault = (event: Event) => event.preventDefault();

            target.addEventListener('contextmenu', preventDefault, {passive: false});
            target.addEventListener('touchstart', onTouchStart, {passive: false});
            target.addEventListener('touchend', setTouchDownState, {passive: false});
            target.addEventListener('touchcancel', setTouchDownState, {passive: false});

            EventManager.addExtendedEvent(target, 'touchpinch', {
                'contextmenu': [preventDefault],
                'touchstart': [onTouchStart],
                'touchend': [onTouchEnd, setTouchDownState],
                'touchcancel': [onTouchCancel, setTouchDownState],
                'touchmove': [onTouchMove]
            });
        }
    }

    private static toArray<T>(input: T | T[]): T[] {
        return Array.isArray(input) ? input : [input];
    }
}



(() => {
    try {
        const empty = () => {
        };

        const options = Object.create({}, {
            passive: {
                get() {
                    EventManager.passiveSupported = true;
                    return undefined;
                }
            },
            once: {
                get() {
                    EventManager.onceSupported = true;
                    return undefined;
                }
            },
        });
        window.addEventListener('test', empty, options);
        window.removeEventListener('test', empty, options);
    } catch (e) {
    }

    (window as any).EventManager = EventManager;
    (window as any).EventPath = EventPath;
    (window as any).EventPathList = EventPathList;
    (window as any).EventPosition = EventPosition;
    (window as any).PathDirection = PathDirection;
    (window as any).ExtendedMouseEvent = ExtendedMouseEvent;
    (window as any).ExtendedTouchEvent = ExtendedTouchEvent;

    Element.prototype.addManagedEventListener = function (types: EventHandlersEventMaps, callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptionsOrBoolean) {
        EventManager.add(this, types, callback, options);
    };

    Element.prototype.removeManagedEventListener = function (types?: EventHandlersEventMaps, callback?: EventListenerOrEventListenerObject) {
        EventManager.remove(this, types, callback);
    };
})();

declare global {
    interface Window {
        EventManager: EventManager;
        ExtendedMouseEvent: ExtendedMouseEvent;
        ExtendedTouchEvent: ExtendedTouchEvent;
        PathDirection: PathDirection;
        EventPosition: EventPosition;
        EventPath: EventPath;
        EventPathList: EventPathList;
    }
    
    interface EventTarget {
        addManagedEventListener: (types: EventHandlersEventMaps, callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptionsOrBoolean) => void;
        removeManagedEventListener: (types?: EventHandlersEventMaps, callback?: EventListenerOrEventListenerObject) => void;
    }
}