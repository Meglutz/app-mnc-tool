

const multiBitDefinitionRegex =      /^(T|D|E|F|G|R|X|Y)(\d+)(\s*)([\S]+)/;
const singleBitDefinitionRegex =     /^(T|D|E|F|G|R|X|Y)(\d+)(\.)(\d)(\s+)([\S]+)/;
const singleBitAddressRegex =        /^(T|D|E|F|G|R|X|Y)(\d+)(\.)(\d)(\s+|)/;
const moduleNumberDefinitionRegex =  /^[P](\d+)\s+C(\d+)/;
const moduleTitleDefinitionRegex =   /^;---------------\s*fc(\d+).lad\s*\(([^\)]*)\)/i;

const currentModuleNumberRegex =     /^([P])(\d+)/;
const currentModuleSourceRegex =     /^;---------------\s*fc(\d+).lad\s*\(([^\)]*)/i;
const currentNetworkRegex =          /^N(\d\d\d\d\d)\:$/g;
const readBitOperationsRegex =       /^(RD|OR|AND)(\.NOT\.STK|\.NOT|\.STK|)\s+(.+)/;
const writeBitOperationsRegex =      /^(WRT|SET|RST)(\.NOT|)\s+(.+)/;
const instructionOperationRegex =    /^(SUB)\s*(\d*)/;
const levelSubRegex =                /^(SUB)\s*(\d*)/;
const instructionReadWriteRegex =    /^([A-Z])(\d*)$/;
const instructionFormatRegex =       /^(\d|)(\d\d|)(\d|)$/;
const instructionDependencyRegex =   /^(RD|OR|AND)(\.NOT\.STK|\.NOT|\.STK|)\s+(.+)/;

const headerMNCstartRegex =          /^\%\@1$/;
const headerMNCstopRegex =           /^\%$/;


/*******************************************************************************
** Class - Memory
** Holds a memory definition
*******************************************************************************/
class Memory
{
  constructor(type, byteAddress, bitAddress, length, symbol)
  {
    this.byteType = type;            /*  =  Memory Letter, e.g. "R" */
    this.byteAddress = byteAddress;  /*  =  Numeric, byte Address */
    this.bitAddress = bitAddress;    /*  =  Numeric, bit Address */
    this.length = length;            /*  =  Numeric, Amount of bits (range) of definition */
    this.symbol = symbol;            /*  =  String, Mnemonic Symbol, < 6 Chars */
  }
}


/*******************************************************************************
** Class - Module
** Holds a module / program definition
*******************************************************************************/
class Module
{
  constructor(programNumber, sourceFile, title)
  {
    this.programNumber = programNumber /*  =  Numeric, "P" number */
    this.sourceFile = sourceFile;      /*  =  String, sourcefile Name */
    this.title = title;                /*  =  String, Module title */
  }
}


/*******************************************************************************
** Class - BitOperation
** Holds a bit operation, read or write
*******************************************************************************/
class BitOperation
{
  constructor(op, rd, wrt, inMod, inNwk, inLine, inLevel)
  {
    this.operation = op;                /*  =  String, operation Type one of: [readBitOperationsRegex] */
    this.reads = rd;                    /*  =  String, memory Address. e.g. [R3453.2] */
    this.writes = wrt;                  /*  =  String, memory Address. e.g. [R3453.3] */
    this.inModule = inMod;              /*  =  Object of type [Module] */
    this.inNetwork = inNwk;             /*  =  String, containing the network the parser is currently in. */
    this.inLine = inLine;               /*  =  String, Line index of the whole file. */
    this.inLevel = inLevel;             /*  =  Object of type [LineRange] */
  }
}


