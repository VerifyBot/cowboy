#!/usr/bin/env python

import asyncio
import configparser
import contextlib
import dataclasses
import json
import random
import secrets
import ssl
import sys
import traceback

import websockets
from websockets.sync.connection import Connection

from board import *


import logging
logging.basicConfig(level=logging.DEBUG)


@dataclasses.dataclass()
class Player:
  ws: Connection  # websocket
  uuid: str  # unique identifier for this player

  role: str
  # ^^^ role explained VVV
  # "host" (created the game, pref is more valuable -- priority 1),
  # "guest" (joined the game -- priority 0)
  # "queue" (from global queue -- priority 0)

  pref: str = None  # preference for which side to play as
  side: str = None  # which side this player is playing as (set once the game starts)

  def __eq__(self, other):
    if isinstance(other, Player):
      return self.uuid == other.uuid
    elif isinstance(other, str):
      return self.uuid == other
    elif isinstance(other, Connection):
      return self.ws == other
    else:
      raise TypeError(f"Cannot compare Player with {type(other)}")

  def __str__(self):
    return f"Player(uuid={self.uuid}, role={self.role}, pref={self.pref}, side={self.side})"


class GameStates:
  WAITING_FOR_OPPONENT = "waiting_for_opponent"
  PLAYING = "playing"


class GameSession:
  def __init__(self, player: Player, key: str):
    self.session_key = key  # for dict reverse lookup

    self.state = GameStates.WAITING_FOR_OPPONENT
    self.players = [player]

    self.game: Game = None

  def who(self, identification: typing.Union[str, Connection]) -> Player:
    """
    Get the player object from a websocket/uuid.
    """
    idname = "uuid" if isinstance(identification, str) else "ws"

    who_list = [p for p in self.players if getattr(p, idname) == identification]

    return who_list[0] if who_list else None

  def other_player(self, ws: Connection) -> Player:
    """
    Get the other player.
    """
    other_list = [p for p in self.players if p.ws != ws]

    return other_list[0] if other_list else None

  async def send_to_opponent(self, ws: Connection, message: str):
    """
    Send a message to the opponent, if they exist.
    """
    if other := self.other_player(ws):
      await other.ws.send(message)

  async def send_all(self, message: str):
    """
    Send a message to all players.
    """
    for p in self.players:
      await p.ws.send(message)

  def add_player(self, player: Player):
    """
    Add the opponent to the game. This will start the game.
    :param player: The opponent's player object
    """
    self.players.append(player)
    self.state = GameStates.PLAYING

    if len(self.players) == 2:
      self.begin_game()

  def begin_game(self):
    """
    Begin the game.
    """
    self.game = Game()


# ongoing sessions
SESSIONS: dict[str, GameSession] = {

}

# map of user uuids to their session
USER_SESSION_MAP: dict[str, GameSession] = {

}

# allow 15s for the client to reconnect
LAST_RECONNECTIONS = [

]

# play queue
GLOBAL_QUEUE: list[Player] = [

]

ONLINE: set[Connection] = set()

# IP_CONNECTIONS: dict[str, int] = {}

from box import Box


async def send_error(ws: Connection, message: str, key: str = None):
  """
  Send an error message.
  """
  event = {
    "type": "error",
    "message": message,
  }

  if key:
    event["key"] = key

  await ws.send(json.dumps(event))


import string


def generate_game_key():
  """
  Generate a game key.

  Key format: 4 chars of [A-Z0-9]
  """

  key = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))

  if key in SESSIONS:
    return generate_game_key()

  return key


