const Scope = require("./fieldScope");

/**
 * @typedef {{
 *    id: number,
 *    type: string,
 *    value: any,
 *    tooltip: string,
 *    isMark: boolean,
 *    signal: string | undefined,
 *    scale: string | undefined,
 *    data: string | undefined,
 *    event: string | undefined,
 *    root: boolean
 *  }} Node
 * @typedef {{
 *    source: number,
 *    target: number,
 *    param: string
 *  }} Edge
 * @typedef {{
 *    node: Node,
 *    scope: Scope,
 *    operations: {type: string, params: string}[],
 *    mark: boolean
 * }} ScopeWrapper
 */

/**
 *
 * @param {Node} node
 * @param {Node[]} nodes
 * @param {Edge[]} edges
 */
function markTopoNodes(node, nodes, edges) {
  node.keep = true;
  edges
    .filter(
      (edge) =>
        (edge.source !== undefined ? edge.source : edge.nodes[0]) === node.id &&
        edge.param === "pulse"
    )
    .map((edge) =>
      nodes.find(
        (node) =>
          node.id === (edge.target !== undefined ? edge.target : edge.nodes[1])
      )
    )
    .forEach((node) => {
      if (!node.keep) {
        markTopoNodes(node, nodes, edges);
      }
    });
}

/**
 *
 * @param {[Node[], Edge[]]} dataflow
 * @returns {[Node[], Edge[]]}
 */
function extractDataGraph([nodes, edges]) {
  try {
    [nodes, edges] = JSON.parse(JSON.stringify([nodes, edges]));
  } catch {
    [nodes, edges] = [nodes.slice(), edges.slice()];
  }
  nodes
    .filter(
      (node) =>
        node.data &&
        ((node.value.metadata && node.value.metadata.source) ||
          (node.value._argops && node.value._argval))
    )
    .forEach((node) => markTopoNodes(node, nodes, edges));
  const dataNodes = nodes.filter((node) => node.keep);
  const dataEdges = edges.filter(
    (edge) =>
      dataNodes.find(
        (node) =>
          node.id === (edge.source !== undefined ? edge.source : edge.nodes[0])
      ) &&
      dataNodes.find(
        (node) =>
          node.id === (edge.target !== undefined ? edge.target : edge.nodes[1])
      ) &&
      edge.param === "pulse"
  );
  return [dataNodes, dataEdges];
}

/**
 * @param {Node} node
 * @param {Node[]} nodes
 * @param {Edge[]} edges
 * @param {ScopeWrapper | null} parentScope
 * @param {ScopeWrapper[]} scopes
 */
function visitDataflow(node, nodes, edges, parentScope, scopes) {
  let scopeWrapper = parentScope || {
    node,
    scope: new Scope(),
    mark: node.isMark,
    operations: [],
  };
  if (
    (node.tooltip &&
      !node.data &&
      !node.scale &&
      !node.signal &&
      !node.event &&
      !node.isMark) ||
    node.type === "encode" ||
    node.type === "axisticks" ||
    node.type === "legendentries"
  ) {
    const scope = new Scope(parentScope ? parentScope.scope : parentScope);
    scopeWrapper = {
      node,
      scope,
      mark: node.isMark || (parentScope && parentScope.mark),
      operations: [].concat(parentScope ? parentScope.operations : []),
    };
    if (node.type === "encode") {
      const fields = [].concat(
        ...node.tooltip
          .split("\\n")
          .map((mapping) =>
            JSON.parse(
              mapping
                .split(":")[1]
                .split("→")[0]
                .trim()
                .replace(/\\\\/g, "###")
                .replace(/\\/g, "")
                .replace(/###/g, "\\")
            )
          )
      );
      fields.forEach((field) => scope.findField(field));
    } else if (node.type === "axisticks" || node.type === "legendentries") {
      scope.fields = {
        label: [],
        value: [],
        index: [],
      };
    } else if (node.expr) {
      scopeWrapper.operations.push({ type: node.type, params: node.tooltip });
    } else {
      node.tooltip.split("\\n").forEach((tooltip) => {
        tooltip = tooltip.trim();
        if (tooltip.includes("→")) {
          let [fieldsFrom, fiedlsTo] = tooltip.split("→").map((fieldsStr) =>
            (fieldsStr || "")
              .trim()
              .split(",")
              .map((field) => field.trim())
          );
          for (let source of fieldsFrom) {
            for (let target of fiedlsTo) {
              scope.fields[target] = scope.fields[target] || [];
              scope.fields[target].push(source);
            }
          }
        } else {
          let fields = tooltip.split(",").map((field) => field.trim());
          scope.link(...fields);
        }
      });
      scopeWrapper.operations.push({ type: node.type, params: node.tooltip });
    }
    scopes.push(scopeWrapper);
  }
  if (!parentScope) {
    scopes.push(scopeWrapper);
  }
  if (node.isMark) {
    scopeWrapper.mark = true;
  }
  const nextNodes = edges
    .filter((edge) => edge.source === node.id)
    .map((edge) => nodes.find((node) => node.id === edge.target));
  nextNodes.forEach((node) =>
    visitDataflow(node, nodes, edges, scopeWrapper, scopes)
  );
  return scopeWrapper;
}

/**
 * @param {[Node[], Edge[]]} dataflow
 * @returns {{
 *    data: string;
 *    properties: string[];
 *    operations: { type: string; params: string }[];
 *  }[]}
 */
function analyseFieldRelations([nodes, edges]) {
  const rootData = nodes.filter(
    (node) => node.data && !edges.find((edge) => edge.target === node.id)
  );
  const result = [];
  rootData.forEach((node) => {
    const scopes = [];
    const rootScope = visitDataflow(node, nodes, edges, null, scopes);
    const commonScope = Scope.findCommonParentsWithWrapper(
      scopes,
      ...scopes.filter((scope) => scope.mark)
    );
    result.push({
      data: node.data,
      properties: Object.keys(rootScope.scope.fields),
      operations: commonScope ? commonScope.operations : [],
    });
  });
  return result;
}

module.exports = {
  extractDataGraph,
  analyseFieldRelations,
};
