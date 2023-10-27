<template>
  <div v-if="state === 'home'">
    <div id="title">קאובוי</div>



    <div class="mt">
      <v-row class="d-flex align-center justify-center">
        <v-col cols="12" md="4">
          <v-btn prepend-icon="mdi-gamepad-round" variant="tonal" color="light-green" size="x-large"
            @click="createPrivateGame">
            יצירת משחק פרטי
          </v-btn>
        </v-col>
      </v-row>
      <v-row class="d-flex align-center justify-center">
        <v-col cols="12" md="4">
          <v-btn prepend-icon="mdi-ticket-confirmation" variant="tonal" color="light-blue" size="x-large"
            @click="openJoinDialog">
            כניסה עם קוד
          </v-btn>
        </v-col>
      </v-row>

      <v-row class="d-flex align-center justify-center">
        <v-col cols="12" md="4">
          <v-btn prepend-icon="mdi-human-queue" variant="tonal" color="red" size="x-large" @click="enterGlobalQueue">
            משחק מהיר
          </v-btn>
        </v-col>
      </v-row>
    </div>

    <v-divider class="mt-10"></v-divider>

    <v-row class="d-flex align-center justify-center">
      <div class="preferences ma-10 mb-3" style="direction: ltr;">
        <ChooseRole size="x-large" v-if="!joinDialog && !globalDialog" @roleChosen="roleClick" />
      </div>
    </v-row>

    <v-row class="d-flex align-center justify-center">

      <v-col cols="12" md="4">
        <span v-if="onlineCount" class="small" style="width: 100%">
          {{
            onlineCount === 1
            ? "אין פה אחד מלבדך..."
            : `${onlineCount} משתמשים מחוברים`

          }}
        </span>

        <div></div>

        <v-btn prepend-icon="mdi-lifebuoy" color="gray" @click="helpDialog = true">הוראות</v-btn>
      </v-col>
    </v-row>






    <!-- dialogs -->
    <v-dialog v-model="createDialog" width="auto" persistent>
      <v-card>
        <v-card-text class="text-center">
          משחק פרטי 🎯

          <v-divider class="my-2"></v-divider>


          <div class="small" style="direction: rtl">קוד המשחק שלך הוא:</div>


          <div id="gameCode" @click="copyGameCode">{{ gameCode }}</div>

          <div class="small" id="code-copied-msg"></div>


          <v-divider class="my-2"></v-divider>


          <v-chip class="ma-2 wa-chip" @click="sendWhatsappLink" color="green">
            שליחת קישור לאויב
            <v-icon end icon="mdi-whatsapp"></v-icon>
          </v-chip>


        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" block @click="closeCreatePrivateGame" size="x-large">ביטול</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <v-dialog v-model="joinDialog" width="auto" persistent>
      <v-card>
        <v-card-text class="text-center">
          כניסה עם קוד 🎠

          <v-divider class="my-2"></v-divider>


          <div class="small" style="direction: rtl;">הכנס קוד משחק:</div>

          <div class="digits-container mt-2">
            <v-text-field v-for="(char, index) in joinCodeChars" :key="index" :value="char"
              @input="handleInput(index, $event)" @paste="handleInput(index, $event)" outlined type="text"
              @keydown="handleInput(index, $event)" class="digit-field"></v-text-field>
          </div>

          <v-divider class="mb-2"></v-divider>


          <ChooseRole size="small" @roleChosen="roleClick" />

          <v-divider class="mt-2"></v-divider>

          <v-btn color="green-lighten-1" class="my-4 py-5" variant="tonal" block size="x-large" id="join-game-btn"
            :disabled="!joinCodeChars.every(e => e !== '')" @click="joinPrivateGame">הצטרפות</v-btn>

          <v-divider></v-divider>

        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" block @click="joinDialog = false" size="x-large">ביטול</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <v-dialog v-model="globalDialog" width="auto" persistent>
      <v-card>
        <v-card-text style="direction: rtl;">
          🎭 משחק מהיר

          <v-divider class="my-2"></v-divider>

          <!-- loader -->
          <div class="text-center my-3">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>

          <div class="small mb-3">מחכים ליריב, לא להתייאש</div>

          <v-divider></v-divider>

        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" block @click="leaveQueue" size="x-large">ביטול</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <v-dialog v-model="helpDialog" width="auto">
      <v-card>
        <v-card-text style="direction: rtl;">
          🛟 הוראות

          <v-divider class="my-2"></v-divider>

          <div class="small my-3" style="text-align: justify; max-width: 500px; user-select: text;">
            עדר פרות חוצה את הערבה והקאובוי נמצא בסכנה,
            האם יוכל בעזרת ארבעת הכלבים שלו לעצור את עדר הפרות לפני שיחצה את
            הנחל?
            <div class="my-3"></div>
            <v-icon color="light-green" class="ml-1">mdi-bookmark-check</v-icon>כל פרה יכולה לנוע בתורה <b>צעד אחד
              קדימה</b>.
            <div class="my-3"></div>
            <v-icon color="light-green" class="ml-1">mdi-bookmark-check</v-icon>על הכלבים לחסום את תנועת הפרות. הם יכולים
            לנוע לפנים ולאחור, ימינה ושמאלה מספר צעדים כרצונם.
            <div class="my-3"></div>
            <v-icon color="orange" class="ml-1">mdi-crown-circle</v-icon>הקאובוי צריך לאכול את כל הפרות ובכך למנוע מהן
            לחצות את הנהר. הוא יכול לנוע צעד אחד לכל הכוונים ויכול לאכול
            <b>באלכסון בלבד (גם הפוך)</b>.
            <div class="my-3"></div>
            <v-icon color="orange" class="ml-1">mdi-crown-circle</v-icon>מספיק שפרה אחת חוצה את הנחל ועדר הפרות ניצח.
          </div>

          <v-divider></v-divider>

        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" block @click="helpDialog = false" size="x-large">ביטול</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>

  <div id="game-screen">

    <div id="not-landscape" v-if="notLandscape && state === 'game'">
      יש לסובב את המסך כדי לשחק
    </div>

    <div id="over" :is-winner="isWinner" v-if="winFrame">
      {{ isWinner ? "ניצחת!" : "הפסדת 😔 לא נורא..." }}

      <v-btn color="green" block @click="state = 'home'" size="x-large" prepend-icon="mdi-home">חזרה ללובי</v-btn>

    </div>

    <div class="board grid">

      <div class="cell" v-for="_ in 77"></div>

    </div>

  </div>

  <v-dialog v-model="errorDialog" width="auto" persistent>
    <v-card style="min-width: 200px">
      <v-card-text class="text-center">
        <span style="color: rgb(255, 115, 115); font-weight: bold;">
          שגיאה
        </span>

        <v-divider class="mt-2 mb-4"></v-divider>

        <div class="small error" style="direction: rtl;">
          {{ errorMessage }}
        </div>

        <v-divider class="mt-4"></v-divider>

      </v-card-text>
      <v-card-actions class="pt-0">

        <v-btn color="primary" block @click="doRefresh" size="x-large">{{ errorButton }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbarError" :timeout="3000" color="red-lighten-1" variant="elevated">
    <span style="display: flex; justify-content: center; font-size: 1rem;">
      {{ snackbarMessage }}
    </span>
  </v-snackbar>
</template>



<script setup>
import ChooseRole from "@/components/ChooseRole.vue";
</script>

<script>

// jquery
import $ from "@/jquery.min.js";
import { App } from "@/cowboy.js"
// import $.notify from "notify"

// sounds
import cow_move from "@/assets/cow_move.mp3"
import cow_kill_victim from "@/assets/cow_kill_victim.mp3"
import cow_kill from "@/assets/cow_kill.mp3"
import king_move from "@/assets/king_move.mp3"
import dog_wall from "@/assets/dog_wall.mp3"
import dog_move from "@/assets/dog_move.mp3"
import on_lose from "@/assets/on_lose.mp3"
import cowboy_win from "@/assets/cowboy_win.mp3"
import defender_win from "@/assets/defender_win.mp3"
import game_start from "@/assets/game_start.mp3"
import sound_silent from "@/assets/silent.mp3"

export default {
  data() {
    return {
      app: null,
      state: "home",

      // dialog errors
      errorDialog: false,
      errorMessage: "שגיאה לא ידועה",
      errorButton: "לנסות שוב",

      // snackbar errors
      snackbarError: false,
      snackbarMessage: "",

      playedIosSilent: false,

      // ------- STATE: GAME -------

      notLandscape: false,
      winFrame: false,
      isWinner: false,

      // ------- STATE: HOME PAGE -------
      onlineCount: null,

      selectedRole: null,
      roleChips: null,

      createDialog: false,
      joinDialog: false,
      globalDialog: false,
      helpDialog: false,

      gameCode: "",

      joinCodeChars: ["", "", "", ""],

    }
  },
  mounted() {
    this.analytics("mounted");

    // idle detector to kill websocket
    const MAX_IDLE_TIME = 60 * 3; // 3 minutes


    // credit - https://stackoverflow.com/a/10126042/11854052
    if (localStorage.getItem('idleCheck') === "no") {
      console.log("Idle Check is disabled. Have fun!")
    } else {
      this.idleGun;
      this.isIdle = false;
      var events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(name => window.addEventListener(name, () => {
        if (this.isIdle) return;  // once you are idle the only way back is to refresh

        clearTimeout(this.idleGun);
        this.idleGun = setTimeout(this.userIsIdle, 1000 * MAX_IDLE_TIME);
      }, true));
    }



    // attemps to fix sounds not playing on ios
    document.body.addEventListener('click', (e) => this.iosSilent());

    // goal: have a landscape-fullscreen game
    this.notLandscape = (!($(window).width() > $(window).height()));

    this.checkLandscape()

    $(window).bind("resize", this.checkLandscape);

    $('#game-screen').toggleClass('hidden', !(this.state === "game" && !this.notLandscape));

    // initiate the app
    let wsUrl;
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    if (protocol === "wss")
      wsUrl = "wss://donate-idf.com:8001";
    else
      wsUrl = location.hostname === "localhost" ? "ws://localhost:8001/" : "ws://192.168.50.73:8001/";

    this.app = new App(
      wsUrl,
      this,  // caller -- allows the App class to call methods here
      { // sounds
        cow_move: cow_move, cow_kill_victim: cow_kill_victim,
        cow_kill: cow_kill, king_move: king_move,
        dog_wall: dog_wall, dog_move: dog_move,
        on_lose: on_lose, cowboy_win: cowboy_win,
        defender_win: defender_win, game_start: game_start,
        sound_silent: sound_silent
      },
      false // debug
    );
    window.app = this.app;  // for debugging

    // online count
    setInterval(this.countOnline, 10000);

    // url params
    let urlParams = new URLSearchParams(window.location.search);

    if (urlParams.size !== 0) {
      let code = urlParams.get("join");  // join -- shortcut for joining a game

      if (code && code.length === 4) {
        this.joinCodeChars = urlParams.get("join").split("");
        this.joinDialog = true;
        this.joinCodeChars = code.split("");
      }

      // url cleanup
      this.$router.replace({ query: {} });
    }


  },
  watch: {
    notLandscape(v) {
      console.log('notLandscape: ' + v);
    },

    state(v) {
      this.checkLandscape();
      $('#game-screen').toggleClass('hidden', !(v === "game" && !this.notLandscape));
      this.winFrame = false;

      // close all dialogs
      this.createDialog = false;
      this.joinDialog = false;
      this.globalDialog = false;
      this.helpDialog = false;


      // if in fullscreen, exit
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(_ => { });
      }
    },

    joinDialog(v) {
      this.chooseRoleLoad()

      if (!v) this.snackbarError = false;
    },
    globalDialog(v) {
      this.chooseRoleLoad()
    },
    helpDialog(v) {
      this.chooseRoleLoad();
    },

    errorDialog(v) {
      if (v) {
        this.createDialog = false;
        this.joinDialog = false;
        this.globalDialog = false;
        this.helpDialog = false;
      }
    }
  },
  methods: {
    analytics(event) {
      this.$logEvent(this.$analytics, event);
    },

    /**
     * show a snackbar
     */
    createSnackbar(message) {
      this.snackbarError = true;
      this.snackbarMessage = message;
    },

    /**
     * User was detected as idle for MAX_IDLE_TIME seconds
     * At this point we should close the websocket, and
     * set up a `do refresh` error dialog
     */
    userIsIdle() {
      this.isIdle = true;

      this.app.ws.close();

      this.errorDialog = true;
      this.errorMessage = "נראה שלא היית פעיל לזמן מה ולכן ניתקנו אותך מהשרת. כדי לחזור יש לרענן את הדף";
      this.errorButton = "רענון";
    },

    iosSilent() {
      if (this.playedIosSilent) return;
      this.playedIosSilent = true;

      // play empty sound for ios to allow playing sounds later
      var audio = new Audio(sound_silent);
      audio.play();
    },

    countOnline() {
      if (this.state === "home" && this.app.ws.readyState === WebSocket.OPEN) {
        this.app.ws.send(JSON.stringify({ type: "count_online" }));
      }
    },

    doRefresh() {
      window.location.reload();
    },

    openJoinDialog() {
      this.joinDialog = true;

      setTimeout(() => {
        document.querySelector('.digit-field input').focus();
      }, 10)
    },

    enterGlobalQueue() {
      this.globalDialog = true;
      this.app.ws.send(JSON.stringify({ type: "queue", preference: this.selectedRole }));
    },

    leaveQueue() {
      this.app.ws.send(JSON.stringify({ type: "leave_queue" }));
    },



    chooseRoleLoad() {
      setTimeout(() => {
        if (this.selectedRole)
          $(`.role-chip[attr-role="${this.selectedRole}"]`)?.addClass("selected");
      }, 10);
    },

    roleClick(val) {
      this.selectedRole = val;

      let roleChips = Array.from(document.querySelectorAll(".role-chip"));

      roleChips.map(chip => chip.classList.remove("selected"));
      roleChips.filter(chip => chip.getAttribute("attr-role") === val).map(e => e.classList.add("selected"));
    },

    sendWhatsappLink() {
      const message = `יאללה משחקים קאובוי?\n${window.location.href}?join=${this.gameCode}`
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank");
    },

    async copyGameCode() {


      // copy to clipboard
      try {
        await navigator.clipboard.writeText(this.gameCode);

        // show toast
        const copiedELement = document.querySelector("#code-copied-msg");

        copiedELement.innerText = "הקוד הועתק ללוח!";

        setTimeout(() => {
          copiedELement.innerText = "";
        }, 2000);
      } catch (e) {
        console.debug(e);
      }
    },

    handleInput(index, event) {
      let inputs = Array.from(document.querySelectorAll(".digit-field input"));

      switch (event.type) {
        case "paste":
          // paste
          let val = (event.clipboardData || window.clipboardData).getData("Text").trim().toUpperCase();

          this.joinCodeChars = val.substring(0, this.joinCodeChars.length).split("");
          inputs.map((e, i) => {
            e.value = this.joinCodeChars[i];
            e.blur();
          });
          break;

        case "input":
          if (event.data) {
            if (event.data.length === this.joinCodeChars.length) {
              let val = event.data.toUpperCase();
              this.joinCodeChars = val.substring(0, this.joinCodeChars.length).split("");
              inputs.map((e, i) => {
                e.value = this.joinCodeChars[i];
                e.blur();
              });
              inputs[this.joinCodeChars.length - 1].focus();
            }
            else {
              // one char
              let val = event.data.slice(-1).toUpperCase();

              this.joinCodeChars[index] = val;

              if ((index === this.joinCodeChars.length - 1) &&
                this.joinCodeChars.every(e => e !== "")) {
                inputs[index].blur();
              } else {
                inputs[(index + 1) % (this.joinCodeChars.length)].focus();

              }
            }
          }
          break;

        case "keydown":
          if (event.key === "Backspace") {
            let curr = this.joinCodeChars[index];

            if (curr === "") {
              inputs[(index - 1) === -1 ? this.joinCodeChars.length - 1 : (index - 1)].focus();
              inputs[(index - 1) === -1 ? this.joinCodeChars.length - 1 : (index - 1)].select();

            } else {
              this.joinCodeChars[index] = "";
              inputs[index].value = "";
            }
          }
          break;
      }

    },

    createPrivateGame() {
      this.createDialog = true;
      this.app.ws.send(JSON.stringify({ type: "create", preference: this.selectedRole }));
    },

    closeCreatePrivateGame() {
      // if (confirm("האם אתה בטוח שכבר לא בא לך לחכות ליריב?")) {
      this.app.ws.send(JSON.stringify({ type: "cancel_creation" }));
      // }
    },

    joinPrivateGame() {
      let key = this.joinCodeChars.join("");

      if (key.length !== 4) return;

      let message = {
        type: "join",
        key: key,
        preference: this.selectedRole
      }

      this.app.ws.send(JSON.stringify(message));
    },

    // Game methods

    checkLandscape() {
      this.notLandscape = (!($(window).width() > $(window).height()));

      if (this.state !== "game")
        return;



      $('#game-screen').toggleClass('hidden', this.notLandscape);


      if (this.notLandscape) {
        // alert("Please rotate your device to landscape mode");
        document.exitFullscreen().catch(_ => { });
      } else {
        // alert("thank you")
        document.documentElement.requestFullscreen().catch(_ => { });
      }
    },




    // App-called methods

    /**
     * user clicked create game -> sent server the pref -> server sent back the game key
     */
    gotGameKey(key) {
      this.gameCode = key;
    },

    /**
     *  user clicked cancel game creation -> sent server the cancel request -> server sent back the cancel ack
     */
    okGameCancelled() {
      this.createDialog = false;
    },

    /**
     * user didnt want to be in queue -> sent server the leave request -> server sent back the leave ack
     */
    okQueueLeft() {
      this.globalDialog = false;
    },


    /**
     * Either:
     *  - user clicked join game -> sent server the join request -> server sent back game started
     *  - user created game -> opponent joined -> server sent back game started
     */
    gameStarted() {
      this.state = "game";

      // build the board

    },

    /**
     * user was in the middle of a game and reconnected
     */
    reconnectSuccess() {
      this.state = "game";
    },

    /**
     * game is over
     */
    gameOver(is_winner) {
      this.winFrame = true;
      this.isWinner = is_winner
    },

    /**
     * error with the websocket
     */
    wsError(m) {
      this.errorDialog = true;
      this.errorMessage = m
    },

    /**
     * update online count on home page
     */
    updateOnline(count) {
      if (this.state !== "home") return;
      this.onlineCount = count;
    },

    /**
     * gameNotFound - user tried to join a game that doesnt exist
     */
    gameNotFound() {
      this.createSnackbar("קוד לא תקין - כנראה שהיוצר שלו עזב");
    }

  },

}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@700&family=Secular+One&display=swap');