async def create_game_session(event, ws: Connection, conn_uuid: str):
  """
  Create a new game session.

  :param event: The event from the client that asked to create a game
  :param ws: The client's ws
  :param conn_uuid: The client's unique identifier

  This event should have the following structure:
  {
    "type": "create",
    "preference": "<COWBOY / DEFENDER / NONE>"
  }

  This function should send the client the game's key.
  """

  if USER_SESSION_MAP.get(conn_uuid):
    return await send_error(ws, "You are already in a game")

  if len(SESSIONS) > 100:
    return await send_error(ws, "השרת בתפוסה מלאה")

  pref = event.preference

  if pref and pref not in [Side.cowboy, Side.defender]:
    pref = random.choice([Side.cowboy, Side.defender])

  # create the player
  player = Player(ws=ws, uuid=conn_uuid, role="host", pref=pref)

  # create the game session
  sess = GameSession(player, key=generate_game_key())

  SESSIONS[sess.session_key] = sess
  USER_SESSION_MAP[conn_uuid] = sess

  print(f"Created game session {sess.session_key=}, {sess.state=}")

  return await ws.send(json.dumps({"type": "game_created", "key": sess.session_key, "state": sess.state}))


def choose_sides(p1: tuple[str, int], p2: tuple[str, int]) -> tuple[str, str]:
  """
  Choose sides for the players.

  priority 0: no special priority.
  priority 1: if they want something, they get it

  important note: they must not end up with the same side

  :param p1: (preference, priority)
  :param p2: (preference, priority)
  """
  p1_pref, p1_priority = p1
  p2_pref, p2_priority = p2

  # utils
  rand = lambda: random.choice([Side.cowboy, Side.defender])
  other = lambda side: Side.cowboy if side == Side.defender else Side.defender

  # validate
  p1_pref = None if p1_pref not in [Side.cowboy, Side.defender] else p1_pref
  p2_pref = None if p2_pref not in [Side.cowboy, Side.defender] else p2_pref

  # calculate who gets what side

  # both want something
  if p1_pref and p2_pref:
    # they want something different (best case scenario)
    if p1_pref != p2_pref:
      return p1_pref, p2_pref

    # they want the same thing, priority decides

    # same priority, random
    if p1_priority == p2_priority:
      p1_side = rand()
      return p1_side, other(p1_side)

    # different priority, the one with the higher priority gets what they want
    return (p1_pref, other(p1_pref)) if p1_priority > p2_priority else (other(p2_pref), p2_pref)

  # only one wants something
  if p1_pref:
    return p1_pref, other(p1_pref)

  if p2_pref:
    return other(p2_pref), p2_pref

  # no one wants anything, random
  p1_side = rand()
  return p1_side, other(p1_side)


async def join_game_session(event, ws: Connection, conn_uuid: str):
  """
  Join an existing game session.

  :param event: The event from the client that asked to join a game
  :param ws: The client's ws
  :param conn_uuid: The client's unique identifier

  This event should have the following structure:
  {
    "type": "join",
    "key": "<GAME_KEY>",
    "preference": "<COWBOY / DEFENDER / NONE>"
  }
  """

  if USER_SESSION_MAP.get(conn_uuid):
    return await send_error(ws, "You are already in a game")

  if len(event.key) != 4 or event.key not in SESSIONS:
    return await send_error(ws, "Game does not exist", key="game_not_found")

  sess: GameSession = SESSIONS[event.key]

  if sess.state != GameStates.WAITING_FOR_OPPONENT:
    return await send_error(ws, "Game is already in progress")

  # choose sides
  other = sess.other_player(ws)

  guest_side, other.side = choose_sides((event.preference, 0), (other.pref, 1))

  player = Player(ws=ws, uuid=conn_uuid, role="guest", side=guest_side)
  sess.add_player(player)  # also begin the game
  USER_SESSION_MAP[conn_uuid] = sess

  print("opponent joined game")
  print(f"game ({sess.session_key}) begins with: creator:{other.uuid} joiner:{conn_uuid}")
  print(repr(sess.game.raw_board))

  # notify the host that the client has joined, and send the board
  await other.ws.send(json.dumps({
    "type": "game_started",
    "board": sess.game.raw_board,
    "turn": sess.game.turn,
    "side": other.side,
  }))

  # notify the client that the game has started, and send the board
  await ws.send(json.dumps({
    "type": "game_started",
    "board": sess.game.raw_board,
    "turn": sess.game.turn,
    "side": guest_side,
  }))


