import { SYM_LEFT, SYM_RIGHT } from "../constants";
import { Option } from "./option";

/**
 * The `Either` class is a functional programming construct used in TypeScript
 * to represent a value that can be one of two types: a 'Left' value or a 'Right'
 * value. Typically, 'Left' is used to hold an error or an exceptional case,
 * while 'Right' is used to hold a successful value. This pattern is beneficial
 * for error handling and for functions that may return either a valid result
 * or some kind of failure.
 *
 * The `Either` type encourages handling of all possible outcomes of a computation,
 * making the code more robust and explicit about error states. It is an alternative
 * to exceptions and can be used to avoid throwing and catching errors in favor
 * of a more functional approach.
 *
 * Usage:
 * - Use `Either.Left(value)` to create an `Either` representing a failure or error state.
 * - Use `Either.Right(value)` to create an `Either` representing a success state.
 * - Use methods like `isLeft()`, `isRight()`, `unwrapLeft()`, `unwrapRight()`,
 *   and pattern matching to interact with the `Either` instances.
 *
 * Methods:
 * - `isLeft()`: Returns `true` if the instance is a `Left` value.
 * - `isRight()`: Returns `true` if the instance is a `Right` value.
 * - `unwrapLeft()`: Unwraps the `Left` value, should only be called if `isLeft()` is `true`.
 * - `unwrapRight()`: Unwraps the `Right` value, should only be called if `isRight()` is `true`.
 * - Additional methods can include `mapLeft`, `mapRight`, `flatMap`, etc.,
 *   for chaining operations and transforming values within the `Either`.
 *
 * Example:
 * ```
 * function processInput(input: string): Either<Error, number> {
 *   const parsed = parseInt(input);
 *   if (isNaN(parsed)) {
 *     return Either.Left(new Error("Invalid input"));
 *   } else {
 *     return Either.Right(parsed);
 *   }
 * }
 *
 * const result = processInput("123");
 * if (result.isRight()) {
 *   console.log("Success:", result.unwrapRight());
 * } else {
 *   console.error("Error:", result.unwrapLeft().message);
 * }
 * ```
 *
 * The `Either` type is a powerful tool for controlling flow in a program and
 * making error handling a first-class concern, promoting better, more readable
 * and maintainable code.
 */
export class Either<L, R> {
    protected constructor() {}

    /**
     * Creates an `Either` instance representing a left value.
     * @param value - The value to be wrapped as a left.
     * @returns An instance of `Left`.
     */
    static Left<L>(value: L): Left<L> {
        return new Left(value);
    }

    /**
     * Creates an `Either` instance representing a right value.
     * @param value - The value to be wrapped as a right.
     * @returns An instance of `Right`.
     */
    static Right<R>(value: R): Right<R> {
        return new Right(value);
    }

    /**
     * Applies a function to the contained value based on whether it is left or right.
     * @param onLeft - Function to apply if the value is left.
     * @param onRight - Function to apply if the value is right.
     * @returns The result of applying the appropriate function.
     */
    either<T>(onLeft: (value: L) => T, onRight: (value: R) => T): T {
        return this.isLeft()
            ? onLeft(this.unwrapLeft())
            : onRight(this.unwrapRight());
    }

    /**
     * Similar to `either`, but provides an additional context parameter to the applied functions.
     * @param ctx - Additional context to pass to the applied functions.
     * @param onLeft - Function to apply if the value is left.
     * @param onRight - Function to apply if the value is right.
     * @returns The result of applying the appropriate function with the context.
     */
    eitherWith<Ctx, T>(
        ctx: Ctx,
        onLeft: (value: L, ctx: Ctx) => T,
        onRight: (value: R, ctx: Ctx) => T
    ): T {
        return this.isLeft()
            ? onLeft(this.unwrapLeft(), ctx)
            : onRight(this.unwrapRight(), ctx);
    }

    /**
     * Returns the left value, throwing an error if the value is right.
     * @param message - The error message to throw if the value is right.
     * @returns The left value if present.
     * @throws Error if the value is right.
     */
    expectLeft(message: string): L {
        if (this.isLeft()) {
            return this["value"];
        }

        throw new Error(message);
    }

