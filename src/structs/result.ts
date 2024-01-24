import { SYM_ERR, SYM_OK } from "../constants";
import { None, Option, Some } from "./option";

/**
 * The `Result` class in TypeScript is a versatile construct used for error handling
 * and representing the outcome of operations that can either succeed or fail. It's
 * a way of encapsulating a successful outcome with a value of type `T`, or a failure
 * with an error of type `E`. This approach makes error handling more explicit and
 * integrated into the type system, compared to traditional try-catch error handling.
 *
 * The `Result` type is particularly useful in functions that can fail, where you
 * would typically throw an exception. Instead of throwing, you return either a
 * success value (`Ok`) or an error (`Err`). This forces callers to handle the
 * possibility of failure explicitly, leading to more robust and maintainable code.
 *
 * Usage:
 * - Use `Result.Ok(value)` to represent a successful outcome.
 * - Use `Result.Err(error)` to represent an error or failure.
 * - Use methods like `isOk()`, `isErr()`, `unwrap()`, and `unwrapOr(default)`
 *   to handle the `Result` based on whether it's an `Ok` or an `Err`.
 *
 * Methods:
 * - `isOk()` and `isErr()` check if the result is successful or an error, respectively.
 * - `unwrap()` retrieves the value if the result is `Ok`, or throws the error if it's `Err`.
 * - `unwrapOr(default)` returns the value if `Ok`, or a default value if `Err`.
 * - `map()`, `mapErr()`, `andThen()`, and other combinators for chaining operations.
 *
 * Example:
 * ```
 * function divide(a: number, b: number): Result<number, Error> {
 *   if (b === 0) {
 *     return Result.Err(new Error("Division by zero"));
 *   } else {
 *     return Result.Ok(a / b);
 *   }
 * }
 *
 * const result = divide(10, 2);
 * if (result.isOk()) {
 *   console.log("Result:", result.unwrap());
 * } else {
 *   console.error("Error:", result.unwrapErr().message);
 * }
 * ```
 *
 * The `Result` type encourages handling both success and error outcomes, leading
 * to more predictable and error-resilient code structures.
 */
export class Result<T, E extends Error> {
    protected constructor() {}

    /**
     * Creates a Result instance representing a successful outcome.
     * @param value - The success value.
     * @returns A Result instance representing success.
     */
    static Ok<T>(value: T): Ok<T> {
        return new Ok(value);
    }

    /**
     * Creates a Result instance representing an error.
     * @param error - The error object.
     * @returns A Result instance representing the error.
     */
    static Err<E extends Error>(error: E): Err<E> {
        return new Err(error);
    }

    /**
     * Creates a Result from a function that may throw an error.
     * @param fn - A function that returns a value or throws an error.
     * @returns A Result instance, either Ok or Err.
     */
    static unsafeFrom<T, E extends Error = Error>(fn: () => T): Result<T, E> {
        try {
            return this.Ok(fn());
        } catch (error) {
            return this.Err(error as E);
        }
    }

    /**
     * Creates a Result from a function that may throw expected errors.
     * @param expectedErrors - An array of expected error constructors.
     * @param fn - A function that returns a value or throws an error.
     * @returns A Result instance, either Ok or Err.
     * @throws Error if an unexpected error occurs.
     */
    static from<T, E extends Error>(
        expectedErrors: Array<new (...args: any[]) => E>,
        fn: () => T
    ): Result<T, E> {
        try {
            return this.Ok(fn());
        } catch (error) {
            if (
                expectedErrors.some(
                    (expectedError) => error instanceof expectedError
                )
            ) {
                return this.Err(error as E);
            }

            throw error;
        }
    }

    /**
     * Asynchronously creates a Result from a function that may throw an error.
     * @param fn - An asynchronous function that returns a promise.
     * @returns A promise that resolves to a Result instance, either Ok or Err.
     */
    static async unsafeFromAsync<T = unknown, E extends Error = Error>(
        fn: () => Promise<T>
    ): Promise<Result<T, E>> {
        try {
            return this.Ok(await fn());
        } catch (error) {
            return this.Err(error as E);
        }
    }

    /**
     * Asynchronously creates a Result from a function that may throw expected errors.
     * @param expectedErrors - An array of expected error constructors.
     * @param fn - An asynchronous function that returns a promise.
     * @returns A promise that resolves to a Result instance, either Ok or Err.
     * @throws Error if an unexpected error occurs.
     */
    static async fromAsync<T, E extends Error>(
        expectedErrors: Array<new (...args: any[]) => E>,
        fn: () => Promise<T>
    ): Promise<Result<T, E>> {
        try {
            return this.Ok(await fn());
        } catch (error) {
            if (
                expectedErrors.some(
                    (expectedError) => error instanceof expectedError
                )
            ) {
                return this.Err(error as E);
            }

            throw error;
        }
    }

    /**
     * Checks if the Result is an Err.
     * @returns true if the Result is an Err, false otherwise.
     */
    isErr(): this is Err<E> {
        return Reflect.has(this, SYM_ERR);
    }

    /**
     * Checks if the Result is Ok.
     * @returns true if the Result is Ok, false otherwise.
     */
    isOk(): this is Ok<T> {
        return Reflect.has(this, SYM_OK);
    }

    /**
     * Checks if the Result is Ok and satisfies a specified predicate.
     * @param predicate - A predicate to apply to the Ok value.
     * @returns true if the Result is Ok and the predicate returns true, false otherwise.
     */
    isOkAnd(predicate: (value: T) => boolean): this is Ok<T> {
        return this.isOk() && predicate(this.unwrap());
    }