/*******************************************************************************
** Class - InstructionOperations
** Hold a bit operation, read or write
*******************************************************************************/
class InstructionOperation
{
  constructor(ins, insNbr, form, formLn, formMod,  reads, writes, dep, uiDat, inMod, inNwk, inLine, inLvl)
  {
    this.instruction = ins;            /*  = String, Type of operation */
    this.instructionNumber = insNbr;   /*  = Numeric, Type number */
    this.format = form;                /*  = String, type of format (Normal, Const, Addr...) */
    this.formatLength = formLn;        /*  = Numeric, length of it's actions (in bytes) */
    this.formatModifier = formMod;     /*  = String, modifier for the format property */
    this.reads = reads;                /*  = String, Beginning Address of read range */
    this.writes = writes;              /*  = String, Beginning Address of write range */
    this.dependency = dep;             /*  = Object of type [InstructionDependency] */
    this.graphicalData = uiDat;        /*  = Object of type [GraphicalData]  */
    this.inModule = inMod;             /*  = Object of type [Module] */
    this.inNetwork = inNwk;            /*  = String, containing the network the parser is currently in. */
    this.inLine = inLine;              /*  = String, Line index of the whole file. */
    this.inLevel = inLvl;              /*  = Object of type [LineRange] */
  }

}

class InstructionDependency
{
  constructor(mem)
  {
    this.dependentOf = mem;
  }
}

class ReadWriteDependency extends InstructionDependency
{
  constructor(mem)
  {
    super(instructionDependencyRegex.exec(mem)[3]);
  }
}

class ActivationDependency extends InstructionDependency
{
  constructor(mem)
  {
    super(instructionDependencyRegex.exec(mem)[3]);
  }
}

class GraphicalData
{
  constructor(oStr, t, texD = null)
  {
    this.operationString = oStr;
    this.tableRows = t;
    this.tableExtraDescription = texD;
  }
}

/*******************************************************************************
** Class - Mnemonic
** Holds the source MNC as well as Line ranges for secotors and levels
*******************************************************************************/
class Mnemonic
{
  constructor(lines)
  {
    this.lines = lines;           /* = String Array, one index per MNC line */
    this.levels = [];
    this.ranges = {head:  null,  /* = Object of Type [LineRange] */
                   defs:  null,  /* = Object of Type [LineRange] */
                   ladr:  null,  /* = Object of Type [LineRange] */
                   mesg:  null}; /* = Object of Type [LineRange] */

    this.info =   {compileDate: null,
                   note:        null,
                   type:        null,
                   release:     null};

    this.timer =  {start: 0,
                   stop:  0,
                   total: 0};
  }


  /*******************************************************************************
  ** Action: Checks if an [index] is in the correct range (>= start, <= end)
  ** Return: LineRange Object
  *******************************************************************************/
  getLevelOf(index)
  {
    for (let level of this.levels)
    {
      if (level.start <= index && level.end >= index)
      {
        return level;
      }
    }
  }

  /*******************************************************************************
  ** Action: Gets the Info from the mnemonic file
  ** Return: Object: [CompileDate, Note, Type, Release]
  *******************************************************************************/
  getMNCinfo()
  {
    let tempLine;
    for (let i = this.ranges.head.start; i < this.ranges.head.end; i++)
    {
      tempLine = removeLeadingChar(this.lines[i], "0");
      tempLine = removeLeadingChar(tempLine,      " ");
      switch (true)
      {
        case tempLine.charAt(0) == "7":
          this.info.compileDate = formatDate(tempLine.substring(2));
        break;

        case tempLine.charAt(0) == "1" && tempLine.charAt(1) == "0":
          this.info.note        = this.lines[i].substring(3);
        break;

        case tempLine.charAt(0) == "2":
          this.info.type        = tempLine.substring(2);
        break;

        case tempLine.charAt(0) == "4":
          if (this.info.release == null)
          {
            this.info.release = tempLine.substring(2);
          }
          else
          {
            this.info.release = tempLine.substring(2) + " " + this.info.release;
          }
        break;

        case tempLine.charAt(0) == "5":
          if (this.info.release == null)
          {
            this.info.release = tempLine.substring(2);
          }
          else
          {
            this.info.release = this.info.release + "." + tempLine.substring(2);
          }
        break;
      }
    }
  }
}


/*******************************************************************************
** Class - LineRange
** Holds a range which is found in a string array trough regexes
** Used to define ranges for optimization and restriction in the Mnc class
*******************************************************************************/
class LineRange
{
  constructor(sArr, id, startRegex, endRegex)
  {
    this.id = id;
    this.start = 1 + sArr.findIndex(function checkStart(element)
    {
      return startRegex.test(element);
    })

    this.end =   1 + sArr.findIndex(function checkEnd(element)
    {
      return endRegex.test(element);
    })
  }
}

