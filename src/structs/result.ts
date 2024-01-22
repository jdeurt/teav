import { SYM_ERR, SYM_OK } from "../constants";
import { Option } from "./option";

interface Err<E> {
    readonly [SYM_ERR]: true;
    readonly inner: E;
}

interface Ok<T> {
    readonly [SYM_OK]: true;
    readonly inner: T;
}

interface ResultOfErr<E> {
    readonly _value: Err<E>;
}

interface ResultOfOk<T> {
    readonly _value: Ok<T>;
}

export class Result<T, E> {
    private constructor(readonly _value: Ok<T> | Err<E>) {}

    /**
     * Represents the result of a successful operation.
     */
    static Ok<T, E = unknown>(value: T): Result<T, E> {
        return new Result({ [SYM_OK]: true, inner: value });
    }

    /**
     * Represents the result of a failed operation.
     */
    static Err<T = unknown, E = Error>(error: E): Result<T, E> {
        return new Result({ [SYM_ERR]: true, inner: error });
    }

    /**
     * Constructs a new `Result` from the provided function.
     *
     * This function automatically catches errors thrown within `fn` and converts them to an `Err`.
     */
    static from<T = unknown, E = unknown>(fn: () => T): Result<T, E> {
        try {
            return this.Ok(fn());
        } catch (error) {
            return this.Err(error as E);
        }
    }

    /**
     * Constructs a new `Result` from the provided async function.
     *
     * This function automatically catches errors thrown within `fn` and converts them to an `Err`.
     */
    static async fromAsync<T = unknown, E = unknown>(
        fn: () => Promise<T>
    ): Promise<Result<T, E>> {
        try {
            return this.Ok(await fn());
        } catch (error) {
            return this.Err(error as E);
        }
    }

    /**
     * Returns `true` if this result is `Err`.
     */
    isErr(): this is ResultOfErr<E> {
        return Reflect.has(this._value, SYM_ERR);
    }

    /**
     * Returns `true` if this result is `Ok`.
     */
    isOk(): this is ResultOfOk<T> {
        return Reflect.has(this._value, SYM_OK);
    }

    /**
     * Returns `true` if this option is a `Some` and the value inside of it matches a predicate.
     */
    isOkAnd(predicate: (value: T) => boolean): this is ResultOfOk<T> {
        return this.isOk() && predicate(this._value.inner);
    }

    /**
     * Maps this `Result<T, E>` to `Result<U, E>` by applying a function to a contained value (if `Ok`) or returns `Err` (if `Err`).
     */
    map<U>(fn: (value: T) => U): Result<U, E> {
        return this.isOk() ? Result.Ok(fn(this._value.inner)) : (this as any);
    }

    /**
     * Maps this `Result<T, E>` to `Result<T, U>` by applying a function to a contained error (if `Err`) or returns `Ok(value)` (if `Ok(value)`).
     */
    mapErr<U>(fn: (error: E) => U): Result<T, U> {
        return this.isErr() ? Result.Err(fn(this._value.inner)) : (this as any);
    }

    /**
     * Returns the provided default (if `Err`), or applies a function to the contained value (if `Ok`).
     *
     * Arguments passed to `mapOr` are eagerly evaluated; if you are passing the result of a function call, it is recommended to use {@link Result.mapOrElse}, which is lazily evaluated.
     */
    mapOr<U>(other: U, fn: (value: T) => U): U {
        return this.isOk() ? this.map(fn).unwrap() : other;
    }

    /**
     * Maps a `Result<T, E>` to `U` by applying fallback function `other` to a contained `Err` value, or function `fn` to a contained `Ok` value.
     */
    mapOrElse<U>(other: (error: E) => U, fn: (value: T) => U): U {
        return this.isOk()
            ? this.map(fn).unwrap()
            : other(this._value.inner as E);
    }

    /**
     * Returns `res` if this result is `Ok`, otherwise returns this `Err` value.
     *
     * Arguments passed to `and` are eagerly evaluated; if you are passing the result of a function call, it is recommended to use {@link Result.andThen}, which is lazily evaluated.
     */
    and<U>(res: Result<U, E>): Result<U, E> {
        return this.isOk() ? res : (this as any);
    }

    /**
     * Calls `fn` if this result is `Ok`, otherwise returns this `Err` value.
     *
     * This function is identical to {@link Result.flatMap}.
     */
    andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
        return this.isOk() ? fn(this._value.inner) : (this as any);
    }

    /**
     * Calls `fn` if this result is `Ok`, otherwise returns this `Err` value.
     */
    flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
        return this.andThen(fn);
    }

    /**
     * Returns `res` if this result is `Err`, otherwise returns this `Ok` value.
     *
     * Arguments passed to `or` are eagerly evaluated; if you are passing the result of a function call, it is recommended to use {@link Result.orElse}, which is lazily evaluated.
     */
    or(res: Result<T, E>): Result<T, E> {
        return this.isOk() ? this : res;
    }

    /**
     * Calls `fn` if this result is `Err`, otherwise returns this `Ok` value.
     */
    orElse(fn: () => Result<T, E>): Result<T, E> {
        return this.isOk() ? this : fn();
    }

    /**
     * Returns the contained `Ok` value.
     *
     * @throws the contained `Err` value if the contained value is `Err`.
     */
    unwrap(): T {
        if (this.isOk()) {
            return this._value.inner;
        }

        throw this._value.inner;
    }

    /**
     * Returns the contained `Ok` value or a provided default.
     *
     * Arguments passed to `unwrapOr` are eagerly evaluated; if you are passing the result of a function call, it is recommended to use {@link Result.unwrapOrElse}, which is lazily evaluated.
     */
    unwrapOr(other: T): T {
        return this.isOk() ? this._value.inner : other;
    }

    /**
     * Returns the contained `Ok` value or computes it from a closure.
     */
    unwrapOrElse(fn: () => T): T {
        return this.isOk() ? this._value.inner : fn();
    }

    /**
     * Converts from `Result<Result<T, E>, E>` to `Result<T, E>`.
     *
     * Calling `flatten` on a result that is already `Err` is a no-op.
     * Calling `flatten` on a result that is not `Ok(Result<T, E>)` is a no-op.
     */
    flatten(): T extends infer U extends Result<unknown, unknown> ? U : T {
        return this.isOk() &&
            typeof this._value.inner === "object" &&
            this._value.inner !== null &&
            Reflect.has(this._value.inner, SYM_OK)
            ? (this._value.inner as any).inner
            : (this as any);
    }

    /**
     * Converts from `Result<T, E>` to `Option<T>`.
     */
    ok(): Option<T> {
        return this.isOk() ? Option.Some(this._value.inner) : Option.None();
    }

    /**
     * Converts from `Result<T, E>` to `Option<E>`.
     */
    err(): Option<E> {
        return this.isErr() ? Option.Some(this._value.inner) : Option.None();
    }
}
