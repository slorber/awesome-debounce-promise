# Awesome Debounce Promise

Debounce your async calls with **React** in mind.

Forget about:

- concurrency issues when promise resolves in "unexpected" order
- leaving promise land for callback hell of Lodash / Underscore

From the author of [this famous SO question](https://stackoverflow.com/a/28046731/82609) about debouncing with React.

# Install

`yarn add awesome-debounce-promise`

`npm install awesome-debounce-promise --save`


```jsx harmony
import AwesomeDebouncePromise from 'awesome-debounce-promise';

const asyncFunction = () => fetch("/api");

const asyncFunctionDebounced = AwesomeDebouncePromise(asyncFunction, 500, options)
```

# Usecases

## Debouncing a search input

```jsx harmony
const searchAPI = text => fetch('/search?text=' + encodeURIComponent(text));

const searchAPIDebounced = AwesomeDebouncePromise(searchAPI, 500);

class SearchInputAndResults extends React.Component {
  state = {
    text: '',
    results: null,
  };

  handleTextChange = async text => {
    this.setState({ text, results: null });
    const result = await searchAPIDebounced(text);
    this.setState({ result });
  };
  
  componentWillUnmount() {
    this.setState = () => {};
  }
}
```

When calling `debouncedSearchAPI`:

- it will debounce the api calls. The API will only be called when user stops typing
- each call will return a promise
- only the promise returned by the last call will resolve, which will prevent the concurrency issues
- there will be at most a single `this.setState({ result });` call per api call

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

  onFieldTextChange = async (fieldId, fieldValue) => {
    this.setState({ [fieldId]: fieldValue });
    await saveFieldValueDebounced(fieldId, fieldValue);
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