/*******************************************************************************
** Class - Resource
** Holds all definitions, as well as logic data (ops)
** and analyze-data
*******************************************************************************/
class Resource
{
  constructor(source)
  {
    this.source = source;                   /* Object of type [Mnemonic] */
    this.Modules = [];                      /* Array of Module objects, holds module definitions */
    this.SBDMemory = [];                    /* Array of Memory objects, holds Single bit definitions */
    this.MBDMemory = [];                    /* Array of Memory objects, holds Multi bit definitions */
    this.bitOperations = [];                /* Array of BitOperations */
    this.instructionOperations = [];        /* Array of InstructionOperations, holds instruction operations */

    this.usedUndefinedInstructions = [];    /* Array of InstructionsOperations, holds unhandled Instructions */
  }

  /*******************************************************************************
  ** Action: Checks if string contains a MBD. Creates Memory Object
  ** Return: Memory Object [definition]
  *******************************************************************************/
  getMultiBitDefinitions(str)
  {
    let match = multiBitDefinitionRegex.exec(str);
    if (match != null && match[1,2,4] != null && match[1,2,4] != "")
    {
      match[2] = removeLeadingChar(match[2], "0");
      return new Memory(match[1], match[2], "", ">=8", match[4])
    }
    else
    {
      return null;
    }
  }


  /*******************************************************************************
  ** Action: Checks if string contains a SBD. Creates Memory Object
  ** Return: Memory Object [definition]
  *******************************************************************************/
  getSingleBitDefinitions(str)
  {
    let match = singleBitDefinitionRegex.exec(str);
    if (match != null && match[1,2,4,6] != null && match[1,2,4,6] != "")
    {
      match[2] = removeLeadingChar(match[2], "0");
      return new Memory(match[1], match[2], match[4], 1, match[6])
    }
    else
    {
      return null;
    }
  }


  /*******************************************************************************
  ** Action: Checks if string contains a Module Definition. Creates Module Object
  ** Return: Module Object [mod]
  *******************************************************************************/
  getModuleNumberDefinition(str)
  {
    let match = moduleNumberDefinitionRegex.exec(str);
    if (match != null && match[1,2] != null && match[1,2] != "")
    {
      /* no need to remove leading zeros if the p number is defined as
      P0045 since the parseInt method will strip them */
      return new Module(parseInt(match[1], 10), parseInt(match[2], 10), "No Moduletitle available");
    }
    else
    {
      return null;
    }
  }


  /*******************************************************************************
  ** Action: Checks if string Module title. Extends matching source.Modules Object
  **         with the found title
  ** Return: true: If a defined module was extended with the found title, else: false
  *******************************************************************************/
  getModuleTitleDefinition(str)
  {
    let match = moduleTitleDefinitionRegex.exec(str);
    if (match != null && match[1,2] != null && match[1,2] != "")
    {
      for (let i = 0; i < this.Modules.length; i++)
      {
        if (match[1].includes(this.Modules[i].sourceFile))
        { /* If the module was found in the defined modules... */
          this.Modules[i].title = match[2]; /* ..add the found title to it */
          return true;
        }
      }
    }
    else
    {
      return null;
    }
  }


  /*******************************************************************************
  ** Action: Checks if string contains Module call. Can differentiate Module calls
  **         by looking at the following line/string [str2]. Differentiates between
  **         sourcefile Name calls or programNumber calls. Creates new Memory Objects
  **         if a Module was not already defined in the source. Attention!:
  **         The new module will not be appended to the source Module array since it's
  **         not a definition if it get found in this method. It's just a call.
  ** Return: Module Object. Either the found one or a new one.
  *******************************************************************************/
  getCurrentModule(str1, str2, lineNumber)
  {
    let match1 = currentModuleNumberRegex.exec(str1);
    let match2 = currentModuleSourceRegex.exec(str2);

    /* does it match the Source file name? */
    if (match2 != null && match2[1,2] != null && match2[1,2] != "")
    {
      for (let i = 0; i < this.Modules.length; i++)
      {
        /* Check if the sourcefile is already defined */
        if (match2.includes(this.Modules[i].sourceFile))
        {
          this.Modules[i].fromLine = lineNumber;
          return this.Modules[i];
        }
      }
      /* Sourcefilename hasn't been used yet. */
      return new Module("No Modulenumber available" , parseInt(match2[1], 10), match2[2]);
    }

    /* does it match the Program Number? */
    if (match1 != null && match1[1,2] != null && match1[1,2] != "")
    {
      for (let i = 0; i < this.Modules.length; i++)
      {
        /* Check if the P Number is already defined */
        if (parseInt(match1[2], 10) == this.Modules[i].programNumber)
        {
          return this.Modules[i];
        }
      }
      /* Sourcenumber hasn't been used yet. */
      return new Module(parseInt(match1[2], 10), "No Sourcefile info available", "No Moduletitle available");
    }
  }


