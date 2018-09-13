import DebouncePromise from 'debounce-promise';

// We use DebouncePromise as a dependency as it does a great low-level job
// The behavior of the lib is to return the same promise for all function calls
export const debounce = (func, wait, options) =>
  DebouncePromise(func, wait, options);

// Given a function returning promises, wrap it so that only the promise returned from last call will actually resolve
// This is useful to ignore former async results and handle concurrency issues
export const onlyResolvesLast = asyncFunction => {
  // Inspired from https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html
  const makeCancelable = promise => {
    let hasCanceled_ = false;
    const wrappedPromise = new Promise((resolve, reject) => {
      promise.then(
        val => (hasCanceled_ ? undefined : resolve(val)),
        error => (hasCanceled_ ? undefined : reject(error)),
      );
    });
    return {
      promise: wrappedPromise,
      cancel() {
        hasCanceled_ = true;
      },
    };
  };

  let cancelPrevious;
  return (...args) => {
    cancelPrevious && cancelPrevious();
    const { promise, cancel } = makeCancelable(asyncFunction(...args));
    cancelPrevious = cancel;
    return promise;
  };
};

// We create a debouncing function cache, because when wrapping the original function,
// we may actually want to route the function call to different debounced functions depending function paameters
export class DebounceCache {
  constructor() {
    this.debounceCache = {};
  }
  getDebouncedFunction = (func, wait, options, args) => {
    const {
      key: keyOptions,
      onlyResolvesLast: onlyResolvesLastOption,
      ...otherOptions
    } = options;
    const key = keyOptions(...args);
    // If the debounced function does not exist for this key, we create one on the fly and return it
    if (!this.debounceCache[key]) {
      let debouncedFunc = debounce(func, wait, otherOptions);
      if (onlyResolvesLastOption) {
        debouncedFunc = onlyResolvesLast(debouncedFunc);
      }
      this.debounceCache[key] = debouncedFunc;
    }
    return this.debounceCache[key];
  };
}

const DefaultOptions = {
  // By default, the key is null, which means that all the function calls will share the same debounced function
  // Providing a key function permit to use the call arguments and route to a distinct debounced function
  key: () => null,

  // By default, a debounced function will only resolve the last promise it returned
  // Former calls will stay unresolved, so that you don't have to handle concurrency issues in your code
  onlyResolvesLast: true,
};

function AwesomeDebouncePromise(func, wait, options) {
  const finalOptions = {
    ...DefaultOptions,
    ...options,
  };
  const debounceCache = new DebounceCache();
  return function AwesomeDebouncePromiseWrapper(...args) {
    const debouncedFn = debounceCache.getDebouncedFunction(
      func,
      wait,
      finalOptions,
      args,
    );
    return debouncedFn(...args);
  };
}

export default AwesomeDebouncePromise;
