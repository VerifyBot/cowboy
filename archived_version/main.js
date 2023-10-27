// game logic for fast ui
class Piece {
  static empty = 0;
  static cow = 1;
  static dog = 2;
  static king = 3;
}

const piecesClassMap = {
  0: "empty", 1: "cow", 2: "dog", 3: "king"
}

//
// class GameLogic {
//   constructor(board) {
//     this.board = board;
//   }
//
//   get(x, y) {
//     if (!(0 <= x < this.columns && 0 <= y < this.rows)) return null;
//     return this.board[y][x];
//   }
//
//   possibleMoves(x, y) {
//     const it = this.get(x, y);
//
//     if (it === Piece.empty) {
//       return [];
//     }
//
//     if (it === Piece.cow) {
//       return [(x, y - 1)].filter(([newX, newY]) => this.get(newX, newY, true) === Piece.empty);
//     }
//
//     if (it === Piece.king) {
//       const moves = [];
//
//       for (let i = -1; i <= 1; i++) {
//         for (let j = -1; j <= 1; j++) {
//           const newItem = this.get(x + i, y + j, true);
//
//           if (newItem === Piece.empty || (i !== 0 && j !== 0 && newItem === Piece.cow)) {
//             moves.push([x + i, y + j]);
//           }
//         }
//       }
//
//       return moves;
//     }
//
//     if (it === Piece.dog) {
//       const moves = [];
//
//       for (const x_pos of [-1, 1]) {
//         let n = x_pos;
//         while (this.get(x + n, y, true) === Piece.empty) {
//           moves.push([x + n, y]);
//           n += x_pos;
//         }
//       }
//
//       for (const y_pos of [-1, 1]) {
//         let n = y_pos;
//         while (this.get(x, y + n, true) === Piece.empty) {
//           moves.push([x, y + n]);
//           n += y_pos;
//         }
//       }
//
//       return moves;
//     }
//
//     throw new Error(`Unsupported piece: ${it}`);
//   }
// }
//
//
// // ui
//
// function playSound(path) {
//   console.log(`Playing ${path}`)
//   var audio = new Audio(path);
//   audio.play();
// }
//
// function highlightPossibleMoves(moves) {
//   /*
//   moves is a list of [x, y] coordinates of possible moves.
//   */
//
//   console.log("highlighting possible moves", moves)
//
//   for (let [x, y] of moves) {
//     console.log(x, y)
//     $(`[data-x="${x}"][data-y="${y}"]`).addClass("possible-move");
//   }
// }
//
// function setTurnUi(side, turn) {
//   let myTurn = side === turn;
//
//   console.log(side, turn)
//   console.log("it is " + (myTurn ? "my turn" : "not my turn"))
//
//   $(".cell:not(.opponent)").toggleClass("not-your-turn", !myTurn)
// }
//
//
//
// function setupBoard(board) {
//   /*
//   The board is a 2d array of ints.
//
//   0: empty
//   1: cow
//   2: dog
//   3: king
//
//   starts from top left
//    */
//
//   updateBoardUI(board);
//
//   // Flip board if you are a defender.
//   if (window.side === "Defender") {
//     $(".column").css("flex-direction", "column-reverse");
//     $(".king").addClass("king-flipped")
//   }
//
//   setTurnUi(window.side, window.turn);
//
//   // add event handler for clicking on cells
//   $(".cell").on("click", onCellClick);
// }
//
// class CellUtils {
//   static selectCell($cell) {
//     /*
//     Toggle selection of a cell, if selected ask for possible moves.
//      */
//
//     $(".cell.mine").not($cell).removeClass("selected");
//     $(".cell").removeClass("possible-move");
//
//     $cell.toggleClass("selected");
//
//     if ($cell.hasClass("selected")) {
//       // ask websocket for possible moves, we will catch the response in the websocket message handler
//       const possibleMoves = (new GameLogic(window.board)).possibleMoves($cell.data("x"), $cell.data("y"));
//       highlightPossibleMoves(possibleMoves);
//       // websocket.send(JSON.stringify({"type": "ask_possible_moves", "x": $cell.data("x"), "y": $cell.data("y")}));
//     }
//   }
// }
//
// function onCellClick(ev) {
//   /*
//   Handles any cell click.
//    */
//
//   let $cell = $(ev.target);
//
//   // if you clicked a cell with your piece, and it's your turn, select it
//   if ($cell.hasClass("mine") && !$cell.hasClass("not-your-turn")) {
//     CellUtils.selectCell($cell);
//     return
//   }
//
//   if ($cell.hasClass("possible-move")) {
//     // move your piece to the selected cell
//     let $piece = $(".cell.selected");
//
//     websocket.send(JSON.stringify({
//       "type": "move", "x": $piece.data("x"), "y": $piece.data("y"), "x2": $cell.data("x"), "y2": $cell.data("y"),
//     }));
//
//     // remove selection
//     $piece.removeClass("selected");
//     $(".cell").removeClass("possible-move");
//   }
// }
//
// function createBoard(board) {
//   // Generate board.
//   for (let column = 0; column < 11; column++) {
//     const columnElement = document.createElement("div");
//     columnElement.className = "column";
//     columnElement.dataset.x = column;
//     for (let row = 0; row < 7; row++) {
//       const cellElement = document.createElement("div");
//       cellElement.className = "cell empty";
//       cellElement.dataset.x = column;
//       cellElement.dataset.y = row;
//       columnElement.append(cellElement);
//     }
//     board.append(columnElement);
//   }
// }
//
//
// // Page Load
//
// // set up board
// const board = document.querySelector(".board");
// createBoard(board);
//
// // open the WebSocket connection and register event handlers.
//
// /* if localhost */
// var wsUrl = "ws://192.168.50.191:$PORT/";
//
// if (window.location.hostname === "localhost") var wsUrl = "ws://localhost:$PORT/";
//
// const websocket = new WebSocket(wsUrl.replace("$PORT", 8001));
//
// websocket.addEventListener("open", () => {
//   console.log("WebSocket connection established.");
// })
//
// websocket.addEventListener("error", (err) => {
//   $.notify("Websocket failed to connect, try again later.", {
//     className: "error", position: "t", autoHide: false
//   })
// })
//
// // log messages
//
// gameEventsListener();  // listen for game events
//
//
// // debugging
// // prepareGame({
// //   board: [[0, 0, 0, 2, 2, 3, 2, 2, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
// //   side: "Cowboy",
// //   turn: "Cowboy"
// // });
// //
//
// const createGameButton = document.querySelector("#create");
// const joinGameButton = document.querySelector("#join");
//
// createGameButton.addEventListener("click", () => {
//   createGame();
// });
//
// joinGameButton.addEventListener("click", () => {
//   joinGame(websocket);
// });
//
// function hideButtons() {
//   document.querySelector(".actions").style.display = "none";
// }
//
// function createGame() {
//   hideButtons();
//
//   let message = {
//     type: "create", key: "69420",  // game key for opponent to join
//     preference: "Cowboy"  // would rather play as cowboy
//   }
//
//   websocket.send(JSON.stringify(message));
//
//   console.log(`sent`, message)
// }
//
// function joinGame() {
//   // todo: get game key from input
//
//   hideButtons();
//
//   let key = "69420"
//
//   let message = {
//     type: "join", key: key
//   }
//
//   websocket.send(JSON.stringify(message));
//
// }
//
// function prepareGame(event) {
//   /*
//   Prepare the game state and ui.
//   If it's the client's turn, allow them to make a move.
//   Otherwise, wait for the opponent to make a move.
//
//   event should have board (2d arr board), turn (current turn) and side (client's side)
//  */
//
//   console.log(event.board)
//
//   window.turn = event.turn;
//   window.side = event.side;
//   setupBoard(event.board);
//
// }
//
// function updateBoardUI(board) {
//   /*
//   Update the board's UI.
//    */
//
//   for (let y = 0; y < board.length; y++) {
//     for (let x = 0; x < board[0].length; x++) {
//       let $cell = $(`[data-x="${x}"][data-y="${y}"]`);
//
//       let it = board[y][x];
//
//       $cell.removeClass("empty cow dog king mine opponent")
//       $cell.addClass(piecesClassMap[it]);
//
//       let mine = (window.side === "Cowboy" && it === 1) || (window.side === "Defender" && [2, 3].includes(it));
//       if (it !== 0) $cell.addClass(mine ? "mine" : "opponent");
//
//     }
//   }
// }
//
// function gameOver(event) {
//   /*
//   Game over, show the winner with the new board, disable it
//   and create a go to lobby button.
//    */
//
//   updateBoardUI(event.board);  // redraw the board
//
//   $(".cell").off("click");  // disable all cells (event wise)
//
//   window.turn = "nobody"; // disable all cells (ui wise)
//   setTurnUi(window.side, window.turn);
//
//   // show winner
//   let winner = event.winner;
//
//   // show a popup with the winner
//   $('body').append(`<div class="popup">
//         <div class="popup-content"><h1>${winner} won!</h1><button class="btn btn-primary" onclick="location.reload()">Go to lobby</button></div>
// </div>
// `)
//
//   if (winner !== window.side) playSound("./sounds/on_lose.mp3"); else playSound(`./sounds/${window.side.toLowerCase()}_win.mp3`);
// }
//
// function cellAt(x, y) {
//   return $(`.cell[data-x="${x}"][data-y="${y}"]`);
// }
//
// function advanceGame(event) {
//   /*
//   Advance the game state and ui after a move has been made.
//    */
//
//   window.turn = event.turn;
//
//
//   let $stepCell = cellAt(...event.change.from);
//   let $targCell = cellAt(...event.change.to);
//
//   if ($targCell.hasClass("cow")) {
//     if (window.side === "Cowboy") playSound("./sounds/cow_kill_victim.mp3"); else playSound("./sounds/cow_kill.mp3");
//   } else {
//     if ($stepCell.hasClass("king")) playSound("./sounds/king_move.mp3");
//   }
//
//   if ($stepCell.hasClass("dog") && cellAt(event.change.to[0], event.change.to[1] + 1).hasClass("cow")) {
//     console.log("BLOCKING")
//     playSound("./sounds/dog_wall.mp3");
//   } else {
//     if ($stepCell.hasClass("dog")) playSound("./sounds/dog_move.mp3");
//   }
//
//   if ($stepCell.hasClass("cow")) playSound("./sounds/cow_move.mp3");
//
//
//   let board = event.board;
//   updateBoardUI(board)
//
//
//   window.turn = event.turn;
//   setTurnUi(window.side, window.turn);
// }
//
// function gameEventsListener() {
//   websocket.addEventListener("message", ({data}) => {
//     const event = JSON.parse(data);
//
//     /* if event has board then update window.board */
//     if (event.board) window.board = event.board;
//
//     // if (event.type !== "possible_moves") {
//     $.notify(data, {className: event?.type === "error" ? "error" : "info", position: "bottom right"})
//     // }/
//     console.log("[Received]", event)
//
//
//     switch (event.type) {
//       case "game_started":  // opponent joined and the game has started
//         console.log("Game started!");
//         prepareGame(event);
//         break;
//
//       case "move_made":
//         console.log("Move made!");
//         advanceGame(event);
//         break;
//
//       case "game_over":
//         console.log("Game over!");
//         gameOver(event);
//
//
//       case "opponent_left":
//         // alert("Opponent left!");
//         console.log("Opponent left!");
//         break;
//
//       // case "possible_moves":
//       //   console.log("possible moves", event.moves)
//       //   highlightPossibleMoves(event.moves);
//       //
//       //   break;
//
//     }
//   })
// }

