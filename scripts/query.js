/*******************************************************************************
** Definitions
*******************************************************************************/
const readOps = "Read";
const writeOps = "Write";
const readWriteOps = "Read-Write";
const definedBitsInInstructions = "Defined Bits which are handled in Instructions";

/*******************************************************************************
** Class - Query
** Holds a User-made query.
** Properties:  .src    =  Object of type [Resource]
**              .type   =  String, containing any Case from switch [this.type]
**              .memory =  String, contains the Symbol or Adress of the Query
**              .log    =  An Array of strings, containing a dialog of results
**              .result =  An Array or single Object, containing the found Ops
*******************************************************************************/
class Query
{
  constructor(resource, type, memory)
  {
    this.src = resource;
    this.type = type;
    this.memory = memory;
    this.memoryDefinition;
    this.log = [];
    this.result = [];

    this.execute();
  }

/*******************************************************************************
** Action: Handles all query types [this.type]. Contains all logic routines for
**         each query type.
** Return: null
*******************************************************************************/
  execute()
  {
    /* start timer */
    let start = new Date().getTime();

    switch (this.type)
    {
      case writeOps:
        this.validateAndDefine();

        /* look for matching bitRead operations */
        this.log.push("Looking for write operations...");

        if (this.isBit()) {
          /* look for matching writes in bit operations */
          for (let op of this.src.bitOperations)
          {
            if (op.writes == this.memoryDefinition.byteType  + this.memoryDefinition.byteAddress  + "." + this.memoryDefinition.bitAddress)
            {
              this.result.push(op);
            }
          }
          /* look for matching writes in instructionOperations */
          for (let ins of this.src.instructionOperations)
          {
            if (ins.writes != null)
            {
              this.checkInstuctionRange(ins.writes, this.memoryDefinition.byteType, this.memoryDefinition.byteAddress, ins);
            }
          }
        }
        else /* if it's not a bit */
        {
          /* look for matching writes in instructionOperations */
          for (let ins of this.src.instructionOperations)
          {
            if (ins.writes != null)
            {
              this.checkInstuctionRange(ins.writes, this.memoryDefinition.byteType, this.memoryDefinition.byteAddress, ins, false);
            }
          }
        }

        this.queryLogFooter(this.result);
      break;
      /* ---------------------------------------------------------------------*/

      case readOps:
        this.validateAndDefine();

        /* look for matching bitRead operations */
        this.log.push("Looking for read operations...");

        if (this.isBit()) {
          /* look for matching reads in bit operations */
          for (let op of this.src.bitOperations)
          {
            if (op.reads == this.memoryDefinition.byteType  + this.memoryDefinition.byteAddress  + "." + this.memoryDefinition.bitAddress)
            {
              this.result.push(op);
            }
          }
          /* look for matching reads in instructionOperations */
          for (let ins of this.src.instructionOperations)
          {
            if (ins.reads != null)
            {
              this.checkInstuctionRange(ins.reads, this.memoryDefinition.byteType, this.memoryDefinition.byteAddress, ins);
            }
          }
        }
        else /* if it's not a bit */
        {
          /* look for matching reads in instructionOperations */
          for (let ins of this.src.instructionOperations)
          {
            if (ins.reads != null)
            {
              this.checkInstuctionRange(ins.reads, this.memoryDefinition.byteType, this.memoryDefinition.byteAddress, ins, false);
            }
          }
        }

        this.queryLogFooter(this.result);
      break;
      /* ---------------------------------------------------------------------*/

      case readWriteOps:
        this.validateAndDefine();

        /* look for matching bitRead operations */
        this.log.push("Looking for read and write operations...");

        if (this.isBit()) {
          /* look for matching reads or writes in bit operations */
          for (let op of this.src.bitOperations)
          {
            if (this.memoryDefinition.byteType + this.memoryDefinition.byteAddress  + "." + this.memoryDefinition.bitAddress == (op.writes || op.reads))
            {
              this.result.push(op);
            }
          }
          /* look for matching reads or writes in instructionOperations */
          for (let ins of this.src.instructionOperations)
          {
            if (ins.writes != null)
            {
              this.checkInstuctionRange(ins.writes, this.memoryDefinition.byteType, this.memoryDefinition.byteAddress, ins);
            }
            if (ins.reads != null)
            {
              this.checkInstuctionRange(ins.reads, this.memoryDefinition.byteType, this.memoryDefinition.byteAddress, ins);
            }
          }
        }
        else /* if it's not a bit */
        {
          /* look for matching reads or writes in instructionOperations */
          for (let ins of this.src.instructionOperations)
          {
            if (ins.writes != null)
            {
              this.checkInstuctionRange(ins.writes, this.memoryDefinition.byteType, this.memoryDefinition.byteAddress, ins, false);
            }
            if (ins.reads != null)
            {
              this.checkInstuctionRange(ins.reads, this.memoryDefinition.byteType, this.memoryDefinition.byteAddress, ins, false);
            }
          }
        }

        this.queryLogFooter(this.result);
      break;
      /* ---------------------------------------------------------------------*/
      default:
        this.log.push("Query Type undefined.");
    }

    /* stop timer */
    let end = new Date().getTime();
    this.log.push("Query took " + (end - start) + " ms");
    this.log.push(" ");

    /* plot log of this query */
    for (let str of this.log)
    {
      console.log(str);
    }
  }


/*******************************************************************************
** Action: Generates the first lines of the [.log]. Writes directly to [.log]
** Return: null. Writes directly to object
*******************************************************************************/
  queryLogHead(type)
  {
    this.log.push(" ");
    this.log.push("Query issued. Type: " + type);
  }

/*******************************************************************************
** Action: Generates the first lines of the [.log]. Writes directly to [.log]
** Return: null. Writes directly to object
*******************************************************************************/
  queryLogFooter(result)
  {
    if (result == null || result.length == 0)
    {
      this.log.push("Nothing found");
    }
    else
    {
      this.log.push("Found this:");
      this.log.push(result);
    }
  }

