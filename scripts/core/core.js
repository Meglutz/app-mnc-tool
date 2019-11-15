/*******************************************************************************
** Definitions
*******************************************************************************/

let IPC = require("electron").ipcRenderer;

let InstructionSource = "./resources/fanuc_instructions.json"
let LadderSource = "./resources/fanuc_ladder_source.json"
let MnemonicSource = "C:/Projects";

let MNC = undefined;
let MNCs = [];
let MyQueries = [];
let Data;
let InstructionData;
let LadderData;

let ActiveQuery = 0;
let ActiveInsOpTable;

let CurrentModule;
let CurrentNetwork;

let Warnings = null;
let WarningLog = []; /* Contains html styled string array of all warnings
                        which occured during the sequences */

/* colors for console highlighting */
const red   = "#b72828"
const green = "#3bb728"

/*******************************************************************************
** p5 Main functions
*******************************************************************************/
function preload()
{
  let files = walkMnc(MnemonicSource);

  /* find files which are a [.mnc] file */
  for (let file of files)
  {
    console.log(file);
    if (file.match(/.*\.mnc/) != null)
    {
      /* the loadStrings function returns an array, indexed by the line count of the loaded file */
      MNCs.push(new Mnemonic(loadStrings(file, console.log("Mnemonic file(s) loaded correctly.")), file));
    }
  }

  /* if there aren't any [.mnc]s around, then exit */
  if (MNCs == null || MNCs.length == 0)
  {
    alert("There are no mnemonic files around! \n Searched '" + MnemonicSource + "' recursivly");

    /* close tool via IPC command */
    IPC.send("closeTool", "-");
  }
}


function setup()
{
  /* generate JSON objs */
  InstructionData = loadJSON(InstructionSource);
  LadderData =      loadJSON(LadderSource);

  /* analyze mnemonics, get their data */
  for (let i = 0; i < MNCs.length; i++)
  {
    /* pre-analyze mnemonic levels and structure */
    MNCs[i].levels.push(new LineRange(MNCs[i].lines, "1",   /^\%\@3/,   /^SUB\s1$/));
    MNCs[i].levels.push(new LineRange(MNCs[i].lines, "2",   /^SUB\s1$/, /^SUB\s2$/));
    MNCs[i].levels.push(new LineRange(MNCs[i].lines, "SUB", /^SUB\s2$/, /^SUB\s64$/));
    MNCs[i].ranges.head = new LineRange(MNCs[i].lines, "HEAD", /^\%\@1/, /^\%\@2/);
    MNCs[i].ranges.defs = new LineRange(MNCs[i].lines, "DEFS", /^\%\@2/, /^\%\@3/);
    MNCs[i].ranges.ladr = new LineRange(MNCs[i].lines, "LADR", /^\%\@3/, /^\%\@4/);
    MNCs[i].ranges.mesg = new LineRange(MNCs[i].lines, "MESG", /^\%\@4/, /^\%\@5/);
    MNCs[i].getMNCinfo();
  }

  /* sort to have the most recently compiled on top, add to DOM */
  MNCs.sort(function(a, b)
  {
    return b.info.compileDate - a.info.compileDate;
  });
  for (var i = 0; i < MNCs.length; i++) {
    addDOM_mncSelectRow(MNCs, i);
  }

  /* wait until user selects mnemonic file
  [MNC] is set when an item in the table is clicked, since this invokes the evalDOM_mnemonicClick function  */
  document.getElementById(mncSelOverlay).style.display = "block";
}



function draw() {}

