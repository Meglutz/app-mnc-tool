# To Do List

## General
* [x] Change DOMTable generation for InstructionOperations so that it can take more than two inputs (e.g. EXOR uses 2 read- and 1 write-input).                     
* [x] Add InstructionOperation Info above the DOMTable
* [x] Add header to InstructionOperations table
* [x] Change CSS of InstructionOperations table to match reads / writes (Probably needs "id"'s to "p" elements of rows to identify which is which -> read / write)
* [x] Center InstructionOperation table

## Nice-to-have
* [x] Support scrolling trough Queries (Query history)

## Prerequisities for stable release
* [x] Add **"%@1"** - **"%"** detection to analyze the MNC Data more reliably.
* [x] Fix compatility with decompiled MNCs. *SOL: Attention, Check the README for instructions*
* [x] Make overlays scrollable by removing parsing of identical successive indexes in warningString arrays
* [x] Fix NUMEB Table (Example: C2EH04)
* [x] Fix COMPB Table
* [x] **Add level parser**
    * [x] Add parser
    * [x] Add Level Tags to result visualisation
    * [x] Remove the `MNCData` global Variable and put it's keys as properties into the `Mnemonic` class
* [x] Remove bitReadOps / bitWriteOps arrays -> replace with bitOps (branch: *newBitOpStructure*)
* [x] Fix Instruction Operation Text in result display (Only plot reads / writes)
* [X] Fix Result sorting: lowest line count to highest line count. (Or by level?)
* [x] Finally implement xmovb instructions
* [x] Find a better solution to the issue with the Operation strings and preparation of the InsOp table data. Maybe include it in the Switch statement in the Resource class? Obviously with a few new properties for the InstructionOperation class
* [x] Fix COMPB instruction
* [x] Fix cell referencing in graphicalData.tableRows
* [x] Fix definitions not being found in insOpTables
* [x] Add dependency bits (Lower / upper boundary, WRT bit etc.) to RNGW / RNGD definitions in the .JSON file
* [x] Fix pressable Memory in insOpTables not being pressable anymore (Since newInsOpTableHandling)
* [x] **MNCShow: Only parse lines which are in the same network as the selected Op**
* [x] **MNCShow: Check for defines before drawing MNCshow**
* [ ] Update all ugly shallow object copy routines to `let sourceOp = JSON.parse(JSON.stringify(this.genSource[match[1] + match[2]]));`

## Nice-to-have
* [x] Check all regexes on single strings
* [x] Remove `$` (= assert position at end of line) regex-signs to enhance compatibility
* [ ] Make sure "Dependency" Bits are being tagged when being a dependency for example for RW / ACT / RST.
* [ ] Add automated sanity checks (e.g. compare all RD, OR, ANDs to the amount of bitReadOps)
