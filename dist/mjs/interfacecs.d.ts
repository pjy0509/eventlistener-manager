interface ExtendedMouseEventMap {
    'mouselongpressstart': MouseEvent;
    'mouselongpressmove': MouseEvent;
    'mouselongpressend': MouseEvent;
    'mouselongpressleave': MouseEvent;
    'mousepanstart': MouseEvent;
    'mousepanmove': MouseEvent;
    'mousepanleft': MouseEvent;
    'mousepanright': MouseEvent;
    'mousepanup': MouseEvent;
    'mousepandown': MouseEvent;
    'mousepanend': MouseEvent;
    'mousepanleave': MouseEvent;
}
interface ExtendedTouchEventMap {
    'touchlongpressstart': TouchEvent;
    'touchlongpressmove': TouchEvent;
    'touchlongpressend': TouchEvent;
    'touchlongpresscancel': TouchEvent;
    'touchpanstart': TouchEvent;
    'touchpanmove': TouchEvent;
    'touchpanleft': TouchEvent;
    'touchpanright': TouchEvent;
    'touchpanup': TouchEvent;
    'touchpandown': TouchEvent;
    'touchpanend': TouchEvent;
    'touchpancancel': TouchEvent;
    'touchpinchstart': TouchEvent;
    'touchpinchmove': TouchEvent;
    'touchpinchend': TouchEvent;
    'touchpinchcancel': TouchEvent;
}
export interface ExtendedEventMap extends ExtendedMouseEventMap, ExtendedTouchEventMap {
}
export interface ExtendedHTMLElementEventMap extends HTMLElementEventMap, ExtendedEventMap {
}
export type ExtendedEventType = 'mouselongpress' | 'mousepan' | 'multiclick' | 'touchlongpress' | 'touchpan' | 'touchpinch' | 'touchrotate' | 'multitouch';
type HTMLElementEventKey = keyof HTMLElementEventMap;
type ExtendedEventKey = keyof ExtendedEventMap;
type ExtendedHTMLElementEventKey = keyof Partial<ExtendedHTMLElementEventMap>;
export type AddEventListenerOptionsOrBoolean = AddEventListenerOptions | boolean;
export type EventHandlersEventMaps = ExtendedHTMLElementEventKey | ExtendedHTMLElementEventKey[];
export type EventListenerEventMap = Map<EventHandlersEventMaps, EventListenerOrEventListenerObject[]>;
export type ExtendedEventImplementation = Partial<{
    [K in HTMLElementEventKey]: EventListenerOrEventListenerObject[];
}>;
export type ExtendedEventInstance = {
    [K in ExtendedEventType]: ExtendedEventImplementation;
};
export interface EventManagerInstance {
    generalEventInstance: WeakMap<EventTarget, EventListenerEventMap>;
    extendedEventInstance: WeakMap<EventTarget, ExtendedEventInstance>;
}
export declare const extendedEventMap: Record<ExtendedEventKey, ExtendedEventType>;
export {};
