// ensure the global object is indexable with string
declare interface global extends globalThis {
  [key: string]: any;
}
