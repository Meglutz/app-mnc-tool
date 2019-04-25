/*******************************************************************************
** Definitions
*******************************************************************************/
const tlElementLoc     =    "timeline_location";
const tlElementId      =    "timeLine_element";
const tlElementTitle   =    "timeline_title";

const stateButton      =    "status-button";
const stateText        =    "status-label";
const stateOverlay     =    "overlay-container-1";
const stateClose       =    "overlay-close-button-1"
const stateWarning     =    "overlay-warning";
const stateWarningLog  =    "overlay-warning-log";
const stateLog         =    "overlay-info";
const stateRedClass    =    "state-circle-red";
const stateGreenClass  =    "state-circle-green";

const insOpOverlay     =    "overlay-container-2";
const insOpTableLoc    =    "insop-table-location";
const insOpTitleLoc    =    "insop-title-location";
const insOpInfoLoc     =    "insop-info-location";
const insOpElementId   =    "insop-table_element";
const insOpClose       =    "overlay-close-button-2";


const mncShowOverlay   =    "overlay-container-3";
const mncShowLoc       =    "mncshow-location";
const mncShowTitleLoc  =    "mncshow-title-location";
const mncShowInfoLoc   =    "mncshow-info-location";
const mncShowElementId =    "mncshow-element";
const mncShowClose     =    "overlay-close-button-3";

const styleDefRegex    =    /^(STYLE__)(.*)$/;


/*******************************************************************************
** DOM Query-Result Handlers
*******************************************************************************/
/* state / status overlay */
document.getElementById(stateButton).onclick = function() {
  document.getElementById(stateOverlay).style.display = "block";
}
document.getElementById(stateClose).onclick = function() {
  document.getElementById(stateOverlay).style.display = "none";
}

/* user-click events (DOM overlays) */
function evaluateDOMUserClick(resultId) {
  /* generate mncShow view if the user didn't click an instruction operation */
  if (MyQueries[MyQueries.length - 1].result[resultId] instanceof InstructionOperation == false) {
    removeDOMelements(mncShowElementId);
    addDOMmncShowList(MyQueries[MyQueries.length - 1], resultId);
    document.getElementById(mncShowOverlay).style.display = "block";
  } else {
    /* generate insOp table if the user did click on an instruction operation */
    removeDOMelements(insOpElementId);
    addDOMinsOpTable(MyQueries[MyQueries.length - 1], resultId);
    document.getElementById(insOpOverlay).style.display = "block";
  }
} /* close insOp Overlay */
document.getElementById(insOpClose).onclick = function() {
  document.getElementById(insOpOverlay).style.display = "none";
} /* close MNCShow Overlay */
document.getElementById(mncShowClose).onclick = function() {
  document.getElementById(mncShowOverlay).style.display = "none";
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
              case "length":      let bitStr = " bits"; if (memDefAttr[1] == 1) {bitStr = " bit"};
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
    content = prepareDOMresult(MyQueries[latestQuery].result[i], query, typeVal);
    if (content != undefined) {
        addDOMresult(content.lineString,
                     content.actionString,
                     content.operationString,
                     content.moduleString,
                     content.tagString,
                     content.highlight,
                     ["onclick", ("evaluateDOMUserClick(" + i + ")")]);
    }
  }

  /* update Warning state */
  updateDOMinfo(Warnings, WarningLog, Data);
}


