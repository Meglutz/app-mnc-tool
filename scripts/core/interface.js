/*******************************************************************************
** Definitions
*******************************************************************************/
const tlElementLoc     =    "timeline_location";
const tlElementId      =    "timeline_element";
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

const mncSelOverlay    =    "overlay-container-0";
const mncSelTableLoc   =    "mnc-select-table-location";

const errorTitle       =    "error-header";
const errorText        =    "error-text";

const mncShowOverlay   =    "overlay-container-3";
const mncShowLoc       =    "mncshow-location";
const mncShowTitleLoc  =    "mncshow-title-location";
const mncShowInfoLoc   =    "mncshow-info-location";
const mncShowElementId =    "mncshow-element";
const mncShowClose     =    "overlay-close-button-3";

const styleDefStart          =    "STYLE__";
const styleDefEnd            =    "-cell";
const styleDefRegex          =    /(STYLE__)(.+cell)/;
const rowRepRegex            =    /^ROWREP__(\d+)/;
const memRegexp              =    /(T|D|E|F|G|R|X|Y)(\d*)(\.*[0-7]*)$/;
const constRegexp            =    /\s*\d+\s*$/;
const Table_RowRepeat        =    "ROWREP__";
const Table_Definition       =    "DEF__";
const Table_StyleCellRed     =    styleDefStart   + "red" +  styleDefEnd;
const Table_StyleCellGreen   =    styleDefStart  + "green" + styleDefEnd;
const Table_StyleCellYellow  =    styleDefStart + "yellow" + styleDefEnd;
const Table_StyleCellHead    =    styleDefStart  + "head" +  styleDefEnd;


/*******************************************************************************
** DOM Query-Result Handlers
*******************************************************************************/
/* state / status overlay */
document.getElementById(stateButton).onclick = function()
{
  document.getElementById(stateOverlay).style.display = "block";
}
document.getElementById(stateClose).onclick = function()
{
  document.getElementById(stateOverlay).style.display = "none";
}

/* close overlays */
document.getElementById(insOpClose).onclick = function()
{
  document.getElementById(insOpOverlay).style.display = "none";
}
document.getElementById(mncShowClose).onclick = function()
{
  document.getElementById(mncShowOverlay).style.display = "none";
}

/*******************************************************************************
** Action: Creates a new mncShow overlay and displays it if the clicked
**         queryresult. ([resultId]) it's NOT an instance of insOp.
** Return: null
*******************************************************************************/
function evalMNCShow(resultId)
{
  /* generate mncShow view if the user didn't click an instruction operation */
  if (MyQueries[MyQueries.length - 1].result[resultId] instanceof InstructionOperation == false)
  {
    removeDOM_elements(mncShowElementId);
    addDOM_MNCShowList(MyQueries[MyQueries.length - 1], resultId);
    document.getElementById(mncShowOverlay).style.display = "block";
  }
  else
  {
    /* generate insOp table if the user did click on an instruction operation */
    removeDOM_elements(insOpElementId);
    addDOM_insOpTable(MyQueries[MyQueries.length - 1], resultId);
    document.getElementById(insOpOverlay).style.display = "block";
  }
}

/*******************************************************************************
** Action: hides overlays, deletes all displayed results and puts the memory
**         into the [query-value] input field. prioritizes bits but can also
**         handle clicked bytes
** Return: null
*******************************************************************************/
function evalDOM_memoryClick(line)
{
  match = memRegexp.exec(line);
  if (match != null)
  {
    /* clear all results, hide the mncShow overlay and put the new line into the query input field */
    removeDOM_elements(tlElementId);
    removeDOM_elements(insOpElementId);
    document.getElementById(mncShowOverlay).style.display = "none";
    document.getElementById(insOpOverlay).style.display = "none";
    let el = document.getElementsByTagName("input");
    el["query-value"].value = match[1] + match[2] + match[3];
  }
}

/*******************************************************************************
** Action: sets the global variable [MNC] to the clicked entry of the mncSel
**         table.
** Return: null
*******************************************************************************/
function evalDOM_mnemonicClick(mnc)
{
  MNC = mnc;
  run();
}

function displayDOMquery(ofs)
{
  /* exit if the [ofs] will put the [ActiveQuery] out of range */
  if (ActiveQuery + ofs >= MyQueries.length || ActiveQuery + ofs < 0)
  {
    return
  }
  else
  {
    removeDOM_elements(tlElementId);
    ActiveQuery += ofs;
    addDOM_showQuery(ActiveQuery);
  }
}

