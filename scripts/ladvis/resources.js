/* the ladder is organized in a grid */
/* each operation symbol must be 8 characters long */
const ReadOps =  ["┤ ├", "┤/├"];
const WriteOps = ["╢ ╟", "╢/╟", "╢S╟", "╢R╟"];

/* each connector symbol must be 1 character long */
const Connectors = ["─", "┬", "┴", "┼"];
const Terminators = ["├", "┤"];

const LADDER_WIDTH = 13 * ReadOps[0].length + 2; /* 13 times a cell spacing + 2 network terminators */


class Ladder
{
  constructor()
  {
    this.networks = [];
  }
}

class LadderNetwork
{
  constructor(genSrc, src)
  {
    this.genSource = genSrc;
    this.source = src;
    this.ops = [];
    this.stacks = [];
  }


  makeMap()
  {
    for (let i = 0; i < this.source.length; i++)
    {
      let match = this.source[i].match(ladderVisOperationRegex);
      if (match != null)
      {
        /* create deep copy of obj (totally referenceless) */
        let sourceOp = JSON.parse(JSON.stringify(this.genSource[match[1] + match[2]]));
        sourceOp.assignedMemory = match[3] /* add the found memory to the new entry in [this.ops] */
        this.ops.push(sourceOp);
      }
      else
      {
        throw ("Error@'makeMap': match is null..");
      }
    }
  }


  makeStacks()
  {
    let stack = [];
    let conNbr = 0;

    for (let i = 0; i < this.ops.length; i++)
    {
      switch (this.ops[i].logic)
      {
        /* new-stack commands */
        case "RD":
          this.ops[i].inputLink = "CON_" + conNbr;
          conNbr++;
          this.ops[i].outputLink = "CON_" + conNbr;
          stack.push(this.ops[i]);
          conNbr++;
          break;
        case "RD.STK" || "RD.NOT.STK":
          /* finish & archive previous stack */
          this.stacks.push([...stack]);
          stack = [];

          this.ops[i].inputLink = this.stacks[this.stacks.length - 1].outputLink;      /* make the connection to the last item in the previous stack */
          this.ops[i].outputLink = "CON_" + conNbr;
          stack.push(this.ops[i]);
          conNbr++;
          break;

        /* finish-stack / new-stack commands */
        case "AND.STK":
          this.stacks.push([...stack]);
          this.stacks.push("AND.STK");
          stack = [];
          break;
        case "OR.STK":
          this.stacks.push([...stack]);
          this.stacks.push("OR.STK");
          stack = [];
          break;

        /* 0815 commands */
        case ("AND" || "AND.NOT"):
          // this.ops[i].inputLink = "TEST";
          this.ops[i].inputLink = this.ops[i - 1].outputLink
          this.ops[i].outputLink = "CON_" + conNbr;
          stack.push(this.ops[i]);
          conNbr++;
          break;

        case "OR" || "OR.NOT":
          this.ops[i].inputLink = stack[0].inputLink;
          this.ops[i].outputLink = this.ops[i - 1].outputLink;
          stack.push(this.ops[i]);
          break;

        /* finish-network commands */
        case "WRT" || "WRT.NOT" || "SET" || "RST":
          this.ops[i].inputLink = this.ops[i - 1].outputLink;
          this.ops[i].outputLink = "CON_" + conNbr;
          stack.push(this.ops[i]);
          /* finish stack */
          this.stacks.push([...stack]); stack = [];
          conNbr++;
          break;
      }
    }
  }
}
