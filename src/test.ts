import AwesomeDebouncePromise from './index';

let resolve;
let reject;

beforeEach(() => {
  // An async function whose result will be the first arg
  resolve = jest.fn(result => new Promise(resolve => resolve(result)));
  reject = jest.fn(
    () => new Promise((resolve, reject) => reject(new Error('rejected'))),
  );
});

// Hacky way to know if a promise is resolved or not
const isPromiseResolved = async promise => {
  const SecondResult = {};
  const shouldResolveFirst = new Promise(resolve => resolve(SecondResult));
  const result = await Promise.race([promise,shouldResolveFirst]);
  return result !== SecondResult;
};

const expectPromiseResolved = async (promise,shouldBeResolved) => {
  const isResolved = await isPromiseResolved(promise);
  if ( isResolved && !shouldBeResolved ) {
    throw new Error("Promise is NOT expected to be resolved");
  }
  else if ( !isResolved && shouldBeResolved ) {
    throw new Error("Promise is expected to be resolved");
  }
};

const expectAllPromisesResolved = async (promises,shouldBeResolve) => {
  await Promise.all(promises.map(async promise => {
    await expectPromiseResolved(promise,shouldBeResolve);
  }));
};


test('basic debouncing', async () => {
  // Given
  const debounced = AwesomeDebouncePromise(resolve, 100);
  // When
  const previousCalls = [
    debounced(1),
    debounced(2),
    debounced(3),
    debounced(4),
  ];
  const result = await debounced(5);
  // Then
  expect(result).toBe(5);
  expect(resolve).toHaveBeenCalledTimes(1);
  expect(reject).toHaveBeenCalledTimes(0);
  await expectAllPromisesResolved(previousCalls,false);
});

test('basic debouncing with onlyResolvesLast=false', async () => {
  // Given
  const debounced = AwesomeDebouncePromise(resolve, 100,{onlyResolvesLast: false});
  // When
  const previousCalls = [
    debounced(1),
    debounced(2),
    debounced(3),
    debounced(4),
  ];
  const result = await debounced(5);
  // Then
  expect(result).toBe(5);
  expect(resolve).toHaveBeenCalledTimes(1);
  expect(reject).toHaveBeenCalledTimes(0);
  await expectAllPromisesResolved(previousCalls,true);
});

test('debouncing with key', async () => {
  // Given
  const debounced = AwesomeDebouncePromise(resolve,
    100,
    { key: (result, keyArg) => 'key:' + keyArg },
  );
  // When
  const previousCalls = [
    debounced(1, 'key1'),
    debounced(2, 'key2'),
    debounced(3, 'key2'),
    debounced(4, 'key2'),
    debounced(5, 'key2'),
    debounced(6, 'key3'),
    debounced(7, 'key2'),
    debounced(8, 'key2'),
  ];
  const [key1result,key2result, key3result] = await Promise.all([
    debounced(9,"key1"),
    debounced(10,"key2"),
    debounced(11,"key3"),
  ]);
  // Then
  expect(key1result).toBe(9);
  expect(key2result).toBe(10);
  expect(key3result).toBe(11);
  expect(resolve).toHaveBeenCalledTimes(3);
  expect(reject).toHaveBeenCalledTimes(0);
  await expectAllPromisesResolved(previousCalls,false);
});