/*******************************************************************************
** Action: Logs [e] to DOM as a [tlElementId] element (Table Element)
** Return: null
*******************************************************************************/
function errorToDOM(e)
{
  /* clear all Elements containing [tlElementId] */
  removeDOM_elements(tlElementId);

  /* add error message */
  let titleSection = document.getElementById(tlElementTitle);
  let divElement   = addDOM_element("div", tlElementId, "container");
  let hElement     = addDOM_element("h1",  tlElementId, errorTitle);
  let pElement     = addDOM_element("p",   tlElementId, errorText);

  hElement.innerHTML += "ERROR";
  pElement.innerHTML += e + "<br><br>" + "Please try again";

  divElement.appendChild(hElement);
  divElement.appendChild(pElement);
  titleSection.appendChild(divElement);

}

/*******************************************************************************
** Action: Event: onClick Submit Button.
**         - Clears all DOM Elements with the [tlElementId] id
**         - Makes a new query using the DOM inputs
**         - Creates a DOM TimeLine and a "Modal" for each result
** Return: null
*******************************************************************************/
document.getElementById("query-submit").onclick = function()
{
  /* clear all Elements containing [tlElementId] */
  removeDOM_elements(tlElementId);

  let type =  document.getElementById("query-type");
  let typeVal = type.options[type.selectedIndex].value;
  let query = document.getElementsByTagName("input")[0].value;

  /* make a new query */
  try
  {
    MyQueries.push(new Query(Data, typeVal, query));
  }
  catch(e)
  {
    /* if an error occured, do not finish the sequence */
    errorToDOM(e);
    return;
  }
  finally {}

  ActiveQuery = MyQueries.length - 1;
  addDOM_showQuery(ActiveQuery);
}


