import {GlobalThis} from "./utils";

export default (() => {
    if (typeof GlobalThis.TouchEvent === 'undefined') {
        class TouchEvent extends UIEvent {
            constructor(type: string, init?: TouchEventInit) {
                super(type, init);
            }
        }

        GlobalThis.TouchEvent = TouchEvent;
    }

    if (!GlobalThis.WeakMap) {
        const hasOwnProperty = Object.prototype.hasOwnProperty;
        const hasDefine = (() => {
            try {
                return (Object.defineProperty({}, 'x', {value: 1}) as any).x === 1;
            } catch (e) {
                return false;
            }
        })();

        const defineProperty = (object: any, name: string, value: any) => {
            if (hasDefine) {
                Object.defineProperty(object, name, {
                    configurable: true,
                    writable: true,
                    value: value
                });
            } else {
                object[name] = value;
            }
        };

        GlobalThis.WeakMap = (function () {
            class WeakMap<K extends object, V> {
                private readonly _id: string;

                constructor() {
                    if (this === undefined) {
                        throw new TypeError("Constructor WeakMap requires 'new'");
                    }

                    this._id = genId('_WeakMap');

                    if (arguments.length > 0) {
                        throw new TypeError('WeakMap iterable is not supported');
                    }
                }

                delete(key: K): boolean {
                    checkInstance(this, 'delete');

                    if (!isObject(key)) {
                        return false;
                    }

                    const entry = (key as any)[this._id];
                    if (entry && entry[0] === key) {
                        delete (key as any)[this._id];
                        return true;
                    }

                    return false;
                }

                get(key: K): V | undefined {
                    checkInstance(this, 'get');

                    if (!isObject(key)) {
                        return undefined;
                    }

                    const entry = (key as any)[this._id];
                    if (entry && entry[0] === key) {
                        return entry[1];
                    }

                    return undefined;
                }

                has(key: K): boolean {
                    checkInstance(this, 'has');

                    if (!isObject(key)) {
                        return false;
                    }

                    const entry = (key as any)[this._id];
                    return !!(entry && entry[0] === key);
                }

                set(key: K, value: V): this {
                    checkInstance(this, 'set');

                    if (!isObject(key)) {
                        throw new TypeError('Invalid value used as weak map key');
                    }

                    const entry = (key as any)[this._id];
                    if (entry && entry[0] === key) {
                        entry[1] = value;
                        return this;
                    }

                    defineProperty(key, this._id, [key, value]);
                    return this;
                }
            }

            function checkInstance(x: any, methodName: string) {
                if (!isObject(x) || !hasOwnProperty.call(x, '_id')) {
                    throw new TypeError(
                        `${methodName} method called on incompatible receiver ${typeof x}`
                    );
                }
            }

            function genId(prefix: string): string {
                return `${prefix}_${rand()}.${rand()}`;
            }

            function rand(): string {
                return Math.random().toString().substring(2);
            }

            defineProperty(WeakMap, '_polyfill', true);
            return WeakMap;
        })();

        const isObject = (x: any): boolean => Object(x) === x;
    }

    if (!GlobalThis.matchMedia) {
        GlobalThis.matchMedia = function (media: string) {
            let styleMedia = (GlobalThis.styleMedia || GlobalThis.media);

            if (!styleMedia) {
                const style: any = document.createElement('style');
                let info = null;

                style.type = 'text/css';
                style.setAttribute('data-match-media-query', 'true');

                document.head.appendChild(style);

                info = ('getComputedStyle' in window) && window.getComputedStyle(style) || style.currentStyle;

                styleMedia = {
                    matchMedium: function (media: string) {
                        const text = '@media ' + media + '{ [data-match-media-query] { width: 1px; } }';

                        if (style.styleSheet) {
                            style.styleSheet.cssText = text;
                        } else {
                            style.textContent = text;
                        }

                        document.head.removeChild(style);
                        return info.width === '1px';
                    }
                };
            }

            return {
                matches: styleMedia.matchMedium(media),
                media: media
            };
        }
    }

    return undefined;
})();