function run()
{
  document.getElementById(mncSelOverlay).style.display = "none";
  Data = new Resource(MNC);

  /* start timer */
  MNC.timer.start = new Date().getTime();

  /* Run all sequences to analyze the mnemonic */
  getDefinitions      (Data);
  analyzeLogic        (Data);
  analyzeDependencies (Data);
  analyzeResults      (Data);

/* /////////////////////////////////////////////////////////////////////////////////// */
/* ///////////////////////////////////////////////////////////////////////////// DEBUG */

  let a =   ["RD         R7940.4", /* new piece           */
             "OR         R7943.2", /* |                   */
                                   /* |                   */
             "RD.STK     R7958.0", /* |  new piece        */
             "AND        R7957.5", /* |  |                */
             "OR.STK",             /* |  close piece (OR) */
                                   /* |                   */
             "RD.STK     F1747.4", /* |  new piece        */
             "OR         Y9.2",    /* |  |                */
             "AND.STK",            /* |  close piece (AND)*/
                                   /* |                   */
             "AND        R7990.5", /* |                   */
             "AND        R7955.4", /* |                   */
             "WRT        Y9.2",    /* |                   */
             "WRT        R4200.3"] /* close piece (END)   */

              /*
              ├──┤ ├─┬────┬─┤ ├─┬─┤ ├───┤ ├─┬──⃝
                     │    │     │           │
              ├──┤ ├─┘    ├─┤ ├─┘           └──⃝
                          │
              ├──┤ ├───┤ ├┘

              */

  let b = new LadderNetwork(LadderData, a);
  b.makeMap();
  b.stackMaker();
  b.stackChecker();

  // b.stackAssemble();
  console.log(b);

/* ///////////////////////////////////////////////////////////////////////////// DEBUG */
/* /////////////////////////////////////////////////////////////////////////////////// */

  /* handle warnings */
  Warnings = checkWarnings(WarningLog);

  /* open state overlay if there are any warnings */
  if (Warnings != null)
  {
    document.getElementById(stateOverlay).style.display = "block";
  }

  /* stop timer */
  MNC.timer.end   = new Date().getTime();
  MNC.timer.total = MNC.timer.end - MNC.timer.start;

  /* plot mnemonic info to DOM header & update overlay */
  updateDOMheader(MNC);
  updateDOMinfo(Warnings, WarningLog, Data);

  noLoop();
}


/*******************************************************************************
** Sequence 1 | get Definitions
********************************************************************************
** Action: Loops trough each line in the res and gets all Definitions.
**         Reads & Writes directly from / to the res
**         Gets SingleBitDefinitions, MultiBitDefinitions & Programnumbers.
**         The "Modules" array is only partially filled after this method, the
**         rest of it's data will be gathered in the getCurrentModule function.
** Return: [w] (Integer), amount of warnings
*******************************************************************************/
function getDefinitions(res)
{
  /* Get all definitions in the current file */
  console.log("Getting definitions...");
  for (let i = res.source.ranges.defs.start; i < res.source.ranges.defs.end; i++)
  {
    /* Check if line contains a multi bit definition */
    let MBD = res.getMultiBitDefinitions(res.source.lines[i]);
    if (MBD != null)
    {
      res.MBDMemory.push(MBD);
    }

    /* Check if line contains a single bit definition */
    let SBD = res.getSingleBitDefinitions(res.source.lines[i]);
    if (SBD != null)
    {
      res.SBDMemory.push(SBD);
    }

    /* Check if line contains a program number definition */
    let PRGNBR = res.getModuleNumberDefinition(res.source.lines[i]);
    if (PRGNBR != null)
    {
      res.Modules.push(PRGNBR);
    }

    /* Check if line contains a program title definition (they are only shown
    where the program is called in the file). Add to equally named existing module */
    res.getModuleTitleDefinition(res.source.lines[i]);
  }

  console.log("-- Multibit definitions  :");
  console.log(res.MBDMemory);
  console.log("-- Singlebit definitions :");
  console.log(res.SBDMemory);
  console.log("-- Module definitions    :");
  console.log(res.Modules);

  let warnString = "";
  if (res.MBDMemory.length < 1)
  {
    warnString = "There aren't any Multi bit definitions in this MNC!";
  }

  if (res.SBDMemory.length < 1)
  {
    if (warnString != "")
    {
      warnString += "<br>"
    }
    warnString += "There aren't any Single bit definitions in this MNC!";
  }

  if (res.Modules.length < 1)
  {
    if (warnString != "")
    {
      warnString += "<br>"
    }
    warnString += "There aren't any Modules defined in this MNC!";
  }

  if (warnString != "")
  {
    addWarning(WarningLog, getDefinitions.name, warnString, null);
  }

  finishSequence(2);
}