/*******************************************************************************
** Action: Adds the MyQuery[id] to the DOM. This includes
**         the correct memory definition, title and all results.
** Return: null
*******************************************************************************/
function addDOM_showQuery(id)
{
  /* make result array iterable. If there's only one result it's not iterable */
  if (isIterable(MyQueries[id].result) == false)
  {
    MyQueries[id].result.push("dummy");
  }

  /* prepare Memory definition string (If the query bit has a Definition) */
  let memDefString = "";

  if (MyQueries[id].memoryDefinition != null || undefined)
  {
    Object.entries(MyQueries[id].memoryDefinition).forEach(memDefAttr =>
      {
        switch (memDefAttr[0])
        {
          case "byteType":
            memDefString += "<b>Address:</b> " + memDefAttr[1];
          break;

          case "byteAddress":
            memDefString += memDefAttr[1];
          break;

          case "bitAddress":
            memDefString += "." + memDefAttr[1];
          break;

          case "length":
            let bitStr = " bits";
            if (memDefAttr[1] == 1)
            {
              bitStr = " bit";
            }
            memDefString += " | <b>length:</b> " + memDefAttr[1] + bitStr;
          break;

          case "symbol":
            memDefString += "<br><b>" + "Symbol:</b> " + memDefAttr[1];
          break;
        }
      })
  }
  else
  {
    memDefString = "<b>No definition was found</b>";
  }


  /* add TimeLine title */
  let titleSection = document.getElementById(tlElementTitle);
  let divElement   = addDOM_element("div", tlElementId, "container");
  let pElement     = addDOM_element("p",   tlElementId);

  pElement.innerHTML += MyQueries[id].type + " for " +
                        MyQueries[id].memory + "<br><br>" +
                        memDefString + " &rarr;";

  divElement.appendChild(pElement);
  titleSection.appendChild(divElement);


  /* add a new TimeLine "Modal" for each result */
  for (let i = 0; i < MyQueries[id].result.length; i++)
  {
    content = prepareDOMresult(MyQueries[id].result[i]);
    if (content != undefined)
    {
        addDOM_result(content.lineString,
                     MyQueries[id].memory + content.actionString,
                     content.operationString,
                     content.moduleString,
                     content.tagString,
                     content.highlight,
                     ["onclick", ("evalMNCShow(" + i + ")")]);
    }
  }

  /* update query count */
  document.getElementById("query-count").innerHTML = (ActiveQuery + 1) + " / " + MyQueries.length;

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
function addDOM_result (title, content1, content2, content3, content4, highlight = false, optAttr = null)
{
  let tlBody =      document.getElementById(tlElementLoc);
  let h1Element =   addDOM_element("h1", tlElementId);
  let pElement =    addDOM_element("p", tlElementId);
  let p2Element =   addDOM_element("p", tlElementId);
  let tagElement =  addDOM_element("a", tlElementId);
  let divElement =  addDOM_element("div", tlElementId, "timeline-item");

  /* assemble modal div */
  divElement.setAttribute("on-line", "MNC Line " + title);
  if (optAttr != null || isIterable(optAttr))
  {
    divElement.setAttribute(optAttr[0], optAttr[1]);
  }

  /* add highlight if needed */
  if (highlight != false)
  {
    let currClass = divElement.getAttribute("class");
    if (currClass != null)
    {
      divElement.setAttribute("class", currClass + " highlight-item");
    }
    else
    {
      divElement.setAttribute("class", "highlight-item");
    }
  }

  /* add style tag to level tag */
  tagElement.appendTag("class", "level-tag-" + content4);
  tagElement.innerHTML = "Ladder-Level: " + content4;
  h1Element.innerHTML  = content1;
  pElement.innerHTML   = content2 + "<br>";
  p2Element.appendTag("class", "module-string");
  p2Element.innerHTML  = content3;

  divElement.appendChild(tagElement);
  divElement.appendChild(h1Element);
  divElement.appendChild(pElement);
  divElement.appendChild(p2Element);

  tlBody.appendChild(divElement);
}


/*******************************************************************************
** Action: Adds new DOM table for instruction operation visualisation
** Return: null
*******************************************************************************/
function addDOM_insOpTable(query, resultIndex)
{
  let ins = query.result[resultIndex];
  let title = document.getElementById(insOpTitleLoc);
  let info =  document.getElementById(insOpInfoLoc);

  /* assemble title & info string of the table */
  title.innerHTML = ins.instruction + " | SUB" + ins.instructionNumber;
  info.innerHTML  = "Range: " + (ins.formatLength * 8) + " bits (" + ins.formatLength + " byte(s))";

  /* if the instructions graphicalData has something to append to the info label, do it here. */
  if (ins.graphicalData.tableExtraDescription != null)
  {
    info.innerHTML += "<br> <b>" + ins.graphicalData.tableExtraDescription + "</b>";
  }

  /* generate DOM table according to the [.tableRows] property */
  ActiveInsOpTable = new DOM_OpTable(ins.graphicalData.tableRows)

  for (let row of ActiveInsOpTable.rows)
  {
    addDOM_tableRow(document.getElementById(insOpTableLoc), row, false);
  }
}


/*******************************************************************************
** Action: Adds new DOM table row to the mnc select table
** Return: null
*******************************************************************************/
function addDOM_mncSelectRow(mncAr, index)
{
  let row = document.createElement("tr");
  let type = document.createElement("td");
  let note = document.createElement("td");
  let date = document.createElement("td");
  let release = document.createElement("td");
  let lines = document.createElement("td");
  let path = document.createElement("td");

  row.appendTag("class", "mnemonic-select-table");
  row.appendTag("onclick", "evalDOM_mnemonicClick(MNCs[" + index + "])")

  type.appendTag("class", "mnemonic-select-table");
  note.appendTag("class", "mnemonic-select-table");
  date.appendTag("class", "mnemonic-select-table");
  release.appendTag("class", "mnemonic-select-table");
  lines.appendTag("class", "mnemonic-select-table");
  lines.appendTag("class", "mnemonic-select-table");

  type.innerHTML =    mncAr[index].info.type;
  note.innerHTML =    mncAr[index].info.note;
  date.innerHTML =    mncAr[index].info.compileDate;
  release.innerHTML = mncAr[index].info.release;
  lines.innerHTML =   mncAr[index].lines.length;
  path.innerHTML =    mncAr[index].filePath;

  row.appendChild(type);
  row.appendChild(note);
  row.appendChild(date);
  row.appendChild(release);
  row.appendChild(lines);
  row.appendChild(path);

  document.getElementById(mncSelTableLoc).appendChild(row);
}


class DOM_OpTable
{
  constructor(rows)
  {
    this.rows = rows;
    /* fill [.rows] property with input array. the input array must be two dimensional and structured like this:
    [ [c1, c2, c3, c4],
    [c5, c6, c7, c8] ] */

    let tempRow = [];
    let tempRows = [];

    /* resolve all tags which are contained in the cells */
    for (let i = 0; i < this.rows.length; i++) /* loop trough rows of the table */
    {
      for (let j = 0; j < this.rows[i].length; j++) /*  loop trough cells of row[i] */
      {
        this.solveRepTags(i); /* check if row contains repeating tags, if it does, expand [rows] */
        this.solveDefTags(i, j, -1); /* def tags ALWAYS source the memory for their definition in the previous cell (-1) */
      }
    }

    /* create objs for each cell */
    for (let i = 0; i < this.rows.length; i++) /* loop trough rows of the table */
    {
      for (let j = 0; j < this.rows[i].length; j++) /*  loop trough cells of row[i] */
      {
        tempRow.push(new DOM_OpTableCell(this.rows[i][j]));
      }
      tempRows.push(tempRow); tempRow = [];
    }

    this.rows = [...tempRows];
  }

  solveRepTags(rowNum)
  {
    /* [Table_RowRepeat] must always be in the first cell of a row, just to restrict it a bit */
    if (this.rows[rowNum][0].includes(Table_RowRepeat))
    {
      let origin = rowNum;
      let bitCount = 0;
      let byteCount = 0;
      let tempRow = [];
      let tempRows = [];
      let sourceRow = [];

      /* get repeat amount and remove tag from cell content */
      let repAmount = parseInt(this.rows[origin][0].match(rowRepRegex)[1], 10);
      this.rows[origin][0] = this.rows[origin][0].replace(rowRepRegex, "");

      /* create separate copy of the source row and remove it from [this.rows] */
      sourceRow = [...this.rows[origin]];
      this.rows.splice(origin, 1);

      /* create the required amount of copies of the origin row and append the bit + byte count to the byte strings.
      attention: this hinders the usage of byte strings in rowrepeats since it will always replace them! */
      for (let i = 0; i < repAmount; i++)
      {
        /* add a new [sourceRow] row */
        tempRows.push(sourceRow);

        /* loop trough the freshly added row's cells */
        for (let j = 0; j < tempRows[i].length; j++)
        {
          /* if the cell contains [memRegexp], then add to it an incremented value (byte / bit) */
          match = tempRows[i][j].match(memRegexp);
          if (match != null)
          {
            tempRow.push(tempRows[i][j].replace(memRegexp, (match[1] + (parseInt(match[2], 10) + byteCount) + "." + bitCount)));
          }
          else
          {
            tempRow.push(tempRows[i][j])
          }
        }

        /* add the new row to the [this.rows] array at index [origin]. */
        this.rows.splice(origin + i, 0, tempRow);
        tempRow = [];

        /* increment bit & byte offset */
        bitCount += 1;
        if (bitCount == 8)
        {
          bitCount = 0;
          byteCount += 1;
        }
      }
    }
  }

  solveDefTags(rowNum, cellNum, cellOffset)
  {
    let isMemory;
    let isConstant;
    let def

    if (this.rows[rowNum][cellNum].includes(Table_Definition))
    {
      isMemory = this.rows[rowNum][cellNum + cellOffset].match(memRegexp);
      if (isMemory != null)
      {
        def = Data.getDef(isMemory[0]); /* the zeroth index of a (.match) return contains the whole match, in this case the memory address */
        if (def == undefined)
        {
          this.rows[rowNum][cellNum] = "No Symbol";
        }
        else
        {
          this.rows[rowNum][cellNum] = def.symbol;
        }
      }
      else
      {
        isConstant = constRegexp.exec(this.rows[rowNum][cellNum + cellOffset]);
        if (isConstant != null)
        {
          this.rows[rowNum][cellNum] = "Constant";
        }
      }
    }
  }
}

class DOM_OpTableCell
{
  constructor(str)
  {
    if (str.match(styleDefRegex) != null)
    {
      this.style = str.match(styleDefRegex)[2];
      str = str.replace(styleDefRegex, "");
    }
    this.content = str.trim();
  }
}


/*******************************************************************************
** Action: Adds DOM table row element to specified parent element
** Return: DOM element
*******************************************************************************/
function addDOM_tableRow(parentElement, rowContent, optClass = null, cellType = "td")
{
  let row = addDOM_element("tr", insOpElementId, optClass);
  let cell;
  let text;
  let texType = "p";

  /* create new DOM row */
  for (let item of rowContent)
  {
    /* create new DOM cell */
    cell = addDOM_element(cellType, insOpElementId, optClass);
    text = addDOM_element(texType,  insOpElementId);

    /* add style to text element, if applicable */
    if (item.style != "")
    {
      text.appendTag("class", item.style);
      cell.appendTag("onclick", "evalDOM_memoryClick('" + item.content + "')")
    }
    text.innerHTML = item.content;
    cell.appendChild(text);
    row.appendChild(cell);
  }
  parentElement.appendChild(row);
}


/*******************************************************************************
** Action: Adds new DOM table for instruction operation visualisation
** Return: null
*******************************************************************************/
function addDOM_MNCShowList(query, resultIndex)
{
  let op = query.result[resultIndex];
  let VIEW_RANGE = 10;

  let title = document.getElementById(mncShowTitleLoc);
  let info =  document.getElementById(mncShowInfoLoc);
  let list = document.getElementById(mncShowLoc);

  title.innerHTML = op.operation + " " + query.memory + " at Line " + op.inLine;

  /* make sourcefile / info string if the data is available */
  if (op.inModule.sourceFile != null || op.inModule.sourceFile != "")
  {
    info.innerHTML  = "This code is found in the Sourcefile <b>fc" + op.inModule.sourceFile + ".lad</b> (" + op.inModule.title + ")";
  }
  else
  {
    info.innerHTML  = "Coudldn't analyze in which Sourcefile this code is located."
  }

  /* get the lines to diplay according to the VIEW_RANGE */
  let stopLine = op.inLine + VIEW_RANGE;
  if (stopLine > query.src.source.lines.length - 1)
  {
    stopLine = query.src.source.lines.length;
  }

  let startLine = op.inLine - VIEW_RANGE;
  if (startLine < 0)
  {
    startLine = 0;
  }

  /* add each mnc line to the list DOM element. if the the line location matches
  the result, add a code-highlight class to the list element*/
  let mncLine;
  for (let i = startLine; i < stopLine; i++)
  {
    if (i == op.inLine)
    {
      mncLine = addDOM_element("a", mncShowElementId, "code-highlight")
    }
    else
    {
      mncLine = addDOM_element("a", mncShowElementId, "code")
    }
    mncLine.appendTag("onclick", "evalDOM_memoryClick('" + query.src.source.lines[i] + "')")

    /* check for definition in the lines to improve readability */
    let line = query.src.source.lines[i];
    let match = line.match(memRegexp);
    let def = null;
    if (match != null)
    {
      def = query.src.getDef(match[0]);
    }

    /* replace memory with the definition if we found one */
    if (def != null)
    {
      /* check if it's a bit / byte definitions by looking if the definition contains a [bitAddress] */
      if (def.bitAddress != "")
      {
        line = line.replace((def.byteType + def.byteAddress + "." + def.bitAddress), def.symbol);
      }
      else
      {
        line = line.replace((def.byteType + def.byteAddress), def.symbol);
      }
    }

    /* write content into DOM line entry */
    mncLine.innerHTML = (i).pad(5) + ": <b>" + line + "</b>";

    list.appendChild(mncLine);
  }
}


/*******************************************************************************
** Action: Adds new DOM element of type [type]
** Return: DOM element
*******************************************************************************/
function addDOM_element(type, id, addClass = null)
{
  let el = document.createElement(type);
  el.setAttribute("id", id);
  if (addClass != null)
  {
    el.appendTag("class", addClass);
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
  if (curr != null)
  {
    /* replace old with new and store new string to temp, so we can compare it with the old one */
    let temp = curr.replace(prevVal, newVal);
    if (temp == curr)
    {
      /* was already right */
    }
    else
    {
      el.setAttribute(type, temp);
    }
  }
  else
  {
    el.setAttribute(type, newVal);
  }
  return el;
}
/*******************************************************************************
** Action: Removes all DOM Elements which are of the ID "id"
** Return: null
*******************************************************************************/
function removeDOM_elements(id) {
  while (document.getElementById(id) != null)
  {
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
  /* TODO: This part is actually the HTMLElement.prototype.appendTag() function from [core.js]
  but it seems to only work like this. */
  let curr = circleElement.getAttribute("class");
  if (curr != null)
  {
    circleElement.setAttribute("class", curr + " " + stateRedClass);
  }
  else
  {
    circleElement.setAttribute("class", stateRedClass);
  }


  let aElement      = {warn:    document.getElementById(stateWarning),
                       warnLog: document.getElementById(stateWarningLog),
                       info:    document.getElementById(stateLog)};

  /* update overlay elements: */
  /* warning string */
  if (warningStr != null)
  {
    circleElement = replaceDOMtagValue(circleElement, "class", stateGreenClass, stateRedClass);
    aElement.warn.innerHTML = warningStr;

    /* if the warning log isn't empty, then add it to the overlay string */
    if (warningLog != null)
    {
      aElement.warnLog.innerHTML = "<br>";
      if (isIterable(warningLog))
      {
        for (let str of warningLog)
        {
          aElement.warnLog.innerHTML += str + "<br>";
        }
      }
      else
      {
        aElement.warnLog.innerHTML += warningLog;
      }
    }

  }
  else
  {
    circleElement = replaceDOMtagValue(circleElement, "class", stateRedClass, stateGreenClass);
    aElement.warn.innerHTML = "No Warnings - All Good!";
    aElement.warnLog.innerHTML  = "---";
  }

  /* mnemonic statistics string */
  if (source != null)
  {
    aElement.info.innerHTML =  "<b>MNC Lines:</b> " +  source.source.lines.length + " | " +
                               "<b>Bit Defs:</b> " +   source.SBDMemory.length +   " | " +
                               "<b>Multi Defs:</b> " + source.MBDMemory.length +   " | " +
                               "<b>Total Ops:</b> " + (source.bitOperations.length + source.instructionOperations.length)
  }
  else
  {
    aElement.info.innerHTML = "No Source Data"
  }

}


/*******************************************************************************
** Action: Updates header string
** Return: null
*******************************************************************************/
function updateDOMheader(mnc)
{
  let pElement = document.getElementById(stateText);

  /* mnemonic info string */
  if (mnc.info != null)
  {
    if (mnc.info.time == undefined)
    {
      mnc.info.time = 0
    }
    pElement.innerHTML = mnc.info.type + " | " +
                         mnc.info.release + " | " + "Compile Date: " +
                         mnc.info.compileDate + " | " +
                         mnc.info.note + " | " + "Analyze time: " +
                         mnc.timer.total.toFixed(2) + " ms";
  }
  else
  {
    pElement.innerHTML = "No Source Data"
  }
}
/*******************************************************************************
** Action: Formats query results into prepared Strings for the DOM Elements
** Return: action-, operation-, module- lineString
*******************************************************************************/
function prepareDOMresult(result)
{
  /* These strings represent one column in the output table */
  let actionString = "";
  let operationString = "";
  let moduleString = "";
  let lineString = "";
  let tagString = "";
  let highlight = false;

  if (result instanceof InstructionOperation)
  {
    /* evaluate strings for instruction operations */
    actionString = " | " + result.instruction;
    highlight = true; /* turn highlight on if it's an instruction */
    operationString = result.graphicalData.operationString;
  }
  else if (result instanceof BitOperation)
  {
    /* evaluate strings for bit operations */
    highlight = false; /* turn highlight off if - it's just a bit operation  */
    if (result.reads == null)
    {
      operationString = result.writes + " " + beautifyBitOpString(result.operation);
    }
    else
    {
      operationString = result.reads  + " " + beautifyBitOpString(result.operation);
    }
  }
  else
  {
    /* throw error for invalid result types */
    throw "Error@'" + prepareDOMresult.name + "': Invalid Object in query.result property: " + result;
  }

  /* set return strings which are identical wheter it's a bit- or instruction operation */
  lineString = result.inLine + 1;
  tagString =  result.inLevel.id;
  Object.entries(result.inModule).forEach(modAttr => {
    if (modAttr[0] == "sourceFile")
    {
      moduleString = "fc" + modAttr[1] + " | ";
    }
    if (modAttr[0] == "title")
    {
      moduleString += modAttr[1];
    }
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
function beautifyBitOpString(op)
{
  let r = "is ";
  switch (true)
  {
    case op.includes("RD.NOT") || op.includes("AND.NOT") || op.includes("OR.NOT"):
      r = r + "negated-read (" + op + ")";
    break;
    case op.includes("RD") || op.includes("OR") || op.includes("AND"):
      r = r + "read (" + op + ")";
    break;
    case op.includes("WRT.NOT"):
      r = r + "un-written (" + op + ")";
    break;
    case op.includes("WRT"):
      r = r + "written (" + op + ")";
    break;
    case op.includes("RST"):
      r = r + "reset (" + op + ")";
    break;
    case op.includes("SET"):
      r = r + "set (" + op + ")";
    break;
    default:
      throw "Error@'" + beautifyBitOpString.name + "': Couldn't find '" + op + "' in the beautify-Cases";
  }
  return r;
}
