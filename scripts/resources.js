

const multiBitDefinitionRegex =      /^(T|D|E|F|G|R|X|Y)(\d*)(\s*)([A-Z0-9\-\_\#]*)$/;
const singleBitDefinitionRegex =     /^(T|D|E|F|G|R|X|Y)(\d*)(\.)(\d)(\s*)([A-Z0-9\-\_\+]*)$/;
const moduleNumberDefinitionRegex =  /^[P](\d*)\s*C(\d*)$/;
const moduleTitleDefinitionRegex =   /^;---------------\s*fc(\d*).lad\s*\(([^\)]*)\)$/i;

const currentModuleNumberRegex =     /^([P])(\d*)/;
const currentModuleSourceRegex =     /^;---------------\s*fc(\d*).lad\s*\(([^\)]*)\$/i;
const currentNetworkRegex =          /^N(\d\d\d\d\d)\:$/g;
const readBitOperationsRegex =       /^(RD|OR|AND)(\.NOT\.STK|\.NOT|\.STK|)\s*(.*)$/;
const writeBitOperationsRegex =      /^(WRT|SET|RST)(\.NOT|)\s*(.*)$/;
const instructionOperationRegex =    /^(SNUB|SUB)\s*(\d*)$/;
const levelSubRegex =                /^(SNUB|SUB)\s*(\d*)$/;
const instructionReadWriteRegex =    /^([A-Z])(\d*)$/;
const instructionFormatRegex =       /^(\d|)(\d\d|)(\d|)$/;


/*******************************************************************************
** Class - Memory
** Holds a memory definition
** Properties:
*******************************************************************************/
class Memory {
  constructor(type, byteAddress, bitAddress, length, symbol) {
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
** Properties:
*******************************************************************************/
class Module {
  constructor(programNumber, sourceFile, title) {
    this.programNumber = programNumber /*  =  Numeric, "P" number */
    this.sourceFile = sourceFile;      /*  =  String, sourcefile Name */
    this.title = title;                /*  =  String, Module title */
  }
}


/*******************************************************************************
** Class - BitOperation
** Holds a bit operation, read or write
** Properties:
*******************************************************************************/
class BitOperation {
  constructor(op, mem, inMod, inNwk, inLine) {
    this.operation = op;    /*  =  String, operation Type one of: [readBitOperationsRegex] */
    this.memory = mem;      /*  =  String, memory Address. e.g. [R3453.2] */
    this.inModule = inMod;  /*  =  Object of type [Module] */
    this.inNetwork = inNwk; /*  =  String, containing the network the parser is currently in. */
    this.inLine = inLine;   /*  =  String, Line index of the whole file. */
  }
}


/*******************************************************************************
** Class - InstructionOperations
** Hold a bit operation, read or write
** Properties:
*******************************************************************************/
class InstructionOperation {
  constructor(instr, instrNbr, form, formLn, reads, writes, inMod, inNwk, inLine) {
    this.instruction = instr;          /*  = String, Type of operation */
    this.instructionNumber = instrNbr; /*  = Numeric, Type number */
    this.format = form;                /*  = String, type of format (Normal, Const, Addr...) */
    this.formatLength = formLn;        /*  = Numeric, length of it's actions (in bytes) */
    this.reads = reads;                /*  = String, Beginning Address of read range */
    this.writes = writes;              /*  = String, Beginnign Address of write range */
    this.inModule = inMod;             /*  = Object, of tyop [Module] */
    this.inNetwork = inNwk;            /*  = String, containing the network the parser is currently in. */
    this.inLine = inLine;
  }
}


/*******************************************************************************
** Class - Resource
** Holds the source MNC, all definitions, as well as logic data (ops)
** and analyze-data
** Properties:
*******************************************************************************/
class Resource {
  constructor(sourceLines) {
    this.sourceLines = sourceLines;         /* String array, each index holds 1 line */

    this.Modules = [];                      /* Array of Module objects, holds module definitions */
    this.SBDMemory = [];                    /* Array of Memory objects, holds Single bit definitions */
    this.MBDMemory = [];                    /* Array of Memory objects, holds Multi bit definitions */
    this.bitReadOperations = [];            /* Array of BitOperations, holds bit read operations */
    this.bitWriteOperations = [];           /* Array of BitOperations, holds bit write operations */
    this.instructionOperations = [];        /* Array of InstructionOperations, holds instruction operations */

    this.usedUndefinedInstructions = [];    /* Array of InstructionsOperations, holds unhandled Instructions */
  }


  /*******************************************************************************
  ** Action: Checks if string contains a MBD. Creates Memory Object
  ** Return: Memory Object [definition]
  *******************************************************************************/
  getMultiBitDefinitions(str) {
    let match = multiBitDefinitionRegex.exec(str);
    if (match != null && match[1,2,4] != null && match[1,2,4] != "") {
      let definition = new Memory(match[1], match[2], "", ">=8", match[4])
      return definition;
    } else {
      return null;
    }
  }

  /*******************************************************************************
  ** Action: Checks if string contains a SBD. Creates Memory Object
  ** Return: Memory Object [definition]
  *******************************************************************************/
  getSingleBitDefinitions(str) {
    let match = singleBitDefinitionRegex.exec(str);
    if (match != null && match[1,2,4,6] != null && match[1,2,4,6] != "") {
      let definition = new Memory(match[1], match[2], match[4], 1, match[6])
      return definition;
    } else {
      return null;
    }
  }

  /*******************************************************************************
  ** Action: Checks if string contains a Module Definition. Creates Module Object
  ** Return: Module Object [mod]
  *******************************************************************************/
  getModuleNumberDefinition(str) {
    let match = moduleNumberDefinitionRegex.exec(str);
    if (match != null && match[1,2] != null && match[1,2] != "") {
      let mod = new Module(parseInt(match[1], 10), parseInt(match[2], 10));
      return mod;
    } else {
      return null;
    }
  }

  /*******************************************************************************
  ** Action: Checks if string Module title. Extends matching source.Modules Object
  **         with the found title
  ** Return: true: If a defined module was extended with the found title, else: false
  *******************************************************************************/
  getModuleTitleDefinition(str) {
    let match = moduleTitleDefinitionRegex.exec(str);
    if (match != null && match[1,2] != null && match[1,2] != "") {
      for (let i = 0; i < this.Modules.length; i++) {
        if (match[1].includes(this.Modules[i].sourceFile)) { /* If the module was found in the defined modules... */
          this.Modules[i].title = match[2]; /* ..add the found title to it */
          return true;
          break;
        }
      }
    } else {
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
  getCurrentModule(str1, str2, lineNumber) {
    let match1 = currentModuleNumberRegex.exec(str1);
    let match2 = currentModuleSourceRegex.exec(str2);

    /* does it match the Source file name? */
    if (match2 != null && match2[1,2] != null && match2[1,2] != "") {
      for (let i = 0; i < this.Modules.length; i++) {
        /* Check if the sourcefile is already defined */
        if (match2.includes(this.Modules[i].sourceFile)) {
          this.Modules[i].fromLine = lineNumber;
          return this.Modules[i];
        }
      }
      /* Sourcenumber hasn't been used yet. */
      return new Module(undefined , parseInt(match2[1], 10), match2[2]);
    }

    /* does it match the Program Number? */
    if (match1 != null && match1[1,2] != null && match1[1,2] != "") {
      for (let i = 0; i < this.Modules.length; i++) {
        /* Check if the P Number is already defined */
        if (parseInt(match1[2], 10) == this.Modules[i].programNumber) {
          return this.Modules[i];
        }
      }
      /* Sourcenumber hasn't been used yet. */
      return new Module(parseInt(match1[2], 10) , undefined, undefined);
    }
  }

  /*******************************************************************************
  ** Action: Checks if string contains a Network Name.
  ** Return: String, network Name [match[1]]
  *******************************************************************************/
  getCurrentNetwork(str) {
    let match = currentNetworkRegex.exec(str);
    if (match != null && match[1] != null && match[1] != "") {
      return match[1];
    } else {
      return null;
    }
  }

  /*******************************************************************************
  ** Action: Checks if string contains a BitRead Operation.
  ** Return: [op: String (Operation), String (Modifier)] [mem: String (Memory)]
  *******************************************************************************/
  getReadBitOperation(str) {
    let match = readBitOperationsRegex.exec(str);
    if (match != null && match[1,3] != null && match[1,3] != "") {
      return {op: match[1] + match[2], mem: match[3]};
    } else {
      return null;
    }
  }

  /*******************************************************************************
  ** Action: Checks if string contains a BitWrite Operation.
  ** Return: [op: String (Operation), String (Modifier)] [mem: String (Memory)]
  *******************************************************************************/
  getWriteBitOperation(str) {
    let match = writeBitOperationsRegex.exec(str);
    if (match != null && match[1,3] != null && match[1,3] != "") {
      return {op: match[1] + match[2], mem: match[3]};
    } else {
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
  InstructionLogicData(lines, index) {
    let match = instructionOperationRegex.exec(lines[index]);
    if (match != null && match[1,2] != null && match[1,2] != "") {
        let name;
        let number = parseInt(match[2], 10);
        let reads = null;
        let writes = null;
        let format = {kind: "-", length: 0};
        switch (number) {
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
            reads = this.instructionReads(lines, index, 1, format.length);
            break;
          case 66: /* ☑️ */
            name = "SUBCALLU";
            format.length = 1;
            reads = this.instructionReads(lines, index, 1, format.length);
            break;
          case 71: /* ☑️ */
            name = "SUBPRG";
            format.length = 1;
            reads = this.instructionReads(lines, index, 1, format.length);
            break;
          case 72: /* ☑️ */
            name = "SUBE";
            /* Needs nothing */
            break;
          case 3: /* ☑️ */
            name = "TMR";
            format.length = 1;
            reads = "TMR_" + this.instructionReads(lines, index, 1, format.length);
            break;
          case 24: /* ☑️ */
            name = "TMRB";
            format.length = 1;
            reads = "TMR_" + this.instructionReads(lines, index, 1, format.length);
            break;
          case 54: /* ☑️ */
            name = "TMRC";
            format.length = 1;
            reads = "TMR_" + this.instructionReads(lines, index, 1, format.length);
            break;
          case 77: /* ☑️ */
            name = "TMBRF";
            format.length = 1;
            reads = "TMR_" + this.instructionReads(lines, index, 1, format.length);
            break;
          case 25: /* ☑️ */
            name = "DECB";
            format = this.instructionFormat(lines, index, 1);
            reads = [this.instructionReads(lines, index, 2, format.length), this.instructionReads(lines, index, 3, format.length)];
            writes = this.instructionWrites(lines, index, 4, format.length);
            break;
          case 5: /* ☑️ */
            name = "CTR";
            format.length = 1;
            reads = "CTR_" + this.instructionReads(lines, index, 1, format.length);
            writes = "CTR_" + this.instructionWrites(lines, index, 1, format.length);
            break;
          case 55: /* ☑️ */
            name = "CTRC";
            format.length = 2;
            reads = this.instructionReads(lines, index, 1, format.length);
            format.length = 4;
            writes = this.instructionWrites(lines, index, 1, format.length);
            break;
          case 56: /* ☑️ */
            name = "CTRB";
            format.length = 1;
            reads = "CTR_" + this.instructionReads(lines, index, 1, format.length);
            writes = "CTR_" + this.instructionWrites(lines, index, 1, format.length);
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
            reads = this.instructionReads(lines, index, 3, format.length);
            writes = this.instructionWrites(lines, index, 4, format.length);
            break;
          case 8:
            name = "MOVE";
            this.usedUndefinedInstructions.push(name);
            break;
          case 28: /* ❔ */
            name = "MOVOR";
            format.length = 1;
            reads = [this.instructionReads(lines, index, 1, format.length), this.instructionReads(lines, index, 2, format.length)];
            writes = this.instructionWrites(lines, index, 3, format.length);

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
            reads = this.instructionReads(lines, index, 2, format.length);
            writes = this.instructionWrites(lines, index, 3, format.length);
            break;
          case 15:
            name = "COMP";
            this.usedUndefinedInstructions.push(name);
            break;
          case 32: /* ☑️ */
            name = "COMPB";
            format = this.instructionFormat(lines, index, 1);
            reads = [this.instructionReads(lines, index, 2, format.length), this.instructionReads(lines, index, 3, format.length)];
            writes = null;
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
            this.usedUndefinedInstructions.push(name);
            break;
          case 19:
            name = "ADD";
            this.usedUndefinedInstructions.push(name);
            break;
          case 36: /* ☑️ */
            name = "ADDB";
            format = this.instructionFormat(lines, index, 1);
            reads = [this.instructionReads(lines, index, 2, format.length), this.instructionReads(lines, index, 3, format.length)];
            writes = this. instructionWrites(lines, index, 4, format.length);
            break;
          case 20:
            name = "SUB";
            this.usedUndefinedInstructions.push(name);
            break;
          case 37: /* ☑️ */
            name = "SUBB";
            format = this.instructionFormat(lines, index, 1);
            reads = [this.instructionReads(lines, index, 2, format.length), this.instructionReads(lines, index, 3, format.length)];
            writes = this. instructionWrites(lines, index, 4, format.length);
            break;
          case 21:
            name = "MUL";
            this.usedUndefinedInstructions.push(name);
            break;
          case 38: /* ☑️ */
            name = "MULB";
            format = this.instructionFormat(lines, index, 1);
            reads = [this.instructionReads(lines, index, 2, format.length), this.instructionReads(lines, index, 3, format.length)];
            writes = this. instructionWrites(lines, index, 4, format.length);
            break;
          case 22:
            name = "DIV";
            this.usedUndefinedInstructions.push(name);
            break;
          case 39: /* ☑️ */
            name = "DIVB";
            format = this.instructionFormat(lines, index, 1);
            reads = [this.instructionReads(lines, index, 2, format.length), this.instructionReads(lines, index, 3, format.length)];
            writes = this. instructionWrites(lines, index, 4, format.length);
            break;
          case 23: /* ❎ */
            name = "NUME";
            this.usedUndefinedInstructions.push(name);
            break;
          case 40: /* ☑️ */
            name = "NUMEB";
            format = this.instructionFormat(lines, index, 1);
            reads = null;
            writes = this.instructionWrites(lines, index, 3, format.length);
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
            reads = this.instructionReads(lines, index, 1, format.length);
            writes = this.instructionWrites(lines, index, 1, format.length);
            break;
          case 43: /* ☑️ */
            name = "MOVB";
            format.length = 1;
            reads = this.instructionReads(lines, index, 1, format.length);
            writes = this.instructionWrites(lines, index, 2, format.length);
            break;
          case 44: /* ☑️ */
            name = "MOVW";
            format.length = 2;
            reads = this.instructionReads(lines, index, 1, format.length);
            writes = this.instructionWrites(lines, index, 2, format.length);
            break;
          case 45: /* ☑️ */
            name = "MOVN";
            format = this.instructionFormat(lines, index, 1);
            reads = this.instructionReads(lines, index, 2, format.length);
            writes = this. instructionWrites(lines, index, 3, format.length);
            break;
          case 51: /* ☑️ */
            name = "WINDR";
            format.length = 1;
            writes = this.instructionWrites(lines, index, 1, format.length);
            break;
          case 52:
            name = "WINDW";
            format.length = 1;
            writes = this.instructionWrites(lines, index, 1, format.length);
            break;
          case 57: /* ☑️ */
            name = "DIFU";
            format.length = 1;
            reads = "DIFU_" + this.instructionReads(lines, index, 1, format.length);
            break;
          case 58: /* ☑️ */
            name = "DIFD";
            format.length = 1;
            reads = "DIFD_" + this.instructionReads(lines, index, 1, format.length);
            break;
          case 53: /* ☑️ */
            name = "AXCTL";
            /* Needs nothing */
            break;
          case 59: /* ☑️ */
            name = "EXOR";
            format = this.instructionFormat(lines, index, 1);
            reads = [this.instructionReads(lines, index, 2, format.length), this.instructionReads(lines, index, 3, format.length)];
            writes = this. instructionWrites(lines, index, 4, format.length);
            break;
          case 60: /* ☑️ */
            name = "LOGAND";
            format = this.instructionFormat(lines, index, 1);
            reads = [this.instructionReads(lines, index, 2, format.length), this.instructionReads(lines, index, 3, format.length)];
            writes = this. instructionWrites(lines, index, 4, format.length);
            break;
          case 61: /* ☑️ */
            name = "LOGOR";
            format = this.instructionFormat(lines, index, 1);
            reads = [this.instructionReads(lines, index, 2, format.length), this.instructionReads(lines, index, 3, format.length)];
            writes = this. instructionWrites(lines, index, 4, format.length);
            break;
          case 62: /* ☑️ */
            name = "LOGNOT";
            format = this.instructionFormat(lines, index, 1);
            reads = this.instructionReads(lines, index, 2, format.length);
            writes = this. instructionWrites(lines, index, 3, format.length);
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
          default:
            /* Collect Subs which appear in the mnemonic and are defined but aren't
            handled in code */
        }

        return  {
                  instruction: name,
                  number: number,
                  reads: reads,
                  writes: writes,
                  format: format.kind,
                  formatLength : format.length
                };
    }
  }

  /*******************************************************************************
  ** Action: Checks which Memory gets read by an instruction
  ** Return: String, containing Starting memory [startByte]
  *******************************************************************************/
  instructionReads(lines, index, offset, length = 1) {
    let startByte = lines[index + offset];
    let match = instructionReadWriteRegex.exec(startByte);
    let endByte
    /* If match is null then it's a constant, not a memory definition */
    if (match != null) {
      return startByte;
    } else {
      return startByte;
    }
  }

  /*******************************************************************************
  ** Action: Checks which Memory gets written by an instruction
  ** Return: String, containing Starting memory [startByte]
  *******************************************************************************/
  instructionWrites(lines, index, offset, length = 1) {
    let startByte = lines[index + offset];
    let match = instructionReadWriteRegex.exec(startByte);
    let endByte
    /* If match is null then it's a constant, not a memory definition */
    if (match != null) {
      return startByte;
    } else {
      return startByte;
    }
  }

  /*******************************************************************************
  ** Action: Checks the format length of instruction. Measured in bytes
  **         Add the format length to the starting adress and you get the
  **         instuctions range.
  **         Also gets the type (kind) of Format
  ** Return:  [kind: String (Kind)] [length: Numeric (Length in Bytes)]
  *******************************************************************************/
  instructionFormat(lines, index, offset) {
    let format = lines[index + offset];
    let match = instructionFormatRegex.exec(format);
    let kind = "Normal";
    let length = parseInt(match[1], 10);
    /* Change kind / length if it's not a normal format */
    if (match[2] && match[3] != null) {
      length = parseInt(match[3], 10);
      switch (match[1]) {
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
