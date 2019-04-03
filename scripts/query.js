/*******************************************************************************
** Definitions
*******************************************************************************/
const bitReadOps = "Bit-Read";
const bitWriteOps = "Bit-Write";
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
class Query {
  constructor(resource, type, memory) {
    this.src = resource;
    this.type = type;
    this.memory = memory;
    this.memoryDefinition;
    this.log = [];
    this.result = [];

    this.handleQuery();
  }

/*******************************************************************************
** Action: Handles all query types [this.type]. Contains all logic routines for
**         each query type.
** Return: null
*******************************************************************************/
  handleQuery() {
    let query;
    let bit;
    let byte;
    let start, end;

    /* start timer */
    start = new Date().getTime();

    switch (this.type) {
      /* ---------------------------------------------------------------------*/
      case bitReadOps:
        query = this.memory;
        this.queryLogHead("Defined-Bit Read Operations for (" + query + ")");

        /* get definition */
        this.log.push("Looking for definition...");
        bit = this.src.getBitDef(query);

        /* check if bit has been found */
        if (bit != undefined) {
          this.log.push("Found definition:");
          this.log.push(bit);
          this.memoryDefinition = bit;
        } else { /* bit has no definition, create Dummy */
          this.log.push("Bit is undefined. Creating Dummy Memory...");
          this.memoryDefinition, bit = this.src.makeDummyDefinition(query)
          if (this.memoryDefinition = null) {this.log.push("Illegal format"); break;}
        }

        /* look for matching bitRead operations */
        this.log.push("Looking for read operations...");
        for (let bitR of this.src.bitReadOperations) {
          if (bitR.memory ==  bit.byteType  + bit.byteAddress  + "." + bit.bitAddress) {
            this.result.push(bitR);
          }
        }

        /* look for matching "reads" in instructionOperations */
        for (let ins of this.src.instructionOperations) {
          /* loop trough "reads" array, if there is one */
          if (ins.reads != null) {
            /* If it "reads" is an array, loop trough it */
            this.checkInstuctionRange(ins.reads, bit.byteType, bit.byteAddress, ins);
          }
        }


        this.queryLogFooter(this.result);
        break;

      /* ---------------------------------------------------------------------*/
      case bitWriteOps:
        query = this.memory;
        this.queryLogHead("Defined-Bit Write Operations for (" + query + ")");

        /* get definition */
        this.log.push("Looking for definitions...");
        bit = this.src.getBitDef(query);

        /* check if bit has been found */
        if (bit != undefined) {
          this.log.push("Found definition:");
          this.log.push(bit);
          this.memoryDefinition = bit;
        } else { /* bit has no definition, create Dummy */
          this.log.push("Bit is undefined. Creating Dummy Memory...");
          this.memoryDefinition, bit = this.src.makeDummyDefinition(query)
          if (this.memoryDefinition = null) {this.log.push("Illegal format"); break;}
        }

        /* look for matching bitWrite operations */
        this.log.push("Looking for write operations...");
        for (let bitW of this.src.bitWriteOperations) {
          if (bitW.memory ==  bit.byteType  + bit.byteAddress  + "." + bit.bitAddress) {
            this.result.push(bitW);
          }
        }

        /* look for matching "writes" in instructionOperations */
        for (let ins of this.src.instructionOperations) {
          /* loop trough "writes" array, if there is one */
          if (ins.writes != null) {
            this.checkInstuctionRange(ins.writes, bit.byteType, bit.byteAddress, ins);
          }
        }

        this.queryLogFooter(this.result);
        break;

      /* ---------------------------------------------------------------------*/
      case definedBitsInInstructions:
        query = this.memory;
        this.queryLogHead("Defined Bits which are handled in Instructions");

        /* get definition */
        this.log.push("Looking trough all definitions...");
        for (let bit of this.src.SBDMemory) {

          /* look for matching "writes" in instructionOperations */
          for (let ins of this.src.instructionOperations) {
            /* loop trough "writes" array, if there is one */
            if (ins.writes != null) {
              this.checkInstuctionRange(ins.writes, bit.byteType, bit.byteAddress, ins, bit);
            }
          }

          /* look for matching "reads" in instructionOperations */
          for (let ins of this.src.instructionOperations) {
            /* loop trough "reads" array, if there is one */
            if (ins.reads != null) {
              /* If it "reads" is an array, loop trough it */
              this.checkInstuctionRange(ins.reads, bit.byteType, bit.byteAddress, ins, bit);
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
    end = new Date().getTime();
    this.log.push("Query took " + (end - start) + " ms");
    this.log.push(" ");

    /* plot log of this query */
    for (let str of this.log) {
      console.log(str);
    }
  }


/*******************************************************************************
** Action: Generates the first lines of the [.log]. Writes directly to [.log]
** Return: null. Writes directly to object
*******************************************************************************/
  queryLogHead(type) {
    this.log.push(" ");
    this.log.push("Query issued. Type: " + type);
  }

/*******************************************************************************
** Action: Generates the first lines of the [.log]. Writes directly to [.log]
** Return: null. Writes directly to object
*******************************************************************************/
  queryLogFooter(result) {
    if (result == null || result.length == 0) {
      this.log.push("Nothing found");
    } else {
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
  checkInstuctionRange(values, byteType, byteAddress, ins, bitDefinition = null) {
    /* Loop trough if array, else handle as one */
    if (isIterable(values)) {
      for (let value of values) {
        /* Check if the current bit is contained in an arrangement of bytes. */
        if (checkInstructionByteRange(value, ins.formatLength, byteType, byteAddress)) {
          if (bitDefinition == null) {this.result.push(ins);}
          else {this.result.push({bit: bitDefinition, foundIn: ins} ); }
        }
      }
    } else {
      if (checkInstructionByteRange(values, ins.formatLength, byteType, byteAddress)) {
        if (bitDefinition == null) {this.result.push(ins);}
        else {this.result.push({bit: bitDefinition, foundIn: ins} ); }
      }
    }
  }
}


function checkInstructionByteRange(startByte, length, checkByteType, checkByteAddress) {
  if (startByte != null) {
    let match = (/^([A-Z])(\d*)$/).exec(startByte);
    if (match != null) {
      let number = parseInt(match[2], 10);
      let type = match[1];
      /* loop trough length (amount of bytes) */
      for (let i = 0; i < length; i++) {
        /* if the bit's byteAdress matches the instructions byteAdress + i then it's getting handled there */
        if (checkByteType + checkByteAddress == type + (number + i)) {
          return true;
        }
      }
    }
  }
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
