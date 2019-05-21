

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
  ** Action: Checks if string[index] contains a instruction.
  **         This method also holds all Instrucion logic. That's  why you have
  **         to pass this method a whole lines array instead of just one line: It needs
  **         to look ahead / behind to get some necessary Data for the found instruction.
  ** Return: All Data to create a new InstructionOperation Object
  *******************************************************************************/
  InstructionLogicData(lines, index)
  {
    let match = instructionOperationRegex.exec(lines[index]);
    if (match != null && match[1,2] != null && match[1,2] != "")
    {
      let name;
      let number = parseInt(match[2], 10);
      let reads = null;
      let writes = null;
      let dependency = null;
      let format = {kind: "-", length: 0, modifier: null};
      let graphicalData = {opStr: null, tableRows: null, tableExtraDescription: null};
        switch (number)
        {
          case 1: /* ☑️ */
            name = "END1";
            /* Needs nothing */
          break;

          case 2: /* ☑️ */
            name = "END2";
            /* Needs nothing */
          break;

          case 48: /* ☑️ */
            name = "END3";
            /* Needs nothing */
          break;

          case 64: /* ☑️ */
            name = "SUBEND";
            /* Needs nothing */
          break;

          case 65: /* ☑️ */
            name = "SUBCALL";
            format.length = 1;
            reads = this.instructionReads(lines, index, 1);
            graphicalData.opStr = "Starts the Subprogram " + reads ;
          break;

          case 66: /* ☑️ */
            name = "SUBCALLU";
            format.length = 1;
            reads = this.instructionReads(lines, index, 1);
            graphicalData.opStr = "Starts the Subprogram " + reads ;
          break;

          case 71: /* ☑️ */
            name = "SUBPRG";
            format.length = 1;
            reads = this.instructionReads(lines, index, 1);
            graphicalData.opStr = "Header of the Subprogram " + reads ;
          break;

          case 72: /* ☑️ */
            name = "SUBE";
            /* Needs nothing */
          break;

          case 3: /* ☑️ */
            name = "TMR";
            format.length = 1;
            reads = "TMR_" + this.instructionReads(lines, index, 1);
          break;

          case 24: /* ☑️ */
            name = "TMRB";
            format.length = 1;
            reads = "TMR_" + this.instructionReads(lines, index, 1);
          break;

          case 54: /* ☑️ */
            name = "TMRC";
            format.length = 1;
            reads = "TMR_" + this.instructionReads(lines, index, 1);
          break;

          case 77: /* ☑️ */
            name = "TMBRF";
            format.length = 1;
            reads = "TMR_" + this.instructionReads(lines, index, 1);
          break;

          case 25: /* ☑️ */
            name = "DECB";
            format = this.instructionFormat(lines, index, 1);
            reads = [this.instructionReads(lines, index, 2), this.instructionReads(lines, index, 3)];
            writes = this.instructionWrites(lines, index, 4);
            graphicalData.opStr = "Reads for " + format.length + " byte(s) " + format.kind + " starting at " + reads[0] + " & " + reads[1] + " and writes the decoded result to " + writes
            graphicalData.tableRows = [StyleNextCellGreen, reads[0], Definition, "DECB", StyleNextCellGreen, reads[1], Definition, "->", StyleNextCellRed, writes, Definition];
          break;

          case 5: /* ☑️ */
            name = "CTR";
            format.length = 1;
            reads = "CTR_" + this.instructionReads(lines, index, 1);
            writes = "CTR_" + this.instructionWrites(lines, index, 1);
          break;

          case 55: /* ☑️ */
            name = "CTRC";
            format.length = 2;
            reads = this.instructionReads(lines, index, 1);
            writes = this.instructionWrites(lines, index, 1);
            graphicalData.opStr = "Reads counter initialization value from " + reads + " and handles the counter register " + writes;
            graphicalData.tabeRows = [StyleNextCellGreen, reads, Definition, StyleNextCellRed, writes, Definition, "CTRC"];
          break;

          case 56: /* ☑️ */
            name = "CTRB";
            format.length = 1;
            reads = "CTR_" + this.instructionReads(lines, index, 1);
            writes = "CTR_" + this.instructionWrites(lines, index, 1);
            graphicalData.opStr = "Reads counter initialization value from " + reads + " and handles the counter register " + writes;
            graphicalData.tabeRows = [StyleNextCellGreen, reads, Definition, StyleNextCellRed, writes, Definition, "CTRB"];
          break;

          case 6:
            name = "ROT";
            this.usedUndefinedInstructions.push(name);
          break;

          case 26:
            name = "ROTB";
            this.usedUndefinedInstructions.push(name);
          break;

          case 7:
            name = "COD";
            this.usedUndefinedInstructions.push(name);
          break;

          case 27: /* ☑️ */
            name = "CODB";
            format = this.instructionFormat(lines, index, 1);
            reads = this.instructionReads(lines, index, 3);
            writes = this.instructionWrites(lines, index, 4);
            graphicalData.opStr = "Reads counter initialization value from " + reads + " and handles the counter register " + writes;
            graphicalData.tabeRows = [StyleNextCellGreen, reads, Definition, "CODB", StyleNextCellRed, writes, Definition];
          break;

          case 8:
            name = "MOVE";
            this.usedUndefinedInstructions.push(name);
          break;

          case 28: /* ❔ */
            name = "MOVOR";
            format.length = 1;
            reads = [this.instructionReads(lines, index, 1), this.instructionReads(lines, index, 2)];
            writes = this.instructionWrites(lines, index, 3);
            graphicalData.opStr = "Writes the logical OR product of " + reads[0] + " & " + reads[1] + " to " + writes;
            graphicalData.tabeRows = [StyleNextCellGreen, reads[0], Definition, "MOVOR", StyleNextCellGreen, reads[1], Definition, "->", StyleNextCellRed, writes, Definition];
          break;

          case 9:
            name = "COM";
            this.usedUndefinedInstructions.push(name);
          break;

          case 29:
            name = "COME";
            this.usedUndefinedInstructions.push(name);
          break;

          case 10: /* ☑️ */
            name = "JMP";
            /* Needs nothing */
          break;

          case 30: /* ☑️ */
            name = "JMPE";
            /* Needs nothing */
          break;

          case 68: /* ☑️ */
            name = "JMPB";
            /* Needs nothing */
          break;

          case 69: /* ☑️ */
            name = "LBL";
            /* Needs nothing */
          break;

          case 11:
            name = "PARI";
            this.usedUndefinedInstructions.push(name);
          break;

          case 14:
            name = "DCNV";
            this.usedUndefinedInstructions.push(name);
          break;

          case 31: /* ☑️ */
            name = "DCNVB";
            format = this.instructionFormat(lines, index, 1);
            reads = this.instructionReads(lines, index, 2);
            writes = this.instructionWrites(lines, index, 3);
            graphicalData.opStr = "Converts " + reads + " from binary to BCD and writes it to " + writes;
            graphicalData.tabeRows = [StyleNextCellGreen, reads, Definition, "DCNVB", StyleNextCellRed, writes, Definition];
          break;

          case 15:
            name = "COMP";
            this.usedUndefinedInstructions.push(name);
          break;

          case 32: /* ☑️ */
            name = "COMPB";
            format = this.instructionFormat(lines, index, 1);
            reads = [this.instructionReads(lines, index, 2), this.instructionReads(lines, index, 3)];
            writes = null;
            graphicalData.opStr = "Compares " + reads[0] + " to " + reads[1] + ". Uses internal evaluation register to store the result";
            graphicalData.tabeRows = [StyleNextCellGreen, reads[0], Definition, "COMPB", StyleNextCellGreen, reads[1], Definition, "->", StyleNextCellRed, "R9000", Definition];
          break;

          case 16:
            name = "COIN";
            this.usedUndefinedInstructions.push(name);
          break;

          case 33:
            name = "SFT";
            this.usedUndefinedInstructions.push(name);
          break;

          case 17:
            name = "DSCH";
            this.usedUndefinedInstructions.push(name);
          break;

          case 34:
            name = "DSCHB";
            this.usedUndefinedInstructions.push(name);
          break;

          case 18:
            name = "XMOV";
            this.usedUndefinedInstructions.push(name);
          break;

          case 35:
            name = "XMOVB";
            format = this.instructionFormat(lines, index, 1);
            format.modifier = [];
            format.modifier.push("*");
            format.modifier.push(lines[index + 2]);
            reads =  [this.instructionReads(lines, index,  3), this.instructionWrites(lines, index, 4)];
            writes = [this.instructionWrites(lines, index, 4), this.instructionReads(lines, index,  3)];
            dependency = new ReadWriteDependency(lines[index  - 3]);
            graphicalData.opStr = "If <b>" + dependency.dependentOf + "</b> is true, it will read " + reads[0] + " and write it to " + writes[0] +
                           ".<br>If <b>" + dependency.dependentOf + "</b> is false, it will read " + writes[0] + " and write it to " + reads[0] +
                           ".<br>The length is defined by it's format (" + format.length + " byte(s), " + format.kind + ") multiplied by the value of <b>" + format.modifier[1] + "</b>";
            graphicalData.tableExtraDescription = "Read / Write depends on the state of " + dependency.dependentOf;
            graphicalData.tableRows = [StyleNextCellYellow, reads[0], Definition, "XMOVB", StyleNextCellYellow, writes[0], Definition];
          break;

          case 19:
            name = "ADD";
            this.usedUndefinedInstructions.push(name);
          break;

          case 36: /* ☑️ */
            name = "ADDB";
            format = this.instructionFormat(lines, index, 1);
            reads = [this.instructionReads(lines, index, 2), this.instructionReads(lines, index, 3)];
            writes = this. instructionWrites(lines, index, 4);
            graphicalData.opStr = "Adds " + reads[0] + " to " + reads[1] + " and writes it to " + writes;
            graphicalData.tableRows = [StyleNextCellGreen, reads[0], Definition, "+", StyleNextCellGreen, reads[1], Definition, "->", StyleNextCellRed, writes, Definition];
          break;

          case 20:
            name = "SUB";
            this.usedUndefinedInstructions.push(name);
          break;

          case 37: /* ☑️ */
            name = "SUBB";
            format = this.instructionFormat(lines, index, 1);
            reads = [this.instructionReads(lines, index, 2), this.instructionReads(lines, index, 3)];
            writes = this. instructionWrites(lines, index, 4);
            graphicalData.opStr = "Subtracts " + reads[1] + " from " + reads[0] + " and writes it to " + writes;
            graphicalData.tableRows = [StyleNextCellGreen, reads[0], Definition, "-", StyleNextCellGreen, reads[1], Definition, "->", StyleNextCellRed, writes, Definition];
          break;

          case 21:
            name = "MUL";
            this.usedUndefinedInstructions.push(name);
          break;

          case 38: /* ☑️ */
            name = "MULB";
            format = this.instructionFormat(lines, index, 1);
            reads = [this.instructionReads(lines, index, 2), this.instructionReads(lines, index, 3)];
            writes = this. instructionWrites(lines, index, 4);
            graphicalData.opStr = "Multiplies " + reads[0] + " by " + reads[1] + " and writes it to " + writes;
            graphicalData.tableRows = [StyleNextCellGreen, reads[0], Definition, "x", StyleNextCellGreen, reads[1], Definition, "->", StyleNextCellRed, writes, Definition];
          break;

          case 22:
            name = "DIV";
            this.usedUndefinedInstructions.push(name);
          break;

          case 39: /* ☑️ */
            name = "DIVB";
            format = this.instructionFormat(lines, index, 1);
            reads = [this.instructionReads(lines, index, 2), this.instructionReads(lines, index, 3)];
            writes = this. instructionWrites(lines, index, 4);
            graphicalData.opStr = "Divides " + reads[1] + " trough " + reads[0] + " and writes it to " + writes;
            graphicalData.tableRows = [StyleNextCellGreen, reads[0], Definition, "/", StyleNextCellGreen, reads[1], Definition, "->", StyleNextCellRed, writes, Definition];
          break;

          case 23: /* ❎ */
            name = "NUME";
            this.usedUndefinedInstructions.push(name);
          break;

          case 40: /* ☑️ */
            name = "NUMEB";
            format = this.instructionFormat(lines, index, 1);
            reads =  this.instructionReads (lines, index, 2);
            writes = this.instructionWrites(lines, index, 3);
            graphicalData.opStr = "Defines " + reads + " as a constant and stores it to " + writes;
            graphicalData.tableRows = ["define", StyleNextCellGreen, reads, Definition, "->", StyleNextCellRed, writes, Definition];
          break;

          case 49:
            name = "DISP";
            this.usedUndefinedInstructions.push(name);
          break;

          case 41: /* ☑️ */
            name = "DISPB";
            /* Needs nothing */
          break;

          case 42: /* ❔ */
          name = "EXIN";
            format.length = 5;
            reads = this.instructionReads(lines, index, 1);
            writes = this.instructionWrites(lines, index, 1);
            graphicalData.opStr = "TEXT TO DO";
            graphicalData.tableRows = ["EXIN", StyleNextCellGreen, reads, Definition, StyleNextCellRed, writes, Definition];
          break;

          case 43: /* ☑️ */
            name = "MOVB";
            format.length = 1;
            reads = this.instructionReads(lines, index, 1);
            writes = this.instructionWrites(lines, index, 2);
            graphicalData.opStr = "Moves one byte, " + reads + " to " + writes;
            graphicalData.tableRows = [StyleNextCellGreen, reads, Definition, "->", StyleNextCellRed, writes, Definition];
          break;

          case 44: /* ☑️ */
            name = "MOVW";
            format.length = 2;
            reads = this.instructionReads(lines, index, 1);
            writes = this.instructionWrites(lines, index, 2);
            graphicalData.opStr = "Moves one word, " + reads + " to " + writes;
            graphicalData.tableRows = [StyleNextCellGreen, reads, Definition, "->", StyleNextCellRed, writes, Definition];
          break;

          case 45: /* ☑️ */
            name = "MOVN";
            format = this.instructionFormat(lines, index, 1);
            reads = this.instructionReads(lines, index, 2);
            writes = this. instructionWrites(lines, index, 3);
            graphicalData.opStr = "Moves n-bytes, (" + format.length + " " + format.kind + ") " + reads + " to " + writes;
            graphicalData.tableRows = [StyleNextCellGreen, reads, Definition, "->", StyleNextCellRed, writes, Definition];
          break;

          case 51: /* ☑️ */
            name = "WINDR";
            format.length = 1;
            writes = this.instructionWrites(lines, index, 1);
            graphicalData.opStr = "Reads dataelements from the PMC / CNC window and writes it to " + writes;
            graphicalData.tableRows = ["WINDR", StyleNextCellRed, writes, Definition];
          break;

          case 52:
            name = "WINDW";
            format.length = 1;
            writes = this.instructionWrites(lines, index, 1);
            graphicalData.opStr = "Reads dataelements from the PMC / CNC window and writes it to " + writes;
            graphicalData.tableRows = ["WINDR", StyleNextCellRed, writes, Definition];
          break;

          case 57: /* ☑️ */
            name = "DIFU";
            format.length = 1;
            reads = "DIFU_" + this.instructionReads(lines, index, 1);
            dependency = new ActivationDependency(lines[index - 1]);
            graphicalData.opStr = "Generates a positive impulse of the signal " + dependency.dependentOf + ". DIFU Number: " + reads;
            graphicalData.tableRows = null;
          break;

          case 58: /* ☑️ */
            name = "DIFD";
            format.length = 1;
            reads = "DIFD_" + this.instructionReads(lines, index, 1);
            dependency = new ActivationDependency(lines[index - 1]);
            graphicalData.opStr = "Generates a negative impulse of the signal " + dependency.dependentOf + ". DIFD Number: " + reads;
            graphicalData.tableRows = null;
          break;

          case 53: /* ☑️ */
            name = "AXCTL";
            /* Needs nothing */
          break;

          case 59: /* ☑️ */
            name = "EXOR";
            format = this.instructionFormat(lines, index, 1);
            reads = [this.instructionReads(lines, index, 2), this.instructionReads(lines, index, 3)];
            writes = this. instructionWrites(lines, index, 4);
            graphicalData.opStr = "Bitwise EXOR links " + reads[0] + " to " + reads[1] + " and writes it to " + writes;
            graphicalData.tableRows = [StyleNextCellGreen, reads[0], Definition, "EXOR", StyleNextCellGreen, reads[1], Definition, "->", StyleNextCellRed, writes, Definition];
          break;

          case 60: /* ☑️ */
            name = "LOGAND";
            format = this.instructionFormat(lines, index, 1);
            reads = [this.instructionReads(lines, index, 2), this.instructionReads(lines, index, 3)];
            writes = this. instructionWrites(lines, index, 4);
            graphicalData.opStr = "Bitwise AND links " + reads[0] + " and " + reads[1] + " and writes it to " + writes;
            graphicalData.tableRows = [StyleNextCellGreen, reads[0], Definition, "&&", StyleNextCellGreen, reads[1], Definition, "->", StyleNextCellRed, writes, Definition];
          break;

          case 61: /* ☑️ */
            name = "LOGOR";
            format = this.instructionFormat(lines, index, 1);
            reads = [this.instructionReads(lines, index, 2), this.instructionReads(lines, index, 3)];
            writes = this. instructionWrites(lines, index, 4);
            graphicalData.opStr = "Bitwise OR links " + reads[0] + " to " + reads[1] + " and writes it to " + writes;
            graphicalData.tableRows = [StyleNextCellGreen, reads[0], Definition, "OR", StyleNextCellGreen, reads[1], Definition, "->", StyleNextCellRed, writes, Definition];
          break;

          case 62: /* ☑️ */
            name = "LOGNOT";
            format = this.instructionFormat(lines, index, 1);
            reads = this.instructionReads(lines, index, 2);
            writes = this. instructionWrites(lines, index, 3);
            graphicalData.opStr = "Bitwise negates " + reads + " and writes it to " + writes;
            graphicalData.tableRows = ["NOT", StyleNextCellGreen, reads, Definition, "->", StyleNextCellRed, writes, Definition];
          break;

          case 90:
            name = "FNC90";
            this.usedUndefinedInstructions.push(name);
          break;

          case 91:
            name = "FNC91";
            this.usedUndefinedInstructions.push(name);
          break;

          case 92:
            name = "FNC92";
            this.usedUndefinedInstructions.push(name);
          break;

          case 93:
            name = "FNC93";
            this.usedUndefinedInstructions.push(name);
          break;

          case 94:
            name = "FNC94";
            this.usedUndefinedInstructions.push(name);
          break;

          case 95:
            name = "FNC95";
            this.usedUndefinedInstructions.push(name);
          break;

          case 96:
            name = "FNC96";
            this.usedUndefinedInstructions.push(name);
          break;

          case 97:
            name = "FNC97";
            this.usedUndefinedInstructions.push(name);
          break;

          case 88:
            name = "MMC3R";
            this.usedUndefinedInstructions.push(name);
          break;

          case 89:
            name = "MMC3W";
            this.usedUndefinedInstructions.push(name);
          break;

          case 98:
            name = "MMCWR";
            this.usedUndefinedInstructions.push(name);
          break;

          case 99:
            name = "MMCWW";
            this.usedUndefinedInstructions.push(name);
          break;

          case 460:
            name = "PID";
            this.usedUndefinedInstructions.push(name);
          break;

          case 219:
            name = "RNGW";
            format.length = 2;
            reads =  [this.instructionReads(lines, index,  1), this.instructionWrites(lines, index, 2), this.instructionWrites(lines, index, 3)];
            graphicalData.opStr = "Word-Range comparison. <br>" +
                           "Lower / Upper Boundary: <b>" + reads[0] + "</b> <br>" +
                           "Lower / Upper Boundary: <b>" + reads[1] + "</b> <br>" +
                           "Input Data :            <b>" + reads[2] + "</b> <br>" +
                           "Sets its output <br>" +
                           "if " + reads[0] + " ≤ " + reads[2] + " ≤ " + reads[1] + " or <br>" +
                           "if " + reads[1] + " ≤ " + reads[2] + " ≤ " + reads[0];
            // graphicalData.tableExtraDescription = "";
            graphicalData.tableRows = [StyleNextCellGreen, reads[0], Definition, "≤", StyleNextCellGreen, reads[2], Definition, "≤", StyleNextCellGreen, reads[1], Definition];
          break;

          case 220:
            name = "RNGD";
            format.length = 4;
            reads =  [this.instructionReads(lines, index,  1), this.instructionWrites(lines, index, 2), this.instructionWrites(lines, index, 3)];
            graphicalData.opStr = "Doubleword-Range comparison. <br>" +
                           "Lower / Upper Boundary: <b>" + reads[0] + "</b> <br>" +
                           "Lower / Upper Boundary: <b>" + reads[1] + "</b> <br>" +
                           "Input Data :            <b>" + reads[2] + "</b> <br>" +
                           "Sets its output <br>" +
                           "if " + reads[0] + " ≤ " + reads[2] + " ≤ " + reads[1] + " or <br>" +
                           "if " + reads[1] + " ≤ " + reads[2] + " ≤ " + reads[0];
            // graphicalData.tableExtraDescription = "";
            graphicalData.tableRows = [StyleNextCellGreen, reads[0], Definition, "≤", StyleNextCellGreen, reads[2], Definition, "≤", StyleNextCellGreen, reads[1], Definition];
          break;

          default:
            /* Collect Subs which appear in the mnemonic and are defined but aren't
            handled in code */
        }

        return  {
                  instruction      : name,
                  number           : number,
                  reads            : reads,
                  writes           : writes,
                  dependency       : dependency,
                  graphicalData    : new GraphicalData(graphicalData.opStr, graphicalData.tableRows, graphicalData.tableExtraDescription),
                  format           : format.kind,
                  formatLength     : format.length,
                  formatModifier   : format.modifier
                };
    }
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
  const monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];
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