    /**
     * Returns the right value, throwing an error if the value is left.
     * @param message - The error message to throw if the value is left.
     * @returns The right value if present.
     * @throws Error if the value is left.
     */
    expectRight(message: string): R {
        if (this.isRight()) {
            return this["value"];
        }

        throw new Error(message);
    }

    /**
     * Flips the sides of the `Either`, turning left into right and vice versa.
     * @returns A new `Either` instance with flipped sides.
     */
    flip(): Either<R, L> {
        return this.isLeft()
            ? Either.Right(this.unwrapLeft())
            : Either.Left(this.unwrapRight());
    }

    /**
     * Checks if the `Either` instance is a left value.
     * @returns `true` if the instance is a left value, otherwise `false`.
     */
    isLeft(): this is Left<L> {
        return Reflect.has(this, SYM_LEFT);
    }

    /**
     * Checks if the `Either` instance is a left value and satisfies the given predicate.
     * @param predicate - A predicate function to test the left value.
     * @returns `true` if the instance is a left value and the predicate returns `true`.
     */
    isLeftAnd(predicate: (value: L) => boolean): this is Left<L> {
        return this.isLeft() && predicate(this.unwrapLeft());
    }

    /**
     * Checks if the `Either` instance is a right value.
     * @returns `true` if the instance is a right value, otherwise `false`.
     */
    isRight(): this is Right<R> {
        return Reflect.has(this, SYM_RIGHT);
    }

    /**
     * Checks if the `Either` instance is a right value and satisfies the given predicate.
     * @param predicate - A predicate function to test the right value.
     * @returns `true` if the instance is a right value and the predicate returns `true`.
     */
    isRightAnd(predicate: (value: R) => boolean): this is Right<R> {
        return this.isRight() && predicate(this.unwrapRight());
    }

    /**
     * Extracts the left value as an `Option`.
     * @returns An `Option` containing the left value, or `None` if it's a right value.
     */
    left(): Option<L> {
        return this.isLeft() ? Option.Some(this.unwrapLeft()) : Option.None();
    }

    /**
     * Returns the left value or a default value if the instance is right.
     * @param defaultValue - The default value to return if the instance is right.
     * @returns The left value or the default value.
     */
    leftOr(defaultValue: L): L {
        return this.isLeft() ? this.unwrapLeft() : defaultValue;
    }

    /**
     * Returns the left value or computes it from a function if the instance is right.
     * @param fn - A function to compute the left value if the instance is right.
     * @returns The left value or the computed value.
     */
    leftOrElse(fn: () => L): L {
        return this.isLeft() ? this.unwrapLeft() : fn();
    }

    /**
     * Maps the contained value to another type.
     * @param fn - A function to transform the contained value.
     * @returns A new `Either` instance with the transformed value.
     */
    map<T>(fn: (value: L | R) => T): Either<T, T> {
        return this.isLeft()
            ? Either.Left(fn(this.unwrapLeft()))
            : Either.Right(fn(this.unwrapRight()));
    }

    /**
     * Maps the contained value to another type based on whether it is left or right.
     * @param onLeft - A function to transform the left value.
     * @param onRight - A function to transform the right value.
     * @returns A new `Either` instance with the transformed value.
     */
    mapEither<T, U>(
        onLeft: (value: L) => T,
        onRight: (value: R) => U
    ): Either<T, U> {
        return this.isLeft()
            ? Either.Left(onLeft(this.unwrapLeft()))
            : Either.Right(onRight(this.unwrapRight()));
    }

    /**
     * Similar to `mapEither`, but provides an additional context parameter to the applied functions.
     * @param ctx - Additional context to pass to the applied functions.
     * @param onLeft - A function to transform the left value.
     * @param onRight - A function to transform the right value.
     * @returns A new `Either` instance with the transformed value and context.
     */
    mapEitherWith<Ctx, T, U>(
        ctx: Ctx,
        onLeft: (value: L, ctx: Ctx) => T,
        onRight: (value: R, ctx: Ctx) => U
    ): Either<T, U> {
        return this.isLeft()
            ? Either.Left(onLeft(this.unwrapLeft(), ctx))
            : Either.Right(onRight(this.unwrapRight(), ctx));
    }

