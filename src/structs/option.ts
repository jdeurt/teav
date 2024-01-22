import { SYM_NONE, SYM_SOME } from "../constants";
import { Result } from "./result";

interface None {
    readonly [SYM_NONE]: true;
}

interface Some<T> {
    readonly [SYM_SOME]: true;
    readonly inner: T;
}

interface OptionOfNone {
    readonly _value: None;
}

interface OptionOfSome<T> {
    readonly _value: Some<T>;
}

export class Option<T> {
    private constructor(readonly _value: None | Some<T>) {}

    /**
     * Represents an option containing some value.
     */
    static Some<T>(value: T): Option<T> {
        return new Option({ [SYM_SOME]: true, inner: value });
    }

    /**
     * Represents an option containing no value.
     */
    static None<T = unknown>(): Option<T> {
        return new Option({ [SYM_NONE]: true });
    }

    /**
     * Constructs a new `Option` from the provided value.
     * If the value is nullish, the resulting option is `None`.
     */
    static ofNullable<T>(value: T | null | undefined): Option<T> {
        return value === undefined || value === null
            ? this.None()
            : this.Some(value);
    }

    /**
     * Returns `true` if this option is `None`.
     */
    isNone(): this is OptionOfNone {
        return Reflect.has(this._value, SYM_NONE);
    }

    /*
     * Returns `true` if this option is a `Some`.
     */
    isSome(): this is OptionOfSome<T> {
        return Reflect.has(this._value, SYM_SOME);
    }

    /**
     * Returns `true` if this option is a `Some` and the value inside of it matches a predicate.
     */
    isSomeAnd(predicate: (value: T) => boolean): this is OptionOfSome<T> {
        return this.isSome() && predicate(this._value.inner);
    }

    /**
     * Maps this `Option<T>` to `Option<U>` by applying a function to a contained value (if `Some`) or returns `None` (if `None`).
     */
    map<U>(fn: (value: T) => U): Option<U> {
        return this.isSome()
            ? Option.Some(fn(this._value.inner))
            : Option.None();
    }

    /**
     * Returns the provided default result (if `None`), or applies a function to the contained value (if `Some`).
     *
     * Arguments passed to `mapOr` are eagerly evaluated; if you are passing the result of a function call, it is recommended to use {@link Option.mapOrElse}, which is lazily evaluated.
     */
    mapOr<U>(other: U, fn: (value: T) => U): U {
        return this.isSome() ? this.map(fn).unwrap() : other;
    }

    /**
     * Computes a default function result (if `None`), or applies a different function to the contained value (if `Some`).
     */
    mapOrElse<U>(other: () => U, fn: (value: T) => U): U {
        return this.isSome() ? this.map(fn).unwrap() : other();
    }

    /**
     * Returns `None` if this option is `None`, otherwise returns `optb`.
     *
     * Arguments passed to `and` are eagerly evaluated; if you are passing the result of a function call, it is recommended to use {@link Option.andThen}, which is lazily evaluated.
     */
    and<U>(optb: Option<U>): Option<U> {
        return this.isSome() ? optb : Option.None();
    }

    /**
     * Returns `None` if this option is `None`, otherwise calls `fn` with the wrapped value and returns the result.
     *
     * This function is identical to {@link Option.flatMap}.
     */
    andThen<U>(fn: (value: T) => Option<U>): Option<U> {
        return this.isSome() ? fn(this._value.inner) : Option.None();
    }

    /**
     * Returns `None` if this option is `None`, otherwise calls `fn` with the wrapped value and returns the result.
     */
    flatMap<U>(fn: (value: T) => Option<U>): Option<U> {
        return this.andThen(fn);
    }

    /**
     * Returns this option if it contains a value, otherwise returns `optb`.
     *
     * Arguments passed to `or` are eagerly evaluated; if you are passing the result of a function call, it is recommended to use {@link Option.orElse}, which is lazily evaluated.
     */
    or(optb: Option<T>): Option<T> {
        return this.isSome() ? this : optb;
    }

    /**
     * Returns this option if it contains a value, otherwise calls `fn` and returns the result.
     */
    orElse(fn: () => Option<T>): Option<T> {
        return this.isSome() ? this : fn();
    }

    /**
     * Returns the contained `Some` value.
     *
     * @throws if the contained value is `None`.
     */
    expect(errorMsg: string): T {
        if (this.isSome()) {
            return this._value.inner;
        }

        throw new Error(errorMsg);
    }

    /**
     * Returns the contained `Some` value.
     *
     * @throws if the contained value is `None`.
     */
    unwrap(): T {
        return this.expect("called `Option.unwrap()` on a `None` value");
    }

    /**
     * Returns the contained `Some` value or a provided default.
     *
     * Arguments passed to `unwrapOr` are eagerly evaluated; if you are passing the result of a function call, it is recommended to use {@link Option.unwrapOrElse}, which is lazily evaluated.
     */
    unwrapOr(other: T): T {
        return this.isSome() ? this._value.inner : other;
    }

    /**
     * Returns the contained `Some` value or computes it from a closure.
     */
    unwrapOrElse(fn: () => T): T {
        return this.isSome() ? this._value.inner : fn();
    }

    /**
     * Returns the contained `Some` value or `undefined` if this option is `None`.
     */
    unwrapOrUndefined(): T | undefined {
        return this.isSome() ? this._value.inner : undefined;
    }

    /**
     * Returns `None` if this option is `None`, otherwise calls predicate with the wrapped value and returns:
     * - `Some(t)` if `predicate` returns `true` (where `t` is the wrapped value), and
     * - `None` if `predicate` returns `false`.
     */
    filter(predicate: (value: T) => boolean): Option<T> {
        return this.isSomeAnd(predicate) ? this : Option.None();
    }

    /**
     * Converts from `Option<Option<T>>` to `Option<T>`.
     *
     * Calling `flatten` on an option that is already `None` is a no-op.
     * Calling `flatten` on an option that is not `Some(Option<T>)` is a no-op.
     */
    flatten(): T extends infer U extends Option<unknown> ? U : T {
        return this.isSome() &&
            typeof this._value.inner === "object" &&
            this._value.inner !== null &&
            Reflect.has(this._value.inner, SYM_SOME)
            ? (this._value.inner as any).inner
            : (this as any);
    }

    /**
     * Returns `Some` if exactly one of `this` or `optb` is `Some`, otherwise returns `None`.
     */
    xor(optb: Option<T>): Option<T> {
        return this.isSome() !== optb.isSome() ? this.or(optb) : Option.None();
    }

    /**
     * Transforms the `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to `Ok(v)` and `None` to `Err(error)`.
     */
    okOr<E>(error: E): Result<T, E> {
        return this.isSome() ? Result.Ok(this._value.inner) : Result.Err(error);
    }

    /**
     * Transforms the `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to `Ok(v)` and `None` to `Err(errorFactory())`.
     */
    okOrElse<E>(errorFactory: () => E): Result<T, E> {
        return this.isSome()
            ? Result.Ok(this._value.inner)
            : Result.Err(errorFactory());
    }
}