/*******************************************************************************
** Sequence 2 | analyze Logic
********************************************************************************
** Action: Loops trough each line in the res and gets the MNC Logic.
**         Reads & Writes directly from / to the res
**         Gets currentModule, currentNetwork, read & write BitOperations.
**         as well as instructionOperations
** Return: [w] (Integer), amount of warnings
*******************************************************************************/
function analyzeLogic(res)
{
  console.log("Analyzing logic...");
  /* Get all logic events in the whole file */
  let lines = res.source.lines;
  for (let i = res.source.ranges.ladr.start; i < res.source.ranges.ladr.end; i++)
  {
    /* Update current module */
    let MODULE = res.getCurrentModule(lines[i], lines[i+1], i);
    if (MODULE != null)
    {
      CurrentModule = MODULE;
    }

    /* Update current network */
    let NETWORK = res.getCurrentNetwork(lines[i]);
    if (NETWORK != null)
    {
      CurrentNetwork = NETWORK;
    }

    let op = null;
    /* bit operations */
    op = res.getReadBitOperation(lines[i]);
    if (op != null)
    {
      res.bitOperations.push (new BitOperation(op.op, op.mem, null, CurrentModule, CurrentNetwork, i, res.source.getLevelOf(i)));
    }

    op = res.getWriteBitOperation(lines[i]);
    if (op != null)
    {
      res.bitOperations.push(new BitOperation(op.op, null, op.mem, CurrentModule, CurrentNetwork, i, res.source.getLevelOf(i)));
    }

    /* instruction operations */
    op = res.instructionParseJSON(i);
    if (op != null)
    {
      res.instructionOperations.push(new InstructionOperation(op.instruction,
                                                              op.number,
                                                              op.format,
                                                              op.formatLength,
                                                              op.formatModifier,
                                                              op.reads,
                                                              op.writes,
                                                              op.dependency,
                                                              op.graphicalData,
                                                              CurrentModule,
                                                              CurrentNetwork,
                                                              i,
                                                              res.source.getLevelOf(i)));
    }

  }

  console.log("-- Found bitwise operations     : ");
  console.log(res.bitOperations)
  console.log("-- Found instruction operations : ");
  console.log(res.instructionOperations);

  /* handle warnings of this sequence */
  let warnString = "";
  if (res.bitOperations.length < 1)
  {
    warnString = "Couldn't find any bit read or write Operations in this MNC! (read: " + r + ", write: " + w +")";
  }

  if (res.instructionOperations.length < 1)
  {
    if (warnString != "")
    {
      warnString += "<br>";
    }
    warnString += "Couldn't find any instruction Operations in this MNC!";
  }

  if (warnString != "")
  {
    addWarning(WarningLog, analyzeLogic.name, warnString, null);
  }
  finishSequence(2);
}

/*******************************************************************************
** Sequence 3 | analyze Dependencies
********************************************************************************
** Action: Loops trough each line in the res and handles dependencies.
**         Reads & Writes directly from / to the res
**         -
** Return: [w] (Integer), amount of warnings
*******************************************************************************/
function analyzeDependencies(res)
{
  console.log("Analyzing Dependencies...");

  /* Currently no dependencies */

  finishSequence(2);
}

/*******************************************************************************
** Sequence 4 | analyze Results
********************************************************************************
** Action: Loops trough each line in the res and analyzes the results.
**         trough some given patterns and tests.
**         Reads & Writes directly from / to the res
**         - Checks for Modules which are defined, but were not used in the MNC.
**         - Checks for used, but not yet handled Instructions.
**           This test is just to warn the user that these Instructions will
**           not be accounted for.
** Return: [w] (Integer), amount of warnings
*******************************************************************************/
function analyzeResults(res)
{
  console.log("Analyzing Results...");

  /* check if all defined programs appear in the mnc */
  console.log("-- Unused, but defined Modules:");
  let unused = [];
  for (let i = 0; i < res.Modules.length; i++)
  {
    for (let j = 0; j < res.Modules[i].length; j++)
    {
      if (res.Modules[i][j] == undefined)
      {
        unused.push(res.Modules[i]);
      }
    }
  }

  if (unused.length == 0)
  {
    console.log("%c--- None. All Modules were used in this file.", "color: " + green);
  }
  else
  {
    addWarning(WarningLog, analyzeResults.name, "Unused, but defined modules found:", unused);
    console.log("%c--- There are some...", "color: " + red);
    console.log(unused);
  }

  /* Check if there are used but not defined instructions in the mnemonic*/
  console.log("-- Used, but not-handled Instructions:");
  if (Data.usedUndefinedInstructions.length == 0)
  {
    console.log("%c--- None. All Instructions are handled in this file.", "color: " + green);
  }
  else
  {
    console.log("%c--- There are some...", "color: " + red);
    console.log(Data.usedUndefinedInstructions);
    addWarning(WarningLog, analyzeResults.name,
              "Used, but not-handled Instructions found.<br>" +
              "Query results will be missing instruction Operations of :",
               Data.usedUndefinedInstructions);
  }

  /* Check if there are undefined instructions found */
  console.log("-- Undefined Instructions (Unknown instructions):");
  let undefIns = [];
  for (let ins of res.instructionOperations)
  {
    if (ins.instruction == undefined)
    {
      undefIns.push(ins.instructionNumber);
    }
  }

  if (undefIns.length == 0)
  {
    console.log("%c--- None. There are no unknown instructions", "color: " + green);
  }
  else
  {
    console.log("%c--- There are some...", "color: " + red);
    console.log(Data.usedUndefinedInstructions);
    addWarning(WarningLog, analyzeResults.name,
              "Undefined / unknown instructions found.<br>" +
              "Query results will be missing instruction Operations with the following SUB number :",
               undefIns);
  }
  finishSequence(2);
}

