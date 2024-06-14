# Eventlistener Manager
![NPM](https://nodei.co/npm/eventlistener-manager.png?downloads=true&downloadRank=true&stars=true)<br>
![NPM Downloads](https://img.shields.io/npm/d18m/eventlistener-manager?style=flat&logo=npm&logoColor=%23CB3837&label=Download&color=%23CB3837&link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2Feventlistener-manager) 
![GitHub Repo stars](https://img.shields.io/github/stars/pjy0509/eventlistener-manager?style=flat&logo=github&logoColor=181717&label=Stars&color=181717&link=https%3A%2F%2Fgithub.com%2Fpjy0509%2Feventlistener-manager)<br> 
![Static Badge](https://img.shields.io/badge/Typescript-8A2BE2?logo=typescript&color=000000)
## Sample page
### [Link](https://pjy0509.github.io/example/eventlistener-manager/)
## Install
npm
```bash
npm i eventlistener-manager
```
cdn
```html
<script src="https://unpkg.com/eventlistener-manager@latest/dist/index.umd.js"></script>
```
## Report errors and suggestions
### [Gmail](mailto:qkrwnss0509@gmail.com?subject=Report_errors_and_suggestions)
## Change log
| Version | Log                                                                                                                  |
|---------|----------------------------------------------------------------------------------------------------------------------|
| 1.0.25  | Support CDN                                                                                                          |
| 1.0.27  | Add 'appearancechange', 'orientationchange', 'resize', 'intersectionchange' eventlistener                            |
| 1.0.32  | Polyfill 'addEventlistener', 'removeEventlistener', 'dispatchEvent', 'requestAnimationFrame', 'cancelAnimationFrame' |
| 1.0.33  | Polyfill 'WeakMap'                                                                                                   |
| 1.0.34  | Fix 'requestAnimationFrame', 'cancelAnimationFrame' polyfill error                                                   |
## 1. Add events
#### Add single type event
```typescript
EventManager.add(eventTarget, 'click', callback);
// or
eventTarget.addManagedEventListener('click', callback);
``` 
#### Add multiple type event
```typescript
EventManager.add(eventTarget, ['click', 'mousedown'], callback);
// or
eventTarget.addManagedEventListener(['click', 'mousedown'], callback);
``` 
## 2. Remove event
#### Remove single type event
```typescript
EventManager.remove(eventTarget, 'click', callback);
// or
eventTarget.removeManagedEventListener('click', callback);
``` 
```typescript
EventManager.remove(eventTarget, 'click'); // remove all click event
// or
eventTarget.removeManagedEventListener('click');
``` 
```typescript
EventManager.remove(eventTarget); // remove all event
// or
eventTarget.removeManagedEventListener();
``` 
#### Remove multiple type event
```typescript
EventManager.add(eventTarget, ['click', 'mousedown']); // remove all click, mousedown event
// or
eventTarget.removeManagedEventListener(['click', 'mousedown']);
``` 
## 3. Add custom event
```typescript
EventManager.add(eventTarget, ['mouselongpressstart'], callback);
// or
eventTarget.addManagedEventListener(['mouselongpressstart']);
``` 
### Supported custom events
Supported custom events include mouse long press, mouse pan, touch long press, touch pan, touch pinch, screen mode change, orientation change, any element resize, and any element intersection change.
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

interface ExtendedUIEventMap {
  'appearancechange': MediaQueryListEvent;
  'orientationchange': MediaQueryListEvent;
  'resize': UIEvent;
  'intersectionchange': UIEvent;
}
```
### Options
Custom event options can be modified.

```typescript
import {EventManager} from "./index";

EventManager.options.strict = true; // Use strict callback mode
EventManager.options.mouseLongpressTimeRequired = 750; // Mouse long press time required
EventManager.options.mouseLongpressBelowDistance = 15; // Mouse long press below distance
EventManager.options.touchLongpressTimeRequired = 750; // Touch long press time required
EventManager.options.touchLongpressBelowDistance = 30; // Touch long press below distance
EventManager.options.callWhenAddedUIEvent = true; // Call callback when extended ui event added
```
## 4. Support event type polyfill
```typescript
EventManager.add(eventTarget, 'fullscreenchange', callback);

// This actually works on firefox with specific version as follows: eventTarget.addEventListener('mozfullscreenchange', callback);
```
### Additional Information
-   The EventManager supports polyfills for various event types to ensure cross-browser compatibility.
-   The `strict` mode in options ensures that the callback is invoked in a strict manner according to the specified requirements.
-   The EventManager is capable of handling both native and custom events seamlessly, providing a robust solution for event management in complex applications.
