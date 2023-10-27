# Messages

Messages will be sent in JSON format. <br/>

a required `type` field will be in every message determining the type (action) of the message. <br/>

when a `board` field is added, the board UI should be updated. <br/>

errors will have `type = error` and a `message` field with the error message. <br/>  

## Board

When the board is sent, its format will be a 2D array of integers `list[list[int]]`. <br/>

Each integer represents a different piece (or an empty spot) - see the table below for the mapping.

| Integer | Piece      |
| --- |------------|
| 0 | Empty Spot |
| 1 | Cow        |
| 2 | Dog        |
| 3 | King       |

The board starts from TOP-LEFT, the first dimension is the row and the second dimension is the column. <br/>
So, for example:
- **`board[0][0]`** ~~--~~ piece at top-left corner of the board.
- **`board[4][5]`** ~~--~~ piece at row 5 and column 6 *(zero-indexed)* 