    /**
     * Transforms the left value while keeping the right value as is.
     * @param fn - A function to transform the left value.
     * @returns A new `Either` instance with the transformed left value.
     */
    mapLeft<T>(fn: (value: L) => T): Either<T, R> {
        return this.isLeft()
            ? Either.Left(fn(this.unwrapLeft()))
            : Either.Right(this.unwrapRight());
    }

    /**
     * Similar to `mapLeft`, but provides an additional context parameter to the applied function.
     * @param ctx - Additional context to pass to the applied function.
     * @param fn - A function to transform the left value.
     * @returns A new `Either` instance with the transformed left value and context.
     */
    mapLeftWith<Ctx, T>(ctx: Ctx, fn: (value: L, ctx: Ctx) => T): Either<T, R> {
        return this.isLeft()
            ? Either.Left(fn(this.unwrapLeft(), ctx))
            : Either.Right(this.unwrapRight());
    }

    /**
     * Transforms the right value while keeping the left value as is.
     * @param fn - A function to transform the right value.
     * @returns A new `Either` instance with the transformed right value.
     */
    mapRight<T>(fn: (value: R) => T): Either<L, T> {
        return this.isLeft()
            ? Either.Left(this.unwrapLeft())
            : Either.Right(fn(this.unwrapRight()));
    }

    /**
     * Similar to `mapRight`, but provides an additional context parameter to the applied function.
     * @param ctx - Additional context to pass to the applied function.
     * @param fn - A function to transform the right value.
     * @returns A new `Either` instance with the transformed right value and context.
     */
    mapRightWith<Ctx, T>(
        ctx: Ctx,
        fn: (value: R, ctx: Ctx) => T
    ): Either<L, T> {
        return this.isLeft()
            ? Either.Left(this.unwrapLeft())
            : Either.Right(fn(this.unwrapRight(), ctx));
    }

    /**
     * Extracts the right value as an `Option`.
     * @returns An `Option` containing the right value, or `None` if it's a left value.
     */
    right(): Option<R> {
        return this.isRight() ? Option.Some(this.unwrapRight()) : Option.None();
    }

    /**
     * Returns the right value or a default value if the instance is left.
     * @param defaultValue - The default value to return if the instance is left.
     * @returns The right value or the default value.
     */
    rightOr(defaultValue: R): R {
        return this.isRight() ? this.unwrapRight() : defaultValue;
    }

    /**
     * Returns the right value or computes it from a function if the instance is left.
     * @param fn - A function to compute the right value if the instance is left.
     * @returns The right value or the computed value.
     */
    rightOrElse(fn: () => R): R {
        return this.isRight() ? this.unwrapRight() : fn();
    }

    /**
     * Unwraps the left value, throwing an error if the instance is right.
     * @returns The left value if present.
     * @throws Error if the instance is right.
     */
    unwrapLeft(): L {
        return this.expectLeft("Tried to left-unwrap a right value");
    }

    /**
     * Unwraps the right value, throwing an error if the instance is left.
     * @returns The right value if present.
     * @throws Error if the instance is left.
     */
    unwrapRight(): R {
        return this.expectRight("Tried to right-unwrap a left value");
    }
}

export class Left<L> extends Either<L, never> {
    private readonly [SYM_LEFT] = true as const;

    constructor(private readonly value: L) {
        super();
    }

    expectLeft(message: string): L {
        return this.value;
    }

    expectRight(message: string): never {
        throw new Error(message);
    }

    isLeft(): true {
        return true;
    }

    isRight(): false {
        return false;
    }

    unwrapLeft(): L {
        return this.value;
    }

    unwrapRight(): never {
        return this.expectRight("Tried to right-unwrap a left value");
    }
}

export class Right<R> extends Either<never, R> {
    private readonly [SYM_RIGHT] = true as const;

    constructor(private readonly value: R) {
        super();
    }

    expectLeft(message: string): never {
        throw new Error(message);
    }

    expectRight(message: string): R {
        return this.value;
    }

    isLeft(): false {
        return false;
    }

    isRight(): true {
        return true;
    }

    unwrapLeft(): never {
        return this.expectLeft("Tried to left-unwrap a right value");
    }

    unwrapRight(): R {
        return this.value;
    }
}
