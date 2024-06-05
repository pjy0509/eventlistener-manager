# Eventlistener Manager

## [Sample](https://pjy0509.github.io/example/eventlistener-manager/)

## 1. Add events
#### Add single type event
```typescript
EventManager.add(eventTarget, 'click', callback);
``` 
#### Add multiple type event
```typescript
EventManager.add(eventTarget, ['click', 'mousedown'], callback);
``` 
## 2. Remove event
#### Remove single type event
```typescript
EventManager.remove(eventTarget, 'click', callback);
``` 
```typescript
EventManager.remove(eventTarget, 'click'); // remove all click event
``` 
```typescript
EventManager.remove(eventTarget); // remove all event
``` 
#### Remove multiple type event
```typescript
EventManager.add(eventTarget, ['click', 'mousedown']); // remove all click, mousedown event
``` 
## 3. Add custom event
```typescript
EventManager.add(eventTarget, ['mouselongpressstart'], callback);
``` 
### Supported custom events
Supported custom events include mouse long press, mouse pan, touch long press, touch pan, and touch pinch.
```typescript
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
```
### Options
Custom event options can be modified.
```typescript
EventManager.options.strict = true; // Use strict callback mode
EventManager.options.mouseLongpressTimeRequired = 750; // Mouse long press time required
EventManager.options.mouseLongpressBelowDistance = 15; // Mouse long press below distance
EventManager.options.touchLongpressTimeRequired = 750; // Touch long press time required
EventManager.options.touchLongpressBelowDistance = 30; // Touch long press below distance
```
## 4. Support event type polyfill
```typescript
EventManager.add(eventTarget, 'fullscreenchange', callback);

// This actually works as follows: eventTarget.addEventListener('mozfullscreenchange', callback);
```
### Additional Information

-   The EventManager supports polyfills for various event types to ensure cross-browser compatibility.
-   The `strict` mode in options ensures that the callback is invoked in a strict manner according to the specified requirements.
-   The EventManager is capable of handling both native and custom events seamlessly, providing a robust solution for event management in complex applications.