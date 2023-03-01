# React Version Requirement

Tools provided by dynamic plugin SDK are [React](https://reactjs.org/) focused.

If your host application or plugin uses [PatternFly](https://www.patternfly.org/), you should
use a React version that is officially supported by your PatternFly major version.

Host applications will typically provide React specific modules such as `react` and `react-dom`
to their plugins via webpack shared scope object.

## PatternFly 4 example

The [manifest][pf-react-core-4.276.6] for `@patternfly/react-core` package version `4.276.6`
contains the following peer dependencies:

```
"react": "^16.8 || ^17 || ^18",
"react-dom": "^16.8 || ^17 || ^18"
```

This combines officially supported React versions (`^16.8 || ^17`) and newer React versions for
the sake of technical compatibility (`^18`) into a single version range.

[pf-react-core-4.276.6]: https://github.com/patternfly/patternfly-react/blob/%40patternfly/react-core%404.276.6/packages/react-core/package.json
