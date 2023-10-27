import itertools
import typing

from colorist import Color


# = Pieces =
class Piece:
  empty = 0  # empty cell
  cow = 1  # cowboy: moves forward
  dog = 2  # defender:  stops the cows
  king = 3  # defender: the king can attack


class Side:
  cowboy = "Cowboy"
  defender = "Defender"


from prettytable import *


class Board:
  columns = 11
  rows = 7

  cell_string_map = {
    Piece.cow: f'{Color.CYAN}@{Color.OFF}',  # Cow character
    Piece.king: f'{Color.YELLOW}X{Color.OFF}',  # King character
    Piece.dog: f'{Color.RED}#{Color.OFF}',  # Dog character
    Piece.empty: ' '
  }

  def __init__(self):
    self.board = self.init_board()

    # optimization: keep track of the number of cows left to check if the game is over
    self.cows_left = self.columns

  def __str__(self):
    """
    Returns a string representation of the board.
    """
    # Create a PrettyTable instance to format the board
    table = PrettyTable()

    # Set the column headers
    table.field_names = [' '] + [str(i) for i in range(11)]

    for row in range(7):
      row_data = [str(row)]
      for x, cell in enumerate(self.board[row]):
        row_data.append(self.cell_string_map[cell])
      table.add_row(row_data)

    return str(table)

  def init_board(self) -> list[list[int]]:
    """Returns board with the pieces in their starting positions."""
    board = [
      [Piece.empty for _ in range(self.columns)]
      for _ in range(self.rows - 1)  # leave one for the cows
    ]

    for x in [3, 4, 6, 7]:
      board[0][x] = Piece.dog  # dogs

    # [[test] for game over on cow can't move]
    # board[-1] = [Piece.dog for _ in range(self.columns)]
    # board[-1][0] = Piece.empty
    # board[-2][0] = Piece.dog

    board[0][5] = Piece.king  # king
    board.append([Piece.cow for _ in range(self.columns)])  # cows

    return board

  def get(self, x, y, quiet: bool = False) -> typing.Optional[Piece]:
    """Returns the piece in (x, y)"""
    if not (0 <= x < self.columns and 0 <= y < self.rows):
      if quiet:
        return None
      raise OutOfBounds(f"Position out of bounds ({x}, {y})")

    return self.board[y][x]

  def set(self, x, y, piece: Piece):
    """Sets the piece in (x, y)"""
    if not (0 <= x < self.columns and 0 <= y < self.rows):
      raise OutOfBounds(f"Position out of bounds ({x}, {y})")

    self.board[y][x] = piece

  def possible_moves(self, x, y) -> typing.List[typing.List[int]]:
    """
    Returns the possible moves of the piece in (x, y).
    The moves are represented as a list of coordinates.

    [(x1, y1), (x2, y2), ...]
    """

    it = self.get(x, y)

    if it == Piece.empty:
      return []

    if it == Piece.cow:  # cows can move forward if the cell there is empty
      return [(x, y - 1)] if self.get(x, y - 1, quiet=True) == Piece.empty else []

    if it == Piece.king:  # king can move one in any direction
      moves = []

      for i in range(-1, 1 + 1):
        for j in range(-1, 1 + 1):
          it = self.get(x + i, y + j, quiet=True)

          # either empty around or a cow is present diagonally
          if it == Piece.empty or (i != 0 and j != 0 and it == Piece.cow):
            moves.append((x + i, y + j))

      return moves

    if it == Piece.dog:  # dogs can move up/down/right/left as much as they want
      moves = []

      for x_pos in [-1, 1]:
        n = x_pos
        while self.get(x + n, y, quiet=True) == Piece.empty:
          moves.append((x + n, y))
          n += x_pos

      for y_pos in [-1, 1]:
        n = y_pos
        while self.get(x, y + n, quiet=True) == Piece.empty:
          moves.append((x, y + n))
          n += y_pos

      return moves

    raise ValueError(f"Unsupported piece: {it}")

  def is_game_over(self) -> typing.Union[Side, bool]:
    """
    If the game is over, returns the side that won.
    Otherwise, returns False.

    The game is over when:
      - The king kills all the cows (defender wins)
      - A cow reaches the other side (y=0) (cowboy wins)
      - It will be the cowboy's turn, and they won't be able to move (defender wins)
    """

    # check if the cowboy won (cow reached the other side)
    for x in range(self.columns):
      if self.get(x, 0) == Piece.cow:
        return Side.cowboy

    # check if the defender won (any cows left)
    if self.cows_left == 0:
      return Side.defender

    if all(
        self.get(x, y - 1) != Piece.empty
        for x in range(self.columns)
        for y in range(self.rows)
        if self.get(x, y) == Piece.cow
    ):
      print('cowboy cant move :(')
      return Side.defender

    return False

  def who_owns(self, x, y) -> typing.Optional[Side]:
    """
    Returns the side that owns the piece in (x, y).
    None is returned if the cell is empty.
    """
    it = self.get(x, y)

    if it == Piece.empty:
      return None

    return Side.cowboy if it == Piece.cow else Side.defender

  def move(self, x, y, x2, y2) -> bool:
    """
    Moves the piece in (x, y) to (x2, y2).
    This function does not check if the move is valid, so use with caution.
    To check if a move is valid, use self.possible_moves().

    Returns True if something was moved, False otherwise.
    """

    it = self.get(x, y)

    if it == Piece.empty:
      return False

    self.set(x, y, Piece.empty)
    self.set(x2, y2, it)

    return True


