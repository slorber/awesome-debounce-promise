# Awesome Debounce Promise

[![NPM](https://img.shields.io/npm/dm/awesome-debounce-promise.svg)](https://www.npmjs.com/package/awesome-debounce-promise)
[![Build Status](https://travis-ci.com/slorber/awesome-debounce-promise.svg?branch=master)](https://travis-ci.com/slorber/awesome-debounce-promise)

Debounce your async calls with **React** in mind.

- No callback hell of lodash/underscore
- Handle concurrent requests nicely (only use last request's response)
- Typescript support (native and well typed)
- React in mind, but can be used in other contexts (no dependency)

Read also [this famous SO question](https://stackoverflow.com/a/28046731/82609) about debouncing with React.


# Install

`yarn add awesome-debounce-promise`

`npm install awesome-debounce-promise --save`

```jsx harmony
import AwesomeDebouncePromise from 'awesome-debounce-promise';

const asyncFunction = () => fetch('/api');

const asyncFunctionDebounced = AwesomeDebouncePromise(
  asyncFunction,
  500,
  options,
);
```

For Typescript, you need the compiler option `"esModuleInterop": true`

# Usecases

## Debouncing a search input (with React class)

```jsx harmony
const searchAPI = text => fetch('/search?text=' + encodeURIComponent(text));

const searchAPIDebounced = AwesomeDebouncePromise(searchAPI, 500);

class SearchInputAndResults extends React.Component {
  mounted = true;

  state = {
    text: '',
    results: null,
  };

  handleTextChange = text => {
    this.setState({ text, results: null }, async () => {
      const results = await searchAPIDebounced(text);
      if (this.mounted) {
        this.setState({ results });
      }
    });
  };

  componentWillUnmount() {
    this.mounted = false;
  }
}
```

When calling `debouncedSearchAPI`:

- it will debounce the api calls. The API will only be called when user stops typing
- each call will return a promise
- only the promise returned by the last call will resolve, which will prevent the concurrency issues
- there will be at most a single `this.setState({ result });` call per api call

## Debouncing a search input (with React hooks)

I recommend solving this problem with [react-async-hook](https://github.com/slorber/react-async-hook), which plays well with `awesome-debounce-promise`. You'll find more informations on `react-async-hook` readme and runnable examples.

```tsx
const useSearchStarwarsHero = () => {
  // Handle the input text state
  const [inputText, setInputText] = useState('');

  // Debounce the original search async function
  const debouncedSearchStarwarsHero = useConstant(() =>
    AwesomeDebouncePromise(searchStarwarsHero, 300)
  );

  const search = useAsync(debouncedSearchStarwarsHero,[inputText]);

  // Return everything needed for the hook consumer
  return {
    inputText,
    setInputText,
    search,
  };
};
```

## Debouncing the background saving of some form inputs

```jsx harmony
const saveFieldValue = (fieldId, fieldValue) =>
  fetch('/saveField', {
    method: 'PUT',
    body: JSON.stringify({ fieldId, fieldValue }),
  });

const saveFieldValueDebounced = AwesomeDebouncePromise(
  saveFieldValue,
  500,
  // Use a key to create distinct debouncing functions per field
  { key: (fieldId, text) => fieldId },
);

class SearchInputAndResults extends React.Component {
  state = {
    value1: '',
    value2: '',
  };

  onFieldTextChange = (fieldId, fieldValue) => {
    this.setState({ [fieldId]: fieldValue }, async () => {
      await saveFieldValueDebounced(fieldId, fieldValue);
    });
  };

  render() {
    const { value1, value2 } = this.state;
    return (
      <form>
        <input
          value={value1}
          onChange={e => onFieldTextChange(1, e.target.value)}
        />
        <input
          value={value2}
          onChange={e => onFieldTextChange(2, e.target.value)}
        />
      </form>
    );
  }
}
```

Thanks to the `key` feature, the 2 fields will be debounced independently from each others. In practice, one debounced function is created for each key.

# Options

```jsx harmony
const DefaultOptions = {
  // One distinct debounced function is created per key and added to an internal cache
  // By default, the key is null, which means that all the calls
  // will share the same debounced function
  key: (...args) => null,

  // By default, a debounced function will only resolve
  // the last promise it returned
  // Former calls will stay unresolved, so that you don't have
  // to handle concurrency issues in your code
  // Setting this to false means all returned promises will resolve to the last result
  onlyResolvesLast: true,
};
```

Other debouncing options are available and provided by an external low-level library: [debounce-promise](https://github.com/bjoerge/debounce-promise)

# FAQ

### How can I cancel the debouncing?

You can easily add promise cancellation support to this lib with [awesome-imperative-promise](https://github.com/slorber/awesome-imperative-promise), lib that is already used internally.

### Why is my debouncing function always firing and is not debounced?

The debouncing function returned by the lib is stateful. If you want deboucing to work fine, make sure to avoid recreating this function everytime. This is the same behavior as regular callback-based debouncing functions.

Instead of this:

```js
handleTextChange = text => {
  const searchAPI = text => fetch('/search?text=' + encodeURIComponent(text));
  const searchAPIDebounced = AwesomeDebouncePromise(searchAPI, 500);
  this.setState({ text, results: null }, async () => {
    const results = await searchAPIDebounced(text);
    this.setState({ results });
  });
};
```

Do this:

```js
const searchAPI = text => fetch('/search?text=' + encodeURIComponent(text));
const searchAPIDebounced = AwesomeDebouncePromise(searchAPI, 500);

handleTextChange = text => {
  this.setState({ text, results: null }, async () => {
    const results = await searchAPIDebounced(text);
    this.setState({ results });
  });
};
```

# Dependencies

This library is a combination of multiple low-level tiny microlibs:

- [debounce-promise](https://github.com/bjoerge/debounce-promise)
- [awesome-only-resolves-last-promise](https://github.com/slorber/awesome-only-resolves-last-promise)
- [awesome-imperative-promise](https://github.com/slorber/awesome-imperative-promise)


# Hire a freelance expert

Looking for a React/ReactNative freelance expert with more than 5 years production experience?
Contact me from my [website](https://sebastienlorber.com/) or with [Twitter](https://twitter.com/sebastienlorber).
