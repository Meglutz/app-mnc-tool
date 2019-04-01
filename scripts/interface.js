
/*******************************************************************************
** Definitions
*******************************************************************************/
const tlElementId    = "timeLine_element";
const tlElementTitle = "timeline_title";
const stateNotifier  = "stNotifier";
const stateText      = "stWarn";
const mncInfoText    = "stMNCInfo";
const mncStatsText   = "stMNCStats";

const stateRed       = "#e74848";
const stateGreen     = "#53d467";


/*******************************************************************************
** Action: Event: onClick Submit Button.
           - Clears all DOM Elements with the [tlElementId] id
           - Makes a new query using the DOM inputs
           - Creates a TimeLine and a "Modal" for each result
** Return: null
*******************************************************************************/
document.getElementById("query-submit").onclick = function() {
  /* Clear all Elements containing [tlElementId] */
  removeDOMelements(tlElementId);

  let type =  document.getElementById("query-type");  let typeVal = type.options[type.selectedIndex].value;
  let query = document.getElementsByTagName("input")[0].value;

  /* Make a new query */
  MyQueries.push(new Query(Data, typeVal, query));
  let latestQuery = MyQueries.length - 1;

  /* Make result array iterable, if there's only one result it's not iterable */
  if (isIterable(MyQueries[latestQuery].result) == false) {
    MyQueries[latestQuery].result.push("dummy");
  }

  /* Prepare Memory definition string (If the query bit has a Definition) */
  let memDefString = "";
  if (MyQueries[latestQuery].memoryDefinition != null || undefined) {
      Object.entries(MyQueries[latestQuery].memoryDefinition).forEach(memDefAttr => {
          switch (memDefAttr[0]) {
              case "byteType":    memDefString += "<b>Address:</b> " + memDefAttr[1];                break;
              case "byteAddress": memDefString += memDefAttr[1];                                     break;
              case "bitAddress":  memDefString += "." + memDefAttr[1];                               break;
              case "length":      let bitStr = " bits";
                                  if (memDefAttr[1] == 1) {bitStr = " bit"};
                                  memDefString += " | <b>length:</b> " + memDefAttr[1] + bitStr;     break;
              case "symbol":      memDefString += "<br><b>" + "Symbol:</b> " + memDefAttr[1];        break;
          }
      })
  } else {memDefString = "<b>No definition was found</b>"}


  /* Add TimeLine title */
  addDOMtitle(MyQueries[latestQuery].type + " for " +
              MyQueries[latestQuery].memory + "<br><br>" +
              memDefString);

  /* Add a new TimeLine "Modal" for each result */
  for (let result of MyQueries[latestQuery].result) {
    content = parseToOutput(result, typeVal, query, typeVal);
    if (content != undefined) {
        addDOMelement(content.lineString,
                      content.actionString,
                      content.operationString,
                      content.moduleString,
                      content.highlight);
    }
  }

  /* Add last line of the TimeLine */
  addDOMlastLine();

  /* Update State */
  updateDOMStatus(Warnings, Data);
}


/*******************************************************************************
** Action: Adds a DOM Title to the TimeLine
** Return: null
*******************************************************************************/
function addDOMtitle(title) {
    let titleSection = document.getElementById(tlElementTitle);
    let divElement   = document.createElement("div");
        divElement.setAttribute("class", "container"); divElement.setAttribute("id", tlElementId);
    let pElement     = document.createElement("p");    pElement.setAttribute  ("id", tlElementId);

    pElement.innerHTML += title + " &rarr;";
    divElement.appendChild(pElement);
    titleSection.appendChild(divElement);
}


/*******************************************************************************
** Action: Adds a new DOM TimeLine Element inside the tbody tag.
**         for a new result: title = lineString
**                           content1 = actionString
**                           content2 = operationString
**                           content3 = moduleString
** Return: null
*******************************************************************************/
function addDOMelement(title, content1, content2, content3, highlight = false) {
    let tlBody =      document.getElementsByTagName("ol").item(0);
    let liElement =   document.createElement("li");   liElement.setAttribute  ("id", tlElementId);
    let timeElement = document.createElement("time"); timeElement.setAttribute("id", tlElementId);
    let divElement =  document.createElement("div");  divElement.setAttribute ("id", tlElementId);

    /* Assemble text content of "modal" */
    timeElement.innerHTML += "L" + title;
    if (highlight) {
      let currentAttr = divElement.getAttribute("class");
      divElement.setAttribute("class", currentAttr + " highlight-div");
    }
    divElement.appendChild(timeElement);
    divElement.innerHTML += content1 + " " + content2 + "<br>";
    divElement.innerHTML += content3;

    liElement.appendChild(divElement);
    tlBody.appendChild(liElement);
}


/*******************************************************************************
** Action: Adds the finishing line to the TimeLine
** Return: null
*******************************************************************************/
function addDOMlastLine() {
    let tlBody =      document.getElementsByTagName("ol").item(0);
    let liElement =   document.createElement("li");   liElement.setAttribute  ("id", tlElementId);
    tlBody.appendChild(liElement);
}


