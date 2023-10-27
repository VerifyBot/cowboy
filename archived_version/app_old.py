#!/usr/bin/env python

import asyncio
import dataclasses
import json
import random
import secrets

import websockets
from websockets.sync.connection import Connection

from board import *

# import logging
# logging.basicConfig(level=logging.DEBUG)

LAST_RECONNECTIONS = []


@dataclasses.dataclass()
class Player:
  ws: Connection  # websocket
  uuid: str  # unique identifier for this player

  role: str  # "host" (created the game, pref is more valuable) or "guest" (joined the game)
  # ^ do: a global queue will be added and there both players will be have a
  # "queue" role, which means that their preference is as valuable as the other's
  # and therefore if both players have the same preference, it will be chosen randomly

  pref: str = None  # preference for which side to play as
  side: str = None  # which side this player is playing as (set once the game starts)

  def __eq__(self, other):
    return self.uuid == other.uuid


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

from box import Box


async def send_error(ws: Connection, message: str):
  """
  Send an error message.
  """
  event = {
    "type": "error",
    "message": message,
  }
  await ws.send(json.dumps(event))


async def create_game_session(event, ws: Connection, conn_uuid: str):
  """
  Create a new game session.

  :param event: The event from the client that asked to create a game
  :param ws: The client's ws
  :param conn_uuid: The client's unique identifier

  This event should have the following structure:
  {
    "type": "create",
    "key": "<GAME_KEY>",
    "preference": "<COWBOY / DEFENDER>"
  }
  """

  if USER_SESSION_MAP.get(conn_uuid):
    return await send_error(ws, "You are already in a game")

  if event.key in SESSIONS:
    return await send_error(ws, "Game already exists")

  if len(SESSIONS) > 100:
    return await send_error(ws, "Server overloaded, try later")

  pref = event.preference

  if pref not in [Side.cowboy, Side.defender]:
    pref = random.choice([Side.cowboy, Side.defender])

  # do: validate key format, event structure

  # create the player
  player = Player(ws=ws, uuid=conn_uuid, role="host", pref=event.preference)

  # create the game session
  sess = GameSession(player, key=event.key)

  SESSIONS[event.key] = sess
  USER_SESSION_MAP[conn_uuid] = sess

  print(f"Created game session {event.key=}, {sess.state=}")

  return await ws.send(json.dumps({"type": "game_created", "key": event.key, "state": sess.state}))


async def join_game_session(event, ws: Connection, conn_uuid: str):
  """
  Join an existing game session.

  :param event: The event from the client that asked to join a game
  :param ws: The client's ws
  :param conn_uuid: The client's unique identifier

  This event should have the following structure:
  {
    "type": "join",
    "key": "<GAME_KEY>"
  }
  """

  if USER_SESSION_MAP.get(conn_uuid):
    return await send_error(ws, "You are already in a game")

  if event.key not in SESSIONS:
    return await send_error(ws, "Game does not exist")

  sess: GameSession = SESSIONS[event.key]

  if sess.state != GameStates.WAITING_FOR_OPPONENT:
    return await send_error(ws, "Game is already in progress")

  # choose sides
  other = sess.other_player(ws)

  other.side = other.pref if other.pref else random.choice([Side.cowboy, Side.defender])
  guest_side = Side.cowboy if other.side == Side.defender else Side.defender

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
  if sess := USER_SESSION_MAP.get(conn_uuid):
    if sess.state == GameStates.PLAYING:
      try:
        await sess.send_to_opponent(ws, json.dumps({"type": "opponent_left", }))
      except websockets.exceptions.ConnectionClosedOK:
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


async def handler(ws: Connection):
  """
  A client connected.
  """
  conn_uuid = secrets.token_urlsafe(12)  # unique identifier for this connection

  # todo: see if it is really necessary to send uuid
  await ws.send(json.dumps({"type": "connected", "uuid": conn_uuid}))

  print(f'Client connected and was given uuid={conn_uuid} {ws.remote_address}')

  try:
    async for message in ws:
      print(f"Received message from {ws.remote_address}: {message}")

      event = Box(json.loads(message))  # for dict . dot access

      # client wishes to create a new game
      if event.type == "create":
        await create_game_session(event, ws, conn_uuid)
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

  except websockets.exceptions.ConnectionClosedError:
    return await disconnect_client(ws, conn_uuid)

  # ded (client disconnected)
  return await disconnect_client(ws, conn_uuid)


async def main():
  async with websockets.serve(handler, "", 8001):
    await asyncio.Future()  # run forever


if __name__ == "__main__":
  asyncio.run(main())