  /*******************************************************************************
  ** Action: Checks if string contains a Network Name.
  ** Return: String, network Name [match[1]]
  *******************************************************************************/
  getCurrentNetwork(str) {
    let match = currentNetworkRegex.exec(str);
    if (match != null && match[1] != null && match[1] != "")
    {
      return match[1];
    }
    else
    {
      return null;
    }
  }


  /*******************************************************************************
  ** Action: Checks if string contains a BitRead Operation.
  ** Return: [op: String (Operation), String (multiplier)] [mem: String (Memory)]
  *******************************************************************************/
  getReadBitOperation(str)
  {
    let match = readBitOperationsRegex.exec(str);
    if (match != null && match[1,3] != null && match[1,3] != "")
    {
      return {op: match[1] + match[2],
              mem: match[3]};
    }
    else
    {
      return null;
    }
  }


  /*******************************************************************************
  ** Action: Checks if string contains a BitWrite Operation.
  ** Return: [op: String (Operation), String (multiplier)] [mem: String (Memory)]
  *******************************************************************************/
  getWriteBitOperation(str)
  {
    let match = writeBitOperationsRegex.exec(str);
    if (match != null && match[1,3] != null && match[1,3] != "")
    {
      return {op: match[1] + match[2],
              mem: match[3]};
    }
    else
    {
      return null;
    }
  }


  /*******************************************************************************
  ** Action: Checks for defined bits. bit must be a string! ("E312.2" or "ELADGK")
  ** Return: SBDMemory Object
  *******************************************************************************/
  getBitDef(bit)
  {
    for (let b of this.SBDMemory)
    {
      if (bit == b.byteType + b.byteAddress + "." + b.bitAddress || bit == b.symbol)
      {
        return b;
      }
    }
    return undefined;
  }


  /*******************************************************************************
  ** Action: Creates a new Memory Object if the given query is valid
  **         bit must be a string! ("E312.2" or "ELADGK")
  **         ATTENTION: gets not stored in SBDMemory Array!
  ** Return: Dummy Memory Object of type [Memory]
  *******************************************************************************/
  makeDummyDefinition(bit)
  {
    let match = singleBitAddressRegex.exec(bit);

    if (match != null && match[1,2,4] != null && match[1,2,4] != "")
    {
      return new Memory(match[1], match[2], match[4], 1, "Undefined (dMem)");
    }
    else
    {
      return null;
    }
  }


