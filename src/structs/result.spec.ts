import { testProp, fc } from "@fast-check/ava";
import { Result } from "./result";

testProp("map", [fc.anything()], (t, v) => {
    const ok = Result.Ok(v);
    const err = Result.Err(new Error());

    const okMapResult = ok.map((v) => [v]);
    const errMapResult = err.map((v) => [v]);

    t.is(okMapResult.isOk(), true);
    t.is(errMapResult.isOk(), false);

    t.is(okMapResult.unwrap()[0], v);
});

testProp("mapErr", [fc.anything()], (t, v) => {
    const e = new Error();

    const ok = Result.Ok(v);
    const err = Result.Err(e);

    const okMapResult = ok.mapErr((v) => new Error(v));
    const errMapResult = err.mapErr((v) => new Error(v.message));

    t.is(okMapResult.isOk(), true);
    t.is(errMapResult.isOk(), false);

    try {
        errMapResult.unwrap();
        t.fail();
    } catch (error) {
        t.is((error as Error).message, e.message);
    }
});
