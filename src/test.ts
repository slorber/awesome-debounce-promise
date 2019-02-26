import AwesomeDebouncePromise from './index';

const asyncTestUtils = () => {
  return {
    asyncResolve: jest.fn(result => new Promise(resolve => resolve(result))),
    asyncReject: jest.fn(
      () => new Promise((_resolve, reject) => reject(new Error('rejected'))),
    ),
  };
};

// Hacky way to know if a promise is resolved or not
const isPromiseResolved = async (promise: Promise<any>) => {
  const SecondResult = {};
  const shouldResolveFirst = new Promise(resolve => resolve(SecondResult));
  const result = await Promise.race([promise, shouldResolveFirst]);
  return result !== SecondResult;
};

const expectPromiseResolved = async (promise: Promise<any>, shouldBeResolved: boolean) => {
  const isResolved = await isPromiseResolved(promise);
  if (isResolved && !shouldBeResolved) {
    throw new Error('Promise is NOT expected to be resolved');
  } else if (!isResolved && shouldBeResolved) {
    throw new Error('Promise is expected to be resolved');
  }
};

const expectAllPromisesResolved = async (promises: Promise<any>[], shouldBeResolve: boolean) => {
  await Promise.all(
    promises.map(async (promise: Promise<any>) => {
      await expectPromiseResolved(promise, shouldBeResolve);
    }),
  );
};

test('basic debouncing', async () => {
  // Given
  const { asyncResolve, asyncReject } = asyncTestUtils();
  const debounced = AwesomeDebouncePromise(asyncResolve, 100);
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
  expect(asyncResolve).toHaveBeenCalledTimes(1);
  expect(asyncReject).toHaveBeenCalledTimes(0);
  await expectAllPromisesResolved(previousCalls, false);
});

test('basic debouncing with onlyResolvesLast=false', async () => {
  // Given
  const { asyncResolve, asyncReject } = asyncTestUtils();
  const debounced = AwesomeDebouncePromise(asyncResolve, 100, {
    onlyResolvesLast: false,
  });
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
  expect(asyncResolve).toHaveBeenCalledTimes(1);
  expect(asyncReject).toHaveBeenCalledTimes(0);
  await expectAllPromisesResolved(previousCalls, true);
});

test('debouncing with key', async () => {
  // Given
  const { asyncResolve, asyncReject } = asyncTestUtils();
  const debounced = AwesomeDebouncePromise(asyncResolve, 100, {
    key: (_result, keyArg) => 'key:' + keyArg,
  });
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
  const [key1result, key2result, key3result] = await Promise.all([
    debounced(9, 'key1'),
    debounced(10, 'key2'),
    debounced(11, 'key3'),
  ]);
  // Then
  expect(key1result).toBe(9);
  expect(key2result).toBe(10);
  expect(key3result).toBe(11);
  expect(asyncResolve).toHaveBeenCalledTimes(3);
  expect(asyncReject).toHaveBeenCalledTimes(0);
  await expectAllPromisesResolved(previousCalls, false);
});
