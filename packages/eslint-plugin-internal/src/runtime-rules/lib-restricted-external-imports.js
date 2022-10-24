const path = require('path');
const findUp = require('find-up');
const minimatch = require('minimatch');

/** @typedef {{ includeFiles: string, excludeFiles: string, excludeModules: string[] }} RuleSetting */

/**
 * @param {import('eslint').Rule.RuleContext} context
 * @param {import('estree').ImportDeclaration} node
 */
const checkImport = (context, node) => {
  const specifier = node.source.value;

  if (typeof specifier !== 'string' || /^[./]/.test(specifier)) {
    return;
  }

  const moduleName = /^@[^/\s]+\//.test(specifier)
    ? specifier.split('/').slice(0, 2).join('/')
    : specifier.split('/')[0];

  const relativeFilePath = path.relative(context.getCwd(), context.getFilename());

  /** @type {RuleSetting[]} */
  const ruleSettings = context.options[0] ?? [];

  const shouldLint = ruleSettings.some(
    ({ includeFiles, excludeFiles, excludeModules }) =>
      !(
        (includeFiles && !minimatch(relativeFilePath, includeFiles)) ||
        (excludeFiles && minimatch(relativeFilePath, excludeFiles)) ||
        (excludeModules && excludeModules.includes(moduleName))
      ),
  );

  if (!shouldLint) {
    return;
  }

  const pkgPath = findUp.sync('package.json', { cwd: path.dirname(context.getFilename()) });

  if (!pkgPath) {
    context.report({
      node,
      message: `Cannot find the closest parent package.json.`,
    });
  }

  // eslint-disable-next-line import/no-dynamic-require
  const { dependencies = {}, peerDependencies = {} } = require(pkgPath);

  if (![...Object.keys(dependencies), ...Object.keys(peerDependencies)].includes(moduleName)) {
    context.report({
      node,
      message: `'${moduleName}' should be listed in dependencies or peerDependencies.`,
    });
  }
};

/**
 * Enforce imported external modules to be declared in `dependencies` or `peerDependencies`
 * within the closest parent `package.json`.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            includeFiles: {
              type: 'string',
            },
            excludeFiles: {
              type: 'string',
            },
            excludeModules: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
          additionalProperties: false,
        },
      },
    ],
  },

  create(context) {
    return {
      ImportDeclaration: (node) => {
        checkImport(context, node);
      },
    };
  },
};
