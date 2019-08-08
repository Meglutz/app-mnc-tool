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

          /* push the logic (or / and.stk) to help assemble the stacks in the next step */
          this.stacks.push(evalOp.logic);
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
            evalOp.inputLink = null;
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
            evalOp.inputLink = null;
          }
          else
          {
            evalOp.inputLink = activeStack.content[activeStack.content.length - 1].inputLink;
          }

          evalOp.outputLink = activeStack.content[activeStack.content.length - 1].outputLink;

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

            /* if this was the last item in the ops array, then finish the stack */
            if (i == this.ops.length - 1)
            {
              this.stacks.push(activeStack);
            }
          }
          else /* if there wasn't a WRT, WRT.NOT etc. beforehand, just link it as AND */
          {
            evalOp.inputLink = activeStack.content[activeStack.content.length - 1].outputLink;
            evalOp.outputLink = activeConnection;
            activeStack.content.push(evalOp);
          }
          break;
      }
    }
  }

  stackAssemble()
  {
    let tempStack
    for (let i = 0; i < this.stacks.length; i++)
    {
      if (this.stacks[i] == "AND.STK") /* AND link to previous stack */
      {
        /* remove current stack, since it's only actually the "AND.STK" string */
        console.log(this.stacks.splice(i, 1));

        /* link the stacks, and replace them */
        tempStack = this.stackLinker("AND.STK", this.stacks[i - 1], this.stacks[i - 2]);
        this.stacks.splice(i - 1, 1);
        this.stacks.splice(i - 2, 1, tempStack);

        /*COMBAK; IT WORKS */
      }
      else if (this.stacks[i] == "OR.STK") /* OR link to previous stack */
      {
        // this.stacks.splice(i, 1);
      }
      else if (isIterable(this.stacks[i].content))
      {
        /* do nothing */
      }
      else
      {
        throw ("Error@'" + this.stackAssemble.name + "': Current stack's content isn't allowed: " + this.stacks[i].content);
      }
    }
  }

  stackLinker(type, stack1, stack2)
  {
    switch (type)
    {
      case "OR.STK":
        break;
      case "AND.STK":
        break;
    }

    return "STACK " + type + " STACK2"
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
