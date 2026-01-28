# React Version Requirement

Tools provided by this SDK are [React](https://reactjs.org/) focused.

If your host application or plugin uses [PatternFly](https://www.patternfly.org/), make sure that
your React version is supported by your PatternFly version. Refer to `@patternfly/react-core` peer
dependencies for details.

For example, [`@patternfly/react-core@6.4.0`][pf-react-core-6.4.0] manifest contains the following
peer dependencies:

```
"react": "^17 || ^18 || ^19",
"react-dom": "^17 || ^18 || ^19"
```

To ensure React version consistency, host applications may provide React specific modules such as
`react` and `react-dom` to their plugins via webpack shared scope object.

[pf-react-core-6.4.0]: https://github.com/patternfly/patternfly-react/blob/v6.4.0/packages/react-core/package.json
