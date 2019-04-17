# To Do List

* [X] Change DOMTable generation for InstructionOperations so that it can take more
      than two inputs (e.g. EXOR uses 2 read- and 1 write-input)
* [X] Add InstructionOperation Info above the DOMTable
* [X] Add header to InstructionOperations table
* [X] Change CSS of InstructionOperations table to match reads / writes (Probably needs "id"'s to "p" elements of rows to identify which is which -> read / write)
* [X] Center InstructionOperation table

* [ ] Make overlays scrollable
* [X] Add "%@1" - "%" detection to get the MNC Data more reliably.
* [X] Fix compatility with decompiled MNC's **Attention: Check the README for instructions**
* [ ] Add sendable queries and Data files

* [ ] Fix COMPB Table
* [X] Fix NUMEB Table (Example: C2EH04)
* [ ] Fix Instruction Operation Text in result display (Only show reads / writes)
* [ ] Fix Result sorting: lowest line count to highest line count.
* [ ] Implement Module detection for decompiled MNCs: RD     PMCOM_XY
                                                      OR.NOT PMCOM_XY
                                                      WRT    PMCOM_XY
* [ ] Visualize Submodules (Highlight them) / Full Make order

# Prerequisities for stable release

* [X] Check all regexes on single strings
* [X] Remove `$` (= assert position to end of line) regex-sings to enhance compatibility
* [ ] Add automated sanity checks (e.g. compare all RD, OR, ANDs to the amount of bitReadOps)