    /**
     * Transforms the Result's value using a provided function.
     * @param fn - A function to apply to the Ok value.
     * @returns A new Result instance with the transformed value.
     */
    map<U>(fn: (value: T) => U): Result<U, E> {
        return this.isOk() ? Result.Ok(fn(this.unwrap())) : (this as any);
    }

    /**
     * Transforms the Result's error using a provided function.
     * @param fn - A function to apply to the Err value.
     * @returns A new Result instance with the transformed error.
     */
    mapErr<U extends Error>(fn: (error: E) => U): Result<T, U> {
        return this.isErr()
            ? Result.Err(fn(this.err().unwrap()))
            : (this as any);
    }

    /**
     * Transforms the Result's value using a function or returns a default value.
     * @param other - The default value to return if the Result is Err.
     * @param fn - A function to apply to the Ok value.
     * @returns The transformed value or the default value.
     */
    mapOr<U>(other: U, fn: (value: T) => U): U {
        return this.isOk() ? this.map(fn).unwrap() : other;
    }

    /**
     * Transforms the Result's value using a function or executes a function to get a default value.
     * @param other - A function that returns the default value.
     * @param fn - A function to apply to the Ok value.
     * @returns The transformed value or the default value obtained by calling other.
     */
    mapOrElse<U>(other: (error: E) => U, fn: (value: T) => U): U {
        return this.isOk()
            ? this.map(fn).unwrap()
            : other(this.err().unwrap() as E);
    }

    /**
     * Returns another Result if the original Result is Ok, otherwise returns the original Result.
     * @param res - Another Result to return if the original Result is Ok.
     * @returns The provided Result if the original Result is Ok, otherwise the original Result.
     */
    and<U>(res: Result<U, E>): Result<U, E> {
        return this.isOk() ? res : (this as any);
    }

    /**
     * Transforms the Result's value with a function that returns a Result.
     * @param fn - A function that takes the Ok value and returns a Result.
     * @returns The result of applying fn to the Ok value if the Result is Ok, otherwise the original Result.
     */
    andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
        return this.isOk() ? fn(this.unwrap()) : (this as any);
    }

    /**
     * Alias for andThen.
     * @see andThen
     */
    flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
        return this.andThen(fn);
    }

    /**
     * Returns the Result if it's Ok, otherwise returns another Result.
     * @param res - Another Result to return if the original Result is Err.
     * @returns The original Result if it's Ok, otherwise the provided Result.
     */
    or(res: Result<T, E>): Result<T, E> {
        return this.isOk() ? this : res;
    }

    /**
     * Returns the Result if it's Ok, otherwise returns the result of a function.
     * @param fn - A function that returns a Result.
     * @returns The original Result if it's Ok, otherwise the Result returned by fn.
     */
    orElse(fn: () => Result<T, E>): Result<T, E> {
        return this.isOk() ? this : fn();
    }

    /**
     * Unwraps the Result, returning the contained value, or throws if the Result is Err.
     * @returns The Ok value if the Result is Ok.
     * @throws The Err value if the Result is Err.
     */
    unwrap(): T {
        if (this.isOk()) {
            return this["value"];
        }

        throw this.err().unwrap();
    }

    /**
     * Unwraps the Result, returning the contained value, or returns a default value if the Result is Err.
     * @param other - The default value to return if the Result is Err.
     * @returns The Ok value if the Result is Ok, otherwise other.
     */
    unwrapOr(other: T): T {
        return this.isOk() ? this.unwrap() : other;
    }

    /**
     * Unwraps the Result, returning the contained value, or executes a function to get a default value if the Result is Err.
     * @param fn - A function that returns the default value.
     * @returns The Ok value if the Result is Ok, otherwise the value returned by fn.
     */
    unwrapOrElse(fn: () => T): T {
        return this.isOk() ? this.unwrap() : fn();
    }

    /**
     * Flattens nested Results.
     * @returns The inner Result if the original Result is a nested Result, otherwise the original Result.
     */
    flatten(): T extends infer U extends Result<unknown, Error> ? U : T {
        if (this.isErr()) {
            return this as any;
        }

        const value = this.unwrap();

        if (value instanceof Result) {
            return value as any;
        }

        return this as any;
    }

    /**
     * Converts the Result to an Option, containing the Ok value if present.
     * @returns An Option containing the Ok value or None if the Result is Err.
     */
    ok(): Option<T> {
        return this.isOk() ? Option.Some(this["value"]) : Option.None();
    }

    /**
     * Converts the Result to an Option, containing the Err value if present.
     * @returns An Option containing the Err value or None if the Result is Ok.
     */
    err(): Option<E> {
        return this.isErr() ? Option.Some(this["value"]) : Option.None();
    }
}

class Ok<T> extends Result<T, never> {
    readonly [SYM_OK] = true;

    constructor(private readonly value: T) {
        super();
    }

    isErr(): false {
        return false;
    }

    isOk(): true {
        return true;
    }

    unwrap(): T {
        return this.value;
    }

    ok(): Some<T> {
        return Option.Some(this.value);
    }

    err(): None {
        return Option.None();
    }
}

class Err<E extends Error> extends Result<never, E> {
    readonly [SYM_ERR] = true;

    constructor(private readonly value: E) {
        super();
    }

    isErr(): true {
        return true;
    }

    isOk(): false {
        return false;
    }

    unwrap(): never {
        throw this.value;
    }

    ok(): None {
        return Option.None();
    }

    err(): Some<E> {
        return Option.Some(this.value);
    }
}