// REMAKING

class UI {
  boardSize = {
    columns: 11, rows: 7
  }

  constructor(app) {
    this.app = app;
    this.game = null;  // will be set later when the game starts

    this.$board = $(".board");
    this.createBoard();

    this.actions = {}
    this.setupActions();
  }

  disableActions() {
    // todo: why wait? smth with reconnecting.. check that out
    setTimeout(() => {
      $("#welcome-header").hide()
    }, 100);

    for (const action of Object.values(this.actions)) {
      action.$button.prop("disabled", true);
    }
  }

  hideActions() {
    for (const action of Object.values(this.actions)) {
      action.$button.hide(0);
    }
  }

  /**
   * Set up the actions click handlers like creating and joining a game.
   */
  setupActions() {
    this.actions = {
      createGame: {
        $button: $("#create"), handler: this.app.createGame.bind(this.app)
      },

      joinGame: {
        $button: $("#join"), handler: this.app.joinGame.bind(this.app)
      }
    }

    // create click handlers
    for (const action of Object.values(this.actions)) {
      action.$button.on("click", action.handler);
    }
  }

  /**
   * Initializes the board UI (empty cells).
   */
  createBoard() {
    // Generate board.
    for (let column = 0; column < this.boardSize.columns; column++) {
      const columnElement = document.createElement("div");
      columnElement.className = "column";
      columnElement.dataset.x = column;
      for (let row = 0; row < this.boardSize.rows; row++) {
        const cellElement = document.createElement("div");
        cellElement.className = "cell empty";
        cellElement.dataset.x = column;
        cellElement.dataset.y = row;
        columnElement.append(cellElement);
      }
      this.$board[0].append(columnElement);
    }
  }

