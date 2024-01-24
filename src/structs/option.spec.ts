import { testProp, fc } from "@fast-check/ava";
import { Option } from "./option";

const genOptions = (v: unknown) => [Option.Some(v), Option.None()] as const;

testProp("map", [fc.anything()], (t, v) => {
    const [some, none] = genOptions(v);

    const someMapResult = some.map((v) => [v]);
    const noneMapResult = none.map((v) => [v]);

    t.is(someMapResult.isSome(), true);
    t.is(noneMapResult.isSome(), false);

    t.is(someMapResult.unwrap()[0], v);
});

testProp("and", [fc.anything(), fc.anything()], (t, v1, v2) => {
    const [some1, none1] = genOptions(v1);
    const [some2, none2] = genOptions(v2);

    t.is(some1.and(some2).unwrapOrUndefined(), v2);
    t.is(none1.and(some2).unwrapOrUndefined(), undefined);
    t.is(some1.and(none2).unwrapOrUndefined(), undefined);
});

testProp("or", [fc.anything(), fc.anything()], (t, v1, v2) => {
    const [some1, none1] = genOptions(v1);
    const [some2, none2] = genOptions(v2);

    t.is(some1.or(some2).unwrapOrUndefined(), v1);
    t.is(some1.or(none2).unwrapOrUndefined(), v1);
});

testProp("xor", [fc.anything(), fc.anything()], (t, v1, v2) => {
    const [some1, none1] = genOptions(v1);
    const [some2, none2] = genOptions(v2);

    t.is(some1.xor(some2).unwrapOrUndefined(), undefined);
    t.is(some1.xor(none2).unwrapOrUndefined(), v1);
});

testProp("okOr", [fc.anything()], (t, v) => {
    const [some, none] = genOptions(v);

    const err = new Error();

    t.is(some.okOr(err).unwrap(), v);
    t.is(none.okOr(err).isErr(), true);

    try {
        none.okOr(err).unwrap();
        t.fail();
    } catch (error) {
        t.is(error, err);
    }
});
