Awesome Debounce Promise
==========================

Debounce your async calls with **React** in mind

Forget about these annoying issues:

- promises after unmount
- handle concurrency issues
- leaving promise land for callback hell with lodash/underscore

From the author of [this famous SO question](https://stackoverflow.com/a/28046731/82609) about debouncing with React.

# Usecases

## Debouncing a search input




class SearchBox extends React.Component {
    constructor(props) {
        super(props);
        this.method = debounce(this.method,1000);
    }
    method() { ... }
}


- Debouncing search input / autocomplete results
- Debouncing background saving of a text input