async def send_possible_moves(event, ws: Connection, conn_uuid: str):
  """
  Send the possible moves for a piece.
  """

  if conn_uuid not in USER_SESSION_MAP:
    return await send_error(ws, "You are not in a game")

  sess: GameSession = USER_SESSION_MAP[conn_uuid]

  if sess.state != GameStates.PLAYING:
    return await send_error(ws, "Game is not in progress")

  if sess.game.turn != sess.who(ws).side:
    return await send_error(ws, "Not your turn, calculate their moves yourself!")

  possible_moves = sess.game.board.possible_moves(x=event.x, y=event.y)

  await ws.send(json.dumps({
    "type": "possible_moves",
    "moves": possible_moves,
  }))


def cleanup_session(sess: GameSession):
  """
  Delete all references to a session to avoid memory leaks.

  :param sess: The session to delete
  """
  for p in sess.players:
    if p.uuid in USER_SESSION_MAP:
      del USER_SESSION_MAP[p.uuid]

  if sess.session_key in SESSIONS:
    del SESSIONS[sess.session_key]

  del sess

  return


async def send_game_over(sess: GameSession, winner: Side):
  """
  Send a game over message to the players, and announce the winner.
  This will also delete the session, because the game is over.

  :param sess: The session that has the game that ended
  :param winner: The winner of the game
  """

  await sess.send_all(json.dumps({
    "type": "game_over",
    "winner": winner,
    "board": sess.game.raw_board,
  }))

  # delete all references to avoid memory leaks
  cleanup_session(sess)


async def move_piece(event, ws: Connection, conn_uuid: str):
  """
  Move a piece on the board

  Message structure:
  {
    "type": "move"
    "x": <int>, "y": <int>,  # from position
    "x2": <int>, "y2": <int>  # to position
  }
  """

  if conn_uuid not in USER_SESSION_MAP:
    return await send_error(ws, "You are not in a game")

  sess: GameSession = USER_SESSION_MAP[conn_uuid]

  if sess.state != GameStates.PLAYING:
    return await send_error(ws, "Game is not in progress")

  me: Player = sess.who(ws)

  if sess.game.turn != me.side:
    return await send_error(ws, "Not your turn")

  try:
    sess.game.move(who=me.side, current=(event.x, event.y), to=(event.x2, event.y2))
  except GameOver as e:
    return await send_game_over(sess, winner=e.args[0])
  except GameException as e:
    return await send_error(ws, str(e))

  # all good, let the players know that the move was successful
  # and continue the game
  await sess.send_all(json.dumps({
    "type": "move_made",
    "change": {"from": [event.x, event.y], "to": [event.x2, event.y2], "author": me.side},
    "turn": sess.game.turn,
    "state": "playing",
    "board": sess.game.raw_board,
  }))

  print(f'Move made, new board:')
  print(sess.game.board)


async def disconnect_client(ws: Connection, conn_uuid: str):
  with contextlib.suppress(KeyError):
    ONLINE.remove(ws)

  print(f'{ONLINE=}')

  # if in queue, remove from queue
  if p := next((p for p in GLOBAL_QUEUE if p.uuid == conn_uuid), None):
    GLOBAL_QUEUE.remove(p)
    print("dying and removed from queue")
    return

  elif sess := USER_SESSION_MAP.get(conn_uuid):
    if sess.state == GameStates.PLAYING:
      try:
        await sess.send_to_opponent(ws, json.dumps({"type": "opponent_left"}))
      except (websockets.exceptions.ConnectionClosedOK, websockets.exceptions.ConnectionClosedError):
        # they are also disconnected, so we can just kill the session
        print("cleaning session because both left")
        cleanup_session(sess)
        return

      # allow 15s for the client to reconnect
      await asyncio.sleep(15)

      if conn_uuid in LAST_RECONNECTIONS:
        LAST_RECONNECTIONS.remove(conn_uuid)
        return

      # game over, the client did not reconnect
      other = sess.other_player(ws)

      with contextlib.suppress(websockets.exceptions.ConnectionClosedOK):
        await other.ws.send(json.dumps({
          "type": "game_over",
          "winner": other.side,
          "board": sess.game.raw_board,
          "reason": "opponent_left",
        }))

    print(f"killing session {sess.session_key}")

    # delete all references to avoid memory leaks
    cleanup_session(sess)

  print("dying without session")
  return


