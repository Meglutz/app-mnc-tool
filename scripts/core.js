
/*******************************************************************************
** Definitions
*******************************************************************************/
/* colors for console highlighting */
const red   = "#b72828"
const green = "#3bb728"

let Source = "./mnemonic.mnc";

let MyQueries = [];
let Data;
let MNCData;

let CurrentModule;
let CurrentNetwork;

let Warnings = null;
let WarningLog = []; /* Contains html styled string array of all warnings
                        which occured during the sequences */

/*******************************************************************************
** p5 Main functions
*******************************************************************************/
function preload() {
  /* the loadStrings function returns an array, indexed by the line count of the loaded file */
  Data = new Resource(loadStrings(Source, console.log("Mnemonic file loaded.")));
}


function setup() {
  /* set global vars for mnc info */
  MNCData = Data.getMNCinfo();
}


function draw() {
  let start, end;
  /* start timer */
  start = new Date().getTime();

  /* Run all sequences to analyze the mnemonic */
  getDefinitions      (Data);
  analyzeLogic        (Data);
  analyzeDependencies (Data);
  analyzeResults      (Data);

  /* handle warnings */
  Warnings = checkWarnings(WarningLog);


  /* open state overlay if there are any warnings */
  if (Warnings != null) {
    document.getElementById(stateOverlay).style.display = "block";
  }

  /* stop timer */
  end = new Date().getTime();
  MNCData.Time = (end - start);

  /* plot mnemonic info to DOM header & update overlay */
  updateDOMheader(MNCData);
  updateDOMinfo(Warnings, WarningLog, Data);

  /* Query to see all defined bits which are handled in Instructions */
  // let test = new Query(Data, definedBitsInInstructions, null);

  noLoop();
}


/*******************************************************************************
** Sequence 1 | get Definitions
********************************************************************************
** Action: Loops trough each line in the source and gets all Definitions.
**         Reads & Writes directly from / to the source
**         Gets SingleBitDefinitions, MultiBitDefinitions & Programnumbers.
**         The "Modules" array is only partially filled after this method, the
**         rest of it's data will be gathered in the getCurrentModule function.
** Return: [w] (Integer), amount of warnings
*******************************************************************************/
function getDefinitions(source) {
  /* Get all definitions in the current file */
  console.log("Getting definitions...");
  for (let line of source.sourceLines) {
    /* Check if line contains a multi bit definition */
    let MBD = source.getMultiBitDefinitions(line);
    if (MBD != null) {source.MBDMemory.push(MBD);}
    /* Check if line contains a single bit definition */
    let SBD = source.getSingleBitDefinitions(line);
    if (SBD != null) {source.SBDMemory.push(SBD);}
    /* Check if line contains a program number definition */
    let PRGNBR = source.getModuleNumberDefinition(line);
    if (PRGNBR != null) {source.Modules.push(PRGNBR);}
    /* Check if line contains a program title definition (they are only shown
    where the program is called in the file). Add to equally named existing module */
    source.getModuleTitleDefinition(line);
  }
  console.log("-- Multibit definitions  :");
  console.log(source.MBDMemory);
  console.log("-- Singlebit definitions :");
  console.log(source.SBDMemory);
  console.log("-- Module definitions    :");
  console.log(source.Modules);

  let warnString = "";
  if (source.MBDMemory.length < 1)  {warnString = "There aren't any Multi bit definitions in this MNC!";}
  if (source.SBDMemory.length < 1)  {if (warnString != "") {warnString += "<br>"}; warnString += "There aren't any Single bit definitions in this MNC!";}
  if (source.Modules.length < 1)    {if (warnString != "") {warnString += "<br>"}; warnString += "There aren't any Modules defined in this MNC!";}
  if (warnString != "") {addWarning(WarningLog, getDefinitions.name, warnString, null);}

  finishSequence(2);
}

/*******************************************************************************
** Sequence 2 | analyze Logic
********************************************************************************
** Action: Loops trough each line in the source and gets the MNC Logic.
**         Reads & Writes directly from / to the source
**         Gets currentModule, currentNetwork, read & write BitOperations.
**         as well as instructionOperations
** Return: [w] (Integer), amount of warnings
*******************************************************************************/
function analyzeLogic(source) {
  console.log("Analyzing logic...");
  /* Get all logic events in the whole file */
  let lines = source.sourceLines;
  for (let i = 0; i < lines.length; i++) {
    /* Update current module */
    let MODULE = source.getCurrentModule(lines[i], lines[i+1], i);
    if (MODULE != null) {CurrentModule = MODULE;}
    /* Update current network */
    let NETWORK = source.getCurrentNetwork(lines[i]);
    if (NETWORK != null) {CurrentNetwork = NETWORK;}

    let op = null;
    /* bit operations */
    op = source.getReadBitOperation(lines[i]);
    if (op != null) {source.bitReadOperations.push (new BitOperation(op.op, op.mem, CurrentModule, CurrentNetwork, i));}
    op = source.getWriteBitOperation(lines[i]);
    if (op != null) {source.bitWriteOperations.push(new BitOperation(op.op, op.mem, CurrentModule, CurrentNetwork, i));}
    /* instruction operations */
    op = source.InstructionLogicData(lines, i);
    if (op != null) {source.instructionOperations.push(new InstructionOperation(op.instruction,
                                                                                op.number,
                                                                                op.format,
                                                                                op.formatLength,
                                                                                op.reads,
                                                                                op.writes,
                                                                                CurrentModule,
                                                                                CurrentNetwork,
                                                                                i));}
  }
  console.log("-- Found bitwise Read operations :");
  console.log(source.bitReadOperations);
  console.log("-- Found bitwise Write operations:");
  console.log(source.bitWriteOperations);
  console.log("-- Found instruction operations  :");
  console.log(source.instructionOperations);

  /* handle warnings of this sequence */
  let warnString = "";
  if (source.bitReadOperations.length < 1)     {warnString = "Couldn't find any bit-read Operations in this MNC!";}
  if (source.bitWriteOperations.length < 1)    {if (warnString != "") {warnString += "<br>"}; warnString += "Couldn't find any bit-write Operations in this MNC!";}
  if (source.instructionOperations.length < 1) {if (warnString != "") {warnString += "<br>"}; warnString += "Couldn't find any instruction Operations in this MNC!";}
  if (warnString != "") {addWarning(WarningLog, analyzeLogic.name, warnString, null);}

  finishSequence(2);
}