  /**
   * Put the pieces on the board based on the board state.
   */
  putPiecesOnBoard() {
    for (let y = 0; y < this.app.board.length; y++) {
      for (let x = 0; x < this.app.board[0].length; x++) {
        let $cell = $(`[data-x="${x}"][data-y="${y}"]`);

        let it = this.app.board[y][x];

        $cell.removeClass("empty cow dog king mine opponent")
        $cell.addClass(piecesClassMap[it]);

        let mine = (this.game.side === "Cowboy" && it === 1) || (this.game.side === "Defender" && [2, 3].includes(it));
        if (it !== 0) $cell.addClass(mine ? "mine" : "opponent");

      }
    }
  }


  /**
   * Set the turn UI based on the current turn.
   */
  setTurnUi() {
    let myTurn = this.game.side === this.game.turn;

    console.log("it is" + (myTurn ? "" : "not") + " my turn");

    $(".cell:not(.opponent)").toggleClass("not-your-turn", !myTurn);
  }

  highlightPossibleMoves(moves) {
    /*
    moves is a list of [x, y] coordinates of possible moves.
    */

    console.log("highlighting possible moves", moves)

    for (let [x, y] of moves) {
      console.log(x, y)
      $(`[data-x="${x}"][data-y="${y}"]`).addClass("possible-move");
    }
  }

