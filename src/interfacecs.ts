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

interface ExtendedUIEventMap {
    'appearancechange': MediaQueryListEvent;
    'orientationchange': MediaQueryListEvent;
    'resize': UIEvent;
    'intersectionchange': UIEvent;
}

export interface ExtendedEventMap extends ExtendedMouseEventMap, ExtendedTouchEventMap, ExtendedUIEventMap {
}

export interface ExtendedHTMLElementEventMap extends HTMLElementEventMap, ExtendedEventMap {
}

export type ExtendedEventType =
    | 'mouselongpress'
    | 'mousepan'
    | 'multiclick'
    | 'touchlongpress'
    | 'touchpan'
    | 'touchpinch'
    | 'touchrotate'
    | 'multitouch'
    | 'appearancechange'
    | 'orientationchange'
    | 'resize'
    | 'intersection';
type HTMLElementEventKey = keyof HTMLElementEventMap;
type ExtendedMouseEventKey = keyof ExtendedMouseEventMap;
type ExtendedTouchEventKey = keyof ExtendedTouchEventMap;
type ExtendedUIEventMapKey = keyof ExtendedUIEventMap;
type ExtendedEventKey = keyof ExtendedEventMap;
type ExtendedHTMLElementEventKey = keyof Partial<ExtendedHTMLElementEventMap>;

export type AddEventListenerOptionsOrBoolean = AddEventListenerOptions | boolean;
export type EventHandlersEventMaps = ExtendedHTMLElementEventKey | ExtendedHTMLElementEventKey[];
export type EventListenerEventMap = Map<EventHandlersEventMaps, EventListenerOrEventListenerObject[]>;

export type ExtendedEventImplementation = Partial<{ [K in HTMLElementEventKey]: EventListenerOrEventListenerObject[] }> & { 'callback'?: () => void };
export type ExtendedEventInstance = { [K in ExtendedEventType]: ExtendedEventImplementation };

export interface EventManagerInstance {
    generalEventInstance: WeakMap<EventTarget, EventListenerEventMap>;
    extendedEventInstance: WeakMap<EventTarget, ExtendedEventInstance>;
}

const extendedMouseEventMap: Record<ExtendedMouseEventKey, ExtendedEventType> = {
    'mouselongpressstart': 'mouselongpress',
    'mouselongpressmove': 'mouselongpress',
    'mouselongpressend': 'mouselongpress',
    'mouselongpressleave': 'mouselongpress',

    'mousepanstart': 'mousepan',
    'mousepanmove': 'mousepan',
    'mousepanleft': 'mousepan',
    'mousepanright': 'mousepan',
    'mousepanup': 'mousepan',
    'mousepandown': 'mousepan',
    'mousepanend': 'mousepan',
    'mousepanleave': 'mousepan',
};

const extendedTouchEventMap: Record<ExtendedTouchEventKey, ExtendedEventType> = {
    'touchlongpressstart': 'touchlongpress',
    'touchlongpressmove': 'touchlongpress',
    'touchlongpressend': 'touchlongpress',
    'touchlongpresscancel': 'touchlongpress',

    'touchpanstart': 'touchpan',
    'touchpanmove': 'touchpan',
    'touchpanleft': 'touchpan',
    'touchpanright': 'touchpan',
    'touchpanup': 'touchpan',
    'touchpandown': 'touchpan',
    'touchpanend': 'touchpan',
    'touchpancancel': 'touchpan',

    'touchpinchstart': 'touchpinch',
    'touchpinchmove': 'touchpinch',
    'touchpinchend': 'touchpinch',
    'touchpinchcancel': 'touchpinch',
};

const extendedUIEventMap: Record<ExtendedUIEventMapKey, ExtendedEventType> = {
    'appearancechange': 'appearancechange',
    'orientationchange': 'orientationchange',
    'resize': 'resize',
    'intersectionchange': 'intersection'
};

export const extendedEventMap: Record<ExtendedEventKey, ExtendedEventType> = {
    ...extendedMouseEventMap,
    ...extendedTouchEventMap,
    ...extendedUIEventMap,
};

export interface ExtendedUIEventProperty {
}