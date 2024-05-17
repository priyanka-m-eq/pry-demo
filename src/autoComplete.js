import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/fold/brace-fold";
import "codemirror/addon/fold/comment-fold";
import "codemirror/addon/fold/foldcode";
import "codemirror/addon/fold/foldgutter";
import "codemirror/addon/fold/foldgutter.css";
import "codemirror/addon/hint/javascript-hint";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/lint/javascript-lint";
import "codemirror/addon/lint/lint";
import "codemirror/addon/lint/lint.css";
import "codemirror/addon/search/search.js";
import "codemirror/addon/search/searchcursor";
import "codemirror/keymap/sublime";
import "codemirror/lib/codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/theme/abcdef.css";
import "codemirror/theme/eclipse.css";
import "codemirror/theme/mbo.css";
import { useState } from "react";
import { Controlled as CodeMirror } from "react-codemirror2";
import ReactDOM from "react-dom";
import "./App.css";

const CustomAutoComplete = ({ code, setCode, dataList }) => {
  const [nodes, setNodes] = useState([]);

  //create custom hints
  const customHint = (editor) => {
    const cursor = editor.getCursor();
    const currentLine = editor.getLine(cursor.line);
    const start = cursor.ch;
    let end = cursor.ch;
    while (end < currentLine.length && /[\w$]+/.test(currentLine.charAt(end)))
      ++end;
    return {
      list: dataList,
      from: { line: cursor.line, ch: start },
      to: { line: cursor.line, ch: end },
    };
  };

  //hits options
  const hintOptions = {
    hint: customHint, // Specify the custom hinting function
    completeSingle: false, // Whether to automatically select the only hint
    closeOnUnfocus: true, // Whether to close the hint dialog when the editor loses focus
    // Other hint options...
  };

  //create custom tags
  const renderTags = (cm, from, to, value) => {
    const customTag = document.createElement("span");
    customTag.setAttribute("data-wid", `${value}/${from}-${to}`);
    //creating custom tags
    customTag.innerHTML = `
      <span class=" flex relative box-border whitespace-nowrap rounded border border-solid font-medium
          bg-gray-900 bg-opacity-10 text-gray-900 border-gray-300 jss71 "><span class="whitespace-pre w-[50px]">${value}</span><div class="absolute -mt-px ml-2 inline-block  bg-gray-900 bg-opacity-30 jss70"></div><button class="variable-tag-argument ml-4 cursor-pointer opacity-50 hover:opacity-75 cancel-button" id="${value}/${from}-${to}">[x]</button> <input class="whitespace-pre w-[50px]" max="1"  maxlength="1"  value="X" onkeypress="return !(/^\d+(\s*[-+*/]\s*\d+)*$/g.test(event.key))" onInput="this.value=this.value.replace(/^[-_a-zA-Z0-9.]+$/,'');" /></span>
    `;

    customTag.addEventListener("click", (event) => {
      if (event.target.tagName === "BUTTON") {
        event.target.parentNode.parentNode.parentNode.remove();
        const formTo = event.target.id.split("/")[1];
        const start = formTo.split("-")[0];
        const end = formTo.split("-")[1];
        const valueTemp = code.substr(0, start) + code.substr(end);
        //   setCode(valueTemp);
      }
    });
    return customTag;
  };

  const handleLoad = (editor) => {
    replaceShortCode(editor, { line: 0, ch: 0 }, code);
  };
  const handleUpdate = (editor) => {
    renderReactNodes(editor);
  };

  const replaceShortCode = (editor, loc, value) => {
    const cursor = editor.getSearchCursor(value, loc, {
      multiline: "disable",
    });
    while (cursor.findNext()) {
      const markers = editor.findMarks(cursor.from(), cursor.to());
      if (markers.length === 0) {
        const from = cursor.from();
        const to = cursor.to();

        const node = renderTags(editor, from.ch, to.ch, value);
        setNodes([...nodes, node]);
        editor.markText(from, to, { replacedWith: node });
      }
    }
  };

  const renderReactNodes = (editor) => {
    let needsRefresh = false;
    setNodes([
      ...nodes.filter((n) => {
        if (n.ownerDocument.body.contains(n)) {
          if (!n.dataset.__react_rendered) {
            const widgetId = n.dataset.wid;
            n.dataset.__react_rendered = "1";
            ReactDOM.render(<Widget wid={widgetId} />, n);
            needsRefresh = true;
          }
          return true;
        } else {
          if (n.dataset.__react_rendered) {
            ReactDOM.unmountComponentAtNode(n);
          }
          return false;
        }
      }),
    ]);
    if (needsRefresh) {
      editor.refresh();
    }
  };

  return (
    <span className="border">
      <CodeMirror
        value={code}
        onBeforeChange={(editor, data, newCode) => {
          setCode(newCode);
        }}
        onChange={(editor, data, value) => {
          const reg = /[a-z0-9]/i;
          const { origin, text } = data;
          if (origin === "+input" && (reg.test(text) || text[0] === ".")) {
            editor.showHint(hintOptions);
          }
          const { from } = data;
          const fromStartOfLine = { ...from, ch: 0 };
          if (dataList.includes(text[0])) {
            replaceShortCode(editor, fromStartOfLine, text[0]);
          }
        }}
        options={{
          mode: "javascript",
          theme: "material",
          lineNumbers: false,
          extraKeys: { "Ctrl-Space": "autocomplete" }, // Enable manual trigger for autocomplete
          hintOptions: hintOptions,
        }}
        onUpdate={handleUpdate}
        onLoad={handleLoad}
        hintOptions={hintOptions}
      />
    </span>
  );
};
function Widget(props) {
  return <span>Widget {props.wid}</span>;
}
export default CustomAutoComplete;