  /*******************************************************************************
  ** Action: Checks if line[index] contains an instruction call.
  **         Parses JSON-Data properties to be compatible with the methods which
  **         handle the respective properties.
  ** Return: All Data to create a new InstructionOperation Object
  *******************************************************************************/
  instructionParseJSON(index) {
    let match = instructionOperationRegex.exec(this.source.lines[index]);
    let subNumber = null;
    let name = null;
    let reads = null;
    let writes = null;

    let dependency =      {
                            dependentOf: null
                          };

    let format =          {
                            kind: "-",
                            length: 0,
                            modifier: null
                          };

    let graphicalData =   {
                            opStr: "-",
                            tableRows: "-",
                            tableExtraDescription: "-"
                          };

    /* if the current line contains an ins op, then set subNumber. Else, leave */
    if (match != null && match[1,2] != null && match[1,2] != "")
    {
      subNumber = parseInt(match[2], 10)
    }
    else
    {
      return null
    }

    if (InstructionData[subNumber] == undefined) {
      console.error("Error: The instruction with the number: " + subNumber + " is inexistent in this JSON data.");
    }

    Object.entries(InstructionData[subNumber]).forEach(key =>
      {
        switch (key[0]) {
          case "name":
            name = key[1];
          break;

          case "usedUndefinedInstruction":
            this.usedUndefinedInstructions.push(name);
          break;

          case "format":
            console.log("format: " + key[1]);
            format = this.instructionFormat(this.source.lines, index, key[1]);
          break;

          case "format.length":
            format.length = key[1];
          break;

          case "format.kind":
            format.kind = key[1];
          break;

          case "format.modifier":
            format.modifier = [];
            for (let item of key[1])
            {
              /* if it's a number it must be an offset of the current index, pointing to a line */
              if (isNaN(item) != true)
              {
                format.modifier.push(this.source.lines[index + item]);
              }
              else
              {
                format.modifier.push(item)
              }
            }
          break;

          case "readsOffset":
            /* if there are multiple "reads" for an ins, then loop trough them */
            if (isIterable(key[1]))
            {
              reads = [];
              for (let i = 0; i < key[1].length; i++)
              {
                reads.push(this.instructionReads(this.source.lines, index, key[1][i]));
              }
            }
            else
            {
              reads = this.instructionReads(this.source.lines, index, key[1]);
            }
          break;

          case "writesOffset":
            /* if there are multiple "writes" for an ins, then loop trough them */
            if (isIterable(key[1]))
            {
              writes = [];
              for (let i = 0; i < key[1].length; i++)
              {
                writes.push(this.instructionWrites(this.source.lines, index, key[1][i]));
              }
            }
            else
            {
              writes = this.instructionWrites(this.source.lines, index, key[1]);
            }
          break;

          case "dependency":
            switch (key[1][0])
            {
              case "ReadWriteDependency":
                dependency = new ReadWriteDependency(this.source.lines[index + key[1][1]]);
              break;

              case "ActivationDependency":
                dependency = new ActivationDependency(this.source.lines[index  + key[1][1]]);
              break;
            }
          break;

          case "graphicalData":
            graphicalData.opStr = key[1].opStr;
            graphicalData.tableRows = key[1].tableRows;
            graphicalData.tableExtraDescription = key[1].tableExtraDescription;

            /* replace placeholders in graphicalData */
            let keywords = ["StyleNextCellRed", "StyleNextCellGreen", "StyleNextCellYellow", "Definition", "reads", "writes", "frmLen",      "frmKin",    "frmMod",        "depOf"];
            let values   = [ StyleNextCellRed,   StyleNextCellGreen,   StyleNextCellYellow,   Definition,   reads ,  writes ,  format.length, format.kind, format.modifier, dependency.dependentOf];
            for (let i = 0; i < keywords.length; i++)
            {
              /* only replace if the value isn't null. not all instruction have e.g. the "dependency.dependentOf" property */
              if (values[i] != null) {
                if (graphicalData.opStr != null)
                {
                  graphicalData.opStr = replaceInString(graphicalData.opStr, "$", keywords[i], ".", values[i]);
                }

                if (graphicalData.tableExtraDescription != null)
                {
                  graphicalData.tableExtraDescription = replaceInString(graphicalData.tableExtraDescription, "$", keywords[i], ".", values[i]);
                }

                if (graphicalData.tableRows != null)
                {
                  for (let j = 0; j < graphicalData.tableRows.length; j++)
                  {
                    if (graphicalData.tableRows[j] != null)
                    {
                      graphicalData.tableRows[j]= replaceInString(graphicalData.tableRows[j], "$", keywords[i], ".", values[i]);
                    }
                  }
                }
              }
            }
          break;

          default:
        }
      }
    );

    return  {
              instruction      : name,
              number           : subNumber,
              reads            : reads,
              writes           : writes,
              dependency       : dependency,
              graphicalData    : new GraphicalData(graphicalData.opStr, graphicalData.tableRows, graphicalData.tableExtraDescription),
              format           : format.kind,
              formatLength     : format.length,
              formatModifier   : format.modifier
            };
  }