  selectCell($cell) {
    /*
    Toggle selection of a cell, if selected ask for possible moves.
     */

    $(".cell.mine").not($cell).removeClass("selected");
    $(".cell").removeClass("possible-move");

    $cell.toggleClass("selected");

    if ($cell.hasClass("selected")) {
      // ask websocket for possible moves, we will catch the response in the websocket message handler
      const possibleMoves = this.game.possibleMoves($cell.data("x"), $cell.data("y"));
      this.highlightPossibleMoves(possibleMoves);
      // websocket.send(JSON.stringify({"type": "ask_possible_moves", "x": $cell.data("x"), "y": $cell.data("y")}));
    }
  }

  /**
   * Handles any cell click.
   *
   * @param ev {Event} The click event.
   */
  onCellClick(ev) {
    let $cell = $(ev.target);

    // if you clicked a cell with your piece, and it's your turn, select it
    if ($cell.hasClass("mine") && !$cell.hasClass("not-your-turn")) {
      this.selectCell($cell);
      return
    }

    if ($cell.hasClass("possible-move")) {
      // move your piece to the selected cell
      let $piece = $(".cell.selected");

      this.app.ws.send(JSON.stringify({
        "type": "move", "x": $piece.data("x"), "y": $piece.data("y"),  // from
        "x2": $cell.data("x"), "y2": $cell.data("y"),  // to
      }));

      // remove selection
      $piece.removeClass("selected");
      $(".cell").removeClass("possible-move");
    }
  }

  /**
   * Cancel the cell click event handler.
   */
  cancelCellClick() {
    $(".cell").off("click");
  }

  /**
   * Set up the board UI based on the board state.
   */
  setupBoard() {
    this.putPiecesOnBoard();

    // Flip board if you are a defender.
    if (this.game.side === "Defender") {
      $(".column").css("flex-direction", "column-reverse");
      $(".king").addClass("king-flipped")
    }

    this.setTurnUi();

    // add event handler for clicking on cells
    $(".cell").on("click", this.onCellClick.bind(this));
  }

  /**
   * Get the cell at the given coordinates.
   * @param x {number} The x coordinate.
   * @param y {number} The y coordinate.
   * @returns {jQuery} The cell.
   */
  cellAt(x, y) {
    return $(`.cell[data-x="${x}"][data-y="${y}"]`);
  }


  /**
   * Play a sound.
   *
   * @param path {string} The path to the sound file.
   */
  playSound(path) {
    console.log(`🎶 Playing ${path}`)
    var audio = new Audio(path);
    audio.play();
  }