async def check_reconnect(event, ws: Connection, conn_uuid: str):
  """
  Check if the client can reconnect to a lost game.
  """

  old_uuid = event.uuid

  if old_uuid not in USER_SESSION_MAP:
    return await ws.send(json.dumps({
      "type": "reconnect_failed",
      "reason": "Took you too long or you were not in a game"
    }))

  # reconnect!
  sess: GameSession = USER_SESSION_MAP[old_uuid]

  # check if the game is still in progress
  if sess.state != GameStates.PLAYING:
    return await send_error(ws, "check_reconnect NOT PLAYING: Handle this :P")

  # change all references to the new user
  print(f"relative session: {sess.session_key}")
  print(f"players: {[p.uuid for p in sess.players]}")

  sess.who(old_uuid).uuid = conn_uuid
  sess.who(conn_uuid).ws = ws  # old_uuid is not relevant anymore because we just updated the uuid
  USER_SESSION_MAP[conn_uuid] = sess
  del USER_SESSION_MAP[old_uuid]

  # add the old uuid to the list of last reconnections
  LAST_RECONNECTIONS.append(old_uuid)

  # notify the client that they have reconnected and about their new uuid
  await ws.send(json.dumps({
    "type": "reconnect_success",
    "new_uuid": conn_uuid,
    "board": sess.game.raw_board,
    "turn": sess.game.turn,
    "side": sess.who(ws).side,
  }))


async def cancel_game_creation(event, ws, conn_uuid):
  """
  Cancel game creation.
  Client doesn't want to wait for an opponent
  """

  if (conn_uuid not in USER_SESSION_MAP) or \
      (USER_SESSION_MAP[conn_uuid].state != GameStates.WAITING_FOR_OPPONENT):
    # no session to clean, so just say fine
    return await ws.send(json.dumps({"type": "creation_cancelled"}))

  sess: GameSession = USER_SESSION_MAP[conn_uuid]

  # delete all references to avoid memory leaks
  cleanup_session(sess)

  await ws.send(json.dumps({"type": "creation_cancelled"}))


async def add_to_queue(event, ws: Connection, conn_uuid: str):
  """
  Add the client to the global queue.
  If there is another player in the queue, start a game.
  """

  if USER_SESSION_MAP.get(conn_uuid):
    return await send_error(ws, "You are already in a game")

  if len(SESSIONS) > 100:
    return await send_error(ws, "השרת בתפוסה מלאה")

  # if player in queue
  if next((p for p in GLOBAL_QUEUE if p.uuid == conn_uuid), None):
    return await send_error(ws, "You are already in the queue")

  # create the player
  player = Player(ws=ws, uuid=conn_uuid, role="queue", pref=event.preference)

  # check if there is another player in the queue
  if len(GLOBAL_QUEUE) == 0:
    GLOBAL_QUEUE.append(player)  # add to queue
    return await ws.send(json.dumps({"type": "queue_joined"}))

  # there is another player in the queue, start a game
  other: Player = GLOBAL_QUEUE.pop(0)

  # choose sides (no one is more special)
  player.side, other.side = choose_sides((player.pref, 0), (other.pref, 0))

  # create the game session and the mappings
  sess = GameSession(player, key=generate_game_key())
  sess.add_player(other)

  SESSIONS[sess.session_key] = sess

  USER_SESSION_MAP[conn_uuid] = sess
  USER_SESSION_MAP[other.uuid] = sess

  # notify the players that the game has started
  await ws.send(json.dumps({
    "type": "game_started",
    "board": sess.game.raw_board,
    "turn": sess.game.turn,
    "side": player.side,
  }))

  await other.ws.send(json.dumps({
    "type": "game_started",
    "board": sess.game.raw_board,
    "turn": sess.game.turn,
    "side": other.side,
  }))


