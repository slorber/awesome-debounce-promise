import DebouncePromise from 'debounce-promise';
import { onlyResolvesLast } from 'awesome-only-resolves-last-promise';

type ArgumentsType<T> = T extends (...args: infer A) => any ? A : never;

export type AwesomeDebounceOptions = {
  key: (...args: any[]) => string | null | undefined;
  onlyResolvesLast: boolean;
} & DebouncePromise.DebounceOptions;


const DefaultOptions = {
  // One distinct debounced function is created per key and added to an internal cache
  // By default, the key is null, which means that all the calls
  // will share the same debounced function
  key: (..._args: any[]) => null,

  // By default, a debounced function will only resolve
  // the last promise it returned
  // Former calls will stay unresolved, so that you don't have
  // to handle concurrency issues in your code
  // Setting this to false means all returned promises will resolve to the last result
  onlyResolvesLast: true,
};


type CacheConfig<Fun extends (...args: any[]) => any> = {
  func: Fun,
  wait: number,
  options: AwesomeDebounceOptions
}

// TODO not useful right now but will be useful if we want to support cancellation
type CacheFunction<Fun extends (...args: any[]) => any> = {
  func: Fun,
  // cancel: () => void,
}

// We create a debouncing function cache, because when wrapping the original function,
// we may actually want to route the function call to different debounced functions depending function paameters
class DebounceCache<Fun extends (...args: any[]) => any> {
  config: CacheConfig<Fun>;

  debounceSingleton: CacheFunction<Fun> | null; // key not used
  debounceCache: { [key: string]: CacheFunction<Fun> }; // key used

  constructor(config: CacheConfig<Fun>) {
    this.config = config;
    this.debounceSingleton = null;
    this.debounceCache = {}; // when key feature is used
  }

  _createDebouncedFunction(): CacheFunction<Fun> {
    let debouncedFunc: Fun = DebouncePromise(this.config.func, this.config.wait, this.config.options) as any; // TODO TS
    if (this.config.options.onlyResolvesLast) {
      debouncedFunc = onlyResolvesLast(debouncedFunc);
    }
    return {
      func: debouncedFunc,
    };
  };

  getDebouncedFunction(
    args: ArgumentsType<Fun>,
  ): CacheFunction<Fun> {
    const key = this.config.options.key(...args);
    if (key === null || typeof key === 'undefined') {
      if (!this.debounceSingleton) {
        this.debounceSingleton = this._createDebouncedFunction();
      }
      return this.debounceSingleton;
    }
    else {
      if (!this.debounceCache[key]) {
        this.debounceCache[key] = this._createDebouncedFunction();
      }
      return this.debounceCache[key];
    }
  }
}

// extra methods are "added" to the the returned debounced async function
type ReturnedFunction<Fun> = Fun & {
  // cancel: (key?: string) => void
}

function AwesomeDebouncePromise<Fun extends (...args: any[]) => any>(
  func: Fun,
  wait: number,
  options?: Partial<AwesomeDebounceOptions>,
): ReturnedFunction<Fun> {
  const finalOptions: AwesomeDebounceOptions = {
    ...DefaultOptions,
    ...options,
  };

  const debounceCache = new DebounceCache<Fun>({
    func,
    wait,
    options: finalOptions,
  });

  const AwesomeDebouncePromiseWrapper = ((...args: ArgumentsType<Fun>) => {
    const debouncedFn = debounceCache.getDebouncedFunction(
      args,
    ).func;
    return debouncedFn(...args);
  }) as ReturnedFunction<Fun>; // TODO fix TS

  /*
  AwesomeDebouncePromiseWrapper.cancel = (key?: string) => {

  };
  */
  return AwesomeDebouncePromiseWrapper;
}

export default AwesomeDebouncePromise;