  /**
   * Play the appropriate sound based on the move.
   * @param from {Array} The [x, y] coordinates of the piece before the move.
   * @param to {Array} The [x, y] coordinates of the piece after the move.
   */
  appropriateSound(from, to) {
    let $stepCell = this.cellAt(...from);
    let $targCell = this.cellAt(...to);

    if ($targCell.hasClass("cow")) {
      if (this.game.side === "Cowboy") this.playSound("./sounds/cow_kill_victim.mp3"); else this.playSound("./sounds/cow_kill.mp3");
    } else {
      if ($stepCell.hasClass("king")) this.playSound("./sounds/king_move.mp3");
    }

    if ($stepCell.hasClass("dog") && this.cellAt(to[0], to[1] + 1).hasClass("cow")) {
      this.playSound("./sounds/dog_wall.mp3");
    } else {
      if ($stepCell.hasClass("dog")) this.playSound("./sounds/dog_move.mp3");
    }

    if ($stepCell.hasClass("cow")) this.playSound("./sounds/cow_move.mp3");
  }
}

class LoggerWebSocket extends WebSocket {
  constructor(url) {
    super(url);
  }

  send(data) {
    console.log("[Sending]", JSON.parse(data));
    super.send(data);
  }
}

class Game {
  /**
   * This class handles the game logic and state.
   *
   * @param app {App} The app instance.
   * @param turn {string} The current turn.
   * @param side {string} The client's side.
   */
  constructor(app, turn, side) {
    this.app = app;
    this.ui = this.app.ui;

    this.turn = turn;
    this.side = side;

    console.log(`Playing as ${this.side}, it is ${this.turn}'s turn.`);

    // board available with this.app.board
  }

  get(x, y) {
    if (x < 0 || y < 0 || x >= this.ui.boardSize.columns || y >= this.ui.boardSize.rows) return null;
    console.log(`tryna get [y=${y}][x=${x}]`)
    return this.app.board[y][x];
  }

  possibleMoves(x, y) {
    const it = this.get(x, y);

    if (it === Piece.empty) {
      return [];
    }

    if (it === Piece.cow) {
      return this.get(x, y - 1) === Piece.empty ? [[x, y - 1]] : [];
    }

    if (it === Piece.king) {
      const moves = [];

      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const newItem = this.get(x + i, y + j, true);

          if (newItem === Piece.empty || (i !== 0 && j !== 0 && newItem === Piece.cow)) {
            moves.push([x + i, y + j]);
          }
        }
      }

      return moves;
    }

    if (it === Piece.dog) {
      const moves = [];

      for (const x_pos of [-1, 1]) {
        let n = x_pos;
        while (this.get(x + n, y) === Piece.empty) {
          moves.push([x + n, y]);
          n += x_pos;
        }
      }

      for (const y_pos of [-1, 1]) {
        let n = y_pos;
        while (this.get(x, y + n) === Piece.empty) {
          moves.push([x, y + n]);
          n += y_pos;
        }
      }

      return moves;
    }

    throw new Error(`Unsupported piece: ${it}`);
  }
}

class App {
  constructor(wsUrl) {
    this.ws = this.setupWebSocket(wsUrl);
    this.ui = new UI(this);

    this.board = null;
    this.game = null;
    this.uuid = null;  // gets set when ws connection is established
  }