async def remove_from_queue(event, ws: Connection, conn_uuid: str):
  """
  Remove the client from the global queue.
  """

  # find idx in queue
  idx = next((i for i, p in enumerate(GLOBAL_QUEUE) if p.uuid == conn_uuid), None)

  if idx is None:
    return await send_error(ws, "You are not in the queue")

  # remove from queue
  GLOBAL_QUEUE.pop(idx)

  await ws.send(json.dumps({"type": "queue_left"}))


def wrap_disconnect(func):
  """a decorator to a function handler(ws) that will run await disconnect_client(ws) after the function"""

  async def wrapper(ws: Connection):
    try:
      await func(ws)
    except Exception as e:
      print(traceback.format_exc())
      await disconnect_client(ws)

  return wrapper


@wrap_disconnect
async def handler(ws: Connection):
  """
  A client connected.
  """

  conn_uuid = secrets.token_urlsafe(12)  # unique identifier for this connection

  ONLINE.add(ws)

  print(f'{ws.remote_address} connected (uuid={conn_uuid})')

  await ws.send(json.dumps({"type": "connected", "uuid": conn_uuid}))

  print(f'Client connected and was given uuid={conn_uuid} {ws.remote_address}')

  try:
    async for message in ws:
      if "count_online" not in message:
        print(f"Received message from {ws.remote_address}: {message}")

      event = Box(json.loads(message))  # for dict . dot access

      # client wishes to create a new game
      if event.type == "create":
        await create_game_session(event, ws, conn_uuid)
        continue

      # client no longer wishes to wait for an opponent
      if event.type == "cancel_creation":
        await cancel_game_creation(event, ws, conn_uuid)
        continue


      # client wishes to join an existing game
      elif event.type == "join":
        await join_game_session(event, ws, conn_uuid)
        continue

      # clients wants to know what moves are possible for a piece
      elif event.type == "ask_possible_moves":
        await send_possible_moves(event, ws, conn_uuid)
        continue

      # client wants to move a piece
      elif event.type == "move":
        await move_piece(event, ws, conn_uuid)
        continue

      # clients wants to try to reconnect to a lost game
      elif event.type == "reconnect":
        await check_reconnect(event, ws, conn_uuid)
        continue

      # clients join the global queue to play with any other player
      elif event.type == "queue":
        await add_to_queue(event, ws, conn_uuid)
        continue

      # client wishest to leaves the global queue
      elif event.type == "leave_queue":
        await remove_from_queue(event, ws, conn_uuid)
        continue

      elif event.type == "count_online":
        await ws.send(json.dumps({"type": "online", "online": len(ONLINE)}))

  except (websockets.exceptions.ConnectionClosedError, websockets.exceptions.ConnectionClosedOK):
    return await disconnect_client(ws, conn_uuid)

  # ded (client disconnected)
  return await disconnect_client(ws, conn_uuid)


async def main():
  ssl_context = None

  config = configparser.ConfigParser()
  config.read("config.ini")

  # if machine is linux
  if sys.platform == "linux":  # host
    DOMAIN = config.get('server', 'domain')
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ssl_context.load_cert_chain(f"/etc/letsencrypt/live/{DOMAIN}/fullchain.pem",
                                f"/etc/letsencrypt/live/{DOMAIN}/privkey.pem")

  async with websockets.serve(handler, "",
                              config.getint('server', 'port'),
                              ssl=ssl_context):
    await asyncio.Future()  # run forever


if __name__ == "__main__":
  asyncio.run(main())
