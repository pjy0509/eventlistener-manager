import { EventHandlersEventMaps, EventManagerInstance } from "./interfacecs";
import { ExtendedMouseEvent, ExtendedTouchEvent } from "./event";
import { EventPath, EventPathList, EventPosition, PathDirection } from "./geometry";
export declare class EventManager {
    static instance: EventManagerInstance;
    static options: {
        strict: boolean;
        mouseLongpressTimeRequired: number;
        mouseLongpressBelowDistance: number;
        touchLongpressTimeRequired: number;
        touchLongpressBelowDistance: number;
    };
    static passiveSupported: boolean;
    static onceSupported: boolean;
    static add(target: EventTarget, types: EventHandlersEventMaps, callback: EventListenerOrEventListenerObject, options?: EventListenerOptions): void;
    private static extendedEventKey;
    private static addExtendedEventListener;
    static remove(target: EventTarget, types?: EventHandlersEventMaps, callback?: EventListenerOrEventListenerObject): void;
    private static removeEventListenerFromType;
    private static matchAndRemoveListener;
    private static removeEventListenerOne;
    private static storeEventListener;
    private static getOrCreateListenerMap;
    private static getOrCreateEventListenerEventMap;
    private static getExtendedEvent;
    private static addExtendedEvent;
    private static hasExtendedEventImplementation;
    private static removeExtendedEvent;
    private static addMouseLongpressEvent;
    private static addMousePanEvent;
    private static addTouchLongpressEvent;
    private static addTouchPanEvent;
    private static addTouchpinchEvent;
    private static toArray;
}
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
}
