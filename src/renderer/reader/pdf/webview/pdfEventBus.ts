
// @ts-ignore
// @ts-nocheck
/* tslint:disable */

/**
 * Simple event bus for an application. Listeners are attached using the `on`
 * and `off` methods. To raise an event, the `dispatch` method shall be used.
 */
export class EventBus {
    constructor(options = null) {
        this._listeners = Object.create(null);
        this._listenersAll = [];

        if (typeof PDFJSDev === "undefined" || PDFJSDev.test("MOZCENTRAL")) {
            this._isInAutomation = (options && options.isInAutomation) === true;
        }
    }

    onAll(listener) {
        this._listenersAll.push(listener);
    }

    /**
     * @param {string} eventName
     * @param {function} listener
     */
    on(eventName, listener) {
        this._on(eventName, listener, { external: true });
    }

    /**
     * @param {string} eventName
     * @param {function} listener
     */
    off(eventName, listener) {
        this._off(eventName, listener, { external: true });
    }

    dispatch(eventName) {

        this._listenersAll.forEach((l) => l(eventName)(args))

        const eventListeners = this._listeners[eventName];
        if (!eventListeners || eventListeners.length === 0) {
            if (
                (typeof PDFJSDev === "undefined" || PDFJSDev.test("MOZCENTRAL")) &&
                this._isInAutomation
            ) {
                const args = Array.prototype.slice.call(arguments, 1);
                dispatchDOMEvent(eventName, args);
            }
            return;
        }
        // Passing all arguments after the eventName to the listeners.
        const args = Array.prototype.slice.call(arguments, 1);
        let externalListeners;
        // Making copy of the listeners array in case if it will be modified
        // during dispatch.
        eventListeners.slice(0).forEach(function ({ listener, external }) {
            if (external) {
                if (!externalListeners) {
                    externalListeners = [];
                }
                externalListeners.push(listener);
                return;
            }
            listener.apply(null, args);
        });
        // Dispatch any "external" listeners *after* the internal ones, to give the
        // viewer components time to handle events and update their state first.
        if (externalListeners) {
            externalListeners.forEach(function (listener) {
                listener.apply(null, args);
            });
            externalListeners = null;
        }
        if (
            (typeof PDFJSDev === "undefined" || PDFJSDev.test("MOZCENTRAL")) &&
            this._isInAutomation
        ) {
            dispatchDOMEvent(eventName, args);
        }
    }

    /**
     * @ignore
     */
    _on(eventName, listener, options = null) {
        let eventListeners = this._listeners[eventName];
        if (!eventListeners) {
            this._listeners[eventName] = eventListeners = [];
        }
        eventListeners.push({
            listener,
            external: (options && options.external) === true,
        });
    }

    /**
     * @ignore
     */
    _off(eventName, listener, options = null) {
        const eventListeners = this._listeners[eventName];
        if (!eventListeners) {
            return;
        }
        for (let i = 0, ii = eventListeners.length; i < ii; i++) {
            if (eventListeners[i].listener === listener) {
                eventListeners.splice(i, 1);
                return;
            }
        }
    }
}
