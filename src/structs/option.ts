import { SYM_NONE, SYM_SOME } from "../constants";
import { Result } from "./result";

/**
 * The `Option` class is a utility for handling optional values in TypeScript.
 * It is used to represent encapsulated values that may either be present (`Some`)
 * or absent (`None`). This pattern is helpful in avoiding null or undefined
 * values and provides a robust way to handle optional or nullable types.
 *
 * The `Option` type is particularly useful in scenarios where a value might
 * or might not be returned from a function, or where a property might or might
 * not be present in an object. Instead of returning `null` or `undefined`,
 * functions return an instance of `Option`, which can either be `Some(value)`
 * if a value is present, or `None()` if it's absent.
 *
 * Usage:
 * - Use `Option.Some(value)` to create an `Option` containing a value.
 * - Use `Option.None()` to create an `Option` representing the absence of a value.
 * - Use methods like `isSome()`, `isNone()`, `unwrap()`, and `unwrapOr(default)`
 *   to interact with the `Option` instances.
 *
 * Methods:
 * - `isSome()`: Returns `true` if the option is a `Some` value.
 * - `isNone()`: Returns `true` if the option is a `None` value.
 * - `unwrap()`: Unwraps the option, returning the contained value if it is `Some`,
 *   and throwing an error if it is `None`.
 * - `unwrapOr(default)`: Unwraps the option, returning the contained value if it
 *   is `Some`, or a default value if it is `None`.
 * - Other methods can include `map`, `flatMap`, `filter`, etc., for chaining
 *   operations in a functional style.
 *
 * Example:
 * ```
 * function findUser(id: number): Option<User> {
 *   const user = database.findUserById(id);
 *   if (user) {
 *     return Option.Some(user);
 *   } else {
 *     return Option.None();
 *   }
 * }
 *
 * const userOption = findUser(123);
 * if (userOption.isSome()) {
 *   console.log("User found:", userOption.unwrap());
 * } else {
 *   console.log("User not found");
 * }
 * ```
 */
export class Option<T> {
    protected constructor() {}

    /**
     * Creates an Option instance representing the existence of a value.
     * @param value - The value to be wrapped in a Some.
     * @returns An Option instance representing the value.
     */
    static Some<T>(value: T): Some<T> {
        return new Some(value);
    }

    /**
     * Creates an Option instance representing the absence of a value.
     * @returns An Option instance representing none.
     */
    static None(): None {
        return new None();
    }

    /**
     * Creates an Option instance from a value that might be null or undefined.
     * @param value - The value that might be null or undefined.
     * @returns An Option instance representing the value or none.
     */
    static ofNullable<T>(value: T | null | undefined): Option<T> {
        return value === undefined || value === null
            ? this.None()
            : this.Some(value);
    }

    /**
     * Checks if the Option is None.
     * @returns true if the Option is None, false otherwise.
     */
    isNone(): this is None {
        return Reflect.has(this, SYM_NONE);
    }

    /**
     * Checks if the Option is Some.
     * @returns true if the Option is Some, false otherwise.
     */
    isSome(): this is Some<T> {
        return Reflect.has(this, SYM_SOME);
    }

    /**
     * Checks if the Option is Some and satisfies a specified predicate.
     * @param predicate - A predicate to apply to the wrapped value.
     * @returns true if the Option is Some and the predicate returns true, false otherwise.
     */
    isSomeAnd(predicate: (value: T) => boolean): this is Some<T> {
        return this.isSome() && predicate(this.unwrap());
    }

    /**
     * Transforms the Option's value using a provided function.
     * @param fn - A function to apply to the wrapped value.
     * @returns A new Option instance with the transformed value.
     */
    map<U>(fn: (value: T) => U): Option<U> {
        return this.isSome() ? Option.Some(fn(this.unwrap())) : Option.None();
    }

    /**
     * Transforms the Option's value using a function or returns a default value.
     * @param other - The default value to return if the Option is None.
     * @param fn - A function to apply to the wrapped value.
     * @returns The transformed value or the default value.
     */
    mapOr<U>(other: U, fn: (value: T) => U): U {
        return this.isSome() ? this.map(fn).unwrap() : other;
    }

    /**
     * Transforms the Option's value using a function or executes a function to get a default value.
     * @param other - A function that returns the default value.
     * @param fn - A function to apply to the wrapped value.
     * @returns The transformed value or the default value obtained by calling other.
     */
    mapOrElse<U>(other: () => U, fn: (value: T) => U): U {
        return this.isSome() ? this.map(fn).unwrap() : other();
    }

    /**
     * Returns another Option if the Option is Some, otherwise returns None.
     * @param optb - Another Option to return if the original Option is Some.
     * @returns The provided Option if the original Option is Some, otherwise None.
     */
    and<U>(optb: Option<U>): Option<U> {
        return this.isSome() ? optb : Option.None();
    }

    /**
     * Transforms the Option's value with a function that returns an Option.
     * @param fn - A function that takes the wrapped value and returns an Option.
     * @returns The result of applying fn to the wrapped value if the Option is Some, otherwise None.
     */
    andThen<U>(fn: (value: T) => Option<U>): Option<U> {
        return this.isSome() ? fn(this.unwrap()) : Option.None();
    }