  /*******************************************************************************
  ** Action: Checks which Memory gets read by an instruction
  ** Return: String, containing Starting memory [startByte]
  *******************************************************************************/
  instructionReads(lines, index, offset)
  {
    let startByte = lines[index + offset];
    let match = instructionReadWriteRegex.exec(startByte);
    /* If match is null then it's a constant, not a memory definition */
    if (match != null)
    {
      return startByte;
    }
    else
    {
      return startByte;
    }
  }

  /*******************************************************************************
  ** Action: Checks which Memory gets written by an instruction
  ** Return: String, containing Starting memory [startByte]
  *******************************************************************************/
  instructionWrites(lines, index, offset)
  {
    let startByte = lines[index + offset];
    let match = instructionReadWriteRegex.exec(startByte);
    /* If match is null then it's a constant, not a memory definition */
    if (match != null)
    {
      return startByte;
    }
    else
    {
      return startByte;
    }
  }

  /*******************************************************************************
  ** Action: Checks the format length of instruction. Measured in bytes.
  **         Add the format length to the starting adress and you get the
  **         instuctions range.
  **         Also gets the type (kind) of Format
  ** Return:  [kind: String (Kind)] [length: Numeric (Length in Bytes)]
  *******************************************************************************/
  instructionFormat(lines, index, offset)
  {
    let format = lines[index + offset];
    let match = instructionFormatRegex.exec(format);
    let kind = "Normal";
    let length = parseInt(match[1], 10);
    /* change kind / length if it's not a normal format */
    if (match[2] && match[3] != null)
    {
      length = parseInt(match[3], 10);
      switch (match[1])
      {
        case "0":
          kind = "Constant";
        break;

        case "1":
          kind = "Adress";
        break;
      }
    }
    return {kind: kind, length: length};
  }
}


/*******************************************************************************
** Action: Formats strings from YY/MM/DD HH:MM to DD.MMMM YYYY HH:MM
** Return: Reformatted string
*******************************************************************************/
function formatDate(str)
{
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  let regexp = /^(\d\d)\/(\d\d)\/(\d\d)\s*(\d\d)\:(\d\d)/;
  let Year  = str.match(regexp)[1];
  let Month = monthNames[parseInt(str.match(regexp)[2], 10) - 1]
  let Day =   str.match(regexp)[3];
  let Time =  str.match(regexp)[4] + ":" + str.match(regexp)[5];
  return Day + ". " + Month + " " + "20" + Year + ", " + Time; /* LOL */
}


/*******************************************************************************
** Action: charToRemove = "0" -> Formats inputStr e.g. "0010" or "0000" to
           "10" and "0" respectively
** Return: formatted toFormat
*******************************************************************************/
function removeLeadingChar(inputStr, charToRemove)
{
  while (inputStr.substring(0, 1) == charToRemove)
  {
    if (inputStr.length == 1)
    {
      return inputStr;
    }
    inputStr = inputStr.substring(1)
  }
  return inputStr;
}


/*******************************************************************************
** Action: Replaces any placholders of [prefix] + [keyword] in [str]
**         with the value(s) of [value]. [value] can be an array. If an array,
**         it will check for all [value.length] references where [delimiter]
**         represents the char to announce th array index.
**         e.g. "$test.1": "$" = [prefix], "test" = [keyword], "." = [delimiter]
** Return: string with all placeholders replaced
*******************************************************************************/
function replaceInString(str, prefix, keyword, delimiter, value)
{
  let rep
  /* make sure only strings get passed into this method */
  if (typeof str != "string")
  {
    console.error("Error: " + replaceInString.name + " 'str' arg must be typeof string. Now it's: " + typeof str);
  }

  /* if [value] is an array, loop [value.length] times to be sure to replace all
  array placeholders in the string */
  if (isIterable(value))
  {
    for (let i = 0; i < value.length; i++)
    {
      /* assemble regular expression according to keyword and current index */
      rep = prefix + keyword + delimiter + i;
      new RegExp(rep)

      /* repeate replacing until the string has no more of the current
      placeholders (rep) */
      while (str != str.replace(rep, value[i]))
      {
        str = str.replace(rep, value[i]);
      }
    }
  }
  else
  {
    rep = prefix + keyword;
    new RegExp(rep);
    /* repeate replacing until the string has no more of the current
    placeholders (rep) */
    while (str != str.replace(rep, value))
    {
      str = str.replace(rep, value);
    }
  }
  return str
}
