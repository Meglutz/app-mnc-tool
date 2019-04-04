
/*******************************************************************************
** Definitions
*******************************************************************************/
const tlElementId     =    "timeLine_element";
const tlElementTitle  =    "timeline_title";
const tableElementId  =    "table_element";

const stateButton     =    "status-button";
const stateText       =    "status-label";
const stateOverlay    =    "overlay-container-1";
const stateClose      =    "overlay-close-button-1"
const stateWarning    =    "overlay-warning";
const stateWarningLog =    "overlay-warning-log";
const stateLog        =    "overlay-info";

const insOpOverlay    =    "overlay-container-2";
const insOpTableLoc   =    "insop-table-location";
const insOpClose      =    "overlay-close-button-2";

const stateRed        =    "#e74848";
const stateGreen      =    "#53d467";

/*******************************************************************************
** Action: Event: onClick Status / Close Button. Open / Close Overlay
** Return: null
*******************************************************************************/
document.getElementById(stateButton).onclick = function() {
  document.getElementById(stateOverlay).style.display = "block";
}
document.getElementById(stateClose).onclick = function() {
  document.getElementById(stateOverlay).style.display = "none";
}

function showInstructionOperationTable(resultId) {
  /* exit if the user didn't click an instruction operation */
  if (MyQueries[MyQueries.length - 1].result[resultId] instanceof InstructionOperation == false) {
    return;
  }

  /* Clear all Elements containing [tableElementId] */
  removeDOMelements(tableElementId);
  addDOMoverlayTable(MyQueries[MyQueries.length - 1], resultId);
  document.getElementById(insOpOverlay).style.display = "block";
}

document.getElementById(insOpClose).onclick = function() {
  document.getElementById(insOpOverlay).style.display = "none";
}

/*******************************************************************************
** Action: Event: onClick Submit Button.
           - Clears all DOM Elements with the [tlElementId] id
           - Makes a new query using the DOM inputs
           - Creates a DOM TimeLine and a "Modal" for each result
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
              case "byteType":    memDefString += "<b>Address:</b> " + memDefAttr[1]; break;
              case "byteAddress": memDefString += memDefAttr[1]; break;
              case "bitAddress":  memDefString += "." + memDefAttr[1]; break;
              case "length":      let bitStr = " bits";
                                  if (memDefAttr[1] == 1) {bitStr = " bit"};
                                  memDefString += " | <b>length:</b> " + memDefAttr[1] + bitStr; break;
              case "symbol":      memDefString += "<br><b>" + "Symbol:</b> " + memDefAttr[1]; break;
          }
      })
  } else {memDefString = "<b>No definition was found</b>"}


  /* Add TimeLine title */
  let titleSection = document.getElementById(tlElementTitle);
  let divElement   = addDOMelement("div", tlElementId, "container");
  let pElement     = addDOMelement("p",   tlElementId);

  pElement.innerHTML += MyQueries[latestQuery].type + " for " +
                        MyQueries[latestQuery].memory + "<br><br>" +
                        memDefString + " &rarr;";
  divElement.appendChild(pElement);
  titleSection.appendChild(divElement);


  /* Add a new TimeLine "Modal" for each result */
  for (let i = 0; i < MyQueries[latestQuery].result.length; i++) {
    content = parseToOutput(MyQueries[latestQuery].result[i], query, typeVal);
    if (content != undefined) {
        addDOMresult(content.lineString,
                     content.actionString,
                     content.operationString,
                     content.moduleString,
                     content.highlight,
                     ["onclick", ("showInstructionOperationTable(" + i + ")")]);
    }
  }

  /* update Warning state */
  updateDOMinfo(Warnings, WarningLog, Data);

}