/*******************************************************************************
** Action: Adds a new DOM TimeLine Element  at tlElementLoc.
**         for a new result: title = lineString
**                           content1 = actionString
**                           content2 = operationString
**                           content3 = moduleString
**                           content4 = tagString
**                           highlight = true if insOp,
**                           optAttr = ["attrName", attrValue]
** Return: null
*******************************************************************************/
function addDOMresult (title, content1, content2, content3, content4, highlight = false, optAttr = null) {
  let tlBody =      document.getElementById(tlElementLoc);
  let h1Element =   addDOMelement("h1", tlElementId);
  let pElement =    addDOMelement("p", tlElementId);
  let tagElement =  addDOMelement("a", tlElementId);
  let divElement =  addDOMelement("div", tlElementId, "timeline-item");

  /* assemble modal div */
  divElement.setAttribute("on-line", "MNC Line " + title);
  if (optAttr != null || isIterable(optAttr)) {divElement.setAttribute(optAttr[0], optAttr[1]);}

  /* add highlight if needed */
  if (highlight != false) {
    let currClass = divElement.getAttribute("class");
    if (currClass != null) {
      divElement.setAttribute("class", currClass + " highlight-item");
    } else {
      divElement.setAttribute("class", "highlight-item");
    }
  }

  /* add style tag to level tag */
  tagElement = appendDOMtag(tagElement, "class", "level-tag-" + content4);
  tagElement.innerHTML = "Ladder-Level: " + content4;
  h1Element.innerHTML =  content1;
  pElement.innerHTML =   content2 + "<br>" + content3 + "<br>";

  divElement.appendChild(tagElement);
  divElement.appendChild(h1Element);
  divElement.appendChild(pElement);

  tlBody.appendChild(divElement);
}


/*******************************************************************************
** Action: Adds new DOM table for instruction operation visualisation
** Return: null
*******************************************************************************/
function addDOMinsOpTable(query, resultIndex) {
  let ins = query.result[resultIndex];
  let bitAmount = ins.formatLength * 8;
  let bitCount = 0; let byteCount = 0;
  let row = [];

  let title = document.getElementById(insOpTitleLoc);
  let info =  document.getElementById(insOpInfoLoc);
  title.innerHTML = ins.instruction + " | SUB" + ins.instructionNumber;
  info.innerHTML  = "Range: " + bitAmount + " bits (" + ins.formatLength + " byte(s))";

  for (let i = 0; i < bitAmount; i++) {

    row = row.concat(formatToRow(bitCount, byteCount, ins.reads, ins.instruction, query, "green-cell"));

    /* there are instructions which only have .reads entries and write their result to
    fanucs predefined result bits. For example "COMP" will do this. */
    if (ins.writes == null) {
      row.push("-> FANUC Predefined Resultbyte: R9000");
    } else {
      row.push("->");
      row = row.concat(formatToRow(bitCount, byteCount, ins.writes, ins.instruction, query, "red-cell"));
    }

    addDOMtableColumn(document.getElementById(insOpTableLoc), row, false)
    row = [];

    /* increment bit & byte offset */
    bitCount += 1;
    if (bitCount == 8) {
      bitCount = 0;
      byteCount += 1;
    }
  }
}


/*******************************************************************************
** Action: Adds new DOM table for instruction operation visualisation
** Return: null
*******************************************************************************/
function addDOMmncShowList(query, resultIndex) {
  let op = query.result[resultIndex];
  let VIEW = 10;

  let title = document.getElementById(mncShowTitleLoc);
  let info =  document.getElementById(mncShowInfoLoc);
  let list = document.getElementById(mncShowLoc);

  title.innerHTML = op.operation + " " + op.memory + " at Line " + op.inLine;
  if (op.inModule.sourceFile != null || op.inModule.sourceFile != "") {
    info.innerHTML  = "This code is found in the Sourcefile <b>fc" + op.inModule.sourceFile + ".lad</b> (" + op.inModule.title + ")";
  } else {
    info.innerHTML  = "Coudldn't analyze in which Sourcefile this code is located."
  }

  let stopLine = op.inLine + VIEW;  if (stopLine > query.src.source.lines.length - 1) {stopLine = query.src.source.lines.length;}
  let startLine = op.inLine - VIEW; if (startLine < 0) {startLine = 0;}

  let mncLine;

  for (let i = startLine; i < stopLine; i++) {
    if (i == op.inLine) {mncLine = addDOMelement("a", mncShowElementId, "code-highlight")}
    else                {mncLine = addDOMelement("a", mncShowElementId, "code")}
    mncLine.innerHTML = (i).pad(5) + ": <b>" + query.src.source.lines[i] + "</b>";
    list.appendChild(mncLine);
  }
}