  /**
   * The create game button click handler.
   * ask the server to create a game.
   *
   * TODO: let the user choose their preference and game key.
   */
  createGame() {
    this.ui.disableActions();

    let message = {
      type: "create", key: "69420",  // game key for opponent to join
      preference: "Cowboy"  // would rather play as cowboy
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * The join game button click handler.
   * ask the server to join a game.
   *
   * TODO: let the user choose the game key.
   */
  joinGame() {
    this.ui.disableActions();

    let message = {
      type: "join", key: "69420"
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Set up the WebSocket connection and register event handlers.
   * @param wsUrl {string} The WebSocket URL to connect to.
   * @returns {WebSocket} The WebSocket connection.
   */
  setupWebSocket(wsUrl) {
    const ws = new LoggerWebSocket(wsUrl);

    ws.addEventListener("open", () => {
      console.log("WebSocket connection established.");
    });

    ws.addEventListener("error", (err) => {
      $.notify("Websocket failed to connect, try again later.", {
        className: "error", position: "t", autoHide: false
      })
    });

    ws.addEventListener("message", ({data}) => this.onMessage(data));

    return ws;
  }

  /**
   * Handle WebSocket messages.
   * @param data {string} The message data in a raw JSON format.
   */
  onMessage(data) {
    const event = JSON.parse(data)

    // debugging messages
    console.log("[Received]", event);
    $.notify(data, {className: event?.type === "error" ? "error" : "info", position: "bottom right"})

    // if event has board then there is a new board...
    if (event.board) this.board = event.board;


    switch (event.type) {
      case "connected":
        console.log("Connected!");

        // reconnecting
        this.uuid = event.uuid;

        this.perhapsReconnect();
        break;

      case "game_started":  // opponent joined and the game has started
        console.log("Game started!");
        this.prepareGame(event);
        break;

      case "move_made":
        console.log("Move made!");
        this.advanceGame(event);
        break;

      case "game_over":
        console.log("Game over!");
        this.gameOver(event);
        break;

      case "opponent_left":
        // alert("Opponent left!");
        console.log("Opponent left!");
        break;

      case "reconnect_failed":
        console.log("Reconnect failed!");

        localStorage.removeItem("uuid");
        localStorage.removeItem("gameInProgress");

        break;

      case "reconnect_success":
        console.log("Reconnect success!");

        localStorage.setItem("uuid", event.new_uuid);
        this.uuid = event.new_uuid;

        this.prepareGame(event);
        break;

      // case "possible_moves":
      //   console.log("possible moves", event.moves)
      //   highlightPossibleMoves(event.moves);
      //
      //   break;

    }
  }

  /**
   * Prepare the game state and ui.
   * If it's the client's turn, allow them to make a move.
   * Otherwise, wait for the opponent to make a move.
   *
   * @param event {object} The game_started event. Expected structure: {board: list[list[int]], turn: str, side: str}
   */
  prepareGame(event) {
    this.game = new Game(this, event.turn, event.side);
    this.ui.game = this.game;

    this.ui.hideActions();
    this.ui.setupBoard();

    // reconnecting
    localStorage.setItem("gameInProgress", true);
    localStorage.setItem("uuid", this.uuid);
  }

  /**
   * See if a game was previously started and reconnecting is possible.
   */
  perhapsReconnect() {
    // stored uuid
    const suuid = localStorage.getItem("uuid");
    const sgameInProgress = localStorage.getItem("gameInProgress");

    if (!suuid || (sgameInProgress === false)) {  // no previous game for sure
      console.log("No previous game found, not reconnecting");
      console.log(suuid)
      console.log(sgameInProgress)
      return false;
    }

    console.log("Trying to reconnect");
    // ask for reconnection
    this.ws.send(JSON.stringify({
      type: "reconnect",
      uuid: suuid
    }));
  }

  /**
   * Advance the game state and ui after a move has been made.
   *
   * @param event {object} The move_made event. Expected structure: {board: list[list[int]], turn: str, change: {from: [int, int], to: [int, int]}}
   */
  advanceGame(event) {
    this.game.turn = event.turn;  // update the turn

    this.ui.appropriateSound(event.change.from, event.change.to);  // play the appropriate sound

    this.ui.putPiecesOnBoard();  // redraw the board
    this.ui.setTurnUi();  // update the turn ui
  }

  /**
   * Game is over, show the winner with the new board and disable it.
   * Create a go to lobby button.
   *
   * @param event {object} The game_over event. Expected structure: {board: list[list[int]], winner: str}
   */
  gameOver(event) {
    this.ui.putPiecesOnBoard();  // redraw the board
    this.ui.cancelCellClick();  // disable all cells (event wise)

    this.game.turn = "nobody";
    this.ui.setTurnUi();  // disable all cells (ui wise)


    // show winner
    let winner = event.winner;

    // show a popup with the winner
    $('body').append(`<div class="popup"><div class="popup-content"><h1>${winner} won!</h1><button id="lobbyBtn" onclick="location.reload()">Go to lobby</button></div>      </div>`)

    if (winner !== this.game.side)
      this.ui.playSound("./sounds/on_lose.mp3")
    else this.ui.playSound(`./sounds/${this.game.side.toLowerCase()}_win.mp3`);

    localStorage.removeItem("gameInProgress");
  }
}

const app = new App(location.hostname === "localhost" ? "ws://localhost:8001/" : "ws://192.168.50.191:8001/");
window.app = app;  // for debugging