# To Do List
## General
* [x] Change DOMTable generation for InstructionOperations so that it can take more
      than two inputs (e.g. EXOR uses 2 read- and 1 write-input)
* [x] Add InstructionOperation Info above the DOMTable
* [x] Add header to InstructionOperations table
* [x] Change CSS of InstructionOperations table to match reads / writes (Probably needs "id"'s to "p" elements of rows to identify which is which -> read / write)
* [x] Center InstructionOperation table

## Prerequisities for stable release
* [x] Add "%@1" - "%" detection to get the MNC Data more reliably.
* [x] Fix compatility with decompiled MNC's *Attention: Check the README for instructions*
* [x] Make overlays scrollable *Just removed parsing of identical successive indexes in warningString arrays*
* [ ] Add sendable queries and Data files

* [x] Fix NUMEB Table (Example: C2EH04)
* [ ] Fix COMPB Table
* [ ] **Add level parser**
    * [x] Add parser
    * [ ] Add Level Tags to result visualisation
    * [ ] Remove the `MNCData` global Variable and put it's keys as properties into the `Mnemonic` class
    * [ ] Rework Module detection / definition strategy. There should be a better solution.
* [x] Remove bitReadOps / bitWriteOps arrays -> replace with bitOps (branch: *newBitOpStructure*)
* [ ] Fix Instruction Operation Text in result display (Only plot reads / writes)
* [ ] Fix Result sorting: lowest line count to highest line count.
* [ ] Implement Module detection for decompiled MNCs: RD     PMCOM_XY
                                                      OR.NOT PMCOM_XY
                                                      WRT    PMCOM_XY

## Nice-to-have
* [x] Check all regexes on single strings
* [x] Remove `$` (= assert position to end of line) regex-sings to enhance compatibility
* [ ] Add automated sanity checks (e.g. compare all RD, OR, ANDs to the amount of bitReadOps)