    /**
     * Alias for andThen.
     * @see andThen
     */
    flatMap<U>(fn: (value: T) => Option<U>): Option<U> {
        return this.andThen(fn);
    }

    /**
     * Returns the Option if it's Some, otherwise returns another Option.
     * @param optb - Another Option to return if the original Option is None.
     * @returns The original Option if it's Some, otherwise the provided Option.
     */
    or(optb: Option<T>): Option<T> {
        return this.isSome() ? this : optb;
    }

    /**
     * Returns the Option if it's Some, otherwise returns the result of a function.
     * @param fn - A function that returns an Option.
     * @returns The original Option if it's Some, otherwise the Option returned by fn.
     */
    orElse(fn: () => Option<T>): Option<T> {
        return this.isSome() ? this : fn();
    }

    /**
     * Unwraps the Option, returning the contained value, or throws an error if the Option is None.
     * @param errorMsg - The error message to throw if the Option is None.
     * @returns The wrapped value if the Option is Some.
     * @throws Error with errorMsg if the Option is None.
     */
    expect(errorMsg: string): T {
        if (this.isSome()) {
            return this["value"];
        }

        throw new Error(errorMsg);
    }

    /**
     * Unwraps the Option, returning the contained value, or throws if the Option is None.
     * @returns The wrapped value if the Option is Some.
     * @throws Error if the Option is None.
     */
    unwrap(): T {
        return this.expect("Tried to unwrap a None value");
    }

    /**
     * Unwraps the Option, returning the contained value, or returns a default value if the Option is None.
     * @param other - The default value to return if the Option is None.
     * @returns The wrapped value if the Option is Some, otherwise other.
     */
    unwrapOr(other: T): T {
        return this.isSome() ? this.unwrap() : other;
    }

    /**
     * Unwraps the Option, returning the contained value, or executes a function to get a default value if the Option is None.
     * @param fn - A function that returns the default value.
     * @returns The wrapped value if the Option is Some, otherwise the value returned by fn.
     */
    unwrapOrElse(fn: () => T): T {
        return this.isSome() ? this.unwrap() : fn();
    }

    /**
     * Unwraps the Option, returning the contained value, or undefined if the Option is None.
     * @returns The wrapped value if the Option is Some, otherwise undefined.
     */
    unwrapOrUndefined(): T | undefined {
        return this.isSome() ? this.unwrap() : undefined;
    }

    /**
     * Filters the Option by a predicate, returning Some if the predicate is true, otherwise None.
     * @param predicate - A predicate to apply to the wrapped value.
     * @returns Some if the Option is Some and the predicate returns true, otherwise None.
     */
    filter(predicate: (value: T) => boolean): Option<T> {
        return this.isSomeAnd(predicate) ? this : Option.None();
    }

    /**
     * Flattens nested Options.
     * @returns The inner Option if the original Option is a nested Option, otherwise the original Option.
     */
    flatten(): T extends infer U extends Option<unknown> ? U : T {
        if (this.isNone()) {
            return this as any;
        }

        const value = this.unwrap();

        if (value instanceof Option) {
            return value as any;
        }

        return this as any;
    }

    /**
     * Returns the Option if it's exclusively Some or the other Option is None, otherwise returns None.
     * @param optb - Another Option to compare with.
     * @returns Some if only one of the Options is Some, otherwise None.
     */
    xor(optb: Option<T>): Option<T> {
        return this.isSome() !== optb.isSome() ? this.or(optb) : Option.None();
    }

    /**
     * Converts the Option to a Result, returning Ok if the Option is Some, otherwise Err with a provided error.
     * @param error - The error to use in the Err variant if the Option is None.
     * @returns A Result containing the wrapped value or an error.
     */
    okOr<E extends Error>(error: E): Result<T, E> {
        return this.isSome() ? Result.Ok(this.unwrap()) : Result.Err(error);
    }

    /**
     * Converts the Option to a Result, returning Ok if the Option is Some, otherwise Err with an error from a factory function.
     * @param errorFactory - A function that returns the error to use in the Err variant if the Option is None.
     * @returns A Result containing the wrapped value or an error.
     */
    okOrElse<E extends Error>(errorFactory: () => E): Result<T, E> {
        return this.isSome()
            ? Result.Ok(this.unwrap())
            : Result.Err(errorFactory());
    }
}

export class Some<T> extends Option<T> {
    private readonly [SYM_SOME] = true as const;

    constructor(private readonly value: T) {
        super();
    }

    isNone(): false {
        return false;
    }

    isSome(): true {
        return true;
    }

    expect(errorMsg: string): T {
        return this.value;
    }

    unwrap(): T {
        return this.value;
    }

    unwrapOrUndefined(): T {
        return this.value;
    }
}

export class None extends Option<never> {
    private readonly [SYM_NONE] = true as const;

    constructor() {
        super();
    }

    isNone(): true {
        return true;
    }

    isSome(): false {
        return false;
    }

    expect(errorMsg: string): never {
        throw new Error(errorMsg);
    }

    unwrap(): never {
        return this.expect("Tried to unwrap a None value");
    }

    unwrapOrUndefined(): undefined {
        return undefined;
    }
}