/*******************************************************************************
** Action: Generates row content for the given parameters
** Return: Array of row cells [bit, address, bit, address, ...]
*******************************************************************************/
function formatToRow(bitIndex, byteOffset, bytes, actionName = "", query, styling) {
  const regexp = /^(T|D|E|F|G|R|X|Y)(\d*)/;
  const Exit = "EXIT";
  let rowContent = [];
  let byteType, byteAddress, bitString, def;

  /* add a dummy to make every input iterable */
  if (isIterable(bytes) != true) {
    let temp = bytes; bytes = [];
    bytes.push(temp); bytes.push(Exit);
  }

  for (let i = 0; i < bytes.length; i++) {
    /* exit directly if we encounter a dummy-array item or an empty bytes[] index */
    if (bytes[i] == Exit || bytes[i] == null) {return rowContent}
    if (i >= 1 ) {rowContent.push(actionName)}

    /* add styling as the first entry of every new row addition */
    rowContent.push("STYLE__" + styling)

    /* assemble bit string. check if it is a number (constant) */
    if (isNaN(parseInt(bytes[i], 10)) == false) {
      rowContent.push(bytes[i]);
      rowContent.push("Constant");

    } else {
      byteType =             bytes[i].match(regexp)[1];
      byteAddress = parseInt(bytes[i].match(regexp)[2], 10);
      bitString =   byteType + (byteAddress + byteOffset) + "." + bitIndex;

      /* if no definition has been found, make a dummy */
      def = query.src.getBitDef(bitString);
      if (def == undefined) {
        rowContent.push(bitString);
        rowContent.push("No Symbol");
      } else {
        rowContent.push(def.byteType + def.byteAddress + "." + def.bitAddress)
        rowContent.push(def.symbol);
      }
    }
  }
  return rowContent;
}


/*******************************************************************************
** Action: Adds DOM table cloumn element to specified parent element
** Return: DOM element
*******************************************************************************/
function addDOMtableColumn(parentElement, rowContent, isHead = false, optClass = null) {
  let row = addDOMelement("tr", insOpElementId, optClass);
  let temp; let text;
  let colType = "td";
  let texType = "p";
  let style = "";
  if (isHead) {colType = "th"; texType = "h1";}

  /* create new column */
  for (let item of rowContent) {
    /* check if the item is a style definer */
    if (item.match(styleDefRegex) != null) {
      style = item.match(styleDefRegex)[2];
    } else {
      temp = addDOMelement(colType, insOpElementId, optClass);
      text = addDOMelement(texType, insOpElementId);
      /* add style to text element, if the item before was a style definer */
      if (style != "") {text = appendDOMtag(text, "class", style); style = "";}
      text.innerHTML = item;
      temp.appendChild(text);
      row.appendChild(temp);
    }
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
    el = appendDOMtag(el, "class", addClass);
  }
  return el;
}


/*******************************************************************************
** Action: Appends DOM tag to DOM element
** Return: DOM element
*******************************************************************************/
function appendDOMtag(el, type, addVal) {
  let curr = el.getAttribute(type);
  if (curr != null) {
    el.setAttribute(type, curr + " " + addVal);
  } else {
    el.setAttribute(type, addVal);
  }
  return el;
}

