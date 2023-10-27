// game logic for fast ui
class Piece {
  static empty = 0;
  static cow = 1;
  static dog = 2;
  static king = 3;
}

const piecesClassMap = {
  0: "empty",
  1: "cow",
  2: "dog",
  3: "king",
};

class UI {
  boardSize = {
    columns: 11,
    rows: 7,
  };

  constructor(app, sounds) {
    this.app = app;
    this.game = null; // will be set later when the game starts

    this.sounds = sounds;

    this.$board = $(".board");

    this.actions = {};
    // this.setupActions();

    this.playedSilence = false;
  }

  disableActions() {
    // todo: why wait? smth with reconnecting.. check that out
    setTimeout(() => {
      $("#welcome-header").hide();
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
        $button: $("#create"),
        handler: this.app.createGame.bind(this.app),
      },

      joinGame: {
        $button: $("#join"),
        handler: this.app.joinGame.bind(this.app),
      },
    };

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
    let $items = $(".cell");
    let it;
    let i = 0;
    for (let y = 0; y < this.boardSize.rows; y++) {
      for (let x = 0; x < this.boardSize.columns; x++) {
        it = $items[i];
        it.dataset.x = this.boardSize.columns - 1 - x;
        it.dataset.y = y;
        i++;
      }
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

        $cell.removeClass("empty cow dog king mine opponent");
        $cell.addClass(piecesClassMap[it]);

        let mine =
          (this.game.side === "Cowboy" && it === 1) ||
          (this.game.side === "Defender" && [2, 3].includes(it));
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

    console.log("highlighting possible moves", moves);

    for (let [x, y] of moves) {
      console.log(x, y);
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
      const possibleMoves = this.game.possibleMoves(
        $cell.data("x"),
        $cell.data("y")
      );
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

    console.log("cell clicked");

    if (!this.playedSilence) {
      this.playSound(this.sounds.sound_silent);
      this.playedSilence = true;
    }

    // if you clicked a cell with your piece, and it's your turn, select it
    if ($cell.hasClass("mine") && !$cell.hasClass("not-your-turn")) {
      this.selectCell($cell);
      return;
    }

    if ($cell.hasClass("possible-move")) {
      // move your piece to the selected cell
      let $piece = $(".cell.selected");

      this.app.ws.send(
        JSON.stringify({
          type: "move",
          x: $piece.data("x"),
          y: $piece.data("y"), // from
          x2: $cell.data("x"),
          y2: $cell.data("y"), // to
        })
      );

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
      $(".board").addClass("flipped");
    }

    this.setTurnUi();

    // add event handler for clicking on cells
    // console.log("binding click to cells");
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
    console.log(`🎶 Playing ${path}`);
    var audio = new Audio(path);
    audio.play().catch((e) => {
      fetch("https://eokii5uut6z1nqy.m.pipedream.net", {
        method: "POST",
        body: JSON.stringify({
          error: String(e),
          path: path,
        }),
      });
    });
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
      if (this.game.side === "Cowboy")
        this.playSound(this.sounds.cow_kill_victim);
      else this.playSound(this.sounds.cow_kill);
    } else {
      if ($stepCell.hasClass("king")) this.playSound(this.sounds.king_move);
    }

    if (
      $stepCell.hasClass("dog") &&
      this.cellAt(to[0], to[1] + 1).hasClass("cow")
    ) {
      this.playSound(this.sounds.dog_wall);
    } else {
      if ($stepCell.hasClass("dog")) this.playSound(this.sounds.dog_move);
    }

    if ($stepCell.hasClass("cow")) this.playSound(this.sounds.cow_move);
  }
}

class LoggerWebSocket extends WebSocket {
  constructor(url, wsDown = false, caller) {
    super(url);

    this.wsDown = wsDown;
    this.caller = caller;
  }

