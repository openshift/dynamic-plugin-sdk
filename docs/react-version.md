# React Version Requirement

Tools provided by dynamic plugin SDK are [React](https://reactjs.org/) focused.

If your host application or plugin uses [PatternFly](https://www.patternfly.org/), you should
use a React version that is officially supported by your PatternFly major version.

Host applications will typically provide React specific modules such as `react` and `react-dom`
to their plugins via webpack shared scope object.

## PatternFly 5 example

The [manifest][pf-react-core-5.0.0] for `@patternfly/react-core` package version `5.0.0` contains
the following peer dependencies:

```
"react": "^17 || ^18",
"react-dom": "^17 || ^18"
```

This combines officially supported React versions (`^18`) and older and/or newer React versions
for the sake of technical compatibility (`^17`) into a single version range.

[pf-react-core-5.0.0]: https://github.com/patternfly/patternfly-react/blob/v5.0.0/packages/react-core/package.json
