import React, { useState } from "react";
import { vega2dot, vega2dataDot, vega2operations } from "./helpers/vega2dot";
import { VegaWrapper } from "./components/VegaWrapper";
import styled from "styled-components";
import EditorPanel from "./components/EditorPanel";
import { ErrorBoundary } from "./components/ErrorBoundary";
import defaultSpec from "./examples/bar-chart.json";
import brandImage from "./images/favicon.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Panel,
  PanelHeader,
  PanelContent,
  EmptyStatus,
} from "./components/common";
import DataFlowGraphPanel from "./components/DataFlowGraphPanel";
import TutorialPopup from "./components/TutorialPopup";
import OperationPanel from "./components/OperationPanel";

const AppHeader = styled.nav.attrs({ className: "bg-gray-900" })`
  grid-column: 1 / span 2;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  color: white;
`;

const AppFooter = styled.footer.attrs({ className: "bg-gray-900" })`
  grid-column: 1 / span 2;
  width: 100%;
`;

const AppLayout = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  grid-template-rows: 3rem minmax(0, 1fr) minmax(0, 1fr) 1.5rem;
  // overflow: hidden;
`;

const App: React.FC = () => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [operations, setOperations] = useState<
    {
      data: string;
      properties: string[];
      operations: { type: string; params: string }[];
    }[]
  >([]);
  const [dataFlow, setDataFlow] = useState<string>("");
  const [spec, setSpec] = useState(JSON.stringify(defaultSpec, undefined, 2));
  // Reference: https://sung.codes/blog/2018/09/29/resetting-error-boundary-error-state/
  const [errorBoundaryKey, setErrorBoundaryKey] = useState(0);

  return (
    <>
      <AppLayout>
        <AppHeader>
          <img className="mr-2 h-6 w-6" src={brandImage} alt="Vega Database" />
          <span className="text-xl font-bold">Vega Database</span>
          <button
            className="ml-auto px-2 py-1 bg-gray-200 text-gray-900 rounded shadow transition duration-150 hover:gray-100"
            onClick={() => setShowTutorial(!showTutorial)}
          >
            <FontAwesomeIcon icon="question-circle" fixedWidth />
            Tutorials
          </button>
        </AppHeader>
        <Panel>
          <PanelHeader className="uppercase">Source Code</PanelHeader>
          <PanelContent className="relative">
            <EditorPanel
              onVisualize={(source) => {
                setSpec(source);
                setDataFlow(vega2dataDot(source));
                setOperations(vega2operations(source));
                setErrorBoundaryKey(errorBoundaryKey + 1);
              }}
              onVisualizeAll={(source) => {
                setSpec(source);
                setDataFlow(vega2dot(source));
                setOperations(vega2operations(source));
                setErrorBoundaryKey(errorBoundaryKey + 1);
              }}
            />
          </PanelContent>
        </Panel>
        <Panel className="relative border-l border-gray-400">
          <PanelHeader className="uppercase">Visualization</PanelHeader>
          <PanelContent className="flex justify-center items-center bg-gray-200 overflow-auto">
            <ErrorBoundary key={errorBoundaryKey}>
              <VegaWrapper spec={spec} />
            </ErrorBoundary>
          </PanelContent>
        </Panel>
        <OperationPanel source={operations} />
        <DataFlowGraphPanel source={dataFlow} />
        <AppFooter />
      </AppLayout>
      <TutorialPopup
        show={showTutorial}
        onClose={() => setShowTutorial(!showTutorial)}
      />
    </>
  );
};

export default App;