/*******************************************************************************
** Sequence 3 | analyze Dependencies
********************************************************************************
** Action: Loops trough each line in the source and handles dependencies.
**         Reads & Writes directly from / to the source
**         -
** Return: [w] (Integer), amount of warnings
*******************************************************************************/
function analyzeDependencies(source) {
  console.log("Analyzing Dependencies...");

  /* Currently no dependencies */

  finishSequence(2);
}

/*******************************************************************************
** Sequence 4 | analyze Results
********************************************************************************
** Action: Loops trough each line in the source and analyzes the results.
**         trough some given patterns and tests.
**         Reads & Writes directly from / to the source
**         - Checks for Modules which are defined, but were not used in the MNC.
**         - Checks for used, but not yet handled Instructions.
**           This test is just to warn the user that these Instructions will
**           not be accounted for.
** Return: [w] (Integer), amount of warnings
*******************************************************************************/
function analyzeResults(source) {
  console.log("Analyzing Results...");

  /* check if all defined programs appear in the mnc */
  console.log("-- Unused, but defined Modules:");
  let unused = [];
  for (let i = 0; i < source.Modules.length; i++) {
    for (let j = 0; j < source.Modules[i].length; j++) {
      if (source.Modules[i][j] == undefined) {
        unused.push(source.Modules[i]);
      }
    }
  }
  if (unused.length == 0) {
    console.log("%c--- None. All Modules were used in this file.", "color: " + green);
  } else {
    addWarning(WarningLog, analyzeResults.name, "Unused, but defined modules found:", unused);
    console.log("%c--- There are some...", "color: " + red);
    console.log(unused);
  }

  /* Check if there are used but not defined instructions in the mnemonic*/
  console.log("-- Used, but not-handled Instructions:");
  if (Data.usedUndefinedInstructions.length == 0) {
    console.log("%c--- None. All Instructions are handled in this file.", "color: " + green);
  } else {
    console.log("%c--- There are some...", "color: " + red);
    console.log(Data.usedUndefinedInstructions);
    addWarning(WarningLog, analyzeResults.name,
              "Used, but not-handled Instructions found.<br>" +
              "Query results will be missing instruction Operations of :",
               Data.usedUndefinedInstructions);
  }
  finishSequence(2);
}

/*******************************************************************************
** Action: Debug function, sequence ending script
** Return: null
*******************************************************************************/
function finishSequence(spaces = 1, additionalString = "") {
  console.log("Finished. " + additionalString);
  for (let i = 0; i < spaces; i++) {
    if (i % 2 == 0) {console.log("");}
    else            {console.log(" ");}
  }
}

/*******************************************************************************
** Action: Debug function, notifies the user if any warnings occured.
** Return: Warningstring if warnings occured. Null if none occured
*******************************************************************************/
function checkWarnings(warn) {
  let str;
  if (warn.length != 0) {
    str = "There are Warnings, please check the Log!"
    console.log("%c" + str, "color: " + red);
    return str;
  } else {
    /* str needs to be null if no warnings occured! */
    console.log("%cNo Warnings overall", "color: " + green);
    return null;
  }
}


/*******************************************************************************
** Action: Adds Warning string to a given array
** Return: null
*******************************************************************************/
function addWarning(wLog, fName, desc, optData = null) {
  wLog.push("<h3>- Warning from <b>" + fName + ":</b></h3> ");
  wLog.push(desc);
  if (optData != null) {
    if (isIterable(optData)) {
      Object.entries(optData).forEach(el => {wLog.push(el[0] + ": " + el[1]);})
    } else {
      wLog.push(optData)
    };
  }
  wLog.push(" ");
}


/*******************************************************************************
** Action: Adds padding to number, (3).pad(4) = 0003.
** Return: padded number
*******************************************************************************/
Number.prototype.pad = function(size) {
  var s = String(this);
  while (s.length < (size || 2)) {s = "0" + s;}
  return s;
}


/*******************************************************************************
** Action: Checks if an object is iterable.
** Return: false if null || string. "true" if anything else
*******************************************************************************/
function isIterable(obj) {
  /* Checks for null and undefined or strings */
  if (obj == null || typeof obj == "string") {
    return false;
  }
  return typeof obj[Symbol.iterator] === 'function';
}