/*******************************************************************************
** Action: Debug function, sequence ending script
** Return: null
*******************************************************************************/
function finishSequence(spaces = 1, additionalString = "")
{
  console.log("Finished. " + additionalString);
  for (let i = 0; i < spaces; i++)
  {
    if (i % 2 == 0)
    {
      console.log("");
    }
    else
    {
      console.log(" ");
    }
  }
}

/*******************************************************************************
** Action: Debug function, notifies the user if any warnings occured.
** Return: Warningstring if warnings occured. Null if none occured
*******************************************************************************/
function checkWarnings(warn)
{
  let str;
  if (warn.length != 0)
  {
    str = "There are Warnings, please check the Mnemonic Stats! \n Be advised that the results may be inaccurate or incomplete."
    console.warn("%c" + str, "color: " + red);
    return str;
  }
  else
  {
    /* str needs to be null if no warnings occured! */
    console.log("%cNo Warnings overall", "color: " + green);
    return null;
  }
}


/*******************************************************************************
** Action: Adds Warning string to a given array
** Return: null
*******************************************************************************/
function addWarning(wLog, fName, desc, optData = null)
{
  wLog.push("<h3>- Warning from <b>" + fName + ":</b></h3> ");
  wLog.push(desc);
  let prevEl1 = "";
  if (optData != null)
  {
    if (isIterable(optData))
    {
      Object.entries(optData).forEach(el => {
        /* only add to wLog if the entry value is unique compared to it's predecessor */
        if (prevEl1 != el[1])
        {
          wLog.push(el[0] + ": " + el[1]);
        }
        prevEl1 = el[1];
      });
    }
    else
    {
      wLog.push(optData);
    }
  }
  wLog.push(" ");
}


/*******************************************************************************
** Action: Adds padding to number, (3).pad(4) = 0003.
** Return: padded number string
*******************************************************************************/
Number.prototype.pad = function(size)
{
  var s = String(this);
  while (s.length < (size || 2))
  {
    s = "0" + s;
  }
  return s;
}


/*******************************************************************************
** Action: Appends [val] to a [tag] or creates it if it doesn't exist
** Return: this
*******************************************************************************/
HTMLElement.prototype.appendTag = function(tag, val)
{
  let curr = this.getAttribute(tag);
  if (curr != null)
  {
    this.setAttribute(tag, curr + " " + val);
  }
  else
  {
    this.setAttribute(tag, val);
  }
  return this;
}


/*******************************************************************************
** Action: Checks if an object is iterable.
** Return: false if null || string. "true" if anything else
*******************************************************************************/
function isIterable(obj) {
  /* Checks for null and undefined or strings */
  if (obj == null || typeof obj == "string")
  {
    return false;
  }
  return typeof obj[Symbol.iterator] === 'function';
}


/*******************************************************************************
** Action: Recursivly checks a path for [.mnc] files
** Return: Array of mnemonic files
*******************************************************************************/
let walkMnc = function(dir)
{
  let results = [];
  let fs = require("fs");
  let list = fs.readdirSync(dir);

  list.forEach(function(file)
  {
    file = dir + '/' + file;
    let stat = fs.statSync(file);
    if (stat && stat.isDirectory())
    {
      /* Recurse into a subdirectory */
      results = results.concat(walkMnc(file));
    }
    else
    {
      // /* Is a [.mnc] file */
      if (file.match(/.*\.mnc/) != null)
      {
        results.push(file)
      }
    }
  });
  return results;
}