/*******************************************************************************
** Action: Adds a new DOM TimeLine Element  at timeline_location.
**         for a new result: title = lineString
**                           content1 = actionString
**                           content2 = operationString
**                           content3 = moduleString
**                           highlight = true if insOp,
**                           optAttr = ["attrName", attrValue]
** Return: null
*******************************************************************************/
function addDOMresult (title, content1, content2, content3, highlight = false, optAttr = null) {
  let tlBody =      document.getElementById("timeline_location");

  let h1Element =   addDOMelement("h1", tlElementId);
  let pElement =    addDOMelement("p", tlElementId);
  let divElement =  addDOMelement("div", tlElementId, "timeline-item");

  /* Assemble modal div */
  divElement.setAttribute ("on-line", "MNC Line " + title);
  if (optAttr != null || isIterable(optAttr)) {divElement.setAttribute(optAttr[0], optAttr[1]);}

  /* Add highlight if neededv */
  if (highlight != false) {
    let currClass = divElement.getAttribute("class");
    if (currClass != null) {
      divElement.setAttribute("class", currClass + " highlight-item");
    } else {
      divElement.setAttribute("class", "highlight-item");
    }
  }

  h1Element.innerHTML = content1;
  pElement.innerHTML =  content2 + "<br>";

  divElement.appendChild(h1Element);
  divElement.appendChild(pElement);

  tlBody.appendChild(divElement);
}


/*******************************************************************************
** Action: Adds new DOM table for instruction operation visualisation
** Return: null
*******************************************************************************/
function addDOMoverlayTable(query, resultIndex) {
  let ins = query.result[resultIndex];

  /* generate header */
  addDOMtableColumn(document.getElementById(insOpTableLoc), "Address", "Symbol", "Action", "Address", "Symbol", true);

  let bitAmount = ins.formatLength * 8;
  let defOne; let srcOne;
  let defTwo; let srcTwo;
  let action = "";

  switch (true) {
    /* ..if the instruction is a read-only instruction */
    case isIterable(ins.reads):
      srcOne = ins.reads[0];
      srcTwo = ins.reads[1];
      action = " - ";
      break;
    /* ..if the instruction is a write-only instruction (does that even exist?) */
    case isIterable(ins.writes):
      srcOne = ins.writes[0];
      srcTwo = ins.writes[1];
      action = " - ";
      break;
    /* ..if the instruction is a read/write instruction (applies in most cases */
    case ins.reads != null && ins.writes != null:
      srcOne = ins.reads;
      srcTwo = ins.writes;
      break;
      // TODO: Default
  }

  /* split adress */ // TODO: put all regexes in resource class and make resource class regex function
  let regexp = /^(T|D|E|F|G|R|X|Y)(\d*)/;
  let srcOneByteType = srcOne.match(regexp)[1];
  let srcTwoByteType = srcTwo.match(regexp)[1];
  let srcOneByteAddress = parseInt(srcOne.match(regexp)[2], 10);
  let srcTwoByteAddress = parseInt(srcTwo.match(regexp)[2], 10);
  let srcOneBitAddress = 0; /* all ins only use byte addresses, so it always starts at 0 */
  let srcTwoBitAddress = 0;

  let bitCount = 0;
  let byteCount = 0;

  /* loop for the amount of bits and try to find their definitions */
  for (let i = 0; i < bitAmount; i++) {

    /* assemble bit strings* */
    let bitStrOne = srcOneByteType + (srcOneByteAddress + byteCount) + "." + (srcOneBitAddress + bitCount);
    let bitStrTwo = srcTwoByteType + (srcTwoByteAddress + byteCount) + "." + (srcTwoBitAddress + bitCount);

    defOne = query.src.getBitDef(bitStrOne);
    defTwo = query.src.getBitDef(bitStrTwo);

    /* if no definition has been found, make a dummy */
    if (defOne == undefined) {defOne = query.src.makeDummyDefinition(bitStrOne)};
    if (defTwo == undefined) {defTwo = query.src.makeDummyDefinition(bitStrTwo)};

    addDOMtableColumn(document.getElementById(insOpTableLoc),
                      defOne.byteType + defOne.byteAddress + "." + defOne.bitAddress,
                      defOne.symbol,
                      "->",
                      defTwo.byteType + defTwo.byteAddress + "." + defTwo.bitAddress,
                      defTwo.symbol);

    /* increment bit & byte offset */
    bitCount += 1;
    if (bitCount == 8) {
      bitCount = 0;
      byteCount += 1;
    }
  }
}

/*******************************************************************************
** Action: Adds DOM table cloumn element to specified parent element
** Return: DOM element
*******************************************************************************/
function addDOMtableColumn(parentElement, a, b, c, d, e, isHead = false, optClass = null) {
  let row = addDOMelement("tr", tableElementId, optClass);
  let temp; let text;
  let colType = "td";
  let texType = "p";
  let col = [a, b, c, d, e];
  if (isHead) {colType = "th"; texType = "h1";}
  /* create new column */
  for (let item of col) {
    temp = addDOMelement(colType, tableElementId, optClass);
    text = addDOMelement(texType, tableElementId);
    text.innerHTML = item;
    temp.appendChild(text);
    row.appendChild(temp);
  }
  parentElement.appendChild(row);
}


