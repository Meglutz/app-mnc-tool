
/* the ladder is organized in a grid */
/* each operation symbol must be 8 characters long */
const ReadOps =  ["──┤ ├───", "──┤/├───"];
const WriteOps = ["──╢ ╟───", "──╢/╟───", "──╢S╟───", "──╢R╟───"];

/* each connector symbol must be 1 character long */
const Connectors = ["─", "┬", "┴", "┼"];
const Terminators = ["├", "┤"];

const LADDER_WIDTH = 13 * ReadOps[0].length + 2; /* 13 times a cell spacing + 2 network terminators */

class Ladder
{
  constructor(inputLns)
   {
    this.inputLines = inputLns;
    this.content = [];
    this.stack = [new LadderStack()];

    this.generate();
  }

  generate()
  {
    let as;    /* currently active stack */

    for (let l of this.inputLines)
    {
      /* pick out the operator of the current line */
      let match = l.match(readBitOperationsRegex);
      if (match == null)
      {
        match = l.match(instructionOperationRegex);
        if (match == null)
        {
          match = l.match(writeBitOperationsRegex);
          if (match == null)
          {
            match = l.match(stackOperationsRegex);
            if (match == null)
            {
              throw "Error@'" + "DOM_LadderVisNetwork." + this.generate.name + "': Found unhandled entity in line range: " + l;
            }
          }
        }
      }


      as = this.activeStack(); /* update [as] to the latest index, if [this.stack] got extended. */

/* COMBAK: somwhere an "undefined" gets pushed in the [.content] property of the LadderStacks
           it maybe at the "OR" and "OR.NOT" cases in the following "switch" statement
           this has been examined using the console.log at the end of this generate method
*/
      switch (match[1] + match[2])
      {
        /* read commands. they are always added to the active stack */
        case "RD":
          this.stack[as].content[this.stack[as].content.length - 1] += ReadOps[0];
          break;
        case "RD.NOT":
          this.stack[as].content[this.stack[as].content.length - 1] += ReadOps[1];
          break;
        case "AND":

          this.stack[as].content[this.stack[as].content.length - 1] += ReadOps[0];
          break;
        case "AND.NOT":
          this.stack[as].content[this.stack[as].content.length - 1] += ReadOps[1];
          break;
        case "OR":
          this.stack[as].content.push(ReadOps[0]); /* create new line for "or" commands */
          break;
        case "OR.NOT":
          this.stack[as].content.push(ReadOps[1]); /* create new line for "or" commands */
          break;

        /* stack commands, stack cmd evaluation */
        /* create new stack */
        case "RD.STK":
          this.stack[as].finished = "RD.STK";
          this.stack.push(new LadderStack());
          this.stack[as + 1].content[0] += ReadOps[0]; /* add symbol to newest stack */
          break;
        case "RD.NOT.STK":
          this.stack[as].finished = "RD.NOT.STK";
          this.stack.push(new LadderStack());
          this.stack[as + 1].content[0] += ReadOps[0]; /* add symbol to newest stack */
          break;
        /* finish stack */
        case "OR.STK":
          this.stack[as].finished = "OR.STK";
          this.stack.push(new LadderStack());
          break;
        case "AND.STK":
          this.stack[as].finished = "AND.STK";
          this.stack.push(new LadderStack());
          break;

        /* coil commands they do always close the active stack.
        if there are any open stacks still, it should give out a compiler error or smth...*/
        case "WRT":
          if (as != -1)
          {
            this.closeNetwork(this.stack[as].content[0], WriteOps[0]);
            this.stack[as].finished = "WRT";
          }
          else
          {
            this.addOptCoil(WriteOps[0]);
          }
          break;
        case "WRT.NOT":
          if (as != -1)
          {
            this.closeNetwork(this.stack[as].content[0], WriteOps[1]);
            this.stack[as].finished = "WRT.NOT";
          }
          else
          {
            this.addOptCoil(WriteOps[1]);
          }
          break;
        case "SET":
          if (as != -1)
          {
            this.closeNetwork(this.stack[as].content[0], WriteOps[2]);
            this.stack[as].finished = "SET";
          }
          else
          {
            this.addOptCoil(WriteOps[2]);
          }
          break;
        case "RST":
          if (as != -1)
          {
            this.closeNetwork(this.stack[as].content[0], WriteOps[3]);
            this.stack[as].finished = "RST";
          }
          else
          {
            this.addOptCoil(WriteOps[3]);
          }
          break;

        default:
          // check instruction operations? maybe?
          break;
      }
    }

    /* unifie the length of the stacks */
    this.content = this.stack[0];
    for (let stack of this.stack)
    {
      stack.content = this.unifieLength(stack.content)
    }

    /* assemble stacks
    reversed for-loop which  adds all the stacks togheter*/
    for (let i = this.stack.length; i > this.stack.length; i--)
    {
      /* if it's not iterable, leave it as it is */
      if (isIterable(this.stack))
      {
        
      }
    }
  }

  activeStack()
  {
    for (let i = 1; i <= this.stack.length; i++)
    {
      if (this.stack[this.stack.length - i].finished != true)
      {
        return this.stack.length - i
      }
    }
    return -1 /* all stacks are finished */
  }

  unifieLength(conStack)
  {
    let maxLength = 0;
    if (isIterable(conStack))
    {
      for (let i = 0; i < conStack.length; i++)
      {
        if (conStack[i].length > maxLength)
        {
          maxLength = conStack[i].length;
        }
      }

      for (let j = 0; j < conStack.length; j++)
      {
        if (conStack[j].length < maxLength)
        {
          let temp = "";
          for (let i = 0; i < (maxLength - conStack[j].length); i++)
          {
            temp += Connectors[0];
          }
          conStack[j] += temp;
        }
      }
    }
    console.log(conStack);
    return conStack
  }
}


class LadderStack
{
  constructor()
  {
    this.finished = false;
    this.content =  [""];
  }
}



/*
0: BitOperation {operation: "RD", reads: "R5070.3", writes: null, inModule: Module, inNetwork: "00011", …}
1: BitOperation {operation: "AND", reads: "R5572.1", writes: null, inModule: Module, inNetwork: "00011", …}
2: BitOperation {operation: "OR", reads: "R5572.2", writes: null, inModule: Module, inNetwork: "00011", …}
3: BitOperation {operation: "OR", reads: "R5574.7", writes: null, inModule: Module, inNetwork: "00011", …}
4: BitOperation {operation: "AND", reads: "G765.7", writes: null, inModule: Module, inNetwork: "00011", …}
5: BitOperation {operation: "OR", reads: "R5093.4", writes: null, inModule: Module, inNetwork: "00011", …}
6: BitOperation {operation: "OR", reads: "D1636.3", writes: null, inModule: Module, inNetwork: "00011", …}
7: BitOperation {operation: "AND", reads: "R10.2", writes: null, inModule: Module, inNetwork: "00011", …}
8: BitOperation {operation: "WRT", reads: null, writes: "R5572.3", inModule: Module, inNetwork: "00011", …}
*/