/*******************************************************************************
** Action: Removes all DOM Elements which are of the ID "id"
** Return: null
*******************************************************************************/
function removeDOMelements(id) {
    while (document.getElementById(id) != null) {
      let elem = document.getElementById(id);
      elem.parentNode.removeChild(elem);
    }
}

/*******************************************************************************
** Action: Updates Status Bar
** Return: null
*******************************************************************************/
function updateDOMStatus(warningStr, source) {
  let circleElement = document.getElementById(stateNotifier);
  let pElement      = {
                       state: document.getElementById(stateText),
                       info:  document.getElementById(mncInfoText),
                       stats: document.getElementById(mncStatsText)
                      }

  /* warning string */
  if (warningStr != null) {
    circleElement.setAttribute("fill", stateRed);
    pElement.state.innerHTML = warningStr;
  } else {
    circleElement.setAttribute("fill", stateGreen);
    pElement.state.innerHTML = "All Good!"
  }

  /* mnemonic info string */
  if (MNCData != null) {
    if (MNCData.Time == undefined) {MNCData.Time = 0}
    pElement.info.innerHTML  =  MNCData.Type + " | " +
                                MNCData.Release + " | " + "Compile Date: " +
                                MNCData.CompileDate + " | " +
                                MNCData.Note + " | " + "Analyze time: " +
                                MNCData.Time.toFixed(2) + " ms";
  } else {
    pElement.info.innerHTML = "No Source Data"
  }

  /* mnemonic statistics string */
  if (source != null) {
    pElement.stats.innerHTML = "MNC Lines: " + source.sourceLines.length + " | " +
                               "Bit Defs: " + source.SBDMemory.length + " | " +
                               "Byte Defs: " + source.MBDMemory.length + " | " +
                               "Total Ops: " + (source.bitReadOperations.length +
                                                source.bitWriteOperations.length +
                                                source.instructionOperations.length)
  } else {
    pElement.stats.innerHTML = "No Source Data"
  }

}


/*******************************************************************************
** Action: Formats query results into prepared Strings for the DOM Elements
** Return: action-, operation-, module- lineString
*******************************************************************************/
function parseToOutput(result, action, query, type) {
  /* These strings represent one column in the output table */
  let ActionString = query;
  let OperationString = "";
  let ModuleString = "";
  let LineString = "";
  let Highlight = false;


  console.log(type + " " + bitWriteOps);

  /* Loop trough each property of all objects in result array */
  Object.entries(result).forEach(entry => {
    let propt = entry[0]; let value = entry[1];

    /* Pick out the relevant properties for the output */
    switch (propt) {
      case "operation":
        if (value != null && OperationString == "") {OperationString = beautify(value);}
        break;
      case "writes":
        if (value != null && OperationString == "" && type == bitWriteOps) {
          Highlight = true; /* Set highlight if it's an instruction */
          OperationString = "(" + result.writes + ") " +
                            "is overwritten by " + result.reads + " (via " + result.instruction + ")";
        } break;
      case "reads":
        if (value != null && OperationString == "" && type == bitReadOps) {
          Highlight = true; /* Set highlight if it's an instruction */
          OperationString = "(" + result.reads + ") " +
                            "is overriding " + result.writes + " (via " + result.instruction + ")";
        } break;
      case "inModule":
        if (value != null && ModuleString == "") {
          Object.entries(value).forEach(modAttr => {
            if (modAttr[0] == "sourceFile") {ModuleString = "fc" + modAttr[1] + " | ";}
            if (modAttr[0] == "title")      {ModuleString += modAttr[1];}
          });
        } break;
      case "inLine":
        if (value != null && LineString == "") {LineString = value;} break;
    }
  });

  return {
    actionString: ActionString,
    operationString: OperationString,
    moduleString: ModuleString,
    lineString: LineString,
    highlight: Highlight
  }
}


/*******************************************************************************
** Action: Formats the OperationString according to it's content
** Return: Formatted OperationString
*******************************************************************************/
function beautify(op) {
  let r = "is ";
  switch (true) {
    case op.includes("RD.NOT")  ||
         op.includes("AND.NOT") ||
         op.includes("OR.NOT"):    r = r + "negated-read (" + op + ")"; break;
    case op.includes("RD")      ||
         op.includes("OR")      ||
         op.includes("AND"):       r = r + "read (" + op + ")"; break;
    case op.includes("WRT.NOT"):   r = r + "un-written (" + op + ")"; break;
    case op.includes("WRT"):       r = r + "written (" + op + ")"; break;
    case op.includes("RST"):       r = r + "reset (" + op + ")"; break;
    case op.includes("SET"):       r = r + "set (" + op + ")";  break;
    default: console.log("Couldn't find " + op + " in beautify Cases");
  }
  r = r + " in";
  return r;
}