/*******************************************************************************
** Action: Adds new DOM element of type [type]
** Return: DOM element
*******************************************************************************/
function addDOMelement(type, id, addClass = null) {
  let el = document.createElement(type);
  el.setAttribute("id", id);
  if (addClass != null) {
    let currClass = el.getAttribute("class");
    /* append class if [el] already ha a class, overwrite it it didn't have one */
    if (currClass != null) {
      el.setAttribute("class", currClass + " " + addClass);
    } else {
      el.setAttribute("class", addClass);
    }
  }
  return el;
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
** Action: Updates header circle & Overlay strings
** Return: null
*******************************************************************************/
function updateDOMinfo(warningStr, warningLog = null, source) {
  let circleElement = document.getElementById(stateButton);
  let aElement      = {warn:    document.getElementById(stateWarning),
                       warnLog: document.getElementById(stateWarningLog),
                       info:    document.getElementById(stateLog)};

  /* update overlay elements: */

  /* warning string */
  if (warningStr != null) {
    circleElement.setAttribute("fill", stateRed);
    aElement.warn.innerHTML = warningStr;

    /* if the warning log isn't empty, then add it to the overlay string */
    if (warningLog != null) {
      aElement.warnLog.innerHTML = "<br>";
      if (isIterable(warningLog)) {
        for (let str of warningLog) {
          aElement.warnLog.innerHTML += str + "<br>";
        }
      } else {
        aElement.warnLog.innerHTML += warningLog;
      }
    }

  } else {
    circleElement.setAttribute("fill", stateGreen);
    aElement.warn.innerHTML = "No Warnings - All Good!";
    aElement.warnLog.innerHTML  = "---";
  }

  /* mnemonic statistics string */
  if (source != null) {
    aElement.info.innerHTML =  "<b>MNC Lines:</b> " +  source.sourceLines.length + " | " +
                               "<b>Bit Defs:</b> " +   source.SBDMemory.length +   " | " +
                               "<b>Multi Defs:</b> " +  source.MBDMemory.length +   " | " +
                               "<b>Total Ops:</b> " + (source.bitReadOperations.length +
                                                source.bitWriteOperations.length +
                                                source.instructionOperations.length)
  } else {
    aElement.info.innerHTML = "No Source Data"
  }

}


/*******************************************************************************
** Action: Updates header string
** Return: null
*******************************************************************************/
function updateDOMheader(source) {
  let pElement = document.getElementById(stateText);

  /* mnemonic info string */
  if (MNCData != null) {
    if (MNCData.Time == undefined) {MNCData.Time = 0}
    pElement.innerHTML  =       MNCData.Type + " | " +
                                MNCData.Release + " | " + "Compile Date: " +
                                MNCData.CompileDate + " | " +
                                MNCData.Note + " | " + "Analyze time: " +
                                MNCData.Time.toFixed(2) + " ms";
  } else {
    pElement.innerHTML = "No Source Data"
  }
}
/*******************************************************************************
** Action: Formats query results into prepared Strings for the DOM Elements
** Return: action-, operation-, module- lineString
*******************************************************************************/
function parseToOutput(result, query, type) {
  /* These strings represent one column in the output table */
  let ActionString = query;
  let OperationString = "";
  let ModuleString = "";
  let LineString = "";
  let Highlight = false;

  /* Loop trough each property of all objects in result array */
  Object.entries(result).forEach(entry => {
    let propt = entry[0]; let value = entry[1];

    /* Pick out the relevant properties for the output */
    switch (propt) {
      case "operation":
        if (value != null && OperationString == "") {OperationString = beautify(value);}
        break;
      case "writes": /* Only if query type is of bitWriteOps */
        if (value != null && OperationString == "" && type == bitWriteOps) {
          Highlight = true; /* Set highlight if it's an instruction */
          OperationString = "(" + result.writes + ") " +
                            "is overwritten by " + result.reads + " (via " + result.instruction + ")";
        } break;
      case "reads": /* Only if query type is of bitReadOps */
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
        if (value != null && LineString == "") {LineString = value + 1;} break;
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