  /*******************************************************************************
  ** Action: Checks a value, or array of values [values] if it contains
  **         [byteType][byteAdress]. If true, it contains every bit in this byte.
  **         this is why the bitAddress property is not queried.
  ** Return: null. Writes directly to object
  *******************************************************************************/
  checkInstuctionRange(values, byteType, byteAddress, ins, checkForBits = true) {
    /* if it's not an array, push a dummy value into the [values] var */
    if (isIterable(values) == false)
    {
      let temp = values;
      values = [];
      values.push(temp, "dummy");
    }

    for (let value of values)
    {
      if (checkForBits) {
        if (checkInstructionByteRange(value, ins.formatLength, byteType, byteAddress))
        {
          this.result.push(ins);
        }
      }
      else /* if checkForBits == false, then only compare bytes (multi bits) */
      {
        if (value == byteType + byteAddress)
        {
          this.result.push(ins);
        }
      }
    }
  }

  /*******************************************************************************
  ** Action: Checks an input query string if well formed and finds its
  **         definition. If no definition has matched it creates a dummy memory
  **         except the input string is formed a a symbol.
  ** Return: this
  *******************************************************************************/
  validateAndDefine() {
    let mem;
    let query = this.memory;
    this.queryLogHead("Validating '" + query + "'...");

    let isMultiBit = (/^([A-Z])(\d+)$/).exec(query);
    let isBit      = (/^([A-Z])(\d+)(\.)([0-7])$/).exec(query);
    let isSymbol   = (/^([\S]){2,6}$/).exec(query);

    /* try to find the correct definition for the sought after mem */
    this.log.push("Looking for definition...");
    if (isBit != null)
    {
      mem = this.src.getBitDef(query);
    }
    else if (isMultiBit != null)
    {
      mem = this.src.getMultiBitDef(query);
    }
    else if (isSymbol != null)
    {
      mem = this.src.getMultiBitDef(query);
      if (mem == null)
      {
        mem = this.src.getBitDef(query);
        if (mem == null)
        {
          throw "Error@'" + this.validateAndDefine.name + "': Found a definion for '" + query + "' in SBD & MBD memory!";
        }
      }
    }
    else
    {
      /* none of the categorizing regexes matched */
      throw "Error@'" + this.validateAndDefine.name + "': Invalid input string '" + query + "'. Consider this: Bit (e.g. A0000.0), Byte or (multi-bit) (e.g. A000) or Symbol (e.g. ABCDEF length = min. 2 Chars & max. 6 Chars)";
    }

    /* check if we've found a def */
    if (mem != undefined)
    {
      this.log.push("Found definition:");
      this.log.push(mem);
      this.memoryDefinition = mem;
    }
    else
    {
      /* if no def has been found, create dummy */
      this.log.push("'" + query +"' is undefined. Creating Dummy Memory...");
      if (isBit != null)
      {
        this.memoryDefinition, mem = this.src.makeDummyBitDefinition(query)
      }
      else if (isMultiBit != null)
      {
        this.memoryDefinition, mem = this.src.makeDummyMultiBitDefinition(query)
      }
      else
      {
        throw "Error@'" + this.validateAndDefine.name + "': Symbol '" + query + "' couldn't be found. Please double-check your input. Make sure there are no spelling errors!";
      }
    }
  }

  /*******************************************************************************
  ** Action: Checks if an instance is a bit definition or not
  ** Return: boolean, true if it is a bit definition.
  *******************************************************************************/
  isBit() {
    if (this.memoryDefinition.bitAddress == "" || this.memoryDefinition.bitAddress == null) {
      return false;
    }
    else
    {
      return true;
    }
  }
}


function checkInstructionByteRange(startByte, length, checkByteType, checkByteAddress) {
  if (startByte != null)
  {
    let match = (/^([A-Z])(\d*)$/).exec(startByte);
    if (match != null)
    {
      let number = parseInt(match[2], 10);
      let type = match[1];
      /* loop trough length (amount of bytes) */
      for (let i = 0; i < length; i++)
      {
        /* if the bit's byteAdress matches the instructions byteAdress + i then it's getting handled there */
        if (checkByteType + checkByteAddress == type + (number + i))
        {
          return true;
        }
      }
    }
  }
}
