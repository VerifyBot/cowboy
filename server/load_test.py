# test loads for websocket server

import asyncio
import json

from websockets.sync.client import connect

oprint = print

async def client(i):
  def print(*args, **kwargs):
    oprint(f"[AGENT {i}] ", *args, **kwargs)

  print(f"TESTER AGENT: {i}")

  with connect("ws://localhost:8001") as websocket:
    message = websocket.recv()
    print(f"Received: {message}")

    # join queue
    m = json.dumps({"type": "queue", "preference": "cowboy"})
    websocket.send(m)

    # queue joined
    message = websocket.recv()
    print(f"Received: {message}")


    await asyncio.Future()


# load test
USERS_COUNT = 500


async def main():
  tasks = []
  for i in range(USERS_COUNT):
    tasks.append(asyncio.create_task(client(i)))
  await asyncio.gather(*tasks)


asyncio.run(main())
