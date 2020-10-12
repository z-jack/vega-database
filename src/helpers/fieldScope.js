/**
 * @typedef {{
 *    node: Node,
 *    scope: Scope,
 *    operations: {type: string, params: string}[],
 *    mark: boolean
 * }} ScopeWrapper
 */

class Scope {
  /**
   *
   * @param {Scope} parent
   */
  constructor(parent = null) {
    /**
     * @type {{[field: string]: string[]}}
     */
    this.fields = {};
    /**
     * @type {Scope[]}
     */
    this.children = [];
    /**
     * @type {{source: string, target: string}[]}
     */
    this.linkage = [];
    /**
     * @type {number}
     */
    this.level = 0;
    this.parent = parent;
    if (parent) {
      parent.children.push(this);
      this.level = parent.level + 1;
    }
  }

  /**
   *
   * @param {string} fieldName
   */
  findField(fieldName) {
    if (this.fields[fieldName]) {
      return this.parent
        ? this.fields[fieldName].map((subfield) =>
            this.parent.findField(subfield)
          )
        : this.fields[fieldName];
    } else {
      if (this.parent) return this.parent.findField(fieldName);
      this.fields[fieldName] = fieldName;
      return this.fields[fieldName];
    }
  }

  /**
   *
   * @param {string} source
   * @param {string} target
   */
  addLinkage(source, target) {
    if (
      source !== target &&
      !this.linkage.find(
        (link) => link.source === source && link.target === target
      )
    ) {
      this.linkage.push({ source, target });
    }
  }

  /**
   *
   * @param  {...string} fields
   */
  link(...fields) {
    const realFields = fields
      .map((field) => this.findField(field))
      .reduce((p, v) => (v instanceof Array ? p.concat(v) : [...p, v]), []);
    if (this.parent) {
      this.parent.link(...realFields);
    } else {
      for (let source of realFields) {
        for (let target of realFields) {
          this.addLinkage(source, target);
        }
      }
    }
  }

  /**
   *
   * @param  {...string} fields
   */
  sequence(...fields) {
    const realFields = fields
      .map((field) => this.findField(field))
      .reduce((p, v) => (v instanceof Array ? p.concat(v) : [...p, v]), []);
    if (this.parent) {
      this.parent.sequence(...realFields);
    } else {
      for (let i = 0; i < realFields.length; i++) {
        for (let j = i + 1; j < realFields.length; j++) {
          const source = realFields[i];
          const target = realFields[j];
          this.addLinkage(source, target);
        }
      }
    }
  }
}

/**
 *
 * @param  {...Scope} scopes
 */
Scope.findCommonParents = (...scopes) => {
  scopes = scopes.filter((scope) => scope);
  if (!scopes.length) return null;
  const minimumLevel = Math.min(...scopes.map((scope) => scope.level));
  let sameLevelScopes = scopes.map((scope) => {
    while (scope.level > minimumLevel) {
      scope = scope.parent;
    }
    return scope;
  });
  while (sameLevelScopes.find((scope) => scope !== sameLevelScopes[0])) {
    sameLevelScopes = sameLevelScopes.map((scope) => scope.parent);
  }
  return sameLevelScopes[0];
};

/**
 * @param  {ScopeWrapper} refs
 * @param  {...ScopeWrapper} wrappers
 */
Scope.findCommonParentsWithWrapper = (refs, ...wrappers) => {
  const scopes = wrappers.map((wrapper) => wrapper.scope);
  const scope = Scope.findCommonParents(...scopes);
  return refs.find((wrapper) => wrapper.scope === scope);
};

module.exports = Scope;
