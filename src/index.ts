import * as DebouncePromise from 'debounce-promise';
import { onlyResolvesLast } from 'awesome-only-resolves-last-promise';

type ArgumentsType<T> = T extends (...args: infer A) => any ? A : never;

// We use DebouncePromise as a dependency as it does a great low-level job
// The behavior of the lib is to return the same promise for all function calls
export const debouncePromise = DebouncePromise;

export type AwesomeDebounceOptions = {
  key: (...args: any[]) => string;
  onlyResolvesLast: boolean;
} & DebouncePromise.DebounceOptions;

const DefaultKey = 'DEFAULT_AWESOME_DEBOUNCE_PROMISE_KEY';

const DefaultOptions = {
  // One distinct debounced function is created per key and added to an internal cache
  // By default, the key is null, which means that all the calls
  // will share the same debounced function
  key: (..._args: any[]) => DefaultKey,

  // By default, a debounced function will only resolve
  // the last promise it returned
  // Former calls will stay unresolved, so that you don't have
  // to handle concurrency issues in your code
  // Setting this to false means all returned promises will resolve to the last result
  onlyResolvesLast: true,
};

// We create a debouncing function cache, because when wrapping the original function,
// we may actually want to route the function call to different debounced functions depending function paameters
export class DebounceCache {
  debounceCache: object;

  constructor() {
    this.debounceCache = {};
  }

  getDebouncedFunction<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    options: AwesomeDebounceOptions,
    args: ArgumentsType<T>,
  ) {
    const {
      key: keyOptions,
      onlyResolvesLast: onlyResolvesLastOption,
      ...otherOptions
    } = options;
    const key = keyOptions(...args);
    // If the debounced function does not exist for this key, we create one on the fly and return it
    if (!this.debounceCache[key]) {
      let debouncedFunc = debouncePromise(func, wait, otherOptions);
      if (onlyResolvesLastOption) {
        debouncedFunc = onlyResolvesLast(debouncedFunc as any); // TODO fix TS
      }
      this.debounceCache[key] = debouncedFunc;
    }
    return this.debounceCache[key];
  }
}

function AwesomeDebouncePromise<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options?: Partial<AwesomeDebounceOptions>,
) {
  const finalOptions: AwesomeDebounceOptions = {
    ...DefaultOptions,
    ...options,
  };
  const debounceCache = new DebounceCache();
  return function AwesomeDebouncePromiseWrapper(...args: ArgumentsType<T>) {
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
