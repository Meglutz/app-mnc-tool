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
    this.map = [];
  }

  makeMap()
  {
    for (let op of this.source)
    {
      let newMapNode = this.extractOp(op);
      if (newMapNode == null)
      {
        throw ("Error@'makeMap': newMapNode is null.");
      }
      else
      {
        this.map.push(newMapNode);
      }
    }
  }

  extractOp(str)
  {
    /* get operation type of string. f.e. rd, or, and, wrt etc. */
    let match;
    switch (true)
    {
      case str.match(readBitOperationsRegex) != null:
        match = str.match(readBitOperationsRegex);
        break;
      case str.match(writeBitOperationsRegex) != null:
        match = str.match(writeBitOperationsRegex);
        break;
    }

    /* get the [genSource] object and set it's [assignedMemory] property to the value contained
    in [str] */
    if (match != null)
    {
      let ret = this.genSource[match[1] + match[2]];
      if (ret != null)
      {
        ret.assignedMemory = match[3];
        return ret
      }
    }
    else
    {
      return null;
    }
  }
}
