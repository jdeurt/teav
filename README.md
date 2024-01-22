# teav

> Typescript errors as values

This library takes heavy inspiration from Rust's `Option` and `Result` types.

## Installation

```
npm i teav --save
```

## Documentation

Currently, there is no dedicated documentation page.
You can consult the JSDoc attached to every method exposed by this library for now.

## Usage

### Simple usage

Javascript errors are invisible to Typescript's type system. To solve this, you
can use the `Result` type to clearly indicate when a function may fail.

```ts
import { Result } from "teav";

function tryToMultiply(x: number, y: number): Result<number, Error> {
    if (x < 10 && y < 10) {
        return Result.Ok(x * y);
    }

    return Result.Err(new Error("Cannot multiply! Numbers are too big!"));
}

const z = tryToMultiply(10, 11);

if (z.isOk()) {
    console.log("Result: " + z.unwrap());
} else {
    console.log("Uh oh!");
}
```

### Wrapping error-throwing functions

Teav supports automatically converting the result of a function call to a `Result`.

```ts
import { Result } from "teav";
import { myIoOperationSync } from "./my/io/utils";

// `result` will be `Err` if `myIoOperation` throws an error.
const result = Result.from(() => myIoOperationSync());

// `mapOrElse` is just one of the many ways of handling `Result` objects.
const data = result.mapOrElse(
    (error) => {
        // Handle error case.
    },
    (data) => {
        // Handle data.
    }
);
```

It also works with async functions.

```ts
import { Result } from "teav";
import { myIoOperation } from "./my/io/utils";

const result = await Result.fromAsync(() => myIoOperation());

const data = result.mapOrElse(
    (error) => {
        // Handle error case.
    },
    (data) => {
        // Handle data.
    }
);
```
