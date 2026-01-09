
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// eslint-disable

// https://github.com/mozilla/pdf.js/blob/a8cf9a41d127b6ed3073371212ea0cae179fbfeb/web/event_utils.js#L66-L170
/**
 * Simple event bus for an application. Listeners are attached using the `on`
 * and `off` methods. To raise an event, the `dispatch` method shall be used.
 */
export class EventBus_ {
  #listeners = Object.create(null);

  /**
   * @param {string} eventName
   * @param {function} listener
   * @param {Object} [options]
   */
  on(eventName, listener, options = null) {
    this._on(eventName, listener, {
      external: true,
      once: options?.once,
      signal: options?.signal,
    });
  }

  /**
   * @param {string} eventName
   * @param {function} listener
   * @param {Object} [options]
   */
  off(eventName, listener, options = null) {
    this._off(eventName, listener);
  }

  /**
   * @param {string} eventName
   * @param {Object} data
   */
  dispatch(eventName, data) {
    const eventListeners = this.#listeners[eventName];
    if (!eventListeners || eventListeners.length === 0) {
      return;
    }
    let externalListeners;
    // Making copy of the listeners array in case if it will be modified
    // during dispatch.
    for (const { listener, external, once } of eventListeners.slice(0)) {
      if (once) {
        this._off(eventName, listener);
      }
      if (external) {
        (externalListeners ||= []).push(listener);
        continue;
      }
      listener(data);
    }
    // Dispatch any "external" listeners *after* the internal ones, to give the
    // viewer components time to handle events and update their state first.
    if (externalListeners) {
      for (const listener of externalListeners) {
        listener(data);
      }
      externalListeners = null;
    }
  }

  /**
   * @ignore
   */
  _on(eventName, listener, options = null) {
    let rmAbort = null;
    if (options?.signal instanceof AbortSignal) {
      const { signal } = options;
      if (signal.aborted) {
        console.error("Cannot use an `aborted` signal.");
        return;
      }
      const onAbort = () => this._off(eventName, listener);
      rmAbort = () => signal.removeEventListener("abort", onAbort);

      signal.addEventListener("abort", onAbort);
    }

    const eventListeners = (this.#listeners[eventName] ||= []);
    eventListeners.push({
      listener,
      external: options?.external === true,
      once: options?.once === true,
      rmAbort,
    });
  }

  /**
   * @ignore
   */
  _off(eventName, listener, options = null) {
    const eventListeners = this.#listeners[eventName];
    if (!eventListeners) {
      return;
    }
    for (let i = 0, ii = eventListeners.length; i < ii; i++) {
      const evt = eventListeners[i];
      if (evt.listener === listener) {
        evt.rmAbort?.(); // Ensure that the `AbortSignal` listener is removed.
        eventListeners.splice(i, 1);
        return;
      }
    }
  }
}

// https://github.com/mozilla/pdf.js/blob/a8cf9a41d127b6ed3073371212ea0cae179fbfeb/web/event_utils.js#L172-L224
/**
 * NOTE: Only used in the Firefox built-in pdf viewer.
 */
export class EventBus__ extends EventBus_ {
  #externalServices;

  #globalEventNames;

  #isInAutomation;

  constructor(globalEventNames, externalServices, isInAutomation) {
    super();
    this.#globalEventNames = globalEventNames;
    this.#externalServices = externalServices;
    this.#isInAutomation = isInAutomation;
  }

  dispatch(eventName, data) {
    if (typeof PDFJSDev !== "undefined" && !PDFJSDev.test("MOZCENTRAL")) {
      throw new Error("Not implemented: FirefoxEventBus.dispatch");
    }
    super.dispatch(eventName, data);

    if (this.#isInAutomation) {
      const detail = Object.create(null);
      if (data) {
        for (const key in data) {
          const value = data[key];
          if (key === "source") {
            if (value === window || value === document) {
              return; // No need to re-dispatch (already) global events.
            }
            continue; // Ignore the `source` property.
          }
          detail[key] = value;
        }
      }
      const event = new CustomEvent(eventName, {
        bubbles: true,
        cancelable: true,
        detail,
      });
      document.dispatchEvent(event);
    }

    if (this.#globalEventNames?.has(eventName)) {
      this.#externalServices.dispatchGlobalEvent({
        eventName,
        detail: data,
      });
    }
  }
}

// https://github.com/mozilla/pdf.js/blob/c366390f6bb2fa303d0d85879afda2c27ee06c28/web/ui_utils.js#L775-L868
/**
 * Simple event bus for an application. Listeners are attached using the `on`
 * and `off` methods. To raise an event, the `dispatch` method shall be used.
 */
export class EventBus {
    constructor(options = null) {
        this._listeners = Object.create(null);
        // this._listenersAll = [];

        if (typeof PDFJSDev === "undefined" || PDFJSDev.test("MOZCENTRAL")) {
            this._isInAutomation = (options && options.isInAutomation) === true;
        }
    }

    // onAll(listener) {
    //     this._listenersAll.push(listener);
    // }

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

    dispatch(eventName, ...arg) {

        const args = Array.prototype.slice.call(arguments, 1);

        // this._listenersAll.forEach((l) => l(eventName)(args))

        const eventListeners = this._listeners[eventName];
        if (!eventListeners || eventListeners.length === 0) {
            if (
                (typeof PDFJSDev === "undefined" || PDFJSDev.test("MOZCENTRAL")) &&
                this._isInAutomation
            ) {
                dispatchDOMEvent(eventName, args);
            }
            return;
        }
        // Passing all arguments after the eventName to the listeners.
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