@font-face {
  font-family: 'Cowboy';
  src: url("@/assets/fonts/Cowboy.woff2");
}

.cow,
.dog,
.king,
.possible-move {
  width: 100% !important;
  height: 100% !important;
  position: relative !important;
  background-size: contain !important;
}

.cow {
  background: url("@/assets/cow.png") no-repeat center center;
}

.dog {
  background: url("@/assets/dog.png") no-repeat center center;
}

.king {
  background: url("@/assets/king.png") no-repeat center center;
}




.grid {
  display: grid;
  grid-template-columns: repeat(11, 1fr);
  grid-template-rows: repeat(7, 1fr);
  grid-auto-flow: dense;
}

.board.flipped {
  transform: rotate(180deg);
}

.flipped .cell {
  transform: rotate(180deg);
}


/* .cell::before {
  content: "";
  display: block;
  padding-top: 100%;
} */

body {
  padding: 0;
  margin: 0;
  background-color: #212121;
}

body .grid {
  margin: 0 auto !important;
  height: 100vh;

  max-width: 70vw;
  margin: 30px auto;
  box-sizing: border-box;
  outline: 1rem solid #2a351f;
  /* border: 10px solid #2a351f; */
}

body .cell {
  background-color: #779558 !important;
  box-shadow: inset 1px 1px 0px 0px #ffffff50;
  color: black;
}


