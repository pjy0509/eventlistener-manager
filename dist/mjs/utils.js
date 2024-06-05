export class EventType {
    static vendors = ['', 'webkit', 'moz', 'ms', 'MS', 'o', 'O'];
    static polyfillEventTypeMap = {
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
    };
    static withVendor(...strings) {
        return EventType.vendors.flatMap(vendor => [
            vendor + strings.join(''),
            vendor + strings.map(string => EventType.capitalize(string)).join('')
        ]);
    }
    static capitalize(string) {
        return string.replace(/\b[a-z]/, s => s.toUpperCase());
    }
    static get(target, type) {
        const types = EventType.polyfillEventTypeMap[type];
        if (types) {
            for (let type of types) {
                if (('on' + type) in target) {
                    return type;
                }
            }
        }
        else if (('on' + type) in target) {
            return type;
        }
        return;
    }
}
export class TaskScheduler {
    lastExecutionTime = 0;
    delayThreshold;
    scheduledTask = null;
    rafId = null;
    constructor(delayThreshold) {
        this.delayThreshold = delayThreshold;
    }
    scheduleTask(task) {
        const currentTime = window.performance.now();
        if (currentTime - this.lastExecutionTime >= this.delayThreshold) {
            if (this.rafId !== null) {
                window.cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
            this.executeTask(task);
        }
        else {
            this.scheduledTask = task;
            if (this.rafId === null) {
                this.rafId = window.requestAnimationFrame(() => this.runScheduledTask());
            }
        }
    }
    executeTask(task) {
        this.lastExecutionTime = window.performance.now();
        task();
    }
    runScheduledTask() {
        if (this.scheduledTask) {
            this.executeTask(this.scheduledTask);
            this.scheduledTask = null;
            this.rafId = null;
        }
    }
}
export class DefaultGesturePreventer {
    static styleSheet;
    static meta = new WeakMap();
    static isActivePreventDefaultPinchGesture = false;
    static isActivePreventDefaultPanGesture = false;
    static isActivePreventDefaultSelectGesture = false;
    static preventDefault = (event) => event.preventDefault();
    static emptyPromise = new Promise(() => {
    });
    static activePreventDefaultPinchGesture() {
        if (DefaultGesturePreventer.isActivePreventDefaultPinchGesture)
            return DefaultGesturePreventer.emptyPromise;
        DefaultGesturePreventer.isActivePreventDefaultPinchGesture = true;
        document.addEventListener('touchmove', DefaultGesturePreventer.preventDefault, { passive: false });
        document.addEventListener('touchstart', DefaultGesturePreventer.preventDefault, { passive: false });
        return new Promise(async (resolve) => {
            const metas = document.querySelectorAll('meta[name="viewport"]');
            if (metas.length === 0) {
                const meta = document.createElement('meta');
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
        if (!DefaultGesturePreventer.isActivePreventDefaultPinchGesture)
            return;
        DefaultGesturePreventer.isActivePreventDefaultPinchGesture = false;
        document.removeEventListener('touchmove', DefaultGesturePreventer.preventDefault);
        document.removeEventListener('touchstart', DefaultGesturePreventer.preventDefault);
        document.querySelectorAll('meta[name="viewport"]')
            .forEach(meta => {
            if (DefaultGesturePreventer.meta.has(meta)) {
                const content = DefaultGesturePreventer.meta.get(meta);
                if (Object.keys(content).length === 0) {
                    meta.remove();
                }
                else {
                    meta.setAttribute('content', DefaultGesturePreventer.joinViewportContent(content));
                }
            }
        });
    }
    static activePreventDefaultPanGesture() {
        if (DefaultGesturePreventer.isActivePreventDefaultPanGesture)
            return DefaultGesturePreventer.emptyPromise;
        DefaultGesturePreventer.isActivePreventDefaultPanGesture = true;
        return new Promise(resolve => {
            document.addEventListener('touchstart', DefaultGesturePreventer.preventDefault, { passive: false });
            setTimeout(resolve);
        });
    }
    static inactivePreventDefaultPanGesture() {
        if (!DefaultGesturePreventer.isActivePreventDefaultPanGesture)
            return;
        DefaultGesturePreventer.isActivePreventDefaultPanGesture = false;
        document.removeEventListener('touchstart', DefaultGesturePreventer.preventDefault);
    }
    static activePreventDefaultSelectGesture() {
        if (DefaultGesturePreventer.isActivePreventDefaultSelectGesture)
            return DefaultGesturePreventer.emptyPromise;
        DefaultGesturePreventer.isActivePreventDefaultSelectGesture = true;
        document.addEventListener('touchstart', DefaultGesturePreventer.preventDefault, { passive: false });
        return new Promise(resolve => {
            DefaultGesturePreventer.getStyleSheet().insertRule('html{-webkit-touch-callout:none;-webkit-user-select:none;-webkit-tap-highlight-color:rgba(0,0,0,0);-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;}');
            setTimeout(resolve);
        });
    }
    static inactivePreventDefaultSelectGesture() {
        if (!DefaultGesturePreventer.isActivePreventDefaultSelectGesture)
            return;
        DefaultGesturePreventer.isActivePreventDefaultSelectGesture = false;
        document.removeEventListener('touchstart', DefaultGesturePreventer.preventDefault);
        try {
            DefaultGesturePreventer.getStyleSheet().deleteRule(0);
        }
        catch (e) {
        }
    }
    static getStyleSheet() {
        if (!DefaultGesturePreventer.styleSheet) {
            const style = document.createElement('style');
            document.head.append(style);
            DefaultGesturePreventer.styleSheet = style.sheet;
        }
        return DefaultGesturePreventer.styleSheet;
    }
    static splitViewportContent(content) {
        return content
            .split(',')
            .map(content => {
            const kv = content.trim().split('=');
            return { [kv[0]]: kv[1] };
        })
            .reduce((prev, curr) => Object.assign(prev, curr), {});
    }
    static joinViewportContent(contentMap) {
        return Object.keys(contentMap)
            .map(key => key + '=' + contentMap[key])
            .join(', ');
    }
}
