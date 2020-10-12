import React, { useRef } from "react";
import defaultSpecObject from "../examples/bar-chart.json";
import FloatingButton from "../components/FloatingButton";
import noop from "../helpers/noop";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAutoSizeMonacoEditor } from "../hooks/useMonacoEditor";

const defaultSpec = JSON.stringify(defaultSpecObject, undefined, 2);

export type EditorPanelProps = {
  onVisualize?: (spec: string) => void;
  onVisualizeAll?: (spec: string) => void;
};

const EditorPanel: React.FC<EditorPanelProps> = ({
  onVisualize = noop,
  onVisualizeAll = noop,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useAutoSizeMonacoEditor(containerRef, {
    value: defaultSpec,
    language: "json",
  });
  return (
    <>
      <div ref={containerRef} className="w-full h-full overflow-hidden"></div>
      <FloatingButton
        style={{ bottom: "4rem" }}
        onClick={() => onVisualize(editorRef.current?.getValue() ?? "")}
      >
        <FontAwesomeIcon className="mr-1" icon="play-circle" fixedWidth />
        Visualize Main
      </FloatingButton>
      <FloatingButton
        onClick={() => onVisualizeAll(editorRef.current?.getValue() ?? "")}
      >
        <FontAwesomeIcon className="mr-1" icon="play-circle" fixedWidth />
        Visualize All
      </FloatingButton>
    </>
  );
};

export default EditorPanel;
