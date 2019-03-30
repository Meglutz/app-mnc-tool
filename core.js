
/*******************************************************************************
** Definitions
*******************************************************************************/
const heightContractor = 0.75;

const red   = "#b72828"
const green = "#3bb728"
const yellow = "#998429"

let CurrentModule;
let CurrentNetwork;

let Source = "https://raw.githubusercontent.com/WashirePie/CFX.Web/master/%2BDOC/RAW/mnemonic.mnc";
let Warnings = null;

let MyQueries = [];
let Data;

/*******************************************************************************
** Main functions
*******************************************************************************/
function preload() {
  /* The loadStrings function returns an array, indexed by the line count of the loaded file
  syntax: loadStrings(filename,callback,errorCallback)*/
  Data = new Resource(loadStrings(Source));
}


function setup() {}


function draw() {
  /* Run all sequences to analyze the mnemonic */
  let warn = 0;
  warn += getDefinitions      (Data);
  warn += analyzeLogic        (Data);
  warn += analyzeDependencies (Data);
  warn += analyzeResults      (Data);
  Warnings = checkWarnings(warn);

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
  let w = 0;
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
  console.log("-- Multibit definitions  : " + source.MBDMemory.length);
  console.log("-- Singlebit definitions : " + source.SBDMemory.length);
  console.log("-- Module definitions    : " + source.Modules.length);
  finishSequence(w, 2);
  return w
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
  let w = 0;
  console.log("Analyzing logic...");
  /* Get all logic events in the whole file */
  let lines = source.sourceLines;
  for (let i = 0; i < lines.length; i++) {
    /* Update the current module */
    let MODULE = source.getCurrentModule(lines[i], lines[i+1], i);
    if (MODULE != null) {CurrentModule = MODULE;}
    /* Update the current network */
    let NETWORK = source.getCurrentNetwork(lines[i]);
    if (NETWORK != null) {CurrentNetwork = NETWORK;}
    /* If both CurrentNetwork & CurrentModule aren't null, we can begin to check
    for operations */
    if (CurrentModule != null && CurrentNetwork != null) {
      let op = null;
      /* Bitwise operations */
      op = source.getReadBitOperation(lines[i]);
      if (op != null) {source.bitReadOperations.push (new BitOperation(op.op, op.mem, CurrentModule, CurrentNetwork, i));}
      op = source.getWriteBitOperation(lines[i]);
      if (op != null) {source.bitWriteOperations.push(new BitOperation(op.op, op.mem, CurrentModule, CurrentNetwork, i));}
      /* Instructions */
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
  }
  console.log("-- Found bitwise Read operations:");
  console.log(source.bitReadOperations);
  console.log("-- Found bitwise Write operations:");
  console.log(source.bitWriteOperations);
  console.log("-- Found instruction operations:");
  console.log(source.instructionOperations);
  finishSequence(w, 2);
  return w
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
  let w = 0;
  console.log("Analyzing Dependencies...");

  /* None */
  finishSequence(w, 2);
  return w
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
  let w = 0;
  console.log("Analyzing Results...");

  /* Check if all defined programs appear in the logic */
  console.log("-- Unused, but defined Modules:");
  let unused = [];
  for (let i = 0; i < source.Modules.length; i++) {
    for (let j = 0; j < source.Modules[i].length; j++) {
      if (source.Modules[i][j] == undefined) {
        unused.push(source.Modules[i]);
        w += 1;
      }
    }
  }
  if (unused.length == 0) {
    console.log("%c--- None. All Modules were used in this file.", "color: " + green);
  } else {
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
    w += Data.usedUndefinedInstructions.length;
  }


  finishSequence(w, 2);
  return w;
}

/*******************************************************************************
** Action: Debug function, plots eventual warnings which came forth in a
**         a sequence to the console.
** Return: null
*******************************************************************************/
function finishSequence(w, spaces = 1, additionalString = "") {
  if (w != 0) {console.log("%cWarnings: " + w, "color: " + yellow);}
  else        {console.log("No Warnings");}

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
  if (warn != 0) {
    str = "There are " + warn + " Warnings overall!"
    console.log("%c" + str, "color: " + red);
    return str;
  } else {
    console.log("%cNo Warnings overall", "color: " + green);
    return null;
  }
  console.log(" ");
}