.cell[data-y="0"],
.cell[data-y="6"] {
  background-color: lightskyblue !important;
}

#title {
  font-family: 'Cowboy';
  font-size: 6rem;
  font-weight: bold;
  color: #ffaf40;
}

body {
  font-size: 1.5rem;
  font-family: "Secular One", sans-serif;
  user-select: none;
}

.role-chip,
.wa-chip {
  cursor: pointer !important;
}

.role-chip:hover,
.wa-chip:hover {
  /* increase brightness */
  filter: brightness(1.2);
}

.role-chip.selected {
  /* outline: 2px solid white; */
  filter: brightness(1.2);
}

.role-chip:not(.selected) {
  filter: brightness(0.5);
}

.small,
.pref-title[size="small"] {
  font-size: 1rem;
  color: rgb(222, 222, 222);
}

#gameCode {
  cursor: pointer;
  user-select: all !important;
}

#gameCode:active {
  transform: scale(1.1);
}

#code-copied-msg {
  color: lightskyblue;
  font-size: 0.7rem;
}

.digits-container {
  display: flex;
}

.digit-field {
  flex: 1;
  margin-right: 8px;
  color: #1289A7;
}

.digit-field input {
  text-align: center;
  font-family: "Pixelify Sans", sans-serif;
  font-size: 1.5rem;
}

