import React from "react";
import { Panel, PanelHeader, PanelContent, EmptyStatus } from "./common";

export type OperationPanelProps = {
  source: {
    data: string;
    properties: string[];
    operations: { type: string; params: string }[];
  }[];
};

const OperationPanel: React.FC<OperationPanelProps> = ({ source }) => {
  return (
    <Panel className="border-l border-gray-400">
      <PanelHeader className="uppercase">Precompute</PanelHeader>
      <PanelContent>
        {!source.length ? (
          <EmptyStatus>
            Click “Visualize” to extract operations can be precomputed and
            display here
          </EmptyStatus>
        ) : (
          <></>
        )}
        <div>
          {source.map((operation) => (
            <div key={operation.data}>
              <p>==========</p>
              <p>Dataset name: {operation.data}</p>
              <p>
                Properties need:{" "}
                {operation.properties.length
                  ? operation.properties.join(", ")
                  : "none"}
              </p>
              <p>
                Operations can be precomputed:{" "}
                {operation.operations.length
                  ? operation.operations.map((op, i) => (
                      <span key={i}>
                        <br></br>
                        <span style={{ marginLeft: "2em" }}>
                          {op.type}: {op.params}
                        </span>
                      </span>
                    ))
                  : "none"}
              </p>
            </div>
          ))}
        </div>
      </PanelContent>
    </Panel>
  );
};

export default OperationPanel;