# = Exceptions =
class GameException(Exception):
  """Base class for all game exceptions"""


class GameState(GameException):
  """Raised when the game state changes (e.g. game over)"""


class GameOver(GameState):
  """Raised when the game is over"""


class OutOfBounds(GameException):
  """Raised when a move is out of bounds"""


class InvalidMove(GameException):
  """Raised when a move is invalid"""


class InvalidSource(GameException):
  """Raised when a source position is invalid"""


class Game:
  def __init__(self):
    self.board = Board()

    self._turn_cycle = itertools.cycle([Side.cowboy, Side.defender])
    self.turn = next(self._turn_cycle)

  @property
  def raw_board(self) -> list[list[int]]:
    """Returns the raw board"""
    return self.board.board

  def get_board(self) -> Board:
    """Returns the board"""
    return self.board

  def print_board_moves(self, x, y):
    """
    Returns a string representation of the board with the possible moves
    of the piece in (x, y) marked with an asterisk (*).
    """
    # Create a PrettyTable instance to format the board
    table = PrettyTable()

    # Set the column headers
    table.field_names = [' '] + [str(i) for i in range(11)]

    pos = self.board.possible_moves(x, y)

    cell_map = {
      Piece.cow: f'{Color.CYAN}@{Color.OFF}',  # Cow character
      Piece.king: f'{Color.YELLOW}X{Color.OFF}',  # King character
      Piece.dog: f'{Color.RED}#{Color.OFF}',  # Dog character
    }

    # Populate the table with board data and map Piece values to characters
    for row in range(7):
      row_data = [str(row)]
      for x, cell in enumerate(self.board.board[row]):
        ch = self.board.cell_string_map.get(cell)

        if cell == Piece.empty and (x, row) in pos:
          row_data.append(f'{Color.MAGENTA}*{Color.OFF}')  # possible move
        else:
          row_data.append(ch)

      table.add_row(row_data)

    return str(table)

  def move(self, who: Side, current: tuple[int, int], to: tuple[int, int]) -> bool:
    """
    Try to move a piece from `current` to `to`.

    This is a Game action, so it will check if the move is valid
    for the current side (`who`).

    If the move is invalid, an exception is raised.
    Otherwise, True is returned.

    If the move makes the game end, a GameOver exception is raised.

    :param who: Which side is moving
    :param current:  From which cell (x, y)
    :param to: To which cell (x, y)
    """

    cell_owner = self.board.who_owns(*current)

    if cell_owner is None:
      raise InvalidMove("This cell is empty")

    if cell_owner != who:
      raise InvalidSource("This is not your piece")

    if to not in self.board.possible_moves(*current):
      raise InvalidMove("This move is not possible")

    self.board.move(*current, *to)

    # check if the game is over
    if winner := self.board.is_game_over():
      raise GameOver(winner)

    # change turn
    self.turn = next(self._turn_cycle)

    return True


if __name__ == '__main__':
  # simulate the game

  game = Game()

  print(game.get_board())

  xy = tuple(map(int, input(f'{game.turn} from>').split(',')))

  while True:
    try:
      if game.board.who_owns(*xy) != game.turn:
        raise InvalidSource("This is not your piece")

      print(game.print_board_moves(*xy))

      x2y2 = tuple(map(int, input(f'{game.turn} to>').split(',')))

      print('#', game.move(game.turn, xy, x2y2))

    except InvalidMove as e:
      print("Invalid move:", e)
      continue

    except GameOver as e:
      winner = e.args[0]
      print(f"Game over! {winner} won the game!!!")
      break

    except GameException as e:
      print("Game Exception:", e)

    print(game.get_board())
    xy = tuple(map(int, input(f'{game.turn} from>').split(',')))