/*******************************************************************************
** Action: Replaces value of DOM tag of a specified DOM element.
** if the tag is empty, it will just add the newVal to it
** Return: DOM element
*******************************************************************************/
function replaceDOMtagValue(el, type, prevVal, newVal) {
  let curr = el.getAttribute(type);
  if (curr != null) {
    /* replace old with new and store new string to temp, so we can compare it with the old one */
    let temp = curr.replace(prevVal, newVal);
    if (temp == curr) {
      console.error("Error: couldn't find old value '" + prevVal + "' in html tag '" + type + "'")
    } else {
      el.setAttribute(type, temp);
    }
  } else {
    el.setAttribute(type, newVal);
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
  /* initialize state circle, otherwise replaceDOMtagValue will throw an error */
  circleElement = appendDOMtag(circleElement, "class", stateRedClass);

  let aElement      = {warn:    document.getElementById(stateWarning),
                       warnLog: document.getElementById(stateWarningLog),
                       info:    document.getElementById(stateLog)};

  /* update overlay elements: */
  /* warning string */
  if (warningStr != null) {
    circleElement = replaceDOMtagValue(circleElement, "class", stateGreenClass, stateRedClass);
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
    circleElement = replaceDOMtagValue(circleElement, "class", stateRedClass, stateGreenClass);
    aElement.warn.innerHTML = "No Warnings - All Good!";
    aElement.warnLog.innerHTML  = "---";
  }

  /* mnemonic statistics string */
  if (source != null) {
    aElement.info.innerHTML =  "<b>MNC Lines:</b> " +  source.source.lines.length + " | " +
                               "<b>Bit Defs:</b> " +   source.SBDMemory.length +   " | " +
                               "<b>Multi Defs:</b> " + source.MBDMemory.length +   " | " +
                               "<b>Total Ops:</b> " + (source.bitOperations.length + source.instructionOperations.length)
  } else {
    aElement.info.innerHTML = "No Source Data"
  }

}


/*******************************************************************************
** Action: Updates header string
** Return: null
*******************************************************************************/
function updateDOMheader(mnc) {
  let pElement = document.getElementById(stateText);

  /* mnemonic info string */
  if (mnc.info != null) {
    if (mnc.info.time == undefined) {mnc.info.time = 0}
    pElement.innerHTML  =            mnc.info.type + " | " +
                                     mnc.info.release + " | " + "Compile Date: " +
                                     mnc.info.compileDate + " | " +
                                     mnc.info.note + " | " + "Analyze time: " +
                                     mnc.timer.total.toFixed(2) + " ms";
  } else {
    pElement.innerHTML = "No Source Data"
  }
}
/*******************************************************************************
** Action: Formats query results into prepared Strings for the DOM Elements
** Return: action-, operation-, module- lineString
*******************************************************************************/
function prepareDOMresult(result, query, type) {
  /* These strings represent one column in the output table */
  let actionString = query;
  let operationString = "";
  let moduleString = "";
  let lineString = "";
  let tagString = "";
  let highlight = false;

  if (result instanceof InstructionOperation) { /* evaluate strings for instruction operations */
    /* get values from reads or writes property of instructionOperation Object, depending
    on the type of query */
    highlight = true; /* turn highlight on if it's an instruction */
    if (type == bitWriteOps) {
      operationString = result.writes + " is overwritten by " + result.reads + " (via " + result.instruction + ")";
    } else if (type == bitReadOps) {
      operationString = result.reads + " is overriding " + result.writes + " (via " + result.instruction + ")";
    } else {console.error("Error: Couldn't assemble 'operationString' for  " + result +
                          "because this query type is not handled: " + type);
    }

  } else if (result instanceof BitOperation) { /* evaluate strings for bit operations */
    highlight = false; /* turn highlight off if it's a bit operation  */
    operationString = beautify(result.operation);

  } else { /* catch invalid result types */
    console.error("Error: Invalid Object in query.result property: " + result);
  }

  /* set return strings which are identical wheter it's a bit- or instruction operation */
  lineString = result.inLine + 1;
  tagString =  result.inLevel.id;
  Object.entries(result.inModule).forEach(modAttr => {
    if (modAttr[0] == "sourceFile") {moduleString = "fc" + modAttr[1] + " | ";}
    if (modAttr[0] == "title")      {moduleString += modAttr[1];}
  });

  return {
    actionString: actionString,
    operationString: operationString,
    moduleString: moduleString,
    lineString: lineString,
    tagString: tagString,
    highlight: highlight
  }
}


/*******************************************************************************
** Action: Formats the operationString according to it's content
** Return: Formatted operationString
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
    default: console.log("Couldn't find " + op + " in 'beautify' Cases");
  }
  r = r + " in";
  return r;
}
