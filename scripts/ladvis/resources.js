/* the ladder is organized in a grid */
/* each operation symbol must be 8 characters long */
const ReadOps =  ["┤ ├", "┤/├"];
const WriteOps = ["╢ ╟", "╢/╟", "╢S╟", "╢R╟"];

/* each connector symbol must be 1 character long */
const Connectors = ["─", "┬", "┴", "┼"];
const Terminators = ["├", "┤"];

const LADDER_WIDTH = 13 * ReadOps[0].length + 2; /* 13 times a cell spacing + 2 network terminators */


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
        throw ("Error@'makeMap': match is null... for this: " + this.source[i]);
      }
    }
  }


  makeStacks()
  {

    /* this handles most of the fanuc compiler logic (it's quiet simple).
    there are just a few rules that must be held:
    - everything is built in stacks.
      - a stack is always being started with:
        RD, RD.STK or RD.NOT.STK
      - a stack is always finished and a fresh one is started with:
        OR.STK or AND.STK
      - a stack is always finished when encountering
        WRT, WRT.NOT, SET, RST
    - etc. */


  //   let stackBuffer = [];
  //   let conNbr = 0;
  //
  //   for (let i = 0; i < this.ops.length; i++)
  //   {
  //     switch (this.ops[i].logic)
  //     {
  //       /* new-stack commands
  //       ------------------------------------------------------------------------ */
  //       case "RD":
  //         this.ops[i].inputLink = conNbr;
  //         conNbr++;
  //         this.ops[i].outputLink = conNbr;
  //         stackBuffer.push(this.ops[i]);
  //         conNbr++;
  //         break;
  //
  //       /* finish & archive previous stack
  //       ------------------------------------------------------------------------ */
  //       case "RD.STK":
  //       case "RD.NOT.STK":
  //         /* only push if the stack's not empty
  //         (could happen when OR.STK is followed by AND.STK or vice versa) */
  //         if (stackBuffer != []) {this.stacks.push([...stackBuffer]);}
  //         stackBuffer = [];
  //
  //         conNbr += 100;
  //         this.ops[i].inputLink = conNbr;
  //         conNbr++;
  //         // this.ops[i].inputLink = this.stacks[this.stacks.length - 1][this.stacks[this.stacks.length - 1].length - 1].outputLink;
  //         this.ops[i].outputLink = conNbr;
  //         stackBuffer.push(this.ops[i]);
  //         conNbr++;
  //         break;
  //
  //       /* finish-stack / new-stack commands
  //       ------------------------------------------------------------------------ */
  //       case "AND.STK":
  //         /* only push if the stackBuffer's not empty
  //         (could happen when OR.STK is followed by AND.STK or vice versa) */
  //         if (stackBuffer != []) {this.stacks.push([...stackBuffer]);}
  //
  //         stackBuffer = [];
  //         break;
  //       case "OR.STK":
  //         /* only push if the stackBuffer's not empty
  //         (could happen when OR.STK is followed by AND.STK or vice versa) */
  //         if (stackBuffer != []) {this.stacks.push([...stackBuffer]);}
  //         stackBuffer = [];
  //         break;
  //
  //       /* 0815 commands
  //       ------------------------------------------------------------------------ */
  //       case "AND":
  //       case "AND.NOT":
  //         // this.ops[i].inputLink = "TEST";
  //         this.ops[i].inputLink = this.ops[i - 1].outputLink
  //         this.ops[i].outputLink = conNbr;
  //         stackBuffer.push(this.ops[i]);
  //         conNbr++;
  //         break;
  //
  //       case "OR":
  //       case "OR.NOT":
  //         this.ops[i].inputLink = stackBuffer[0].inputLink;
  //         this.ops[i].outputLink = this.ops[i - 1].outputLink;
  //         stackBuffer.push(this.ops[i]);
  //         break;
  //
  //       /* finish-network commands
  //       ------------------------------------------------------------------------ */
  //       case "WRT":
  //       case "WRT.NOT":
  //       case "SET":
  //       case "RST":
  //         this.ops[i].inputLink = this.ops[i - 1].outputLink;
  //         this.ops[i].outputLink = conNbr;
  //         stackBuffer.push(this.ops[i]);
  //
  //         /* finish stack */
  //         this.stacks.push([...stackBuffer]); stackBuffer = [];
  //         conNbr++;
  //         break;
  //     }
  //   }
  // }

  let activeStack = new LadderStack();
  let connectionsCounter = 0;
  let activeConnection = new LadderConnection(connectionsCounter); connectionsCounter++;

  for (let i = 0; i < this.ops.length; i++)
  {
    /* create a deep copy of the op we want to evaluate */
    let evalOp = JSON.parse(JSON.stringify(this.ops[i]));

    switch (evalOp.logic)
    {
      /* new-stack commands
      ------------------------------------------------------------------------ */
      case "RD":
        evalOp.inputLink = activeConnection;
        activeConnection = new LadderConnection(connectionsCounter); connectionsCounter++;

        evalOp.outputLink = activeConnection;
        activeConnection = new LadderConnection(connectionsCounter); connectionsCounter++;

        activeStack.content.push(evalOp);
        break;

      /* finish & archive previous stack
      ------------------------------------------------------------------------ */
      case "RD.STK":
      case "RD.NOT.STK":
        /* only push if the stack's not empty
        (could happen when OR.STK is followed by AND.STK or vice versa) */
        if (activeStack.content != [])
        {
          this.stacks.push(activeStack);
        }
        activeStack = new LadderStack();

        evalOp.inputLink = activeConnection;
        activeConnection = new LadderConnection(connectionsCounter); connectionsCounter++

        evalOp.outputLink = activeConnection;
        activeConnection = new LadderConnection(connectionsCounter); connectionsCounter++

        activeStack.content.push(evalOp);
        break;

      /* finish-stack / new-stack commands
      ------------------------------------------------------------------------ */
      case "AND.STK":
      case "OR.STK":
        /* only push if the activeStack.content's not empty
        (could happen when OR.STK is followed by AND.STK or vice versa) */
        if (activeStack.content != [])
        {
          this.stacks.push(activeStack);
        }
        activeStack = new LadderStack();
        break;

      /* 0815 commands
      ------------------------------------------------------------------------ */
      case "AND":
      case "AND.NOT":
        /* test if the current stack already has an item in it to grab it's outputLink from.
        if it doesn't, then use the terminatingLink of the previous Network */
        /* DEBUG: the above is correct, but [connectionsCounter] - 1 would store the same connection id... */
        if (activeStack.content.length == 0)
        {
          evalOp.inputLink = this.stacks[this.stacks.length - 1].terminatingLink;
        }
        else
        {
          evalOp.inputLink = activeStack.content[activeStack.content.length - 1].outputLink;
        }

        evalOp.outputLink = activeConnection;
        activeConnection = new LadderConnection(connectionsCounter); connectionsCounter++

        activeStack.content.push(evalOp);
        break;

      case "OR":
      case "OR.NOT":
        /* test if the current stack already has an item in it to grab it's inputLink from.
        if it doesn't, then use the beginningLink of the previous Network */
        /* DEBUG: the above is correct, but [connectionsCounter] - 1 would store the same connection id... */
        if (activeStack.content.length == 0)
        {
          evalOp.inputLink = "UNDECIDABLE";
        }
        else
        {
          evalOp.outputLink = activeStack.content[activeStack.content.length - 1].inputLink;
        }

        evalOp.inputLink = activeStack.content[0].inputLink;

        activeStack.content.push(evalOp);
        break;

      /* finish-network commands
      ------------------------------------------------------------------------ */
      case "WRT":
      case "WRT.NOT":
      case "SET":
      case "RST":
        /* if the op beforehand was also a WRT, WRT.NOT etc. op, then
        set the current one parallel to the beforehand one */
        if (this.ops[i - 1].logic.match(/^(WRT|WRT.NOT|SET|RST)$/) != null)
        {
          evalOp.inputLink = activeStack.content[activeStack.content.length - 1].inputLink;
          evalOp.outputLink = activeConnection;
          activeStack.content.push(evalOp);
        }
        else
        {
          evalOp.inputLink = activeStack.content[activeStack.content.length - 1].outputLink;
          evalOp.outputLink = activeConnection;
          activeStack.content.push(evalOp);
        }
        break;
    }
  }

  /* COMBAK DOESENT WORK*/
  /* finish all generated stacks */
  for (let stack of this.stacks)
  {
    stack.finishStack();
  }
}

  andStacker(stackId1, stackId2)
  {
    /* get highest outputLink number (= y) of [stackId1]
   and get smallest inputLink number (= x) of [stackId2]. We can then
   merge them together by replacing each occurence of y in [stackId1] with x
   or by repalcing each occurence of x in [stackId2] with y */
  }


  orStacker(stackId1, stackId2)
  {

  }
}

class LadderStack
{
  constructor()
  {
    this.beginningLink   = {id: Infinity};
    this.terminatingLink = {id: 0};
    this.content = [];
  }

  finishStack()
  {
    for (let i = 0; i > this.content.length; i++)
    {
      /* find out what the smallest inputLink id is in this stack (the smallest is always the first) */
      if (this.content[i].inputLink instanceof LadderConnection)
      {
        if (this.content[i].inputLink.id < this.beginningLink)
        {
          this.beginningLink = this.content[i].inputLink;
        }
      }
      else
      {
        throw ("Error@'" + this.finishStack().name + "': the .inputLink property is not an instance of the LadderConnection class");
      }

      /* find out what the biggest outputLink id is in this stack (the biggest is always the last) */
      if (this.content[i].outputLink instanceof LadderConnection)
      {
        if (this.content[i].outputLink.id > this.terminatingLink)
        {
          this.terminatingLink = this.content[i].outputLink;
        }
      }
      else
      {
        throw ("Error@'" + this.finishStack().name + "': the .outputLink property is not an instance of the LadderConnection class");
      }
    }
  }
}

class LadderConnection
{
  constructor(id)
  {
    this.id = id;
    this.links = [];
  }
}
