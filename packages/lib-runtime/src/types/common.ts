// TODO use https://www.typescriptlang.org/docs/handbook/project-references.html
// with --build flag to extract common code and types into a separate package

// The type {} doesn't mean "any empty object", it means "any non-nullish value"
// https://github.com/typescript-eslint/typescript-eslint/issues/2063#issuecomment-675156492
export type AnyObject = Record<string, unknown>;
