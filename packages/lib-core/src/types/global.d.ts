// ensure the global object is indexable with string
declare interface global extends globalThis {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