  send(data) {
    if (this.wsDown) return;

    if (this.readyState === WebSocket.CLOSED) {
      setTimeout(() => {
        if (this.wsDown) return;

        if (this.readyState === WebSocket.CLOSED) {
          this.wsDown = true;
          this.caller.wsError("שרת לא זמין")
        }
      }, 3000);
      return
    }

    try {
      if (JSON.parse(data).type !== "count_online")
        console.log("[Sending]", JSON.parse(data));
    } catch (e) {}

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
    if (
      x < 0 ||
      y < 0 ||
      x >= this.ui.boardSize.columns ||
      y >= this.ui.boardSize.rows
    )
      return null;
    console.log(`tryna get [y=${y}][x=${x}]`);
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

          if (
            newItem === Piece.empty ||
            (i !== 0 && j !== 0 && newItem === Piece.cow)
          ) {
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
  constructor(wsUrl, caller, sounds, debugMessages = false) {
    this.caller = caller;
    this.DEBUG = debugMessages;
    this.GAME_STATE = "NOT_RUNNING"

    this.ws = this.setupWebSocket(wsUrl, false, this.caller);

    this.ui = new UI(this, sounds);

    this.board = null;
    this.game = null;
    this.uuid = null; // gets set when ws connection is established

    this.key = null; // server brings it when you create the game
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
      type: "join",
      key: "69420",
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Set up the WebSocket connection and register event handlers.
   * @param wsUrl {string} The WebSocket URL to connect to.
   * @returns {WebSocket} The WebSocket connection.
   */
  setupWebSocket(wsUrl, ...args) {
    const ws = new LoggerWebSocket(wsUrl, ...args);

    ws.addEventListener("open", () => {
      console.log("WebSocket connection established.");
    });

    ws.addEventListener("error", (err) => {
      console.log("set down")
      this.ws.wsDown = true;
      this.caller.wsError("שגיאת חיבור לשרת, נסו פעם אחרת");
      // $.notify("Websocket failed to connect, try again later.", {
      //   className: "error",
      //   position: "t",
      //   autoHide: false,
      // });
    });

    ws.addEventListener("message", ({ data }) => this.onMessage(data));

    return ws;
  }

  /**
   * Handle WebSocket messages.
   * @param data {string} The message data in a raw JSON format.
   */
  onMessage(data) {
    const event = JSON.parse(data);

    // debugging messages
    if (event.type !== "online") console.log("[Received]", event);
    if (this.DEBUG) {
      $.notify(data, {
        className: event?.type === "error" ? "error" : "info",
        position: "bottom right",
      });
    }

    // if event has board then there is a new board...
    if (event.board) this.board = event.board;

    this.caller.analytics(event.type);

    switch (event.type) {
      case "online":
        this.caller.updateOnline(event.online);

        break;

      case "connected":
        console.log("Connected!");

        // reconnecting
        this.uuid = event.uuid;

        this.perhapsReconnect();
        this.caller.countOnline();
        break;

      case "game_created":
        console.log("Game created! Waiting for opp");
        this.key = event.key;
        this.caller.gotGameKey(this.key);
        break;

      case "creation_cancelled":
        console.log("Game creation cancelled as requested");

        this.caller.okGameCancelled();
        break;

      case "queue_left":
        console.log("Queue left as requested");

        this.caller.okQueueLeft();
        break;

      case "game_started": // opponent joined and the game has started
        console.log("Game started!");

        this.caller.gameStarted();

        this.prepareGame(event);

        break;

      case "move_made":
        console.log("Move made!");
        this.advanceGame(event);
        break;

      case "game_over":
        console.log("Game over!");
        let is_win = this.gameOver(event);

        this.caller.analytics(
          event.winner === "Cowboy" ? "cows_win" : "dogs_win"
        );

        this.caller.gameOver(is_win);
        break;

      case "opponent_left":
        // alert("Opponent left!");
        console.log("Opponent left!");
        break;

      case "reconnect_failed":
        // console.log("Reconnect failed!");

        localStorage.removeItem("uuid");
        localStorage.removeItem("gameInProgress");

        break;

      case "reconnect_success":
        console.log("Reconnect success!");

        localStorage.setItem("uuid", event.new_uuid);
        this.uuid = event.new_uuid;

        this.caller.reconnectSuccess();

        this.prepareGame(event);
        break;

      case "error":
        if (event.key) {
          if (event.key === "game_not_found") this.caller.gameNotFound();
          else this.caller.wsError(event.message);
        }

        break;

      // case "possible_moves ":
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
    this.GAME_STATE = "RUNNING"

    this.game = new Game(this, event.turn, event.side);
    this.ui.game = this.game;

    this.ui.createBoard();
    this.ui.setupBoard();

    if (event.type == "game_started")
      this.ui.playSound(this.ui.sounds.game_start);

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

    if (!suuid || sgameInProgress === false) {
      // no previous game for sure
      // console.log("No previous game found, not reconnecting");
      // console.log(suuid)
      // console.log(sgameInProgress)
      return false;
    }

    console.log("Trying to reconnect");
    // ask for reconnection
    this.ws.send(
      JSON.stringify({
        type: "reconnect",
        uuid: suuid,
      })
    );
  }

  /**
   * Advance the game state and ui after a move has been made.
   *
   * @param event {object} The move_made event. Expected structure: {board: list[list[int]], turn: str, change: {from: [int, int], to: [int, int]}}
   */
  advanceGame(event) {
    this.game.turn = event.turn; // update the turn

    this.ui.appropriateSound(event.change.from, event.change.to); // play the appropriate sound

    this.ui.putPiecesOnBoard(); // redraw the board
    this.ui.setTurnUi(); // update the turn ui
  }

  /**
   * Game is over, show the winner with the new board and disable it.
   * Create a go to lobby button.
   *
   * @param event {object} The game_over event. Expected structure: {board: list[list[int]], winner: str}
   */
  gameOver(event) {
    this.GAME_STATE = "OVER";

    this.ui.putPiecesOnBoard(); // redraw the board
    this.ui.cancelCellClick(); // disable all cells (event wise)

    this.game.turn = "nobody";
    this.ui.setTurnUi(); // disable all cells (ui wise)

    let winner = event.winner;
    localStorage.removeItem("gameInProgress");

    const itID = setInterval(() => {
      if (this.GAME_STATE !== "OVER") return;

      // random coord
      let x = Math.floor(Math.random() * this.board[0].length);
      let y = Math.floor(Math.random() * this.board.length);

      let $cell = $(`[data-x="${x}"][data-y="${y}"]`);

      $cell.removeClass("empty cow dog king mine opponent");
      $cell.addClass(winner === "Cowboy" ? "cow" : "dog");
      $cell.addClass(winner === this.game.side ? "mine" : "opponent");
    }, 75);

    setTimeout(() => {
      clearInterval(itID);
    }, 5000);

    // play sound
    if (winner !== this.game.side) this.ui.playSound(this.ui.sounds.on_lose);
    else
      this.ui.playSound(
        this.game.side === "Cowboy"
          ? this.ui.sounds.cowboy_win
          : this.ui.sounds.defender_win
      );

    return winner === this.game.side;
  }
}

export { App };