#game-screen.hidden .board {
  display: none !important;
}

/* old */

.cell:hover:not(.empty, .opponent, .not-your-turn) {
  cursor: pointer;
  /* make bg color darker */
  filter: brightness(.9);
}

.cell.not-your-turn:hover:not(.empty, .opponent) {
  cursor: not-allowed;
  filter: brightness(0.8);
}

.cell.selected {
  /* make it glow and heart beat */
  animation: glow 1s ease-in-out infinite alternate;
}

@keyframes glow {
  from {
    filter: brightness(1);
  }

  to {
    filter: brightness(1.1);
  }
}


/* on .cell.opponent:hover modify all .cell.opponent to have a darker bg color */

.cell.opponent:hover {
  filter: grayscale(100%);
  cursor: not-allowed;
}

.cell.possible-move {
  background-color: whitesmoke;

  /* put asterisk in the middle */
  background: radial-gradient(rgb(165 255 179 / 30%) 19%, rgba(0, 0, 0, 0) 20%);
  /* background-color: red !important; */
}


/* king aims to cow */
.cell.possible-move.cow {
  background: url("@/assets/cow-kill.png") no-repeat center center;
}

.cell.possible-move.cow:hover {
  /* red color effect */
  background-color: darkred !important;
  filter: grayscale(0%) !important;
}


.possible-move:hover {
  background: none;
  cursor: pointer !important;
  filter: brightness(1.2);
}

#over {
  position: absolute;
  z-index: 99;
  top: 50vh;
  left: 50vw;
  transform: translate(-50%, -50%);
}

[is-winner="true"] {
  font-size: 5rem;
  color: #f9ff40;
  font-weight: bold;
  text-shadow: 0px 0px 30px #f3ae12;
}

[is-winner="false"] {
  font-size: 5rem;
  color: rgb(255, 30, 30);
  text-shadow: 0px 0px 30px darkred;
}
</style>
